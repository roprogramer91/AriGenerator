import React from 'react';
import type { VariationState, ZoomType, TiltType } from '../types';

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
    <div className="w-[300px] h-full border-r border-[rgba(218,220,224,0.15)] flex flex-col justify-between px-[10px] py-[12px] shrink-0 bg-[#0e0e0e] overflow-y-auto dark-scrollbar">
      <div className="flex flex-col gap-[24px]">

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
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </>
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center cursor-pointer hover:bg-white/5"
                  onClick={() => onSelectMedia('var_source')}
                >
                  <span className="material-symbols-outlined text-[32px] text-white/20">add_photo_alternate</span>
                  <p className="text-[10px] text-white/40 font-medium">Sube la escena que deseas variar</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dos personas */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Sujetos e Identidad</SectionLabel>
          <div className="flex flex-col gap-3 p-2 bg-blue-500/5 rounded-2xl border border-blue-500/10">
            <div className="flex items-center justify-between px-1">
              <p className="text-[9px] text-blue-400 font-bold uppercase">Dos personas</p>
              <button
                type="button"
                onClick={() => setState(prev => ({ ...prev, dosPersonas: !prev.dosPersonas }))}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${state.dosPersonas ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/5 text-white/40'}`}
              >
                <span className="material-symbols-outlined text-[14px]">{state.dosPersonas ? 'group' : 'person'}</span>
                <span className="text-[9px] font-black uppercase">{state.dosPersonas ? 'Sí' : 'No'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Expresiones */}
        <div className="flex flex-col gap-4">
          <SectionLabel>Expresiones</SectionLabel>
          <div className="grid grid-cols-2 gap-1">
            <IconButton active={state.expresion === 'sonrisa'} onClick={() => setState(p => ({ ...p, expresion: 'sonrisa' }))} icon="sentiment_very_satisfied" label="Sonrisa" />
            <IconButton active={state.expresion === 'beso'} onClick={() => setState(p => ({ ...p, expresion: 'beso' }))} icon="favorite" label="Beso" />
            <IconButton active={state.expresion === 'picara'} onClick={() => setState(p => ({ ...p, expresion: 'picara' }))} icon="mood" label="Pícara" />
            <IconButton active={state.expresion === 'guiño'} onClick={() => setState(p => ({ ...p, expresion: 'guiño' }))} icon="mood" label="Guiño" />
            <IconButton active={state.expresion === 'seria'} onClick={() => setState(p => ({ ...p, expresion: 'seria' }))} icon="sentiment_neutral" label="Seria" />
            <IconButton active={state.expresion === 'sorprendida'} onClick={() => setState(p => ({ ...p, expresion: 'sorprendida' }))} icon="sentiment_extremely_dissatisfied" label="Sorpresa" />
            <IconButton active={state.expresion === 'triste'} onClick={() => setState(p => ({ ...p, expresion: 'triste' }))} icon="sentiment_dissatisfied" label="Triste" />
            <IconButton active={state.expresion === 'enojada'} onClick={() => setState(p => ({ ...p, expresion: 'enojada' }))} icon="sentiment_very_dissatisfied" label="Enojada" />
            <IconButton active={state.expresion === 'enojada_tierna'} onClick={() => setState(p => ({ ...p, expresion: 'enojada_tierna' }))} icon="child_care" label="Enojada tierna" />
            <IconButton active={state.expresion === 'triste_tierna'} onClick={() => setState(p => ({ ...p, expresion: 'triste_tierna' }))} icon="child_friendly" label="Triste tierna" />
            <IconButton active={state.expresion === 'sonrisa_tierna'} onClick={() => setState(p => ({ ...p, expresion: 'sonrisa_tierna' }))} icon="favorite_border" label="Sonrisa tierna" />
            <IconButton active={state.expresion === 'neutra'} onClick={() => setState(p => ({ ...p, expresion: 'neutra' }))} icon="sentiment_calm" label="Neutra" />
          </div>
        </div>

        {/* Zoom / Encuadre */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Zoom / Encuadre</SectionLabel>
          <div className="grid grid-cols-2 gap-1">
            <IconButton active={state.zoom === 'primer'} onClick={() => setState(p => ({ ...p, zoom: 'primer' }))} icon="zoom_in" label="1° Plano" />
            <IconButton active={state.zoom === 'segundo'} onClick={() => setState(p => ({ ...p, zoom: 'segundo' }))} icon="person" label="2° Plano" />
            <IconButton active={state.zoom === 'tercer'} onClick={() => setState(p => ({ ...p, zoom: 'tercer' }))} icon="accessibility" label="3° Plano" />
            <IconButton active={state.zoom === 'cuarto'} onClick={() => setState(p => ({ ...p, zoom: 'cuarto' }))} icon="accessibility_new" label="General" />
          </div>
        </div>

        {/* Ángulo de Cámara */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Ángulo de Cámara</SectionLabel>
          <div className="grid grid-cols-3 gap-1">
            <IconButton active={state.angulo === 'izquierda'} onClick={() => setState(p => ({ ...p, angulo: 'izquierda' }))} icon="rotate_left" label="Izquierda" />
            <IconButton active={state.angulo === 'ninguna'} onClick={() => setState(p => ({ ...p, angulo: 'ninguna' }))} icon="horizontal_rule" label="Frontal" />
            <IconButton active={state.angulo === 'derecha'} onClick={() => setState(p => ({ ...p, angulo: 'derecha' }))} icon="rotate_right" label="Derecha" />
          </div>
        </div>

        {/* Estilo de Disparo */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Estilo de Disparo</SectionLabel>
          <div className="grid grid-cols-2 gap-1">
            <IconButton active={state.estilo === 'selfie'} onClick={() => setState(p => ({ ...p, estilo: 'selfie' }))} icon="smartphone" label="Selfie" />
            <IconButton active={state.estilo === 'espejo'} onClick={() => setState(p => ({ ...p, estilo: 'espejo' }))} icon="camera_front" label="Espejo" />
          </div>
        </div>

      </div>

      {/* Generate button */}
      <div className="pt-8">
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading || !state.source.mediaId}
          className="w-full h-12 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all"
        >
          <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>
            {loading ? 'sync' : 'auto_awesome'}
          </span>
          {loading ? 'Generando...' : 'Aplicar Variación'}
        </button>
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-2">
    <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.1px]">{children}</span>
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
    className={`flex items-center gap-2 h-10 px-2 rounded-xl border transition-all ${active ? 'bg-blue-500 border-blue-500 text-white shadow-lg' : 'bg-transparent border-[#595959] text-white/40 hover:border-[#7a7a7a]'}`}
  >
    <span className="material-symbols-outlined text-[18px]">{icon}</span>
    <span className="text-[8px] font-bold uppercase truncate">{label}</span>
  </button>
);
