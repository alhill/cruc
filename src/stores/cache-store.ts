import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type LensCacheState = {
  lensCache: Record<string, Record<string, unknown>>;
  setLensCache: (lensId: string, data: Record<string, unknown>) => void;
  clearLensCache: (lensId: string) => void;
  // Legacy aliases kept to avoid breaking current callers during transition.
  moduleCache: Record<string, Record<string, unknown>>;
  setModuleCache: (moduleId: string, data: Record<string, unknown>) => void;
  clearModuleCache: (moduleId: string) => void;
  clearAllCache: () => void;
};

export const useCacheStore = create<LensCacheState>()(
  persist(
    (set) => ({
      lensCache: {},
      moduleCache: {},
      setLensCache: (lensId, data) =>
        set((state) => ({
          lensCache: {
            ...state.lensCache,
            [lensId]: data,
          },
          moduleCache: {
            ...state.moduleCache,
            [lensId]: data,
          },
        })),
      clearLensCache: (lensId) =>
        set((state) => {
          const nextLensCache = { ...state.lensCache };
          delete nextLensCache[lensId];
          const nextModuleCache = { ...state.moduleCache };
          delete nextModuleCache[lensId];
          return {
            lensCache: nextLensCache,
            moduleCache: nextModuleCache,
          };
        }),
      setModuleCache: (moduleId, data) =>
        set((state) => ({
          lensCache: {
            ...state.lensCache,
            [moduleId]: data,
          },
          moduleCache: {
            ...state.moduleCache,
            [moduleId]: data,
          },
        })),
      clearModuleCache: (moduleId) =>
        set((state) => {
          const nextLensCache = { ...state.lensCache };
          delete nextLensCache[moduleId];
          const nextModuleCache = { ...state.moduleCache };
          delete nextModuleCache[moduleId];
          return {
            lensCache: nextLensCache,
            moduleCache: nextModuleCache,
          };
        }),
      clearAllCache: () => set({ lensCache: {}, moduleCache: {} }),
    }),
    {
      name: 'cruc-module-cache-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
