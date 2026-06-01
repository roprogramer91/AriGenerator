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

export type Tab = 'create' | 'gallery' | 'config';
