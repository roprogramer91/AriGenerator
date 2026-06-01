import { useState } from 'react';
import type { SceneState, Config } from '../types';

interface PromptDebugProps {
  scene: SceneState;
  config: Config | null;
  lastPrompt: string | null;
  loading: boolean;
}

const SHOT_LABELS: Record<string, string> = {
  selfie: 'Selfie — cámara frontal, brazo extendido',
  espejo: 'Espejo — cuerpo completo en espejo, mano con celular visible',
  fija: 'Fija — cámara en superficie o timer, manos libres',
};

const PLANO_LABELS: Record<string, string> = {
  primer: '1° Plano — rostro llena el encuadre, close-up extremo',
  segundo: '2° Plano — encuadre hasta hombros-cabeza (bust-up)',
};

const INCLINACION_LABELS: Record<string, string> = {
  ninguna: 'Nivelado — horizonte recto',
  izquierda: 'Dutch angle — cámara inclinada hacia la izquierda',
  derecha: 'Dutch angle — cámara inclinada hacia la derecha',
};

const CAMARA_LABELS: Record<string, string> = {
  movil: 'Móvil — exposición natural de smartphone, sin corrección',
  pro: 'Pro (DSLR) — nitidez alta, leve profundidad de campo',
};

const PROMPT_LINE_LABELS = [
  'TIPO DE DISPARO',
  'IDENTIDAD + CUERPO',
  'VESTIMENTA',
  'AMBIENTE + EXPRESIÓN',
  'COMPOSICIÓN',
  'CÁMARA + NEGATIVO',
];

function StatusChip({
  label,
  value,
  active,
  icon,
}: {
  label: string;
  value: string;
  active: boolean;
  icon: string;
}) {
  return (
    <div className={`flex items-start gap-2 py-1.5 px-2 rounded-lg ${active ? 'bg-white/5' : 'opacity-40'}`}>
      <span className={`material-symbols-outlined text-[14px] mt-0.5 shrink-0 ${active ? 'text-green-400' : 'text-white/30'}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-none mb-0.5">{label}</p>
        <p className="text-[11px] text-white/80 leading-snug">{value}</p>
      </div>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1 pb-0.5">
      <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em]">{label}</span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

export function PromptDebug({ scene, config, lastPrompt, loading }: PromptDebugProps) {
  const [open, setOpen] = useState(false);

  const promptLines = lastPrompt ? lastPrompt.split('\n').filter(l => l.trim()) : [];

  const objetosCargados = scene.objetos.filter(o => o.base64);

  return (
    <div className="w-full max-w-4xl mb-6 rounded-2xl border border-white/10 bg-[#111] overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-white/40">bug_report</span>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Prompt Debug</span>
          {lastPrompt && (
            <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 text-[8px] font-bold uppercase">
              Prompt listo
            </span>
          )}
          {loading && (
            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[8px] font-bold uppercase animate-pulse">
              Generando...
            </span>
          )}
        </div>
        <span className={`material-symbols-outlined text-[18px] text-white/30 transition-transform ${open ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-1">

          {/* ─── Configuración activa ─────────────────────────────── */}
          <SectionDivider label="Configuración" />

          <StatusChip
            label="Tipo de disparo"
            value={SHOT_LABELS[scene.estiloDisparo]}
            active
            icon="smartphone"
          />
          <StatusChip
            label="Plano"
            value={PLANO_LABELS[scene.plano]}
            active
            icon="zoom_in"
          />
          <StatusChip
            label="Inclinación"
            value={INCLINACION_LABELS[scene.inclinacion]}
            active
            icon="rotate_left"
          />
          <StatusChip
            label="Cámara"
            value={CAMARA_LABELS[scene.camara]}
            active
            icon="photo_camera"
          />

          {/* ─── Identidad de Ari (Config) ───────────────────────── */}
          <SectionDivider label="Identidad de Ari (Config)" />

          <StatusChip
            label="Rostro"
            value={config?.faceUrl ? 'Configurado — Claude usa la imagen para identidad (@img1)' : 'Sin configurar'}
            active={!!config?.faceUrl}
            icon="face_retouching_natural"
          />
          <StatusChip
            label="Cuerpo"
            value={config?.bodyUrl
              ? 'Configurado — Claude extrae: silueta, proporciones y tono de piel'
              : 'Sin configurar'}
            active={!!config?.bodyUrl}
            icon="accessibility"
          />
          <StatusChip
            label="Celular"
            value={!config?.phoneUrl
              ? 'No configurado'
              : scene.usePhone
              ? 'Activado — Claude describe el celular para el prompt'
              : 'Desactivado — no se incluye en el prompt'}
            active={scene.usePhone && !!config?.phoneUrl}
            icon="phone_iphone"
          />

          {/* ─── Referencias del sidebar ─────────────────────────── */}
          <SectionDivider label="Referencias cargadas" />

          <StatusChip
            label="Vestimenta"
            value={scene.vestimenta.base64
              ? 'Imagen cargada — Claude lee solo la ropa (tela, fit, color, detalles)'
              : 'Sin imagen — Claude infiere la ropa del texto de instrucciones'}
            active={!!scene.vestimenta.base64}
            icon="apparel"
          />
          <StatusChip
            label="Escenario"
            value={scene.escenario.base64
              ? 'Imagen cargada — Claude lee el ambiente y la iluminación'
              : 'Sin imagen — Claude usa las instrucciones para describir el lugar'}
            active={!!scene.escenario.base64}
            icon="landscape"
          />
          <StatusChip
            label="Pose / Composición"
            value={scene.pose.base64
              ? 'Imagen cargada — Claude extrae el encuadre y posición corporal'
              : 'Sin imagen — se usa el plano e inclinación configurados'}
            active={!!scene.pose.base64}
            icon="accessibility_new"
          />
          {objetosCargados.length > 0 ? (
            <StatusChip
              label={`Objetos (${objetosCargados.length})`}
              value={`${objetosCargados.length} imagen${objetosCargados.length > 1 ? 'es' : ''} cargada${objetosCargados.length > 1 ? 's' : ''} — Claude describe cada objeto para incluirlo en la escena`}
              active
              icon="category"
            />
          ) : (
            <StatusChip
              label="Objetos"
              value="Sin imágenes"
              active={false}
              icon="category"
            />
          )}

          {scene.instrucciones.trim() && (
            <StatusChip
              label="Instrucciones de escena"
              value={`"${scene.instrucciones.trim().slice(0, 120)}${scene.instrucciones.length > 120 ? '...' : ''}"`}
              active
              icon="edit_note"
            />
          )}

          {/* ─── Último prompt generado ───────────────────────────── */}
          {promptLines.length > 0 && (
            <>
              <SectionDivider label="Último prompt generado por Claude" />
              <div className="flex flex-col gap-1 mt-1">
                {promptLines.map((line, i) => (
                  <div key={i} className="flex gap-2 p-2 rounded-lg bg-white/5">
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-0.5 w-28 shrink-0">
                      {PROMPT_LINE_LABELS[i] ?? `LINE ${i + 1}`}
                    </span>
                    <p className="text-[11px] text-white/70 leading-snug">{line}</p>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}
