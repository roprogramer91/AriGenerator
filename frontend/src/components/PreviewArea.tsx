import React from 'react';
import type { SceneState, GeneratedResult, MediaSlot, Config } from '../types';

interface PreviewAreaProps {
  history: GeneratedResult[];
  loading: boolean;
  error: string | null;
  config: Config | null;
  scene: SceneState;
  onDownload: (result: GeneratedResult) => void;
  downloadStates: Record<string, 'idle' | 'downloading' | 'done' | 'error'>;
  onVariations: (result: GeneratedResult) => void;
  variationLoading: Record<string, boolean>;
}

export const PreviewArea: React.FC<PreviewAreaProps> = ({
  history, loading, error, config, scene,
  onDownload, downloadStates, onVariations, variationLoading,
}) => {
  return (
    <div className="w-full flex flex-col items-center gap-12 pb-32">

      {/* Loading placeholder */}
      {loading && (
        <div
          className="relative w-full max-w-4xl bg-[#141414] rounded-2xl border border-white/5 flex flex-col items-center justify-center shadow-2xl"
          style={{ aspectRatio: scene.aspectRatio.replace(':', '/') }}
        >
          <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin mb-4" />
          <p className="text-white/60 text-sm font-medium animate-pulse">Componiendo nueva escena...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="w-full max-w-xl p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium">
          {error}
        </div>
      )}

      {/* Empty state */}
      {history.length === 0 && !loading && !error && (
        <div className="flex flex-col items-center gap-6 py-24 opacity-30">
          <span className="material-symbols-outlined text-[80px]">auto_awesome_motion</span>
          <div className="text-center">
            <h3 className="text-xl font-medium text-white mb-2">Comienza a crear</h3>
            <p className="text-sm text-white/60">Configura los elementos en el panel lateral para generar tu primera escena</p>
          </div>
        </div>
      )}

      {/* History */}
      <div className="flex flex-col gap-16 w-full items-center">
        {history.map((result, index) => (
          <div key={result.id} className="w-full max-w-4xl group animate-dropdown">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                    {result.isVariation
                      ? 'Variación de Escena'
                      : index === 0
                      ? 'Último Resultado'
                      : `Resultado #${history.length - index}`}
                  </span>
                  {result.isVariation && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[8px] font-bold uppercase tracking-tighter">
                      Variación
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-white/20">{new Date(result.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-2">
                {!result.isVariation && (
                  <VariationButton
                    loading={variationLoading[result.id]}
                    onClick={() => onVariations(result)}
                  />
                )}
                <DownloadButton
                  state={downloadStates[result.id] || 'idle'}
                  onClick={() => onDownload(result)}
                />
              </div>
            </div>

            <div
              className="relative w-full bg-[#141414] rounded-2xl border border-white/5 overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]"
              style={{ aspectRatio: scene.aspectRatio.replace(':', '/') }}
            >
              <img
                src={result.imageUrl}
                alt={`Generación ${result.id}`}
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6 pointer-events-none">
                <p className="text-white/80 text-xs leading-relaxed max-w-2xl italic">"{result.prompt}"</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reference thumbnails bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-[calc(300px+50%)] lg:-translate-x-1/2 flex gap-3 p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-20">
        <RefThumbnail label="ID" imgSrc={config?.faceUrl ?? null} variant="identity" />
        <RefThumbnail label="Vest" slot={scene.vestimenta} />
        <RefThumbnail label="Esc" slot={scene.escenario} />
        <RefThumbnail label="Obj" slot={scene.objetos[0]} />
        <RefThumbnail label="Pose" slot={scene.pose} />
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const VariationButton: React.FC<{ loading?: boolean; onClick: () => void }> = ({ loading, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className="flex items-center gap-2 h-8 px-4 rounded-full text-[11px] font-bold bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white transition-all disabled:opacity-50"
  >
    <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>
      {loading ? 'sync' : 'psychology'}
    </span>
    <span>{loading ? 'Generando variaciones...' : 'Generar Variaciones'}</span>
  </button>
);

const DownloadButton: React.FC<{
  state: 'idle' | 'downloading' | 'done' | 'error';
  onClick: () => void;
}> = ({ state, onClick }) => {
  const config = {
    idle: { label: 'Descargar', icon: 'download', className: 'bg-white/10 hover:bg-white text-white hover:text-black' },
    downloading: { label: 'Preparando...', icon: 'sync', className: 'bg-white/5 text-white/40 cursor-wait animate-pulse' },
    done: { label: 'Guardado', icon: 'check_circle', className: 'bg-green-500/20 text-green-400' },
    error: { label: 'Error', icon: 'error', className: 'bg-red-500/20 text-red-400' },
  }[state];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state !== 'idle'}
      className={`flex items-center gap-2 h-8 px-4 rounded-full text-[11px] font-bold transition-all ${config.className}`}
    >
      <span className={`material-symbols-outlined text-[16px] ${state === 'downloading' ? 'animate-spin' : ''}`}>
        {config.icon}
      </span>
      <span>{config.label}</span>
    </button>
  );
};

const RefThumbnail: React.FC<{
  label: string;
  slot?: MediaSlot;
  imgSrc?: string | null;
  variant?: 'default' | 'identity';
}> = ({ label, slot, imgSrc, variant = 'default' }) => {
  const hasContent = !!imgSrc || !!slot?.base64;
  const src = imgSrc ?? (slot?.base64 ? `data:${slot.mimeType};base64,${slot.base64}` : null);

  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${hasContent ? 'bg-white/10 border-white/20' : 'bg-transparent border-white/5 opacity-20'} ${slot?.isLocked ? 'ring-1 ring-amber-400' : ''} ${variant === 'identity' ? 'border-blue-400/40' : ''}`}>
        {src
          ? <img src={src} className="w-full h-full object-cover rounded-md" alt={label} crossOrigin="anonymous" />
          : <span className={`material-symbols-outlined text-[14px] ${variant === 'identity' ? 'text-blue-400' : 'text-white/40'}`}>
              {variant === 'identity' ? 'face_retouching_natural' : (slot?.icon ?? 'image')}
            </span>
        }
      </div>
      <span className={`text-[8px] uppercase tracking-tighter font-bold ${slot?.isLocked ? 'text-amber-400' : 'text-white/40'}`}>
        {label}
      </span>
    </div>
  );
};
