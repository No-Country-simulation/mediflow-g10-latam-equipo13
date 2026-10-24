/**
 * El grafo de decisión del agente (el mismo de Backend_FastAPI/agente/grafo.py), dibujado en SVG.
 * La luz recorre la ruta elegida: se usa en el landing (demo), al procesar (en vivo) y en el detalle (resultado).
 */
import { useEffect, useId, useState } from 'react';
import {
  Bell,
  Brain,
  ClipboardCheck,
  Database,
  FileText,
  Gauge,
  GitBranch,
  Route,
  ShieldAlert,
  Siren,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../lib/design-system';
import type { DocumentoUnificado } from '../lib/api';

export type RutaAgente = 'revision_humana' | 'urgencia' | 'estandar';

type Estado = 'pendiente' | 'activo' | 'hecho' | 'descartado';
type Tipo = 'principal' | 'decision' | 'rama' | 'final';

interface Nodo {
  id: string;
  x: number;
  y: number;
  titulo: string;
  sub: string;
  Icono: LucideIcon;
  tipo: Tipo;
  ruta?: RutaAgente;
  orden: number;
}

const COLOR_RAMA: Record<RutaAgente, string> = {
  revision_humana: '#f79009',
  urgencia: '#f04438',
  estandar: '#12b76a',
};

const Y = 190;
const NODOS: Nodo[] = [
  { id: 'doc', x: 60, y: Y, titulo: 'Documento', sub: 'PDF · imagen · texto', Icono: FileText, tipo: 'principal', orden: 0 },
  { id: 'extraer', x: 175, y: Y, titulo: 'Extracción', sub: 'Gemini multimodal', Icono: Brain, tipo: 'principal', orden: 1 },
  { id: 'validar', x: 290, y: Y, titulo: 'Validación', sub: 'Pydantic + reglas', Icono: ClipboardCheck, tipo: 'principal', orden: 2 },
  { id: 'confianza', x: 405, y: Y, titulo: 'Confianza', sub: 'IA − penalizaciones', Icono: Gauge, tipo: 'principal', orden: 3 },
  { id: 'urgencia', x: 520, y: Y, titulo: 'Urgencia', sub: 'hallazgos · términos', Icono: Siren, tipo: 'principal', orden: 4 },
  { id: 'decision', x: 632, y: Y, titulo: 'Decisión', sub: 'arista condicional', Icono: GitBranch, tipo: 'decision', orden: 5 },
  { id: 'revision_humana', x: 762, y: 70, titulo: 'Revisión humana', sub: 'confianza baja', Icono: ShieldAlert, tipo: 'rama', ruta: 'revision_humana', orden: 6 },
  { id: 'urgencia_rama', x: 762, y: Y, titulo: 'Emergencias', sub: 'alerta a guardia', Icono: Siren, tipo: 'rama', ruta: 'urgencia', orden: 6 },
  { id: 'estandar', x: 762, y: 310, titulo: 'Flujo estándar', sub: 'destino por tipo', Icono: Route, tipo: 'rama', ruta: 'estandar', orden: 6 },
  { id: 'oci', x: 900, y: Y, titulo: 'OCI Storage', sub: 'JSON + original', Icono: Database, tipo: 'final', orden: 7 },
];

const ARISTAS: { de: string; a: string; d: string }[] = [
  { de: 'doc', a: 'extraer', d: `M 86 ${Y} H 149` },
  { de: 'extraer', a: 'validar', d: `M 201 ${Y} H 264` },
  { de: 'validar', a: 'confianza', d: `M 316 ${Y} H 379` },
  { de: 'confianza', a: 'urgencia', d: `M 431 ${Y} H 494` },
  { de: 'urgencia', a: 'decision', d: `M 546 ${Y} H 600` },
  { de: 'decision', a: 'revision_humana', d: `M 664 ${Y} C 706 ${Y}, 700 70, 736 70` },
  { de: 'decision', a: 'urgencia_rama', d: `M 664 ${Y} H 736` },
  { de: 'decision', a: 'estandar', d: `M 664 ${Y} C 706 ${Y}, 700 310, 736 310` },
  { de: 'revision_humana', a: 'oci', d: `M 788 70 C 836 70, 846 ${Y}, 874 ${Y}` },
  { de: 'urgencia_rama', a: 'oci', d: `M 788 ${Y} H 874` },
  { de: 'estandar', a: 'oci', d: `M 788 310 C 836 310, 846 ${Y}, 874 ${Y}` },
];

const TOTAL_PASOS = 8;

/** Ruta que tomó un documento ya procesado, según su traza (o, si no hay traza, según sus campos). */
export function rutaDeDocumento(doc: Pick<DocumentoUnificado, 'traza' | 'requiereAuditoria' | 'prioridad' | 'revision'>): RutaAgente {
  const nodos = doc.traza.map((p) => p.nodo);
  if (nodos.includes('ruta_revision')) return 'revision_humana';
  if (nodos.includes('ruta_urgencia')) return 'urgencia';
  if (nodos.includes('ruta_estandar')) return 'estandar';
  if (doc.requiereAuditoria || doc.revision) return 'revision_humana';
  return doc.prioridad === 'Urgente' ? 'urgencia' : 'estandar';
}

/** Ciclo automático por escenarios (para el landing y el acceso). */
export function useCicloEscenarios<T>(escenarios: T[], msPorPaso = 520, pausa = 2600) {
  const [indice, setIndice] = useState(0);
  const [paso, setPaso] = useState(0);
  useEffect(() => {
    const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducido) {
      setPaso(TOTAL_PASOS);
      return;
    }
    const t = window.setTimeout(
      () => {
        if (paso < TOTAL_PASOS) setPaso((p) => p + 1);
        else {
          setPaso(0);
          setIndice((i) => (i + 1) % escenarios.length);
        }
      },
      paso < TOTAL_PASOS ? msPorPaso : pausa
    );
    return () => window.clearTimeout(t);
  }, [paso, escenarios.length, msPorPaso, pausa]);
  return { escenario: escenarios[indice], indice, paso, irA: (i: number) => { setIndice(i); setPaso(0); } };
}

interface Props {
  /** Ruta elegida por el agente. Sin ruta y sin `procesando`, el grafo se muestra en reposo. */
  ruta?: RutaAgente | null;
  /** Cuántos pasos de la ruta se iluminan (0 a 8). Por defecto, todos. */
  paso?: number;
  /** Animación en vivo mientras el agente trabaja (la ruta aún no se conoce). */
  procesando?: boolean;
  /** Muestra la campana de alerta sobre Emergencias. */
  alerta?: boolean;
  tono?: 'claro' | 'oscuro';
  className?: string;
}

export default function GrafoAgente({ ruta = null, paso = TOTAL_PASOS, procesando = false, alerta, tono = 'claro', className }: Props) {
  const uid = useId().replace(/:/g, '');
  const oscuro = tono === 'oscuro';

  // En vivo: la luz avanza por los nodos principales mientras la IA trabaja.
  const [pasoVivo, setPasoVivo] = useState(1);
  useEffect(() => {
    if (!procesando) return;
    const t = window.setInterval(() => setPasoVivo((p) => (p >= 5 ? 1 : p + 1)), 1100);
    return () => window.clearInterval(t);
  }, [procesando]);

  const estadoDe = (n: Nodo): Estado => {
    if (procesando) {
      if (n.orden < pasoVivo) return 'hecho';
      if (n.orden === pasoVivo) return 'activo';
      return 'pendiente';
    }
    if (!ruta) return 'pendiente';
    if (n.tipo === 'rama' && n.ruta !== ruta) return paso > 6 ? 'descartado' : 'pendiente';
    if (n.orden < paso) return 'hecho';
    if (n.orden === paso) return 'activo';
    return 'pendiente';
  };

  const estados = Object.fromEntries(NODOS.map((n) => [n.id, estadoDe(n)])) as Record<string, Estado>;
  const colorDe = (n: Nodo) => (n.ruta ? COLOR_RAMA[n.ruta] : n.tipo === 'final' ? '#3f8cf5' : '#5b5bf0');
  const mostrarAlerta = (alerta ?? ruta === 'urgencia') && !procesando && estados.urgencia_rama === 'hecho';

  const etiqueta = procesando
    ? 'El agente está analizando el documento'
    : ruta
      ? `Ruta del agente: ${ruta === 'revision_humana' ? 'revisión humana' : ruta === 'urgencia' ? 'emergencias' : 'flujo estándar'}`
      : 'Grafo de decisión del agente';

  return (
    <svg viewBox="0 0 960 380" className={cn('w-full h-auto select-none', className)} role="img" aria-label={etiqueta}>
      <defs>
        <linearGradient id={`luz-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5b5bf0" />
          <stop offset="0.6" stopColor="#3f8cf5" />
          <stop offset="1" stopColor="#0cc4ab" />
        </linearGradient>
        <radialGradient id={`nodo-${uid}`} cx="0.3" cy="0.25" r="0.9">
          <stop offset="0" stopColor="#8080fb" />
          <stop offset="0.6" stopColor="#5b5bf0" />
          <stop offset="1" stopColor="#3c37b8" />
        </radialGradient>
        <filter id={`brillo-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Aristas: base tenue + luz sobre la ruta recorrida */}
      {ARISTAS.map((e) => {
        const de = estados[e.de];
        const a = estados[e.a];
        const encendida = de === 'hecho' && (a === 'hecho' || a === 'activo');
        const fluyendo = de === 'hecho' && a === 'activo';
        const descartada = a === 'descartado' || de === 'descartado';
        return (
          <g key={`${e.de}-${e.a}`}>
            <path
              d={e.d}
              fill="none"
              stroke={oscuro ? 'rgba(255,255,255,0.12)' : '#e3e8ef'}
              strokeWidth={2}
              strokeDasharray={descartada ? '3 6' : undefined}
              opacity={descartada ? 0.6 : 1}
            />
            {encendida && (
              <path
                d={e.d}
                fill="none"
                stroke={`url(#luz-${uid})`}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={fluyendo ? '6 6' : undefined}
                className={fluyendo ? 'animate-flow' : undefined}
                filter={oscuro ? `url(#brillo-${uid})` : undefined}
              />
            )}
          </g>
        );
      })}

      {/* Nodos */}
      {NODOS.map((n) => {
        const estado = estados[n.id];
        const color = colorDe(n);
        const lleno = estado === 'hecho' || estado === 'activo';
        const atenuado = estado === 'descartado';
        const r = n.tipo === 'decision' ? 30 : 26;
        const fondoPendiente = oscuro ? 'rgba(255,255,255,0.05)' : '#ffffff';
        const bordePendiente = oscuro ? 'rgba(255,255,255,0.18)' : '#d6dce6';
        const relleno = lleno ? (n.tipo === 'principal' || n.tipo === 'decision' ? `url(#nodo-${uid})` : color) : fondoPendiente;
        const icono = lleno ? '#ffffff' : oscuro ? 'rgba(255,255,255,0.55)' : '#8a96a9';
        return (
          <g key={n.id} opacity={atenuado ? 0.35 : 1} style={{ transition: 'opacity 400ms ease' }}>
            {estado === 'activo' && (
              <circle cx={n.x} cy={n.y} r={r} fill="none" stroke={color} strokeWidth={2} className="animate-pulse-ring" style={{ transformOrigin: `${n.x}px ${n.y}px` }} />
            )}
            {lleno && <circle cx={n.x} cy={n.y} r={r + 8} fill={color} opacity={oscuro ? 0.22 : 0.12} />}
            {n.tipo === 'decision' ? (
              <rect
                x={n.x - 22}
                y={n.y - 22}
                width={44}
                height={44}
                rx={10}
                transform={`rotate(45 ${n.x} ${n.y})`}
                fill={relleno}
                stroke={lleno ? 'none' : bordePendiente}
                strokeWidth={1.5}
                style={{ transition: 'fill 400ms ease' }}
              />
            ) : (
              <circle cx={n.x} cy={n.y} r={r} fill={relleno} stroke={lleno ? 'none' : bordePendiente} strokeWidth={1.5} style={{ transition: 'fill 400ms ease' }} />
            )}
            <n.Icono x={n.x - 11} y={n.y - 11} width={22} height={22} color={icono} strokeWidth={2} />
            <text x={n.x} y={n.y + (n.tipo === 'decision' ? 50 : 44)} textAnchor="middle" fontSize={13} fontWeight={600}
              fill={oscuro ? (lleno ? '#ffffff' : 'rgba(255,255,255,0.65)') : lleno ? '#141b3b' : '#6e7c91'} fontFamily="Sora, Inter, sans-serif">
              {n.titulo}
            </text>
            <text x={n.x} y={n.y + (n.tipo === 'decision' ? 65 : 59)} textAnchor="middle" fontSize={10.5}
              fill={oscuro ? 'rgba(255,255,255,0.4)' : '#a9b4c4'} fontFamily="Inter, sans-serif">
              {n.sub}
            </text>
          </g>
        );
      })}

      {/* Alerta a la guardia sobre Emergencias */}
      {mostrarAlerta && (
        <g>
          <circle cx={786} cy={Y - 26} r={12} fill="#f04438" className="animate-pulse-ring" style={{ transformOrigin: `786px ${Y - 26}px` }} />
          <circle cx={786} cy={Y - 26} r={12} fill="#f04438" stroke={oscuro ? '#0b1026' : '#ffffff'} strokeWidth={3} />
          <Bell x={780} y={Y - 32} width={12} height={12} color="#ffffff" strokeWidth={2.5} />
        </g>
      )}
    </svg>
  );
}
