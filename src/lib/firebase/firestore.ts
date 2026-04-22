import { getFirestore } from 'firebase/firestore';

import { firebaseApp } from '@/lib/firebase/app';
// Import auth to ensure it's initialized first in React Native

export const db = getFirestore(firebaseApp);
