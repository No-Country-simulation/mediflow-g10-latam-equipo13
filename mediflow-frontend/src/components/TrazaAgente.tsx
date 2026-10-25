/**
 * Línea de tiempo del grafo de decisión del agente: qué hizo cada nodo, qué decidió y por qué.
 */
import {
  Bell,
  Brain,
  ClipboardCheck,
  Database,
  Gauge,
  GitBranch,
  ShieldAlert,
  Siren,
  type LucideIcon,
} from 'lucide-react';
import type { PasoTraza, ValidacionAgente } from '../lib/api';

const NODOS: Record<string, { Icon: LucideIcon; color: string }> = {
  extraer: { Icon: Brain, color: 'bg-brand-50 text-brand-600 ring-brand-100' },
  validar: { Icon: ClipboardCheck, color: 'bg-neutral-100 text-neutral-600 ring-neutral-200' },
  evaluar_confianza: { Icon: Gauge, color: 'bg-neutral-100 text-neutral-600 ring-neutral-200' },
  detectar_urgencia: { Icon: Siren, color: 'bg-neutral-100 text-neutral-600 ring-neutral-200' },
  ruta_revision: { Icon: ShieldAlert, color: 'bg-warning-50 text-warning-600 ring-warning-100' },
  ruta_urgencia: { Icon: Siren, color: 'bg-danger-50 text-danger-600 ring-danger-100' },
  ruta_estandar: { Icon: GitBranch, color: 'bg-success-50 text-success-600 ring-success-100' },
  notificar: { Icon: Bell, color: 'bg-danger-50 text-danger-600 ring-danger-100' },
  persistir: { Icon: Database, color: 'bg-brand-50 text-brand-600 ring-brand-100' },
};

const ETIQUETAS: Record<string, string> = {
  tipo_detectado: 'Tipo leído',
  prioridad_ia: 'Prioridad según la IA',
  medicamentos: 'Medicamentos',
  hallazgos_criticos: 'Hallazgos críticos',
  campos_faltantes: 'Faltan',
  inconsistencias: 'Inconsistencias',
  ambiguedades: 'Ambigüedades',
  medicamentos_alto_riesgo: 'Alto riesgo',
  confianza_ia: 'Confianza de la IA',
  penalizacion: 'Penalización',
  motivos: 'Motivos',
  tipo: 'Tipo',
  canal: 'Canal',
  ruta_objeto: 'Objeto en OCI',
};

const OCULTOS = new Set(['faltantes', 'ambiguedades_total']);

function Detalle({ detalle }: { detalle: Record<string, unknown> }) {
  const filas = Object.entries(detalle).filter(([clave, valor]) => {
    if (OCULTOS.has(clave) || valor === null || valor === undefined || valor === '') return false;
    if (Array.isArray(valor)) return valor.length > 0;
    // Los contadores en 0 no aportan: ya se ven en las listas.
    return !(typeof valor === 'number' && valor === 0 && clave !== 'penalizacion');
  });
  if (!filas.length) return null;
  return (
    <dl className="mt-2 space-y-1.5">
      {filas.map(([clave, valor]) => (
        <div key={clave} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs">
          <dt className="text-neutral-400">{ETIQUETAS[clave] ?? clave.replace(/_/g, ' ')}:</dt>
          <dd className="text-neutral-700 flex flex-wrap gap-1">
            {Array.isArray(valor)
              ? valor.map((v, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                    {String(v)}
                  </span>
                ))
              : <span className="font-medium">{typeof valor === 'number' ? valor.toLocaleString('es-CO') : String(valor)}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Observaciones({ validacion }: { validacion: ValidacionAgente }) {
  const grupos = [
    { titulo: 'Datos faltantes', items: validacion.camposFaltantes, clase: 'bg-warning-50 text-warning-800 border-warning-200' },
    { titulo: 'Inconsistencias', items: validacion.inconsistencias, clase: 'bg-warning-50 text-warning-800 border-warning-200' },
    { titulo: 'Ambigüedades', items: validacion.ambiguedades, clase: 'bg-warning-50 text-warning-800 border-warning-200' },
    { titulo: 'Medicamentos de alto riesgo', items: validacion.medicamentosAltoRiesgo, clase: 'bg-danger-50 text-danger-800 border-danger-200' },
    { titulo: 'Motivos de urgencia', items: validacion.motivosUrgencia, clase: 'bg-danger-50 text-danger-800 border-danger-200' },
  ].filter((g) => g.items.length > 0);

  if (!grupos.length) {
    return (
      <p className="text-sm text-success-700 bg-success-50 border border-success-200 rounded-lg p-3">
        El agente no encontró datos faltantes, inconsistencias ni señales de urgencia.
      </p>
    );
  }
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {grupos.map((g) => (
        <div key={g.titulo} className={`rounded-lg border p-3 text-sm ${g.clase}`}>
          <p className="font-semibold mb-1">{g.titulo}</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {g.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function TrazaAgente({ traza, validacion }: { traza: PasoTraza[]; validacion: ValidacionAgente | null }) {
  if (!traza.length) {
    return (
      <p className="text-sm text-neutral-500">
        Este documento se procesó con una versión anterior del agente, que no registraba la traza de decisión.
      </p>
    );
  }
  const total = traza.reduce((suma, paso) => suma + (paso.duracion_ms ?? 0), 0);

  return (
    <div className="space-y-6">
      {validacion && <Observaciones validacion={validacion} />}

      <ol className="relative">
        {traza.map((paso, i) => {
          const { Icon, color } = NODOS[paso.nodo] ?? NODOS.validar;
          const ultimo = i === traza.length - 1;
          return (
            <li key={`${paso.nodo}-${i}`} className="relative pl-12 pb-5">
              {!ultimo && <span className="absolute left-[19px] top-10 bottom-0 w-px bg-neutral-200" aria-hidden />}
              <span className={`absolute left-0 top-0 w-10 h-10 rounded-full ring-4 flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </span>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-neutral-900">{paso.titulo}</p>
                {paso.duracion_ms !== undefined && (
                  <span className="text-xs text-neutral-400 tabular-nums">
                    {paso.duracion_ms >= 1000 ? `${(paso.duracion_ms / 1000).toFixed(1)} s` : `${Math.round(paso.duracion_ms)} ms`}
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-700">{paso.resultado}</p>
              {paso.detalle && <Detalle detalle={paso.detalle} />}
            </li>
          );
        })}
      </ol>

      <p className="text-xs text-neutral-400">
        {traza.length} pasos del grafo de decisión (LangGraph) · {total >= 1000 ? `${(total / 1000).toFixed(1)} s` : `${Math.round(total)} ms`} en total
      </p>
    </div>
  );
}
