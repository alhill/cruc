import { getFunctions } from 'firebase/functions';

import { firebaseApp } from '@/lib/firebase/app';

export const functions = getFunctions(firebaseApp, 'europe-west1');
