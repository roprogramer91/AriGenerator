import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { PreviewArea } from './components/PreviewArea';
import { VariationSidebar } from './components/VariationSidebar';
import { ConfigScreen } from './components/Config/ConfigScreen';
import { GalleryScreen } from './components/Gallery/GalleryScreen';
import { LoginScreen } from './components/LoginScreen';
import { useAppStore } from './store/useAppStore';
import { generatePrompt, generateImage, generateVariations, getConfig } from './services/api';
import type {
  AppTab, SceneState, VariationState, GeneratedResult, MediaSlot,
  ShotStyle, ZoomType, TiltType, CameraHeightType, HeadTurnType, Generation,
} from './types';

// ─── Image compression ────────────────────────────────────────────────────────
// Reduce todas las imágenes a max 1024px JPEG 80% antes de guardarlas en estado.
// Una foto de celular de 5MB base64 queda en ~150KB — evita errores de payload grande.

async function compressToJpeg(
  base64: string,
  mimeType: string,
  maxPx = 1024,
  quality = 0.82,
): Promise<{ base64: string; mimeType: 'image/jpeg' }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
    };
    img.onerror = () => {
      // Si falla la compresión, mandar el original
      resolve({ base64, mimeType: 'image/jpeg' });
    };
    img.src = `data:${mimeType};base64,${base64}`;
  });
}

// ─── Shot style → backend param ───────────────────────────────────────────────

const SHOT_TYPE_MAP: Record<ShotStyle, 'selfie' | 'mirror_selfie' | 'fixed'> = {
  selfie: 'selfie',
  espejo: 'mirror_selfie',
  fija: 'fixed',
};

const EXP_MAP: Record<string, string> = {
  neutra: 'neutral facial expression, relaxed',
  sonrisa: 'big happy smile, natural teeth showing',
  seria: 'serious focused look, no expression',
  sorprendida: 'surprised wide-eyed expression, mouth slightly open',
  'guiño': 'playful winking one eye, subtle smirk',
  triste: 'sad emotional face, downcast eyes',
  enojada: 'angry frowning expression, stern look',
  enojada_tierna: 'cute pouting annoyed face, playful angry look, soft mock-angry expression',
  triste_tierna: 'cute sad pouting, adorable puppy eyes',
  beso: 'blowing a kiss, puckered lips forward',
  sonrisa_tierna: 'tender soft smile, sweet gentle expression, kind eyes',
  picara: 'smirking mischievous look, one eyebrow slightly raised',
  victoria: 'flashing a peace/victory V-sign with two fingers, playful proud grin',
  dedo_medio: 'showing middle finger at camera, cute exaggerated mock-angry face, playful defiant look — not truly offensive, comedic',
  dedo_labio: 'index finger lightly touching lower lip, soft thoughtful or flirty gaze, subtle pensive expression',
};

const ZOOM_MAP: Record<ZoomType, string> = {
  primer: 'extreme close-up shot, focus on facial features',
  segundo: 'medium portrait shot, bust-up framing',
  tercer: 'medium shot, waist-up framing',
  cuarto: 'full body wide shot',
};

const TILT_MAP: Record<TiltType, string> = {
  ninguna: 'camera level, straight horizon',
  izquierda: 'dutch angle, camera tilted to the left',
  derecha: 'dutch angle, camera tilted to the right',
};

const ALTURA_MAP: Record<CameraHeightType, string> = {
  arriba: 'camera held slightly above eye level, angled down — typical selfie high angle, elongates neck and shows more body',
  nivel: 'camera at eye level, neutral angle, direct straight-on gaze',
  abajo: 'camera held slightly below eye level, looking slightly downward into lens',
};

const GIRO_MAP: Record<HeadTurnType, string> = {
  izquierda: 'head turned 45 degrees to the left, three-quarter profile',
  frente: 'facing directly forward, full frontal',
  derecha: 'head turned 45 degrees to the right, three-quarter profile',
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
  usePhone: false,
  model: 'nanabanana-pro',
  aspectRatio: '9:16',
  instrucciones: '',
};

const INITIAL_VARIATION: VariationState = {
  source: makeSlot('var_source', 'Imagen de Origen', 'image'),
  dosPersonas: false,
  expresion: 'sonrisa',
  zoom: 'segundo',
  angulo: 'ninguna',
  alturaAngulo: 'arriba',
  giro: 'frente',
  estilo: 'selfie',
  model: 'nanabanana-pro',
};

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ari_token'));

  const { config, setConfig } = useAppStore();
  const [activeTab, setActiveTab] = useState<AppTab>('compositor');
  const [scene, setScene] = useState<SceneState>(INITIAL_SCENE);
  const [variation, setVariation] = useState<VariationState>(INITIAL_VARIATION);
  const [history, setHistory] = useState<GeneratedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [variationLoading, setVariationLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
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
      reader.onload = async () => {
        const result = reader.result as string;
        const rawBase64 = result.split(',')[1];
        // Comprimir a max 1024px JPEG — reduce 5MB a ~150KB
        const { base64, mimeType } = await compressToJpeg(rawBase64, file.type);
        updateSlotMedia(slotId, base64, mimeType);
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
        usePhone: scene.usePhone,
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
        usePhone: scene.usePhone,
        model: scene.model,
        inputText: text,
        extraRefsBase64: extraRefsBase64.length > 0 ? extraRefsBase64 : undefined,
      });

      setLastPrompt(prompt);
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
        ALTURA_MAP[variation.alturaAngulo],
        GIRO_MAP[variation.giro],
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
        model: variation.model,
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

  // ─── Usar resultado del compositor en Lab ───────────────────────────────────

  const handleUseInLab = useCallback(async (result: GeneratedResult) => {
    setActiveTab('laboratorio');
    try {
      const response = await fetch(result.imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = async () => {
        const raw = (reader.result as string).split(',')[1];
        const { base64, mimeType } = await compressToJpeg(raw, blob.type);
        setVariation(prev => ({
          ...prev,
          source: { ...prev.source, mediaId: `comp_${result.id}`, base64, mimeType },
        }));
      };
      reader.readAsDataURL(blob);
    } catch { /* usuario puede subir manualmente */ }
  }, []);

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

  // ─── Auth guard ──────────────────────────────────────────────────────────────

  if (!token) {
    return <LoginScreen onLogin={setToken} />;
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const NAV_TABS = [
    { id: 'compositor' as AppTab, label: 'Crear',   icon: 'dashboard_customize' },
    { id: 'laboratorio' as AppTab, label: 'Lab',    icon: 'psychology' },
    { id: 'galeria' as AppTab,    label: 'Galería', icon: 'photo_library' },
    { id: 'config' as AppTab,     label: config ? 'Config ✓' : 'Config ⚠', icon: 'settings' },
  ] as const;

  const tabActiveClass = (id: AppTab) => {
    if (activeTab !== id) return '';
    if (id === 'compositor')  return 'text-white';
    if (id === 'laboratorio') return 'text-[#3b82f6]';
    if (id === 'galeria')     return 'text-purple-400';
    return 'text-amber-400';
  };

  const commonPreviewProps = {
    history, loading, error, config, scene, lastPrompt,
    onDownload: handleDownload,
    downloadStates,
    onVariations: handleGenerateVariations,
    variationLoading,
    onUseInLab: handleUseInLab,
  };

  return (
    /* Mobile: flex-col scrollable. Desktop: flex-row fixed-height split */
    <div className="flex flex-col md:flex-row w-screen bg-[#0e0e0e] min-h-[100dvh] md:h-[100dvh] md:overflow-hidden pb-16 md:pb-0">

      {/* ── Desktop floating top tabs ── */}
      <div className="hidden md:flex fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black/60 backdrop-blur-xl border border-white/10 p-1 rounded-2xl shadow-2xl">
        {NAV_TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all ${
              activeTab === t.id
                ? t.id === 'compositor'  ? 'bg-white text-black shadow-lg'
                : t.id === 'laboratorio' ? 'bg-[#3b82f6] text-white shadow-lg'
                : t.id === 'galeria'     ? 'bg-purple-500 text-white shadow-lg'
                :                         'bg-amber-500 text-black shadow-lg'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111]/95 backdrop-blur border-t border-white/10 flex safe-area-bottom">
        {NAV_TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
              activeTab === t.id ? tabActiveClass(t.id) : 'text-white/30'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">{t.icon}</span>
            <span className="text-[9px] font-bold uppercase tracking-tight">{t.label}</span>
          </button>
        ))}
      </nav>

      {/* ── Config ── */}
      {activeTab === 'config' && (
        <div className="flex-1 overflow-y-auto dark-scrollbar pt-4 md:pt-20">
          <ConfigScreen onDone={() => setActiveTab('compositor')} />
        </div>
      )}

      {/* ── Galería ── */}
      {activeTab === 'galeria' && (
        <div className="flex-1 overflow-y-auto dark-scrollbar pt-4 md:pt-20">
          <GalleryScreen
            onGoToCompositor={() => setActiveTab('compositor')}
            onVariationFromGallery={handleVariationFromGallery}
          />
        </div>
      )}

      {/* ── Compositor ── */}
      {activeTab === 'compositor' && (
        <>
          {/* Sidebar: full-width on mobile, 300px fixed on desktop */}
          <div className="w-full md:w-[300px] md:h-full md:shrink-0 md:overflow-y-auto md:dark-scrollbar md:border-r md:border-white/10">
            <Sidebar
              scene={scene} setScene={setScene} config={config}
              selectedSlotId={selectedSlotId}
              onSelectMedia={selectLocalFile} onClearMedia={handleClearMedia}
              onToggleLock={handleToggleLock} onGenerate={handleGenerate}
              onReset={handleResetScene} onConfigClick={() => setActiveTab('config')}
              loading={loading}
            />
          </div>
          {/* Preview: scrolls below sidebar on mobile, fills right on desktop */}
          <main className="flex-1 overflow-visible md:overflow-y-auto dark-scrollbar p-4 pt-4 md:p-8 md:pt-24">
            <PreviewArea {...commonPreviewProps} />
          </main>
        </>
      )}

      {/* ── Lab de Variaciones ── */}
      {activeTab === 'laboratorio' && (
        <>
          <div className="w-full md:w-[300px] md:h-full md:shrink-0 md:overflow-y-auto md:dark-scrollbar md:border-r md:border-white/10">
            <VariationSidebar
              state={variation} setState={setVariation}
              onSelectMedia={selectLocalFile} onClearMedia={handleClearMedia}
              onGenerate={handleGenerateFromLab} loading={loading}
            />
          </div>
          <main className="flex-1 overflow-visible md:overflow-y-auto dark-scrollbar p-4 pt-4 md:p-8 md:pt-24">
            <PreviewArea {...commonPreviewProps} />
          </main>
        </>
      )}
    </div>
  );
}
