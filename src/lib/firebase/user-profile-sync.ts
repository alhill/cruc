import { httpsCallable } from 'firebase/functions';

import { functions } from '@/lib/firebase/functions';

type EnsureOwnUserProfileOutput = {
  uid: string;
  created: boolean;
};

export async function ensureOwnUserProfile(): Promise<EnsureOwnUserProfileOutput> {
  const callable = httpsCallable<Record<string, never>, EnsureOwnUserProfileOutput>(
    functions,
    'ensureOwnUserProfile'
  );

  const response = await callable({});
  return response.data;
}
