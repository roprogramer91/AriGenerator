import { create } from 'zustand';
import type { Config, Generation, Tab, ShotType } from '../types';

export type CreateStep = 1 | 2 | 3;

interface AppStore {
  tab: Tab;
  setTab: (tab: Tab) => void;

  config: Config | null;
  setConfig: (config: Config | null) => void;

  // Flujo de generación
  createStep: CreateStep;
  setCreateStep: (step: CreateStep) => void;
  shotType: ShotType;
  setShotType: (t: ShotType) => void;
  inputText: string;
  setInputText: (text: string) => void;
  refImageBase64: string | null;
  setRefImageBase64: (b64: string | null) => void;
  refImagePreview: string | null;
  setRefImagePreview: (url: string | null) => void;
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

  resetFlow: () => void;
}

export const useAppStore = create<AppStore>(set => ({
  tab: 'create',
  setTab: tab => set({ tab }),

  config: null,
  setConfig: config => set({ config }),

  createStep: 1,
  setCreateStep: createStep => set({ createStep }),
  shotType: 'selfie',
  setShotType: shotType => set({ shotType }),
  inputText: '',
  setInputText: inputText => set({ inputText }),
  refImageBase64: null,
  setRefImageBase64: refImageBase64 => set({ refImageBase64 }),
  refImagePreview: null,
  setRefImagePreview: refImagePreview => set({ refImagePreview }),
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

  resetFlow: () =>
    set({
      createStep: 1,
      shotType: 'selfie',
      inputText: '',
      refImageBase64: null,
      refImagePreview: null,
      currentPrompt: '',
      currentGeneration: null,
      useFace: true,
      useBody: true,
      usePhone: false,
    }),
}));
