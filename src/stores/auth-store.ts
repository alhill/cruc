import { type User } from 'firebase/auth';
import { create } from 'zustand';

import { auth } from '@/lib/firebase/auth';

type AuthState = {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  refreshUser: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  refreshUser: async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await currentUser.reload();
      set({ user: auth.currentUser });
    }
  },
}));
