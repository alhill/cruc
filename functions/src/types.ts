export type EventType = 'user_note' | 'user_deep' | 'system_generated';
export type EventSource = 'text' | 'voice' | 'photo';
export type EventStatus = 'pending' | 'processing' | 'processed' | 'failed' | 'archived';

export type UserRole = 'user';

export type UserProfile = {
  uid: string;
  email: string;
  name: string;
  surname: string;
  profileImage: string | null;
  createdAt: string | FirebaseFirestore.Timestamp;
  updatedAt: string | FirebaseFirestore.Timestamp;
  lastLogin: string | FirebaseFirestore.Timestamp;
  isActive: boolean;
  role: UserRole;
};

export type LooseStringArrayMap = Record<string, string[]>;

export type LensField = {
  name: string;
  type: string;
  instructions?: string | null;
};

export type LensBase = {
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  name: string;
  version: number;
  mainInstruction: string;
  description?: string | null;
  vocabulary: LooseStringArrayMap;
  examples: LooseStringArrayMap;
  active: boolean;
  fields: LensField[];
};

export type MasterLens = LensBase;

export type UserLens = LensBase & {
  base_version: number;
  base_lens: string;
};

export type StructuredAnalysis = Record<string, Record<string, unknown>>;

export type LensesUsed = Record<string, { version: number }>;

export type ModulesUsed = LensesUsed;

export type StructuredDataEntry = {
  version: number;
  processed_at: string;
  modules_used: LensesUsed;
  analysis: StructuredAnalysis;
};

export type UserJournalEvent = {
  id: string;
  timestamp: string;
  type: 'user_note' | 'user_deep';
  source: EventSource;
  user_input: string;
  media?: string[];
  modules_active: string[];
  structured_data: StructuredDataEntry[];
  status: EventStatus;
  processed_at?: string;
};

export type SystemGeneratedEvent = {
  id: string;
  timestamp: string;
  type: 'system_generated';
  related_event_id: string;
  content: string;
  metadata?: Record<string, unknown>;
};

export type JournalEvent = UserJournalEvent | SystemGeneratedEvent;
