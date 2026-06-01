import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { PreviewArea } from './components/PreviewArea';
import { VariationSidebar } from './components/VariationSidebar';
import { ConfigScreen } from './components/Config/ConfigScreen';
import { GalleryScreen } from './components/Gallery/GalleryScreen';
import { useAppStore } from './store/useAppStore';
import { generatePrompt, generateImage, generateVariations, getConfig } from './services/api';
import type {
  AppTab, SceneState, VariationState, GeneratedResult, MediaSlot,
  ShotStyle, ZoomType, TiltType, Generation,
} from './types';

// ─── Shot style → backend param ───────────────────────────────────────────────

const SHOT_TYPE_MAP: Record<ShotStyle, 'selfie' | 'mirror_selfie' | 'fixed'> = {
  selfie: 'selfie',
  espejo: 'mirror_selfie',
  fija: 'fixed',
};

const EXP_MAP: Record<string, string> = {
  neutra: 'neutral facial expression',
  sonrisa: 'big happy smile',
  seria: 'serious focused look',
  sorprendida: 'surprised wide-eyed expression',
  'guiño': 'playful winking',
  triste: 'sad emotional face',
  enojada: 'angry frowning expression',
  enojada_tierna: 'cute pouting annoyed expression, playful angry face',
  triste_tierna: 'cute sad pouting, adorable sad face',
  beso: 'blowing a kiss, puckered lips',
  sonrisa_tierna: 'tender soft smile, sweet expression',
  picara: 'smirking mischievous look',
};

const ZOOM_MAP: Record<ZoomType, string> = {
  primer: 'extreme close-up shot, focus on facial features',
  segundo: 'medium portrait shot, bust-up framing',
  tercer: 'medium shot, waist-up framing',
  cuarto: 'full body wide shot',
};

const TILT_MAP: Record<TiltType, string> = {
  ninguna: 'straight camera angle, level horizon',
  izquierda: 'dynamic dutch angle, tilted camera to the left',
  derecha: 'dynamic dutch angle, tilted camera to the right',
};

// ─── Initial state ────────────────────────────────────────────────────────────

const makeSlot = (id: string, label: string, icon: string): MediaSlot => ({
  id, label, icon, mediaId: null, base64: null, mimeType: null, isLocked: false,
});

const INITIAL_SCENE: SceneState = {
  personaje: makeSlot('personaje', 'Rostro/Persona', 'face'),
  dosPersonas: false,
  contextura: makeSlot('contextura', 'Tipo de Cuerpo', 'accessibility'),
  vestimenta: makeSlot('vestimenta', 'Vestimenta', 'apparel'),
  escenario: makeSlot('escenario', 'Escenario', 'landscape'),
  objetos: [
    makeSlot('obj1', 'Objeto 1', 'category'),
    makeSlot('obj2', 'Objeto 2', 'category'),
  ],
  pose: makeSlot('pose', 'Pose / Referencia', 'accessibility_new'),
  plano: 'segundo',
  inclinacion: 'ninguna',
  estiloDisparo: 'selfie',
  camara: 'movil',
  aspectRatio: '9:16',
  instrucciones: '',
};

const INITIAL_VARIATION: VariationState = {
  source: makeSlot('var_source', 'Imagen de Origen', 'image'),
  dosPersonas: false,
  expresion: 'sonrisa',
  zoom: 'segundo',
  angulo: 'ninguna',
  estilo: 'selfie',
};

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { config, setConfig } = useAppStore();
  const [activeTab, setActiveTab] = useState<AppTab>('compositor');
  const [scene, setScene] = useState<SceneState>(INITIAL_SCENE);
  const [variation, setVariation] = useState<VariationState>(INITIAL_VARIATION);
  const [history, setHistory] = useState<GeneratedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [variationLoading, setVariationLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [downloadStates, setDownloadStates] = useState<Record<string, 'idle' | 'downloading' | 'done' | 'error'>>({});
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Load config on mount
  useEffect(() => {
    getConfig().then(c => { if (c) setConfig(c); }).catch(() => {});
  }, [setConfig]);

  // Inject styles (same as Flow app)
  useEffect(() => {
    const id = 'ari-studio-css';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      input[type=range]{-webkit-appearance:none;appearance:none;background:transparent;width:100%;cursor:pointer;padding:8px 0}
      input[type=range]::-webkit-slider-runnable-track{width:100%;height:3px;background:#595959;border-radius:9999px}
      input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:14px;height:14px;border-radius:50%;background:white;box-shadow:0 1px 3px rgba(0,0,0,.5);margin-top:-5.5px;cursor:grab}
      input[type=range]::-webkit-slider-thumb:active{cursor:grabbing}
      .dark-scrollbar{scrollbar-width:thin;scrollbar-color:#595959 transparent}
      .dark-scrollbar::-webkit-scrollbar{width:6px}
      .dark-scrollbar::-webkit-scrollbar-track{background:transparent}
      .dark-scrollbar::-webkit-scrollbar-thumb{background:#595959;border-radius:9999px}
      @keyframes dropdown-enter{from{opacity:0;transform:scale(.95) translateY(-5px)}to{opacity:1;transform:scale(1) translateY(0)}}
      .animate-dropdown{animation:dropdown-enter .15s ease-out forwards}
      html,body,#root{margin:0;padding:0;width:100%;height:100%;background:#0e0e0e;font-family:'Google Sans Text','Google Sans',-apple-system,BlinkMacSystemFont,sans-serif;letter-spacing:.1px;-webkit-font-smoothing:antialiased}
    `;
    document.head.appendChild(style);
  }, []);

  // ─── Media helpers ──────────────────────────────────────────────────────────

  const updateSlotMedia = useCallback((slotId: string, base64: string, mimeType: string) => {
    const mediaId = `local_${Date.now()}`;

    if (slotId === 'var_source') {
      setVariation(prev => ({ ...prev, source: { ...prev.source, mediaId, base64, mimeType } }));
      return;
    }

    setScene(prev => {
      if (slotId === 'obj1') {
        const objs = [...prev.objetos];
        objs[0] = { ...objs[0], mediaId, base64, mimeType };
        return { ...prev, objetos: objs };
      }
      if (slotId === 'obj2') {
        const objs = [...prev.objetos];
        objs[1] = { ...objs[1], mediaId, base64, mimeType };
        return { ...prev, objetos: objs };
      }
      const key = slotId as keyof SceneState;
      const slot = prev[key];
      if (slot && typeof slot === 'object' && !Array.isArray(slot) && 'mediaId' in slot) {
        return { ...prev, [key]: { ...(slot as MediaSlot), mediaId, base64, mimeType } };
      }
      return prev;
    });
  }, []);

  const selectLocalFile = useCallback((slotId: string) => {
    setSelectedSlotId(slotId);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        updateSlotMedia(slotId, base64, file.type);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [updateSlotMedia]);

  const handleClearMedia = useCallback((slotId: string) => {
    if (slotId === 'var_source') {
      setVariation(prev => ({ ...prev, source: { ...prev.source, mediaId: null, base64: null, mimeType: null } }));
      return;
    }
    setScene(prev => {
      if (slotId === 'obj1') {
        const objs = [...prev.objetos];
        objs[0] = { ...objs[0], mediaId: null, base64: null, mimeType: null };
        return { ...prev, objetos: objs };
      }
      if (slotId === 'obj2') {
        const objs = [...prev.objetos];
        objs[1] = { ...objs[1], mediaId: null, base64: null, mimeType: null };
        return { ...prev, objetos: objs };
      }
      const key = slotId as keyof SceneState;
      const slot = prev[key];
      if (slot && typeof slot === 'object' && !Array.isArray(slot) && 'mediaId' in slot) {
        return { ...prev, [key]: { ...(slot as MediaSlot), mediaId: null, base64: null, mimeType: null } };
      }
      return prev;
    });
  }, []);

  const handleToggleLock = useCallback((slotId: string) => {
    setScene(prev => {
      if (slotId === 'obj1') {
        const objs = [...prev.objetos];
        objs[0] = { ...objs[0], isLocked: !objs[0].isLocked };
        return { ...prev, objetos: objs };
      }
      if (slotId === 'obj2') {
        const objs = [...prev.objetos];
        objs[1] = { ...objs[1], isLocked: !objs[1].isLocked };
        return { ...prev, objetos: objs };
      }
      const key = slotId as keyof SceneState;
      const slot = prev[key];
      if (slot && typeof slot === 'object' && !Array.isArray(slot) && 'isLocked' in slot) {
        return { ...prev, [key]: { ...(slot as MediaSlot), isLocked: !(slot as MediaSlot).isLocked } };
      }
      return prev;
    });
  }, []);

  const handleResetScene = useCallback(() => {
    const clear = (s: MediaSlot): MediaSlot =>
      s.isLocked ? s : { ...s, mediaId: null, base64: null, mimeType: null };
    setScene(prev => ({
      ...prev,
      personaje: clear(prev.personaje),
      contextura: clear(prev.contextura),
      vestimenta: clear(prev.vestimenta),
      escenario: clear(prev.escenario),
      objetos: prev.objetos.map(clear),
      pose: clear(prev.pose),
      dosPersonas: false,
      instrucciones: '',
    }));
  }, []);

  // ─── Compositor generate ────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!config) {
      setError('Primero configurá las imágenes de Ari en ⚙️ Config');
      setActiveTab('config');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const shotType = SHOT_TYPE_MAP[scene.estiloDisparo];
      const text = scene.instrucciones.trim() || undefined;

      // Objetos con imagen cargada
      const objetosBase64 = scene.objetos
        .filter(o => o.base64)
        .map(o => ({ base64: o.base64!, mimeType: o.mimeType! }));

      // Claude: recibe parámetros + imágenes de referencia con sus roles
      const { prompt } = await generatePrompt({
        text,
        shotType,
        plano: scene.plano,
        inclinacion: scene.inclinacion,
        camara: scene.camara,
        // Pose / composición
        refImageBase64: scene.pose.base64 ?? undefined,
        refImageMimeType: scene.pose.mimeType ?? undefined,
        // Ropa — Claude lee solo la ropa
        vestimentaBase64: scene.vestimenta.base64 ?? undefined,
        vestimentaMimeType: scene.vestimenta.mimeType ?? undefined,
        // Escenario / fondo
        escenarioBase64: scene.escenario.base64 ?? undefined,
        escenarioMimeType: scene.escenario.mimeType ?? undefined,
        // Objetos
        objetosBase64: objetosBase64.length > 0 ? objetosBase64 : undefined,
      });

      // Gemini: Config de Ari + todas las imágenes del sidebar como referencias visuales
      const extraRefsBase64 = [
        scene.vestimenta.base64 ? { base64: scene.vestimenta.base64, mimeType: scene.vestimenta.mimeType! } : null,
        scene.escenario.base64 ? { base64: scene.escenario.base64, mimeType: scene.escenario.mimeType! } : null,
        scene.pose.base64 ? { base64: scene.pose.base64, mimeType: scene.pose.mimeType! } : null,
        ...objetosBase64,
      ].filter((r): r is { base64: string; mimeType: string } => r !== null);

      const result = await generateImage({
        prompt,
        shotType,
        useFace: true,
        useBody: true,
        usePhone: false,
        inputText: text,
        extraRefsBase64: extraRefsBase64.length > 0 ? extraRefsBase64 : undefined,
      });

      setHistory(prev => [{
        id: result.id,
        imageUrl: result.imageUrl,
        timestamp: Date.now(),
        prompt,
      }, ...prev]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } }; message?: string })
        ?.response?.data?.error ?? (err as Error)?.message ?? 'Error al generar.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Lab generate ────────────────────────────────────────────────────────────

  const handleGenerateFromLab = async () => {
    if (!variation.source.base64) {
      setError('Sube una imagen de origen en el Lab.');
      return;
    }
    if (!config) {
      setError('Primero configurá las imágenes de Ari en ⚙️ Config');
      setActiveTab('config');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const shotType = variation.estilo === 'espejo' ? 'mirror_selfie' : 'selfie';
      const descParts = [
        variation.dosPersonas ? 'Two people together' : 'One person',
        EXP_MAP[variation.expresion],
        ZOOM_MAP[variation.zoom],
        TILT_MAP[variation.angulo],
      ].join(', ');

      const { prompt } = await generatePrompt({
        text: descParts,
        refImageBase64: variation.source.base64,
        shotType,
      });

      const result = await generateImage({
        prompt,
        shotType,
        useFace: true,
        useBody: true,
        usePhone: false,
        sourceImageBase64: variation.source.base64,
        sourceImageMimeType: variation.source.mimeType ?? 'image/jpeg',
      });

      setHistory(prev => [{
        id: result.id,
        imageUrl: result.imageUrl,
        timestamp: Date.now(),
        prompt,
        isVariation: true,
      }, ...prev]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } }; message?: string })
        ?.response?.data?.error ?? (err as Error)?.message ?? 'Error al generar variación.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Variations from existing result ────────────────────────────────────────

  const handleGenerateVariations = async (originalResult: GeneratedResult) => {
    setVariationLoading(prev => ({ ...prev, [originalResult.id]: true }));
    try {
      const variations = await generateVariations({ generationId: originalResult.id, count: 3 });
      setHistory(prev => [
        ...variations.map(v => ({
          id: v.id,
          imageUrl: v.imageUrl,
          timestamp: Date.now(),
          prompt: originalResult.prompt + ' (variación)',
          isVariation: true,
        })),
        ...prev,
      ]);
    } catch {
      setError('Error al generar variaciones.');
    } finally {
      setVariationLoading(prev => ({ ...prev, [originalResult.id]: false }));
    }
  };

  // ─── Variation from gallery ─────────────────────────────────────────────────

  const handleVariationFromGallery = useCallback(async (generation: Generation) => {
    setActiveTab('laboratorio');
    try {
      const response = await fetch(generation.imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        setVariation(prev => ({
          ...prev,
          source: { ...prev.source, mediaId: `gallery_${generation.id}`, base64, mimeType: blob.type },
        }));
      };
      reader.readAsDataURL(blob);
    } catch {
      // Switch to lab anyway — user uploads manually
    }
  }, []);

  // ─── Download ────────────────────────────────────────────────────────────────

  const handleDownload = useCallback(async (result: GeneratedResult) => {
    setDownloadStates(prev => ({ ...prev, [result.id]: 'downloading' }));
    try {
      const response = await fetch(result.imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ari_${result.id.slice(0, 8)}.jpg`;
      link.click();
      URL.revokeObjectURL(url);
      setDownloadStates(prev => ({ ...prev, [result.id]: 'done' }));
      setTimeout(() => setDownloadStates(prev => { const n = { ...prev }; delete n[result.id]; return n; }), 2000);
    } catch {
      setDownloadStates(prev => ({ ...prev, [result.id]: 'error' }));
      setTimeout(() => setDownloadStates(prev => { const n = { ...prev }; delete n[result.id]; return n; }), 3000);
    }
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen w-screen bg-[#0e0e0e] overflow-hidden">
      {/* Top tab bar */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex bg-black/60 backdrop-blur-xl border border-white/10 p-1 rounded-2xl shadow-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('compositor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all ${activeTab === 'compositor' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
        >
          <span className="material-symbols-outlined text-[18px]">dashboard_customize</span>
          Compositor
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('laboratorio')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all ${activeTab === 'laboratorio' ? 'bg-[#3b82f6] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
        >
          <span className="material-symbols-outlined text-[18px]">psychology</span>
          Lab
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('galeria')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all ${activeTab === 'galeria' ? 'bg-purple-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
        >
          <span className="material-symbols-outlined text-[18px]">photo_library</span>
          Galería
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all ${activeTab === 'config' ? 'bg-amber-500 text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
        >
          <span className="material-symbols-outlined text-[18px]">settings</span>
          {config ? '✓' : '⚠'}
        </button>
      </div>

      {/* Galería */}
      {activeTab === 'galeria' && (
        <div className="flex-1 overflow-y-auto dark-scrollbar pt-20">
          <GalleryScreen
            onGoToCompositor={() => setActiveTab('compositor')}
            onVariationFromGallery={handleVariationFromGallery}
          />
        </div>
      )}

      {/* Config screen (overlay) */}
      {activeTab === 'config' && (
        <div className="flex-1 overflow-y-auto dark-scrollbar pt-20">
          <ConfigScreen onDone={() => setActiveTab('compositor')} />
        </div>
      )}

      {/* Compositor */}
      {activeTab === 'compositor' && (
        <>
          <Sidebar
            scene={scene}
            setScene={setScene}
            config={config}
            selectedSlotId={selectedSlotId}
            onSelectMedia={selectLocalFile}
            onClearMedia={handleClearMedia}
            onToggleLock={handleToggleLock}
            onGenerate={handleGenerate}
            onReset={handleResetScene}
            onConfigClick={() => setActiveTab('config')}
            loading={loading}
          />
          <main className="flex-1 relative overflow-y-auto dark-scrollbar p-6 pt-24 lg:p-12 lg:pt-24">
            <PreviewArea
              history={history}
              loading={loading}
              error={error}
              config={config}
              scene={scene}
              onDownload={handleDownload}
              downloadStates={downloadStates}
              onVariations={handleGenerateVariations}
              variationLoading={variationLoading}
            />
          </main>
        </>
      )}

      {/* Lab de Variaciones */}
      {activeTab === 'laboratorio' && (
        <>
          <VariationSidebar
            state={variation}
            setState={setVariation}
            onSelectMedia={selectLocalFile}
            onClearMedia={handleClearMedia}
            onGenerate={handleGenerateFromLab}
            loading={loading}
          />
          <main className="flex-1 relative overflow-y-auto dark-scrollbar p-6 pt-24 lg:p-12 lg:pt-24">
            <PreviewArea
              history={history}
              loading={loading}
              error={error}
              config={config}
              scene={scene}
              onDownload={handleDownload}
              downloadStates={downloadStates}
              onVariations={handleGenerateVariations}
              variationLoading={variationLoading}
            />
          </main>
        </>
      )}
    </div>
  );
}
