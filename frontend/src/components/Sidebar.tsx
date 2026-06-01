import React from 'react';
import type { SceneState, MediaSlot, ShotPlano, TiltType, ShotStyle, CameraType, Config } from '../types';

interface SidebarProps {
  scene: SceneState;
  setScene: React.Dispatch<React.SetStateAction<SceneState>>;
  config: Config | null;
  selectedSlotId: string | null;
  onSelectMedia: (id: string) => void;
  onClearMedia: (id: string) => void;
  onToggleLock: (id: string) => void;
  onGenerate: () => void;
  onReset: () => void;
  onConfigClick: () => void;
  loading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  scene, setScene, config, selectedSlotId,
  onSelectMedia, onClearMedia, onToggleLock,
  onGenerate, onReset, onConfigClick, loading,
}) => {
  return (
    <div className="w-[300px] h-full border-r border-[rgba(218,220,224,0.15)] flex flex-col justify-between px-[10px] py-[12px] shrink-0 bg-[#0e0e0e] overflow-y-auto dark-scrollbar">
      <div className="flex flex-col gap-[24px]">

        {/* Identidad de Ari */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Identidad de Ari</SectionLabel>
          <div className="flex flex-col gap-2 p-2 bg-blue-500/5 rounded-2xl border border-blue-500/10">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className={`material-symbols-outlined text-[14px] ${config ? 'text-green-400' : 'text-amber-400'}`}>
                  {config ? 'verified' : 'warning'}
                </span>
                <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">
                  {config ? 'Identidad configurada' : 'Sin configurar'}
                </p>
              </div>
              <button
                type="button"
                onClick={onConfigClick}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all"
              >
                <span className="material-symbols-outlined text-[13px]">settings</span>
                <span className="text-[9px] font-black uppercase">Config</span>
              </button>
            </div>
            {config && (
              <div className="flex gap-2 px-1">
                <img src={config.faceUrl} alt="Rostro Ari" crossOrigin="anonymous" className="w-9 h-9 rounded-lg object-cover border border-blue-400/30" />
                <img src={config.bodyUrl} alt="Cuerpo Ari" crossOrigin="anonymous" className="w-9 h-9 rounded-lg object-cover border border-blue-400/30" />
                {config.phoneUrl && (
                  <img src={config.phoneUrl} alt="Celular" crossOrigin="anonymous" className="w-9 h-9 rounded-lg object-cover border border-blue-400/30" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instrucciones */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Instrucciones de Escena</SectionLabel>
          <textarea
            value={scene.instrucciones}
            onChange={e => setScene(prev => ({ ...prev, instrucciones: e.target.value }))}
            placeholder="Ej: Ari despertando en la cama, luz de la mañana..."
            className="w-full h-[80px] bg-transparent border border-[#595959] hover:border-[#7a7a7a] focus:border-[#969696] rounded-xl px-3 py-2 text-[12px] text-white placeholder-white/20 outline-none resize-none transition-all dark-scrollbar"
          />
        </div>

        {/* Tipo de Disparo — NEW vs Flow original */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Tipo de Disparo</SectionLabel>
          <div className="grid grid-cols-3 gap-1">
            <ShotStyleOption
              active={scene.estiloDisparo === 'selfie'}
              onClick={() => setScene(prev => ({ ...prev, estiloDisparo: 'selfie' }))}
              icon="smartphone"
              label="Selfie"
            />
            <ShotStyleOption
              active={scene.estiloDisparo === 'espejo'}
              onClick={() => setScene(prev => ({ ...prev, estiloDisparo: 'espejo' }))}
              icon="camera_front"
              label="Espejo"
            />
            <ShotStyleOption
              active={scene.estiloDisparo === 'fija'}
              onClick={() => setScene(prev => ({ ...prev, estiloDisparo: 'fija' }))}
              icon="photo_camera"
              label="Fija"
            />
          </div>
        </div>

        {/* Cámara / Estética */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Cámara / Estética</SectionLabel>
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-medium text-white/30 px-2 uppercase tracking-tight">Calidad Visual</p>
            <SegmentedToggle
              value={scene.camara}
              onChange={val => setScene(prev => ({ ...prev, camara: val as CameraType }))}
              items={[
                { value: 'movil', label: 'Móvil (Real)', icon: <span className="material-symbols-outlined text-[18px]">smartphone</span> },
                { value: 'pro', label: 'Pro Cam (DSLR)', icon: <span className="material-symbols-outlined text-[18px]">photo_camera</span> },
              ]}
            />
          </div>
        </div>

        {/* Composición */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Composición (Escena)</SectionLabel>
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1">
              <MediaSlotButton slot={scene.personaje} isSelected={selectedSlotId === 'personaje'} onSelect={() => onSelectMedia('personaje')} onClear={() => onClearMedia('personaje')} onToggleLock={() => onToggleLock('personaje')} className="flex-1" />
              <MediaSlotButton slot={scene.contextura} isSelected={selectedSlotId === 'contextura'} onSelect={() => onSelectMedia('contextura')} onClear={() => onClearMedia('contextura')} onToggleLock={() => onToggleLock('contextura')} className="flex-1" />
            </div>
            <MediaSlotButton slot={scene.vestimenta} isSelected={selectedSlotId === 'vestimenta'} onSelect={() => onSelectMedia('vestimenta')} onClear={() => onClearMedia('vestimenta')} onToggleLock={() => onToggleLock('vestimenta')} />
            <MediaSlotButton slot={scene.escenario} isSelected={selectedSlotId === 'escenario'} onSelect={() => onSelectMedia('escenario')} onClear={() => onClearMedia('escenario')} onToggleLock={() => onToggleLock('escenario')} />
            <div className="flex gap-1">
              <MediaSlotButton slot={scene.objetos[0]} isSelected={selectedSlotId === 'obj1'} onSelect={() => onSelectMedia('obj1')} onClear={() => onClearMedia('obj1')} onToggleLock={() => onToggleLock('obj1')} className="flex-1" />
              <MediaSlotButton slot={scene.objetos[1]} isSelected={selectedSlotId === 'obj2'} onSelect={() => onSelectMedia('obj2')} onClear={() => onClearMedia('obj2')} onToggleLock={() => onToggleLock('obj2')} className="flex-1" />
            </div>
            <MediaSlotButton slot={scene.pose} isSelected={selectedSlotId === 'pose'} onSelect={() => onSelectMedia('pose')} onClear={() => onClearMedia('pose')} onToggleLock={() => onToggleLock('pose')} />
          </div>
        </div>

        {/* Encuadre / Plano */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Encuadre / Plano</SectionLabel>
          <div className="grid grid-cols-2 gap-1">
            <ShotOption active={scene.plano === 'primer'} onClick={() => setScene(prev => ({ ...prev, plano: 'primer' }))} label="1° Plano" sublabel="Rostro" icon="zoom_in" />
            <ShotOption active={scene.plano === 'segundo'} onClick={() => setScene(prev => ({ ...prev, plano: 'segundo' }))} label="2° Plano" sublabel="Busto" icon="person" />
          </div>
          <div className="mt-1 flex flex-col gap-1">
            <p className="text-[10px] font-medium text-white/30 px-2 uppercase tracking-tight">Inclinación (Tilt)</p>
            <SegmentedToggle
              value={scene.inclinacion}
              onChange={val => setScene(prev => ({ ...prev, inclinacion: val as TiltType }))}
              items={[
                { value: 'izquierda', label: 'Izquierda', icon: <span className="material-symbols-outlined text-[18px]">rotate_left</span> },
                { value: 'ninguna', label: 'Nivelado', icon: <span className="material-symbols-outlined text-[18px]">horizontal_rule</span> },
                { value: 'derecha', label: 'Derecha', icon: <span className="material-symbols-outlined text-[18px]">rotate_right</span> },
              ]}
            />
          </div>
        </div>

        {/* Configuración */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Configuración</SectionLabel>
          <FieldDropdown
            label="Relación de Aspecto"
            value={scene.aspectRatio}
            options={['9:16', '16:9', '1:1', '4:3', '3:4']}
            onChange={val => setScene(prev => ({ ...prev, aspectRatio: val as SceneState['aspectRatio'] }))}
          />
        </div>

        {/* Dos personas */}
        <div className="flex items-center justify-between px-2 py-1.5 rounded-xl border border-[#595959]">
          <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Dos personas</p>
          <button
            type="button"
            onClick={() => setScene(prev => ({ ...prev, dosPersonas: !prev.dosPersonas }))}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${scene.dosPersonas ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/40'}`}
          >
            <span className="material-symbols-outlined text-[14px]">{scene.dosPersonas ? 'group' : 'person'}</span>
            <span className="text-[9px] font-black uppercase">{scene.dosPersonas ? '2 Personas' : '1 Persona'}</span>
          </button>
        </div>

      </div>

      {/* Actions */}
      <div className="flex flex-col gap-[8px] pt-8">
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="flex items-center gap-2 justify-center w-full h-[42px] rounded-xl font-bold tracking-widest uppercase text-[11px] px-4 bg-white hover:bg-gray-200 text-black disabled:opacity-40 transition-all"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
            {loading ? 'sync' : 'auto_awesome'}
          </span>
          {loading ? 'Generando...' : 'Generar Imagen'}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-white/30 hover:text-white/60 transition-all uppercase tracking-widest border border-dashed border-white/10 rounded-xl"
        >
          <span className="material-symbols-outlined text-[14px]">restart_alt</span>
          Reiniciar Escena
        </button>
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-2 shrink-0">
    <span className="text-[11px] font-medium text-[rgba(218,220,224,0.9)] tracking-[0.1px] uppercase">{children}</span>
  </div>
);

const ShotStyleOption: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all h-[56px] ${active ? 'bg-[#969696] border-[#969696] text-black shadow-lg' : 'bg-transparent border-[#595959] text-white/40 hover:border-[#7a7a7a] hover:text-white/60'}`}
  >
    <span className="material-symbols-outlined text-[18px]">{icon}</span>
    <span className="text-center text-[9px] font-bold mt-1 leading-none">{label}</span>
  </button>
);

const ShotOption: React.FC<{ active: boolean; onClick: () => void; label: string; sublabel: string; icon: string }> = ({ active, onClick, label, sublabel, icon }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all h-[64px] ${active ? 'bg-[#969696] border-[#969696] text-black shadow-lg' : 'bg-transparent border-[#595959] text-white/40 hover:border-[#7a7a7a] hover:text-white/60'}`}
  >
    <span className="material-symbols-outlined text-[18px]">{icon}</span>
    <span className="text-center text-[10px] font-bold mt-1 leading-none">{label}</span>
    <span className={`text-[9px] font-medium ${active ? 'text-black/60' : 'text-white/20'}`}>{sublabel}</span>
  </button>
);

const MediaSlotButton: React.FC<{
  slot: MediaSlot;
  isSelected: boolean;
  onSelect: () => void;
  onClear: () => void;
  onToggleLock: () => void;
  className?: string;
}> = ({ slot, isSelected, onSelect, onClear, onToggleLock, className = '' }) => (
  <div className={`group relative flex items-center gap-0 border rounded-xl transition-all overflow-hidden h-[42px] ${isSelected ? 'border-white shadow-[0_0_10px_rgba(255,255,255,0.1)]' : slot.isLocked ? 'border-amber-400/50' : 'border-[#595959] hover:border-[#7a7a7a]'} ${className}`}>
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onToggleLock(); }}
      className={`w-8 h-full flex items-center justify-center border-r border-white/5 transition-all ${slot.isLocked ? 'text-amber-400 bg-amber-400/10' : 'text-white/20 hover:text-white/60 hover:bg-white/5'}`}
    >
      <span className="material-symbols-outlined text-[16px]">{slot.isLocked ? 'lock' : 'lock_open'}</span>
    </button>
    <button
      type="button"
      onClick={onSelect}
      className={`flex-1 flex items-center gap-2 px-2.5 h-full cursor-pointer transition-colors text-left overflow-hidden ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'}`}
    >
      {slot.base64
        ? <img src={`data:${slot.mimeType};base64,${slot.base64}`} alt={slot.label} className="w-6 h-6 rounded-md object-cover shrink-0" />
        : <span className={`material-symbols-outlined text-[18px] shrink-0 ${isSelected ? 'text-white' : 'text-white/40'}`}>{slot.icon}</span>
      }
      <span className={`text-[11px] font-medium tracking-[0.1px] truncate ${slot.mediaId || isSelected ? 'text-white' : 'text-white/40'}`}>
        {slot.mediaId ? 'Cargado' : slot.label}
      </span>
    </button>
    {slot.mediaId && (
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onClear(); }}
        className="w-10 h-full flex items-center justify-center text-red-400/40 hover:text-red-400 hover:bg-red-400/10"
      >
        <span className="material-symbols-outlined text-[18px]">delete</span>
      </button>
    )}
  </div>
);

const SegmentedToggle: React.FC<{
  value: string;
  items: { value: string; label: string; icon?: React.ReactNode }[];
  onChange: (val: string) => void;
}> = ({ value, items, onChange }) => (
  <div className="flex w-full items-center border border-[#595959] rounded-xl overflow-hidden bg-transparent">
    {items.map(item => (
      <button
        key={item.value}
        type="button"
        onClick={() => onChange(item.value)}
        className={`flex-1 flex items-center justify-center gap-1 h-[36px] px-1 rounded-xl text-[10px] font-medium transition-all ${value === item.value ? 'bg-[#969696] text-black' : 'text-[rgba(218,220,224,0.75)] hover:text-white'}`}
      >
        {item.icon}
        <span className="truncate">{item.label}</span>
      </button>
    ))}
  </div>
);

const FieldDropdown: React.FC<{
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}> = ({ label, value, options, onChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left border border-[#595959] rounded-xl flex flex-col gap-0.5 justify-center pb-2 pl-3 pr-2 pt-[6px] bg-transparent"
      >
        <p className="text-[10px] font-medium text-white/30 uppercase">{label}</p>
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-white">{value}</span>
          <span className="material-symbols-outlined text-[18px] text-white/50">expand_more</span>
        </div>
      </button>
      {isOpen && (
        <div className="absolute z-50 bottom-[100%] left-0 w-full bg-[#1a1a1a] border border-[#595959] rounded-xl shadow-2xl overflow-hidden">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setIsOpen(false); }}
              className="w-full text-left px-3 py-2 text-[12px] text-white hover:bg-white/5"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
