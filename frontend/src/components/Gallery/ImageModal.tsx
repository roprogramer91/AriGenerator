import { useEffect } from 'react';
import type { Generation } from '../../types';

interface Props {
  generation: Generation;
  onClose: () => void;
  onDownload: (url: string) => void;
  onCopy: (url: string) => void;
  onCopyPrompt: (prompt: string) => void;
  onVariation: (id: string) => void;
}

export function ImageModal({ generation, onClose, onDownload, onCopy, onCopyPrompt, onVariation }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 flex-shrink-0">
        <button type="button" onClick={onClose} className="text-[#888] hover:text-white transition-colors text-sm">
          ✕ Cerrar
        </button>
        {generation.isVariation && (
          <span className="text-xs bg-[#ff6b6b]/20 text-[#ff6b6b] px-2 py-1 rounded-full">Variación</span>
        )}
      </div>

      {/* Image */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center px-4 pb-4 gap-4">
        <img
          src={generation.imageUrl}
          alt="Generación de Ari"
          className="w-full max-w-sm rounded-2xl object-contain"
        />

        {/* Prompt */}
        <div className="w-full max-w-sm bg-[#141414] rounded-xl p-4 border border-[#1e1e1e]">
          <p className="text-xs text-[#666] mb-2 uppercase tracking-wider font-semibold">Prompt</p>
          <p className="text-sm text-[#aaa] leading-relaxed">{generation.prompt}</p>
        </div>

        {/* Actions */}
        <div className="w-full max-w-sm grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onCopyPrompt(generation.prompt)}
            className="flex items-center justify-center gap-2 py-3 bg-[#141414] rounded-xl border border-[#1e1e1e] text-sm text-[#888] hover:text-[#f5f0eb] hover:border-[#333] transition-colors"
          >
            📋 Copiar prompt
          </button>
          <button
            type="button"
            onClick={() => onVariation(generation.id)}
            className="flex items-center justify-center gap-2 py-3 bg-[#ff6b6b]/10 rounded-xl border border-[#ff6b6b]/30 text-sm text-[#ff6b6b] hover:bg-[#ff6b6b]/20 transition-colors"
          >
            ✨ Variación
          </button>
          <button
            type="button"
            onClick={() => onDownload(generation.imageUrl)}
            className="flex items-center justify-center gap-2 py-3 bg-[#141414] rounded-xl border border-[#1e1e1e] text-sm text-[#888] hover:text-[#f5f0eb] hover:border-[#333] transition-colors"
          >
            ⬇️ Descargar
          </button>
          <button
            type="button"
            onClick={() => onCopy(generation.imageUrl)}
            className="flex items-center justify-center gap-2 py-3 bg-[#141414] rounded-xl border border-[#1e1e1e] text-sm text-[#888] hover:text-[#f5f0eb] hover:border-[#333] transition-colors"
          >
            📱 Copiar imagen
          </button>
        </div>

        {/* Meta */}
        <p className="text-xs text-[#444]">
          {new Date(generation.createdAt).toLocaleDateString('es-AR', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
