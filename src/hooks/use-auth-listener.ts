import { type FirebaseError } from 'firebase/app';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useRef } from 'react';

import { auth } from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/firestore';
import { ensureOwnUserProfile } from '@/lib/firebase/user-profile-sync';
import { useAuthStore } from '@/stores/auth-store';

function getErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const maybeFirebaseError = error as FirebaseError;
  return typeof maybeFirebaseError.code === 'string' ? maybeFirebaseError.code : null;
}

async function hasUserProfileDocument(uid: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnapshot = await getDoc(userRef);
    return userSnapshot.exists();
  } catch (error: unknown) {
    const errorCode = getErrorCode(error);

    // Firestore can throw while offline in RN; treat this as an unknown state
    // and let the next token refresh retry.
    if (errorCode === 'unavailable' || errorCode === 'failed-precondition') {
      return false;
    }

    throw error;
  }
}

/**
 * Listens to Firebase auth state changes (sign-in/sign-out/restored session).
 * Must be called once from the root layout.
 */
export function useAuthListener() {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const syncedUidRef = useRef<string | null>(null);
  const syncingUidRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);

      if (!user) {
        syncedUidRef.current = null;
        syncingUidRef.current = null;
        return;
      }

      if (syncedUidRef.current === user.uid || syncingUidRef.current === user.uid) {
        return;
      }

      syncingUidRef.current = user.uid;

      void ensureOwnUserProfile()
        .then(() => {
          syncedUidRef.current = user.uid;
        })
        .catch(async (error: unknown) => {
          const errorCode = getErrorCode(error);

          // In some environments the callable can return not-found even when
          // the user profile document already exists.
          if (errorCode === 'functions/not-found' || errorCode === 'not-found') {
            try {
              const profileExists = await hasUserProfileDocument(user.uid);
              if (profileExists) {
                syncedUidRef.current = user.uid;
                return;
              }
            } catch (profileError: unknown) {
              // Silently skip profile checks that fail; don't block auth flow
            }
            // Don't warn for not-found since it's a known transient state
            return;
          }

          console.warn('Failed to ensure user profile document', error);
        })
        .finally(() => {
          if (syncingUidRef.current === user.uid) {
            syncingUidRef.current = null;
          }
        });
    });
    return unsubscribe;
  }, [setUser, setLoading]);
}
