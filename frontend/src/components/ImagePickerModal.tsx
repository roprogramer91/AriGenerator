import { useState, useEffect, useCallback, useRef } from 'react';
import { compressToJpeg } from '../lib/imageUtils';
import { getLibrary, saveToLibrary, deleteFromLibrary } from '../lib/imageLibrary';
import type { LibraryImage } from '../lib/imageLibrary';

interface ImagePickerModalProps {
  slotLabel: string;
  onSelect: (base64: string, mimeType: string) => void;
  onClose: () => void;
}

export function ImagePickerModal({ slotLabel, onSelect, onClose }: ImagePickerModalProps) {
  const [library, setLibrary] = useState<LibraryImage[]>([]);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLibrary(getLibrary());
  }, []);

  // Cierra al pulsar Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // ─── Pegar del portapapeles ────────────────────────────────────────────────

  const handlePaste = useCallback(async () => {
    setStatus('');
    setLoading(true);
    try {
      const items = await navigator.clipboard.read();
      let found = false;
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const reader = new FileReader();
            reader.onload = async () => {
              const raw = (reader.result as string).split(',')[1];
              const compressed = await compressToJpeg(raw, type);
              saveToLibrary(compressed.base64);
              onSelect(compressed.base64, compressed.mimeType);
            };
            reader.readAsDataURL(blob);
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (!found) setStatus('No hay imagen en el portapapeles. Copiá una imagen primero.');
    } catch (err: unknown) {
      const name = (err as Error)?.name;
      if (name === 'NotAllowedError') {
        setStatus('Permiso denegado. Habilitá el acceso al portapapeles en el navegador.');
      } else {
        setStatus('No se pudo leer el portapapeles. Intentá con "Cargar nueva".');
      }
    } finally {
      setLoading(false);
    }
  }, [onSelect]);

  // ─── Cargar nueva desde archivo ────────────────────────────────────────────

  const handleFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const raw = (reader.result as string).split(',')[1];
      const compressed = await compressToJpeg(raw, file.type);
      saveToLibrary(compressed.base64);
      onSelect(compressed.base64, compressed.mimeType);
    };
    reader.readAsDataURL(file);
    // reset input so same file can be re-selected
    e.target.value = '';
  }, [onSelect]);

  // ─── Seleccionar de biblioteca ─────────────────────────────────────────────

  const handleLibrarySelect = useCallback((img: LibraryImage) => {
    onSelect(img.base64, img.mimeType);
  }, [onSelect]);

  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteFromLibrary(id);
    setLibrary(getLibrary());
  }, []);

  return (
    /* overlay */
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* sheet */}
      <div className="w-full md:w-[480px] max-h-[85dvh] bg-[#111] rounded-t-3xl md:rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-2xl animate-dropdown">

        {/* header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10 shrink-0">
          <div>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Elegir imagen</p>
            <p className="text-[13px] font-bold text-white">{slotLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-white/70">close</span>
          </button>
        </div>

        {/* actions */}
        <div className="grid grid-cols-2 gap-2 px-4 pt-3 pb-2 shrink-0">
          <button
            type="button"
            onClick={handlePaste}
            disabled={loading}
            className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-[#3b82f6]/15 hover:bg-[#3b82f6]/30 border border-[#3b82f6]/30 text-[#3b82f6] transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[22px]">content_paste</span>
            <div className="text-left">
              <p className="text-[11px] font-bold uppercase">Pegar</p>
              <p className="text-[9px] opacity-60">del portapapeles</p>
            </div>
          </button>
          <button
            type="button"
            onClick={handleFileInput}
            disabled={loading}
            className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 transition-all"
          >
            <span className="material-symbols-outlined text-[22px]">upload_file</span>
            <div className="text-left">
              <p className="text-[11px] font-bold uppercase">Cargar</p>
              <p className="text-[9px] opacity-60">nueva imagen</p>
            </div>
          </button>
        </div>

        {status && (
          <p className="text-[11px] text-amber-400 bg-amber-400/10 rounded-xl mx-4 px-3 py-2 text-center shrink-0">
            {status}
          </p>
        )}

        {/* library grid */}
        <div className="overflow-y-auto dark-scrollbar px-4 pb-6 pt-2 flex-1">
          {library.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-30 gap-3">
              <span className="material-symbols-outlined text-[40px]">photo_library</span>
              <p className="text-[12px] text-center">Aún no hay imágenes guardadas.<br />Cargá o pegá una para que aparezca acá.</p>
            </div>
          ) : (
            <>
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2">
                Anteriores ({library.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {library.map(img => (
                  <div
                    key={img.id}
                    className="relative aspect-square rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:border-white/40 active:scale-95 transition-all group"
                    onClick={() => handleLibrarySelect(img)}
                  >
                    <img
                      src={`data:${img.mimeType};base64,${img.base64}`}
                      alt="Imagen guardada"
                      className="w-full h-full object-cover"
                    />
                    {/* delete button */}
                    <button
                      type="button"
                      onClick={e => handleDelete(e, img.id)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white/70 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <span className="material-symbols-outlined text-[12px]">close</span>
                    </button>
                    {/* timestamp */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <p className="text-[8px] text-white/60">
                        {new Date(img.timestamp).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          title="Seleccionar imagen"
          aria-label="Seleccionar imagen desde archivo"
          className="hidden"
          onChange={onFileChange}
        />
      </div>
    </div>
  );
}
