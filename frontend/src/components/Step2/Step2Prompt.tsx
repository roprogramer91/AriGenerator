import { useState } from 'react';
import { generateImage } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

export function Step2Prompt() {
  const {
    config,
    currentPrompt, setCurrentPrompt,
    inputText,
    useFace, useBody, usePhone,
    setUseFace, setUseBody, setUsePhone,
    setCurrentGeneration,
    setCreateStep,
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    if (!currentPrompt.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await generateImage({
        prompt: currentPrompt,
        useFace,
        useBody,
        usePhone,
        inputText: inputText || undefined,
      });
      setCurrentGeneration({ ...result, prompt: currentPrompt, useFace, useBody, usePhone, isVariation: false, createdAt: new Date().toISOString() });
      setCreateStep(3);
    } catch {
      setError('Error al generar la imagen. La generación tarda 15-40 segundos, intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  interface RefToggle {
    key: 'face' | 'body' | 'phone';
    label: string;
    url: string | undefined;
    value: boolean;
    onChange: (v: boolean) => void;
    locked?: boolean;
  }

  const refs: RefToggle[] = [
    { key: 'face', label: 'Rostro', url: config?.faceUrl, value: useFace, onChange: setUseFace, locked: true },
    { key: 'body', label: 'Cuerpo', url: config?.bodyUrl, value: useBody, onChange: setUseBody },
    { key: 'phone', label: 'Celular', url: config?.phoneUrl, value: usePhone, onChange: setUsePhone },
  ].filter(r => r.url);

  return (
    <div className="px-5 pt-6 pb-6 max-w-lg mx-auto flex flex-col gap-5">
      {/* Back */}
      <button
        type="button"
        onClick={() => setCreateStep(1)}
        className="flex items-center gap-2 text-sm text-[#666] hover:text-[#f5f0eb] transition-colors w-fit"
      >
        ← Volver
      </button>

      <div>
        <h2 className="text-xl font-semibold text-[#f5f0eb] mb-1">Revisá el prompt</h2>
        <p className="text-sm text-[#555]">Podés editarlo antes de generar la imagen.</p>
      </div>

      {/* Prompt editable */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[#888] uppercase tracking-wider">
          Prompt generado por Claude
        </label>
        <textarea
          value={currentPrompt}
          onChange={e => setCurrentPrompt(e.target.value)}
          rows={6}
          className="w-full bg-[#141414] border border-[#ff6b6b]/20 rounded-xl px-4 py-3 text-[#f5f0eb] text-sm resize-none focus:outline-none focus:border-[#ff6b6b] transition-colors leading-relaxed"
        />
      </div>

      {/* Referencias activas */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[#888] uppercase tracking-wider">
          Referencias visuales
        </label>
        <div className="flex gap-3">
          {refs.map(ref => (
            <button
              key={ref.key}
              type="button"
              onClick={() => !ref.locked && ref.onChange(!ref.value)}
              className={`relative flex-1 rounded-xl overflow-hidden border-2 transition-all ${
                ref.value ? 'border-[#ff6b6b]' : 'border-[#222] opacity-40'
              } ${ref.locked ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}`}
            >
              <div className="aspect-square">
                <img src={ref.url} alt={ref.label} className="w-full h-full object-cover" />
              </div>
              <div className={`absolute inset-0 flex items-end justify-center pb-2 ${ref.value ? 'bg-black/20' : 'bg-black/60'}`}>
                <span className="text-white text-xs font-semibold drop-shadow">{ref.label}</span>
              </div>
              {ref.value && (
                <div className="absolute top-1.5 right-1.5 bg-[#ff6b6b] rounded-full w-5 h-5 flex items-center justify-center">
                  <span className="text-white text-[10px]">✓</span>
                </div>
              )}
              {ref.locked && (
                <div className="absolute top-1.5 left-1.5 bg-black/60 rounded-full px-1.5 py-0.5">
                  <span className="text-white text-[9px]">🔒</span>
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#444]">Tocá para activar/desactivar. Rostro siempre activo.</p>
      </div>

      {error && (
        <p className="text-sm text-[#ff6b6b] bg-[#ff6b6b]/10 rounded-xl px-4 py-3">{error}</p>
      )}

      {/* Generate image button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!currentPrompt.trim() || loading}
        className={`w-full py-4 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
          currentPrompt.trim() && !loading
            ? 'bg-[#ff6b6b] text-white hover:bg-[#ff5555] active:scale-[0.98]'
            : 'bg-[#1e1e1e] text-[#444] cursor-not-allowed'
        }`}
      >
        {loading ? (
          <span className="flex flex-col items-center gap-1">
            <span className="flex items-center gap-2">
              <span className="animate-spin inline-block">⟳</span>
              Generando imagen...
            </span>
            <span className="text-xs font-normal opacity-70">Esto puede tardar 15-40 segundos</span>
          </span>
        ) : (
          '🎨 Generar imagen'
        )}
      </button>
    </div>
  );
}
