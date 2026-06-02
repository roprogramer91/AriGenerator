// Guarda imágenes usadas para poder reutilizarlas sin tener que descargarlas de nuevo.
// Se almacena en localStorage. Límite: 40 imágenes. Si se llena, se descarta la más vieja.

export interface LibraryImage {
  id: string;
  base64: string;       // 1024px JPEG
  mimeType: 'image/jpeg';
  timestamp: number;
}

const KEY = 'ari_image_library';
const MAX = 40;

export function getLibrary(): LibraryImage[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveToLibrary(base64: string): LibraryImage {
  const img: LibraryImage = {
    id: crypto.randomUUID(),
    base64,
    mimeType: 'image/jpeg',
    timestamp: Date.now(),
  };

  const existing = getLibrary();

  // No guardar duplicados (primeros 80 chars de base64 son suficientes como huella)
  const fingerprint = base64.slice(0, 80);
  if (existing.some(i => i.base64.slice(0, 80) === fingerprint)) {
    return existing.find(i => i.base64.slice(0, 80) === fingerprint)!;
  }

  const updated = [img, ...existing].slice(0, MAX);

  try {
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // localStorage lleno — descartar las más viejas hasta que entre
    const trimmed = [img, ...existing].slice(0, MAX - 10);
    try { localStorage.setItem(KEY, JSON.stringify(trimmed)); } catch { /* sin espacio */ }
  }

  return img;
}

export function deleteFromLibrary(id: string): void {
  const updated = getLibrary().filter(i => i.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}
