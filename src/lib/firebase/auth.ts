import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAuth,
  initializeAuth,
  type Auth,
  type Persistence,
} from 'firebase/auth';
import * as FirebaseAuth from 'firebase/auth';
import { Platform } from 'react-native';

import { firebaseApp } from '@/lib/firebase/app';

let authInstance: Auth;

const getReactNativePersistence = (
  FirebaseAuth as unknown as {
    getReactNativePersistence?: (storage: typeof AsyncStorage) => Persistence;
  }
).getReactNativePersistence;

if (Platform.OS === 'web') {
  authInstance = getAuth(firebaseApp);
} else {
  try {
    if (getReactNativePersistence) {
      authInstance = initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } else {
      authInstance = getAuth(firebaseApp);
    }
  } catch {
    authInstance = getAuth(firebaseApp);
  }
}

export const auth = authInstance;
