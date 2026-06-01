// ─── Backend types (Config + Generation para galería y store) ────────────────

export interface Config {
  id: string;
  faceUrl: string;
  bodyUrl: string;
  phoneUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Generation {
  id: string;
  inputText?: string;
  refImageUrl?: string;
  prompt: string;
  imageUrl: string;
  useFace: boolean;
  useBody: boolean;
  usePhone: boolean;
  isVariation: boolean;
  parentId?: string;
  createdAt: string;
  variations?: Generation[];
}

export interface GalleryResponse {
  items: Generation[];
  total: number;
  page: number;
  limit: number;
}

// ─── App tabs ─────────────────────────────────────────────────────────────────

export type AppTab = 'compositor' | 'laboratorio' | 'galeria' | 'config';

// ─── Flow-style UI types ──────────────────────────────────────────────────────

export type MediaSlot = {
  id: string;
  mediaId: string | null;
  base64: string | null;
  mimeType: string | null;
  label: string;
  icon: string;
  isLocked?: boolean;
};

export type GeneratedResult = {
  id: string;
  imageUrl: string;
  timestamp: number;
  prompt: string;
  isVariation?: boolean;
};

export type ShotPlano = 'primer' | 'segundo';
export type TiltType = 'ninguna' | 'izquierda' | 'derecha';
export type ShotStyle = 'selfie' | 'espejo' | 'fija';
export type CameraType = 'pro' | 'movil';
export type ZoomType = 'primer' | 'segundo' | 'tercer' | 'cuarto';
export type ExpressionType =
  | 'neutra' | 'sonrisa' | 'seria' | 'sorprendida' | 'guiño'
  | 'triste' | 'enojada' | 'enojada_tierna' | 'triste_tierna'
  | 'beso' | 'sonrisa_tierna' | 'picara';

export type SceneState = {
  personaje: MediaSlot;
  dosPersonas: boolean;
  contextura: MediaSlot;
  vestimenta: MediaSlot;
  escenario: MediaSlot;
  objetos: MediaSlot[];
  pose: MediaSlot;
  plano: ShotPlano;
  inclinacion: TiltType;
  estiloDisparo: ShotStyle;
  camara: CameraType;
  usePhone: boolean;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
  instrucciones: string;
};

export type VariationState = {
  source: MediaSlot;
  dosPersonas: boolean;
  expresion: ExpressionType;
  zoom: ZoomType;
  angulo: TiltType;
  estilo: 'selfie' | 'espejo';
};
