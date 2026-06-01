import { useEffect, useRef, useState } from 'react';
import { getConfig, uploadConfig } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

interface ImageSlot {
  key: 'face' | 'body' | 'phone';
  label: string;
  required: boolean;
  hint: string;
}

const SLOTS: ImageSlot[] = [
  { key: 'face', label: 'Rostro', required: true, hint: 'Foto clara del rostro de Ari' },
  { key: 'body', label: 'Cuerpo', required: true, hint: 'Foto completa con ropa' },
  { key: 'phone', label: 'Celular', required: false, hint: 'Para fotos donde se ve el celu' },
];

export function ConfigScreen({ onDone }: { onDone?: () => void }) {
  const { config, setConfig } = useAppStore();
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const refs = { face: useRef<HTMLInputElement>(null), body: useRef<HTMLInputElement>(null), phone: useRef<HTMLInputElement>(null) };

  useEffect(() => {
    getConfig().then(c => { if (c) setConfig(c); }).catch(() => {});
  }, [setConfig]);

  function handleFile(key: 'face' | 'body' | 'phone', e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFiles(prev => ({ ...prev, [key]: file }));
    const url = URL.createObjectURL(file);
    setPreviews(prev => ({ ...prev, [key]: url }));
    setError('');
  }

  async function handleSave() {
    if (!files.face && !files.body && !files.phone) return;
    if (!files.face && !config?.faceUrl) { setError('Falta la imagen de Rostro'); return; }
    if (!files.body && !config?.bodyUrl) { setError('Falta la imagen de Cuerpo'); return; }

    setLoading(true);
    setSaved(false);
    setError('');
    try {
      const fd = new FormData();
      if (files.face) fd.append('face', files.face);
      if (files.body) fd.append('body', files.body);
      if (files.phone) fd.append('phone', files.phone);

      const updated = await uploadConfig(fd);
      setConfig(updated);
      setFiles({});
      setPreviews({});
      setSaved(true);
      setTimeout(() => { setSaved(false); onDone?.(); }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setError(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  const hasChanges = Object.keys(files).length > 0;
  const canSave = hasChanges;

  return (
    <div className="px-5 pt-6 pb-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#f5f0eb] mb-1">Configuración de Ari</h2>
        <p className="text-sm text-[#666]">
          Estas imágenes se usan como referencia visual en cada generación.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {SLOTS.map(slot => {
          const currentUrl = previews[slot.key] || config?.[`${slot.key}Url` as 'faceUrl' | 'bodyUrl' | 'phoneUrl'];
          const hasImage = !!currentUrl;
          const isSavedRemote = !previews[slot.key] && !!config?.[`${slot.key}Url` as 'faceUrl' | 'bodyUrl' | 'phoneUrl'];

          return (
            <div
              key={slot.key}
              className="bg-[#141414] rounded-2xl overflow-hidden border border-[#1e1e1e]"
            >
              <div className="flex gap-4 p-4">
                {/* Thumbnail */}
                <button
                  type="button"
                  onClick={() => refs[slot.key].current?.click()}
                  className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-[#1a1a1a] border-2 border-dashed border-[#333] flex items-center justify-center transition-colors hover:border-[#ff6b6b] group"
                >
                  {hasImage ? (
                    <>
                      <img
                        src={currentUrl}
                        alt={slot.label}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium">Cambiar</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-2xl">📷</span>
                  )}
                </button>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-center gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#f5f0eb]">{slot.label}</span>
                    {slot.required ? (
                      <span className="text-[10px] bg-[#ff6b6b]/15 text-[#ff6b6b] px-2 py-0.5 rounded-full font-medium">
                        Requerida
                      </span>
                    ) : (
                      <span className="text-[10px] bg-[#333] text-[#888] px-2 py-0.5 rounded-full font-medium">
                        Opcional
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#666]">{slot.hint}</p>
                  {isSavedRemote && (
                    <p className="text-[10px] text-[#44aa44]">✓ Guardada en Cloudinary</p>
                  )}
                  {previews[slot.key] && (
                    <p className="text-[10px] text-[#ffaa33]">● Sin guardar</p>
                  )}
                </div>

                {/* Upload button */}
                <button
                  type="button"
                  onClick={() => refs[slot.key].current?.click()}
                  className="self-center text-xs text-[#ff6b6b] font-medium px-3 py-2 rounded-lg border border-[#ff6b6b]/30 hover:bg-[#ff6b6b]/10 transition-colors"
                >
                  {hasImage ? 'Cambiar' : 'Subir'}
                </button>
              </div>

              <input
                ref={refs[slot.key]}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleFile(slot.key, e)}
              />
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 text-sm text-[#ff6b6b] bg-[#ff6b6b]/10 rounded-xl px-4 py-3">{error}</p>
      )}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave || loading}
        className={`mt-6 w-full py-4 rounded-2xl font-semibold text-base transition-all ${
          canSave && !loading
            ? 'bg-[#ff6b6b] text-white hover:bg-[#ff5555] active:scale-[0.98]'
            : 'bg-[#1e1e1e] text-[#444] cursor-not-allowed'
        }`}
      >
        {loading ? 'Subiendo a Cloudinary...' : saved ? '✓ Guardado' : 'Guardar cambios'}
      </button>

      {!config && !hasChanges && (
        <p className="mt-4 text-center text-xs text-[#555]">
          Subí al menos el Rostro y el Cuerpo para empezar a generar.
        </p>
      )}
    </div>
  );
}
