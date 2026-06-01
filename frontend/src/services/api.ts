import axios from 'axios';
import type { Config, Generation, GalleryResponse } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Config
export const getConfig = () =>
  api.get<Config | null>('/api/config').then(r => r.data);

export const uploadConfig = (formData: FormData) =>
  api.post<Config>('/api/config', formData).then(r => r.data);

// Generate
export const generatePrompt = (payload: { text?: string; refImageBase64?: string }) =>
  api.post<{ prompt: string }>('/api/generate/prompt', payload).then(r => r.data);

export const generateImage = (payload: {
  prompt: string;
  useFace: boolean;
  useBody: boolean;
  usePhone: boolean;
  inputText?: string;
  refImageUrl?: string;
}) => api.post<{ id: string; imageUrl: string }>('/api/generate/image', payload).then(r => r.data);

// Variations
export const generateVariations = (payload: {
  generationId: string;
  expression?: string;
  framing?: string;
  angle?: string;
  count?: number;
}) =>
  api
    .post<Array<{ id: string; imageUrl: string }>>('/api/variations', payload)
    .then(r => r.data);

// Gallery
export const getGallery = (page = 1, limit = 20) =>
  api.get<GalleryResponse>(`/api/gallery?page=${page}&limit=${limit}`).then(r => r.data);

export const getGeneration = (id: string) =>
  api.get<Generation>(`/api/gallery/${id}`).then(r => r.data);
