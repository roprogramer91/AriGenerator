import axios from 'axios';
import type { Config, Generation, GalleryResponse } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Adjuntar token JWT en cada request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ari_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el servidor responde 401, limpiar token y emitir evento (App.tsx escucha y muestra login)
api.interceptors.response.use(
  r => r,
  err => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('ari_token');
      window.dispatchEvent(new CustomEvent('ari_session_expired'));
    }
    return Promise.reject(err);
  },
);

// ─── Config ───────────────────────────────────────────────────────────────────

export const getConfig = () =>
  api.get<Config | null>('/api/config').then(r => r.data);

export const uploadConfig = (formData: FormData) =>
  api.post<Config>('/api/config', formData).then(r => r.data);

// ─── Generate ─────────────────────────────────────────────────────────────────

export const generatePrompt = (payload: {
  text?: string;
  shotType?: 'selfie' | 'mirror_selfie' | 'fixed';
  plano?: 'primer' | 'segundo';
  inclinacion?: 'ninguna' | 'izquierda' | 'derecha';
  camara?: 'movil' | 'pro';
  usePhone?: boolean;
  // Pose / composición
  refImageBase64?: string;
  refImageMimeType?: string;
  // Ropa — Claude lee solo la ropa de esta imagen
  vestimentaBase64?: string;
  vestimentaMimeType?: string;
  // Escenario / fondo — Claude lee solo el ambiente
  escenarioBase64?: string;
  escenarioMimeType?: string;
  // Objetos en escena
  objetosBase64?: Array<{ base64: string; mimeType: string }>;
}) => api.post<{ prompt: string }>('/api/generate/prompt', payload).then(r => r.data);

export const generateImage = (payload: {
  prompt: string;
  shotType: 'selfie' | 'mirror_selfie' | 'fixed';
  useFace?: boolean;
  useBody?: boolean;
  usePhone?: boolean;
  model?: string;
  inputText?: string;
  // Lab: imagen fuente a variar
  sourceImageBase64?: string;
  sourceImageMimeType?: string;
  // Compositor: refs del sidebar para que Gemini las vea directamente
  extraRefsBase64?: Array<{ base64: string; mimeType: string }>;
}) => api.post<{ id: string; imageUrl: string }>('/api/generate/image', payload).then(r => r.data);

// ─── Variations ───────────────────────────────────────────────────────────────

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

// ─── Gallery ──────────────────────────────────────────────────────────────────

export const getGallery = (page = 1, limit = 20) =>
  api.get<GalleryResponse>(`/api/gallery?page=${page}&limit=${limit}`).then(r => r.data);

export const getGeneration = (id: string) =>
  api.get<Generation>(`/api/gallery/${id}`).then(r => r.data);
