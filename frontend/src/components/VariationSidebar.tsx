import React from 'react';
import type { VariationState, GeminiModel } from '../types';

const MODEL_OPTIONS: { value: GeminiModel; label: string; desc: string }[] = [
  { value: 'nanabanana-pro', label: '🍌 NanaBanana Pro', desc: 'Máxima calidad' },
  { value: 'nanabanana-2',   label: '🍌 NanaBanana 2',   desc: 'Más rápido' },
];

interface VariationSidebarProps {
  state: VariationState;
  setState: React.Dispatch<React.SetStateAction<VariationState>>;
  onSelectMedia: (id: string) => void;
  onClearMedia: (id: string) => void;
  onGenerate: () => void;
  loading: boolean;
}

export const VariationSidebar: React.FC<VariationSidebarProps> = ({
  state, setState, onSelectMedia, onClearMedia, onGenerate, loading,
}) => {
  return (
    <div className="w-full flex flex-col justify-between px-3 py-3 bg-[#0e0e0e]">
      <div className="flex flex-col gap-6">

        {/* Imagen de origen */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Imagen a Variar</SectionLabel>
          <div className="p-1.5 border border-dashed border-white/10 rounded-2xl">
            <div className={`relative aspect-[9/16] rounded-xl overflow-hidden border ${state.source.mediaId ? 'border-blue-500/50' : 'border-[#595959]'} bg-black/40`}>
              {state.source.base64 ? (
                <>
                  <img
                    src={`data:${state.source.mimeType};base64,${state.source.base64}`}
                    className="w-full h-full object-cover"
                    alt="Fuente"
                  />
                  <button
                    type="button"
                    onClick={() => onClearMedia('var_source')}
                    className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/60 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center hover:bg-white/5"
                  onClick={() => onSelectMedia('var_source')}
                >
                  <span className="material-symbols-outlined text-[32px] text-white/20">add_photo_alternate</span>
                  <p className="text-[10px] text-white/40 font-medium">Sube la escena que deseas variar</p>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dos personas */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Sujetos</SectionLabel>
          <div className="flex items-center justify-between p-2 bg-blue-500/5 rounded-2xl border border-blue-500/10 px-3">
            <p className="text-[10px] text-blue-400 font-bold uppercase">Dos personas</p>
            <button
              type="button"
              onClick={() => setState(prev => ({ ...prev, dosPersonas: !prev.dosPersonas }))}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all ${state.dosPersonas ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/5 text-white/40'}`}
            >
              <span className="material-symbols-outlined text-[16px]">{state.dosPersonas ? 'group' : 'person'}</span>
              <span className="text-[10px] font-black uppercase">{state.dosPersonas ? 'Sí' : 'No'}</span>
            </button>
          </div>
        </div>

        {/* Expresiones */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Expresión</SectionLabel>
          <div className="grid grid-cols-3 gap-1.5">
            <IconButton active={state.expresion === 'sonrisa'}       onClick={() => setState(p => ({...p, expresion: 'sonrisa'}))}       icon="sentiment_very_satisfied" label="Sonrisa" />
            <IconButton active={state.expresion === 'sonrisa_tierna'} onClick={() => setState(p => ({...p, expresion: 'sonrisa_tierna'}))} icon="favorite_border"          label="Tierna" />
            <IconButton active={state.expresion === 'picara'}         onClick={() => setState(p => ({...p, expresion: 'picara'}))}         icon="mood"                     label="Pícara" />
            <IconButton active={state.expresion === 'beso'}           onClick={() => setState(p => ({...p, expresion: 'beso'}))}           icon="favorite"                 label="Beso" />
            <IconButton active={state.expresion === 'guiño'}          onClick={() => setState(p => ({...p, expresion: 'guiño'}))}          icon="mood"                     label="Guiño" />
            <IconButton active={state.expresion === 'neutra'}         onClick={() => setState(p => ({...p, expresion: 'neutra'}))}         icon="sentiment_calm"           label="Neutra" />
            <IconButton active={state.expresion === 'seria'}          onClick={() => setState(p => ({...p, expresion: 'seria'}))}          icon="sentiment_neutral"        label="Seria" />
            <IconButton active={state.expresion === 'sorprendida'}    onClick={() => setState(p => ({...p, expresion: 'sorprendida'}))}    icon="sentiment_very_dissatisfied" label="Sorpresa" />
            <IconButton active={state.expresion === 'triste'}         onClick={() => setState(p => ({...p, expresion: 'triste'}))}         icon="sentiment_dissatisfied"   label="Triste" />
            <IconButton active={state.expresion === 'enojada'}        onClick={() => setState(p => ({...p, expresion: 'enojada'}))}        icon="sentiment_very_dissatisfied" label="Enojada" />
            <IconButton active={state.expresion === 'enojada_tierna'} onClick={() => setState(p => ({...p, expresion: 'enojada_tierna'}))} icon="child_care"               label="Enojada tierna" />
            <IconButton active={state.expresion === 'triste_tierna'}  onClick={() => setState(p => ({...p, expresion: 'triste_tierna'}))}  icon="child_friendly"           label="Triste tierna" />
            {/* Nuevos gestos */}
            <IconButton active={state.expresion === 'victoria'}    onClick={() => setState(p => ({...p, expresion: 'victoria'}))}    icon="back_hand"      label="Victoria ✌" />
            <IconButton active={state.expresion === 'dedo_medio'}  onClick={() => setState(p => ({...p, expresion: 'dedo_medio'}))}  icon="sentiment_very_dissatisfied" label="F*ck you 🖕" />
            <IconButton active={state.expresion === 'dedo_labio'}  onClick={() => setState(p => ({...p, expresion: 'dedo_labio'}))}  icon="sentiment_calm" label="Shh..." />
          </div>
        </div>

        {/* Zoom / Encuadre */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Zoom / Encuadre</SectionLabel>
          <div className="grid grid-cols-2 gap-1.5">
            <IconButton active={state.zoom === 'primer'}  onClick={() => setState(p => ({...p, zoom: 'primer'}))}  icon="zoom_in"          label="1° Plano (close-up)" />
            <IconButton active={state.zoom === 'segundo'} onClick={() => setState(p => ({...p, zoom: 'segundo'}))} icon="person"           label="2° Plano (bust-up)" />
            <IconButton active={state.zoom === 'tercer'}  onClick={() => setState(p => ({...p, zoom: 'tercer'}))}  icon="accessibility"    label="3° Plano (waist-up)" />
            <IconButton active={state.zoom === 'cuarto'}  onClick={() => setState(p => ({...p, zoom: 'cuarto'}))}  icon="accessibility_new" label="General (full body)" />
          </div>
        </div>

        {/* Altura de cámara */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Altura de Cámara</SectionLabel>
          <div className="grid grid-cols-3 gap-1.5">
            <IconButton
              active={state.alturaAngulo === 'arriba'}
              onClick={() => setState(p => ({...p, alturaAngulo: 'arriba'}))}
              icon="north"
              label="Desde arriba"
            />
            <IconButton
              active={state.alturaAngulo === 'nivel'}
              onClick={() => setState(p => ({...p, alturaAngulo: 'nivel'}))}
              icon="horizontal_rule"
              label="Nivel (ojo)"
            />
            <IconButton
              active={state.alturaAngulo === 'abajo'}
              onClick={() => setState(p => ({...p, alturaAngulo: 'abajo'}))}
              icon="south"
              label="Desde abajo"
            />
          </div>
        </div>

        {/* Inclinación de cámara */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Inclinación de Cámara</SectionLabel>
          <div className="grid grid-cols-3 gap-1.5">
            <IconButton active={state.angulo === 'izquierda'} onClick={() => setState(p => ({...p, angulo: 'izquierda'}))} icon="rotate_left"    label="Tilt ←" />
            <IconButton active={state.angulo === 'ninguna'}   onClick={() => setState(p => ({...p, angulo: 'ninguna'}))}   icon="horizontal_rule" label="Nivelado" />
            <IconButton active={state.angulo === 'derecha'}   onClick={() => setState(p => ({...p, angulo: 'derecha'}))}   icon="rotate_right"   label="Tilt →" />
          </div>
        </div>

        {/* Giro de cabeza */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Giro de Cabeza (45°)</SectionLabel>
          <div className="grid grid-cols-3 gap-1.5">
            <IconButton active={state.giro === 'izquierda'} onClick={() => setState(p => ({...p, giro: 'izquierda'}))} icon="arrow_back"    label="← 45°" />
            <IconButton active={state.giro === 'frente'}    onClick={() => setState(p => ({...p, giro: 'frente'}))}    icon="face"          label="Frente" />
            <IconButton active={state.giro === 'derecha'}   onClick={() => setState(p => ({...p, giro: 'derecha'}))}   icon="arrow_forward" label="→ 45°" />
          </div>
        </div>

        {/* Estilo de Disparo */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Estilo de Disparo</SectionLabel>
          <div className="grid grid-cols-2 gap-1.5">
            <IconButton active={state.estilo === 'selfie'} onClick={() => setState(p => ({...p, estilo: 'selfie'}))} icon="smartphone"    label="Selfie frontal" />
            <IconButton active={state.estilo === 'espejo'} onClick={() => setState(p => ({...p, estilo: 'espejo'}))} icon="camera_front"  label="Espejo" />
          </div>
        </div>

        {/* Motor */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Motor de Generación</SectionLabel>
          <div className="grid grid-cols-2 gap-1.5">
            {MODEL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setState(p => ({ ...p, model: opt.value }))}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all h-14 text-center ${
                  state.model === opt.value
                    ? 'bg-yellow-500/20 border-yellow-500/60 text-yellow-300'
                    : 'bg-transparent border-[#595959] text-white/40 hover:border-[#7a7a7a]'
                }`}
              >
                <span className="text-[11px] font-bold leading-tight">{opt.label}</span>
                <span className={`text-[9px] ${state.model === opt.value ? 'text-yellow-400/70' : 'text-white/20'}`}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Generate button */}
      <div className="pt-6 pb-2">
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading || !state.source.mediaId}
          className="w-full h-14 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-2xl text-white text-[12px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all"
        >
          <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>
            {loading ? 'sync' : 'auto_awesome'}
          </span>
          {loading ? 'Generando variación...' : 'Aplicar Variación'}
        </button>
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-1">
    <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.12em]">{children}</span>
  </div>
);

const IconButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 h-11 px-2.5 rounded-xl border transition-all ${
      active
        ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
        : 'bg-transparent border-[#595959] text-white/40 hover:border-[#7a7a7a]'
    }`}
  >
    <span className="material-symbols-outlined text-[18px] shrink-0">{icon}</span>
    <span className="text-[9px] font-bold uppercase truncate">{label}</span>
  </button>
);
