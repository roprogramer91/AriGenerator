import { useState } from 'react';
import { generateImage, generateVariations } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

const EXPRESSIONS = [
  { key: 'smile', label: 'Sonrisa' },
  { key: 'serious', label: 'Seria' },
  { key: 'tender', label: 'Tierna' },
  { key: 'cute_angry', label: 'Enojada tierna' },
  { key: 'pout', label: 'Puchero' },
  { key: 'surprised', label: 'Sorpresa' },
  { key: 'wink', label: 'Guiño' },
  { key: 'mischievous', label: 'Pícara' },
];

const FRAMINGS = [
  { key: 'close', label: 'Primer plano' },
  { key: 'bust', label: 'Busto' },
  { key: 'full', label: 'Cuerpo entero' },
];

const ANGLES = [
  { key: 'left', label: 'Izquierda' },
  { key: 'front', label: 'Frontal' },
  { key: 'right', label: 'Derecha' },
];

export function Step3Result() {
  const {
    currentGeneration, setCurrentGeneration,
    currentPrompt,
    shotType,
    useFace, useBody, usePhone,
    inputText,
    setCreateStep,
    resetFlow,
  } = useAppStore();

  const [showVariations, setShowVariations] = useState(false);
  const [expression, setExpression] = useState('');
  const [framing, setFraming] = useState('');
  const [angle, setAngle] = useState('');
  const [varCount, setVarCount] = useState(1);
  const [varImages, setVarImages] = useState<string[]>([]);
  const [loadingRetry, setLoadingRetry] = useState(false);
  const [loadingVar, setLoadingVar] = useState(false);
  const [error, setError] = useState('');

  if (!currentGeneration) return null;

  async function handleRetry() {
    setLoadingRetry(true);
    setError('');
    try {
      const result = await generateImage({
        prompt: currentPrompt,
        shotType,
        useFace, useBody, usePhone,
        inputText: inputText || undefined,
      });
      setCurrentGeneration({
        ...result,
        prompt: currentPrompt,
        useFace, useBody, usePhone,
        isVariation: false,
        createdAt: new Date().toISOString(),
      });
      setVarImages([]);
    } catch {
      setError('Error al reintentar. Intentá de nuevo.');
    } finally {
      setLoadingRetry(false);
    }
  }

  async function handleVariations() {
    setLoadingVar(true);
    setError('');
    try {
      const results = await generateVariations({
        generationId: currentGeneration!.id,
        expression: expression || undefined,
        framing: framing || undefined,
        angle: angle || undefined,
        count: varCount,
      });
      setVarImages(results.map(r => r.imageUrl));
    } catch {
      setError('Error al generar variaciones.');
    } finally {
      setLoadingVar(false);
    }
  }

  async function handleDownload(url: string) {
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
      // fallback: abrir en nueva tab
      window.open(url, '_blank');
    }
  }

  function SelectGroup({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (v: string) => void }) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(value === o.key ? '' : o.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              value === o.key
                ? 'bg-[#ff6b6b] text-white'
                : 'bg-[#1e1e1e] text-[#888] hover:text-[#f5f0eb]'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-6 max-w-lg mx-auto flex flex-col gap-5">
      {/* Imagen principal */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-[#141414] border border-[#1e1e1e]">
        <img
          src={currentGeneration.imageUrl}
          alt="Generación de Ari"
          className="w-full object-contain max-h-[70vh]"
        />
      </div>

      {/* Acciones principales */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={handleRetry}
          disabled={loadingRetry}
          className="flex flex-col items-center gap-1 py-3 bg-[#141414] rounded-xl border border-[#1e1e1e] text-[#888] hover:text-[#f5f0eb] hover:border-[#333] transition-colors disabled:opacity-40"
        >
          <span className={`text-xl ${loadingRetry ? 'animate-spin' : ''}`}>🔄</span>
          <span className="text-xs">Reintentar</span>
        </button>

        <button
          type="button"
          onClick={() => setCreateStep(2)}
          className="flex flex-col items-center gap-1 py-3 bg-[#141414] rounded-xl border border-[#1e1e1e] text-[#888] hover:text-[#f5f0eb] hover:border-[#333] transition-colors"
        >
          <span className="text-xl">✏️</span>
          <span className="text-xs">Editar prompt</span>
        </button>

        <button
          type="button"
          onClick={() => setShowVariations(!showVariations)}
          className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-colors ${
            showVariations
              ? 'bg-[#ff6b6b]/10 border-[#ff6b6b]/40 text-[#ff6b6b]'
              : 'bg-[#141414] border-[#1e1e1e] text-[#888] hover:text-[#f5f0eb] hover:border-[#333]'
          }`}
        >
          <span className="text-xl">✨</span>
          <span className="text-xs">Variaciones</span>
        </button>
      </div>

      {/* Download + Copy */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleDownload(currentGeneration.imageUrl)}
          className="flex items-center justify-center gap-2 py-3 bg-[#141414] rounded-xl border border-[#1e1e1e] text-sm text-[#888] hover:text-[#f5f0eb] hover:border-[#333] transition-colors"
        >
          ⬇️ Descargar
        </button>
        <button
          type="button"
          onClick={() => handleCopyImage(currentGeneration.imageUrl)}
          className="flex items-center justify-center gap-2 py-3 bg-[#141414] rounded-xl border border-[#1e1e1e] text-sm text-[#888] hover:text-[#f5f0eb] hover:border-[#333] transition-colors"
        >
          📋 Copiar imagen
        </button>
      </div>

      {/* Panel variaciones */}
      {showVariations && (
        <div className="flex flex-col gap-4 bg-[#141414] rounded-2xl p-4 border border-[#1e1e1e]">
          <h3 className="text-sm font-semibold text-[#f5f0eb]">Configurar variación</h3>

          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs text-[#666] mb-2">Expresión</p>
              <SelectGroup options={EXPRESSIONS} value={expression} onChange={setExpression} />
            </div>
            <div>
              <p className="text-xs text-[#666] mb-2">Encuadre</p>
              <SelectGroup options={FRAMINGS} value={framing} onChange={setFraming} />
            </div>
            <div>
              <p className="text-xs text-[#666] mb-2">Ángulo</p>
              <SelectGroup options={ANGLES} value={angle} onChange={setAngle} />
            </div>
            <div>
              <p className="text-xs text-[#666] mb-2">Cantidad</p>
              <div className="flex gap-2">
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setVarCount(n)}
                    className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${
                      varCount === n ? 'bg-[#ff6b6b] text-white' : 'bg-[#1e1e1e] text-[#888]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleVariations}
            disabled={loadingVar}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              loadingVar ? 'bg-[#1e1e1e] text-[#444]' : 'bg-[#ff6b6b] text-white hover:bg-[#ff5555]'
            }`}
          >
            {loadingVar ? (
              <>
                <span className="animate-spin">⟳</span>
                Generando... (15-40 seg)
              </>
            ) : (
              `✨ Generar ${varCount} variación${varCount > 1 ? 'es' : ''}`
            )}
          </button>
        </div>
      )}

      {/* Variaciones generadas */}
      {varImages.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-[#f5f0eb]">Variaciones</h3>
          <div className="grid grid-cols-2 gap-2">
            {varImages.map((url, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden bg-[#141414] border border-[#1e1e1e]">
                <img src={url} alt={`Variación ${i + 1}`} className="w-full object-contain" />
                <div className="absolute bottom-0 left-0 right-0 flex gap-1 p-2 bg-gradient-to-t from-black/60">
                  <button type="button" onClick={() => handleDownload(url)} className="flex-1 text-center text-white text-xs py-1 bg-black/40 rounded-lg">⬇️</button>
                  <button type="button" onClick={() => handleCopyImage(url)} className="flex-1 text-center text-white text-xs py-1 bg-black/40 rounded-lg">📋</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-[#ff6b6b] bg-[#ff6b6b]/10 rounded-xl px-4 py-3">{error}</p>
      )}

      {/* Nueva generación */}
      <button
        type="button"
        onClick={resetFlow}
        className="w-full py-3 rounded-2xl text-sm text-[#666] border border-[#1e1e1e] hover:text-[#f5f0eb] hover:border-[#333] transition-colors"
      >
        + Nueva imagen
      </button>
    </div>
  );
}
