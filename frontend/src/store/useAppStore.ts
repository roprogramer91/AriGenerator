import { create } from 'zustand';
import type { Config, Generation, Tab } from '../types';

interface AppStore {
  tab: Tab;
  setTab: (tab: Tab) => void;

  config: Config | null;
  setConfig: (config: Config | null) => void;

  // Flujo de generación
  inputText: string;
  setInputText: (text: string) => void;
  refImageBase64: string | null;
  setRefImageBase64: (b64: string | null) => void;
  currentPrompt: string;
  setCurrentPrompt: (prompt: string) => void;
  currentGeneration: Generation | null;
  setCurrentGeneration: (gen: Generation | null) => void;
  useFace: boolean;
  useBody: boolean;
  usePhone: boolean;
  setUseFace: (v: boolean) => void;
  setUseBody: (v: boolean) => void;
  setUsePhone: (v: boolean) => void;
}

export const useAppStore = create<AppStore>(set => ({
  tab: 'create',
  setTab: tab => set({ tab }),

  config: null,
  setConfig: config => set({ config }),

  inputText: '',
  setInputText: inputText => set({ inputText }),
  refImageBase64: null,
  setRefImageBase64: refImageBase64 => set({ refImageBase64 }),
  currentPrompt: '',
  setCurrentPrompt: currentPrompt => set({ currentPrompt }),
  currentGeneration: null,
  setCurrentGeneration: currentGeneration => set({ currentGeneration }),
  useFace: true,
  useBody: true,
  usePhone: false,
  setUseFace: useFace => set({ useFace }),
  setUseBody: useBody => set({ useBody }),
  setUsePhone: usePhone => set({ usePhone }),
}));
