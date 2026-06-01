import { useRef, useState } from 'react';
import { generatePrompt } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import type { ShotType } from '../../types';

const SHOT_TYPES: { key: ShotType; icon: string; label: string }[] = [
  { key: 'selfie', icon: '📱', label: 'Selfie frontal' },
  { key: 'mirror_selfie', icon: '🪞', label: 'Selfie espejo' },
  { key: 'fixed', icon: '📷', label: 'Foto fija' },
];

export function Step1Input() {
  const {
    config,
    shotType, setShotType,
    inputText, setInputText,
    refImageBase64, setRefImageBase64,
    refImagePreview, setRefImagePreview,
    setCurrentPrompt,
    setCreateStep,
    setTab,
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const hasInput = inputText.trim().length > 0 || !!refImageBase64;

  function handleRefImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      const base64 = result.split(',')[1];
      setRefImageBase64(base64);
      setRefImagePreview(result);
    };
    reader.readAsDataURL(file);
  }

  function removeRefImage() {
    setRefImageBase64(null);
    setRefImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleGenerate() {
    if (!hasInput) return;
    setLoading(true);
    setError('');
    try {
      const { prompt } = await generatePrompt({
        text: inputText.trim() || undefined,
        refImageBase64: refImageBase64 || undefined,
        shotType,
      });
      setCurrentPrompt(prompt);
      setCreateStep(2);
    } catch {
      setError('Error al generar el prompt. Revisá que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  }

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
        <span className="text-5xl">⚙️</span>
        <h2 className="text-lg font-semibold text-[#f5f0eb]">Primero configurá a Ari</h2>
        <p className="text-sm text-[#555]">
          Necesitás subir el Rostro y el Cuerpo antes de generar imágenes.
        </p>
        <button
          type="button"
          onClick={() => setTab('config')}
          className="px-6 py-3 bg-[#ff6b6b] text-white rounded-xl font-semibold text-sm"
        >
          Ir a Config
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-6 max-w-lg mx-auto flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-[#f5f0eb] mb-1">Nueva imagen de Ari</h2>
        <p className="text-sm text-[#555]">Describí la escena o subí una foto de referencia de pose.</p>
      </div>

      {/* Shot type selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[#888] uppercase tracking-wider">
          Tipo de foto
        </label>
        <div className="flex gap-2">
          {SHOT_TYPES.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => setShotType(s.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full text-sm font-medium transition-colors border ${
                shotType === s.key
                  ? 'bg-[#ff6b6b] border-[#ff6b6b] text-white'
                  : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#888] hover:text-[#f5f0eb] hover:border-[#444]'
              }`}
            >
              <span>{s.icon}</span>
              <span className="text-xs">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Text input */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[#888] uppercase tracking-wider">
          Descripción de la escena
        </label>
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Ej: Ari despertando, aún está en la cama, luz de mañana..."
          rows={4}
          className="w-full bg-[#141414] border border-[#222] rounded-xl px-4 py-3 text-[#f5f0eb] text-sm placeholder-[#444] resize-none focus:outline-none focus:border-[#ff6b6b] transition-colors"
        />
      </div>

      {/* Reference image */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[#888] uppercase tracking-wider">
          Foto de referencia de pose <span className="text-[#444] normal-case font-normal">(opcional)</span>
        </label>

        {refImagePreview ? (
          <div className="relative w-full aspect-[9/16] max-h-64 rounded-xl overflow-hidden bg-[#141414] border border-[#222]">
            <img src={refImagePreview} alt="Referencia" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={removeRefImage}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black/80"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full py-8 rounded-xl border-2 border-dashed border-[#2a2a2a] text-[#444] flex flex-col items-center gap-2 hover:border-[#ff6b6b]/40 hover:text-[#ff6b6b]/60 transition-colors"
          >
            <span className="text-3xl">📷</span>
            <span className="text-sm">Subir foto de Instagram o pose</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleRefImage}
        />
      </div>

      {error && (
        <p className="text-sm text-[#ff6b6b] bg-[#ff6b6b]/10 rounded-xl px-4 py-3">{error}</p>
      )}

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!hasInput || loading}
        className={`w-full py-4 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
          hasInput && !loading
            ? 'bg-[#ff6b6b] text-white hover:bg-[#ff5555] active:scale-[0.98]'
            : 'bg-[#1e1e1e] text-[#444] cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>
            <span className="animate-spin">⟳</span>
            Generando prompt...
          </>
        ) : (
          '✨ Generar prompt'
        )}
      </button>

      <p className="text-center text-xs text-[#444]">
        Claude va a crear el prompt perfecto para Ari
      </p>
    </div>
  );
}
