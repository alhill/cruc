import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { initializeApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import OpenAI from 'openai';

import {
  type LensField,
  type LensesUsed,
  type LooseStringArrayMap,
  type StructuredAnalysis,
  type UserJournalEvent,
} from './types';

initializeApp();

const db = getFirestore();
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

type UserLensDefinition = {
  id: string;
  name: string;
  description: string;
  version: number;
  mainInstruction: string;
  vocabulary: LooseStringArrayMap;
  examples: LooseStringArrayMap;
  fields: LensField[];
  legacySchema?: Record<string, unknown>;
};

type LlmAnalysisResult = {
  lensesUsed: LensesUsed;
  analysis: StructuredAnalysis;
};

type UploadRequest = {
  contentType: string;
  extension: string;
};

type UploadResponse = {
  uploadUrl: string;
  objectKey: string;
};

type ReadUrlRequest = {
  objectKey: string;
};

type ReadUrlResponse = {
  readUrl: string;
};

type EnsureOwnUserProfileResponse = {
  uid: string;
  created: boolean;
};

type UserProfileDocument = {
  uid: string;
  email: string;
  name: string;
  surname: string;
  profileImage: string | null;
  createdAt: FieldValue;
  updatedAt: FieldValue;
  lastLogin: FieldValue;
  isActive: boolean;
  role: 'user';
};

function buildInitialUserProfileDocument(args: {
  uid: string;
  email: string;
}): UserProfileDocument {
  return {
    uid: args.uid,
    email: args.email,
    name: '',
    surname: '',
    profileImage: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    lastLogin: FieldValue.serverTimestamp(),
    isActive: true,
    role: 'user',
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isUserJournalEvent(value: unknown): value is UserJournalEvent {
  if (!isRecord(value)) {
    return false;
  }

  const type = value.type;

  return (
    typeof value.id === 'string' &&
    typeof value.timestamp === 'string' &&
    (type === 'user_note' || type === 'user_deep') &&
    typeof value.source === 'string' &&
    typeof value.user_input === 'string' &&
    Array.isArray(value.modules_active) &&
    Array.isArray(value.structured_data) &&
    typeof value.status === 'string'
  );
}

function parseJsonObject(value: string): Record<string, unknown> {
  const parsed = JSON.parse(value) as unknown;
  if (!isRecord(parsed)) {
    throw new Error('Model response was not a JSON object.');
  }
  return parsed;
}

function parseLooseStringArrayMap(value: unknown): LooseStringArrayMap {
  if (!isRecord(value)) {
    return {};
  }

  const parsed: LooseStringArrayMap = {};

  for (const [key, rawValues] of Object.entries(value)) {
    if (!Array.isArray(rawValues)) {
      continue;
    }

    const stringValues = rawValues.filter((rawValue): rawValue is string => typeof rawValue === 'string');
    parsed[key] = stringValues;
  }

  return parsed;
}

function parseLensFields(value: unknown): LensField[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      name: typeof item.name === 'string' ? item.name : '',
      type: typeof item.type === 'string' ? item.type : '',
      instructions:
        typeof item.instructions === 'string' || item.instructions === null
          ? item.instructions
          : undefined,
    }))
    .filter((field) => field.name.length > 0 && field.type.length > 0);
}

function mapLegacyModuleDocument(id: string, data: Record<string, unknown>): UserLensDefinition {
  const versionRaw = data.version;
  const version = typeof versionRaw === 'number' && Number.isFinite(versionRaw) ? versionRaw : 1;

  return {
    id,
    name: typeof data.name === 'string' ? data.name : id,
    description: typeof data.description === 'string' ? data.description : '',
    version,
    mainInstruction: typeof data.prompt_instructions === 'string' ? data.prompt_instructions : '',
    vocabulary: {},
    examples: {},
    fields: [],
    legacySchema: isRecord(data.schema) ? data.schema : {},
  };
}

function mapLensDocument(id: string, data: Record<string, unknown>): UserLensDefinition {
  const versionRaw = data.version;
  const version = typeof versionRaw === 'number' && Number.isFinite(versionRaw) ? versionRaw : 1;

  return {
    id,
    name: typeof data.name === 'string' ? data.name : id,
    description: typeof data.description === 'string' ? data.description : '',
    version,
    mainInstruction:
      typeof data.mainInstruction === 'string'
        ? data.mainInstruction
        : typeof data.prompt_instructions === 'string'
          ? data.prompt_instructions
          : '',
    vocabulary: parseLooseStringArrayMap(data.vocabulary),
    examples: parseLooseStringArrayMap(data.examples),
    fields: parseLensFields(data.fields),
  };
}

async function listActiveUserLenses(userId: string): Promise<UserLensDefinition[]> {
  const lensesSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('lenses')
    .where('active', '==', true)
    .get();

  if (lensesSnapshot.size > 0) {
    return lensesSnapshot.docs
      .map((doc) => mapLensDocument(doc.id, doc.data()))
      .filter((lens) => lens.mainInstruction.length > 0);
  }

  const modulesSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('modules')
    .where('active', '==', true)
    .get();

  if (modulesSnapshot.size > 0) {
    logger.info('Using legacy modules collection as fallback for lenses', { userId });
  }

  return modulesSnapshot.docs
    .map((doc) => mapLegacyModuleDocument(doc.id, doc.data()))
    .filter((lens) => lens.mainInstruction.length > 0);
}

async function analyzeWithLlm(
  userInput: string,
  lenses: UserLensDefinition[]
): Promise<LlmAnalysisResult> {
  if (!openai || lenses.length === 0) {
    return {
      lensesUsed: {},
      analysis: {},
    };
  }

  const lensById = new Map(lenses.map((lens) => [lens.id, lens]));
  const lensPayload = lenses.map((lens) => ({
    id: lens.id,
    name: lens.name,
    version: lens.version,
    description: lens.description,
    main_instruction: lens.mainInstruction,
    vocabulary: lens.vocabulary,
    examples: lens.examples,
    fields: lens.fields,
    schema: lens.legacySchema,
  }));

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You analyze user text against all provided lenses in one pass. Return JSON with keys "modules_used" and "analysis" only. "modules_used" is a compatibility key and should contain relevant lens ids as keys with values containing {"version": number}. "analysis" must include only relevant lens ids and object payloads.',
      },
      {
        role: 'user',
        content: `User input:\n${userInput}\n\nActive user lenses:\n${JSON.stringify(lensPayload)}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    return {
      lensesUsed: {},
      analysis: {},
    };
  }

  const parsed = parseJsonObject(raw);
  const parsedLensesUsed = isRecord(parsed.modules_used)
    ? parsed.modules_used
    : isRecord(parsed.lenses_used)
      ? parsed.lenses_used
      : undefined;
  const parsedAnalysis = parsed.analysis;
  const lensesUsed: LensesUsed = {};
  const analysis: StructuredAnalysis = {};

  if (isRecord(parsedLensesUsed)) {
    for (const lensId of Object.keys(parsedLensesUsed)) {
      const lensDefinition = lensById.get(lensId);
      if (!lensDefinition) {
        continue;
      }

      lensesUsed[lensId] = {
        version: lensDefinition.version,
      };
    }
  }

  if (isRecord(parsedAnalysis)) {
    for (const [lensId, value] of Object.entries(parsedAnalysis)) {
      const lensDefinition = lensById.get(lensId);
      if (!lensDefinition || !isRecord(value)) {
        continue;
      }

      analysis[lensId] = value;

      if (!lensesUsed[lensId]) {
        lensesUsed[lensId] = {
          version: lensDefinition.version,
        };
      }
    }
  }

  return {
    lensesUsed,
    analysis,
  };
}

function getNextStructuredDataVersion(structuredData: UserJournalEvent['structured_data']): number {
  if (structuredData.length === 0) {
    return 1;
  }

  const maxVersion = structuredData.reduce((highestVersion, entry) => {
    const entryVersion = Number.isFinite(entry.version) ? entry.version : 0;
    return entryVersion > highestVersion ? entryVersion : highestVersion;
  }, 0);

  return maxVersion + 1;
}

export const processUserEvent = onDocumentCreated(
  {
    document: 'users/{userId}/events/{eventId}',
    region: 'europe-west1',
  },
  async (event) => {
    const userId = event.params.userId;
    const eventId = event.params.eventId;
    const data = event.data?.data();

    if (!isUserJournalEvent(data)) {
      logger.warn('Skipping invalid user event payload', { userId, eventId });
      return;
    }

    const eventRef = db.collection('users').doc(userId).collection('events').doc(eventId);

    try {
      await eventRef.update({ status: 'processing' });

      if (!openai) {
        await eventRef.update({
          status: 'failed',
          processed_at: new Date().toISOString(),
        });
        return;
      }

      const lenses = await listActiveUserLenses(userId);
      const llmResult = await analyzeWithLlm(data.user_input, lenses);
      const processedAt = new Date().toISOString();
      const structuredDataEntry: UserJournalEvent['structured_data'][number] = {
        version: getNextStructuredDataVersion(data.structured_data),
        processed_at: processedAt,
        modules_used: llmResult.lensesUsed,
        analysis: llmResult.analysis,
      };

      await eventRef.update({
        modules_active: Object.keys(llmResult.lensesUsed),
        structured_data: [...data.structured_data, structuredDataEntry],
        status: 'processed',
        processed_at: processedAt,
      });
    } catch (error) {
      logger.error('Failed processing event', { userId, eventId, error });

      await eventRef.update({
        status: 'failed',
        processed_at: new Date().toISOString(),
      });
    }
  }
);

export const ensureOwnUserProfile = onCall<Record<string, never>, Promise<EnsureOwnUserProfileResponse>>(
  { region: 'europe-west1' },
  async (request): Promise<EnsureOwnUserProfileResponse> => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const userRef = db.collection('users').doc(uid);
    const userSnapshot = await userRef.get();

    if (userSnapshot.exists) {
      await userRef.set(
        {
          updatedAt: FieldValue.serverTimestamp(),
          lastLogin: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        uid,
        created: false,
      };
    }

    const authUser = await getAdminAuth().getUser(uid);
    const userProfile = buildInitialUserProfileDocument({
      uid,
      email: authUser.email ?? '',
    });

    await userRef.set(userProfile);

    logger.info('User profile created from callable', { uid });

    return {
      uid,
      created: true,
    };
  }
);

function getRequiredServerEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing server env: ${name}`);
  }
  return value;
}

function createR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: getRequiredServerEnv('R2_ENDPOINT'),
    credentials: {
      accessKeyId: getRequiredServerEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: getRequiredServerEnv('R2_SECRET_ACCESS_KEY'),
    },
  });
}

function sanitizeExtension(extension: string): string {
  const normalized = extension.trim().toLowerCase().replace('.', '');
  if (!/^[a-z0-9]{1,10}$/.test(normalized)) {
    throw new HttpsError('invalid-argument', 'Invalid file extension.');
  }
  return normalized;
}

function sanitizeObjectKey(objectKey: string): string {
  const normalized = objectKey.trim();
  if (!/^[a-zA-Z0-9/_\-.]{1,512}$/.test(normalized)) {
    throw new HttpsError('invalid-argument', 'Invalid object key.');
  }
  return normalized;
}

function assertCanAccessObjectKey(uid: string, objectKey: string): void {
  if (!objectKey.startsWith(`${uid}/`)) {
    throw new HttpsError('permission-denied', 'You do not have access to this object.');
  }
}

export const requestR2Upload = onCall<UploadRequest, Promise<UploadResponse>>(
  { region: 'europe-west1' },
  async (request): Promise<UploadResponse> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const extension = sanitizeExtension(request.data.extension);
    const bucketName = getRequiredServerEnv('R2_BUCKET_NAME');

    const objectKey = `${request.auth.uid}/${Date.now()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: request.data.contentType,
    });

    const r2Client = createR2Client();
    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 60 * 5 });

    return {
      uploadUrl,
      objectKey,
    };
  }
);

export const getR2ReadUrl = onCall<ReadUrlRequest, Promise<ReadUrlResponse>>(
  { region: 'europe-west1' },
  async (request): Promise<ReadUrlResponse> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const objectKey = sanitizeObjectKey(request.data.objectKey);
    assertCanAccessObjectKey(request.auth.uid, objectKey);

    const bucketName = getRequiredServerEnv('R2_BUCKET_NAME');
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const r2Client = createR2Client();
    const readUrl = await getSignedUrl(r2Client, command, { expiresIn: 60 * 2 });

    return { readUrl };
  }
);
