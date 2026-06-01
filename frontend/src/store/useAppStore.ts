import { create } from 'zustand';
import type { Config } from '../types';

interface AppStore {
  config: Config | null;
  setConfig: (config: Config | null) => void;
}

export const useAppStore = create<AppStore>(set => ({
  config: null,
  setConfig: config => set({ config }),
}));
