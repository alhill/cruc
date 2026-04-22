import { type FieldValue, serverTimestamp } from 'firebase/firestore';

export type UserRole = 'user';

export type UserProfile = {
  uid: string;
  email: string;
  name: string;
  surname: string;
  profileImage: string | null;
  createdAt: FieldValue;
  updatedAt: FieldValue;
  lastLogin: FieldValue;
  isActive: boolean;
  role: UserRole;
};

export function buildInitialUserProfile(args: {
  uid: string;
  email: string;
}): UserProfile {
  return {
    uid: args.uid,
    email: args.email,
    name: '',
    surname: '',
    profileImage: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
    isActive: true,
    role: 'user',
  };
}
