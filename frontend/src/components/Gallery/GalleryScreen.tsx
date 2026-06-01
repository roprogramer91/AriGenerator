import { useEffect, useState, useCallback } from 'react';
import { getGallery } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { ImageModal } from './ImageModal';
import type { Generation } from '../../types';

const PAGE_SIZE = 20;

export function GalleryScreen() {
  const { setTab, setCurrentGeneration, setCreateStep, setCurrentPrompt, setUseFace, setUseBody, setUsePhone } = useAppStore();

  const [items, setItems] = useState<Generation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Generation | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const data = await getGallery(p, PAGE_SIZE);
      setItems(prev => p === 1 ? data.items : [...prev, ...data.items]);
      setTotal(data.total);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  function handleDownload(url: string) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `ari-${Date.now()}.jpg`;
    a.target = '_blank';
    a.click();
  }

  async function handleCopyImage(url: string) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    } catch {
      window.open(url, '_blank');
    }
  }

  async function handleCopyPrompt(prompt: string, id: string) {
    await navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleVariation(gen: Generation) {
    setCurrentGeneration(gen);
    setCurrentPrompt(gen.prompt);
    setUseFace(gen.useFace);
    setUseBody(gen.useBody);
    setUsePhone(gen.usePhone);
    setCreateStep(3);
    setTab('create');
    setSelected(null);
  }

  const hasMore = items.length < total;

  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
        <span className="text-5xl">🖼️</span>
        <h2 className="text-xl font-semibold text-[#f5f0eb]">Galería vacía</h2>
        <p className="text-sm text-[#555]">Generá tu primera imagen de Ari para verla acá.</p>
        <button
          type="button"
          onClick={() => setTab('create')}
          className="px-6 py-3 bg-[#ff6b6b] text-white rounded-xl font-semibold text-sm"
        >
          ✨ Crear imagen
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="px-3 pt-5 pb-6">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-lg font-semibold text-[#f5f0eb]">Galería</h2>
          <span className="text-xs text-[#555]">{total} imagen{total !== 1 ? 'es' : ''}</span>
        </div>

        {/* Grid 2 columnas */}
        <div className="grid grid-cols-2 gap-2">
          {items.map(item => (
            <div
              key={item.id}
              className="relative bg-[#141414] rounded-xl overflow-hidden border border-[#1e1e1e] group cursor-pointer"
              onClick={() => setSelected(item)}
            >
              {/* Imagen */}
              <div className="aspect-[9/16] w-full overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt="Ari"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Badge variación */}
              {item.isVariation && (
                <div className="absolute top-2 left-2 bg-[#ff6b6b] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  VAR
                </div>
              )}

              {/* Overlay con acciones */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 gap-1">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); handleCopyPrompt(item.prompt, item.id); }}
                    className="flex-1 py-1.5 bg-black/60 rounded-lg text-white text-[10px] text-center hover:bg-black/80 transition-colors"
                  >
                    {copiedId === item.id ? '✓' : '📋'}
                  </button>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); handleDownload(item.imageUrl); }}
                    className="flex-1 py-1.5 bg-black/60 rounded-lg text-white text-[10px] text-center hover:bg-black/80 transition-colors"
                  >
                    ⬇️
                  </button>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); handleVariation(item); }}
                    className="flex-1 py-1.5 bg-[#ff6b6b]/80 rounded-lg text-white text-[10px] text-center hover:bg-[#ff6b6b] transition-colors"
                  >
                    ✨
                  </button>
                </div>
              </div>

              {/* Fecha abajo */}
              <div className="px-2 py-2">
                <p className="text-[10px] text-[#555] truncate">
                  {new Date(item.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                </p>
                <p className="text-[11px] text-[#666] truncate leading-tight mt-0.5">
                  {item.prompt.slice(0, 50)}…
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Load more */}
        {hasMore && (
          <button
            type="button"
            onClick={() => load(page + 1)}
            disabled={loading}
            className="mt-4 w-full py-3 rounded-xl border border-[#1e1e1e] text-sm text-[#666] hover:text-[#f5f0eb] hover:border-[#333] transition-colors disabled:opacity-40"
          >
            {loading ? 'Cargando...' : 'Cargar más'}
          </button>
        )}

        {loading && items.length === 0 && (
          <div className="flex justify-center py-12">
            <span className="text-[#555] text-sm animate-pulse">Cargando galería...</span>
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <ImageModal
          generation={selected}
          onClose={() => setSelected(null)}
          onDownload={handleDownload}
          onCopy={handleCopyImage}
          onCopyPrompt={prompt => handleCopyPrompt(prompt, selected.id)}
          onVariation={id => handleVariation(items.find(i => i.id === id)!)}
        />
      )}
    </>
  );
}
