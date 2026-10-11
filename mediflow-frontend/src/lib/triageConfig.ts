/**
 * Configuración de triaje editable desde la pantalla "Configuración".
 * Se guarda en este navegador (localStorage) y se intenta sincronizar con FastAPI.
 * Las reglas del frontend son orientativas: la decisión final la toma el backend.
 */
import { SERVICE_URLS, type DocumentoUnificado } from './api';

export interface DestinoRuta {
  id: string;
  nombre: string;
  /** Tipo de documento que se enruta aquí ('*' = urgencias / cualquier tipo). */
  tipoDocumento: string;
  activo: boolean;
}

export interface TriageConfig {
  umbralConfianza: number;
  palabrasUrgencia: string[];
  destinos: DestinoRuta[];
}

export const TIPOS_DOCUMENTO = [
  'Receta',
  'Informe de Estudio por Imágenes',
  'Orden de Procedimiento',
  'Epicrisis',
  'Certificado Médico',
] as const;

export const DEFAULT_CONFIG: TriageConfig = {
  umbralConfianza: 0.6,
  palabrasUrgencia: [
    'urgente',
    'emergencia',
    'embolia',
    'tromboembolismo',
    'infarto',
    'hemorragia',
    'disnea súbita',
    'paro cardiorrespiratorio',
    'sepsis',
    'correlación clínica urgente',
  ],
  destinos: [
    { id: 'urgencias', nombre: 'Cola_Emergencia_Medica', tipoDocumento: '*', activo: true },
    { id: 'farmacia', nombre: 'Farmacia_Hospitalaria', tipoDocumento: 'Receta', activo: true },
    { id: 'imagenes', nombre: 'Historia_Clinica_Electronica', tipoDocumento: 'Informe de Estudio por Imágenes', activo: true },
    { id: 'autorizaciones', nombre: 'Auditoria_Autorizaciones', tipoDocumento: 'Orden de Procedimiento', activo: true },
    { id: 'epicrisis', nombre: 'Historia_Clinica_Electronica', tipoDocumento: 'Epicrisis', activo: true },
    { id: 'certificados', nombre: 'Historia_Clinica_Electronica', tipoDocumento: 'Certificado Médico', activo: true },
    { id: 'revision', nombre: 'Cola_Revision_Humana', tipoDocumento: '*', activo: true },
  ],
};

const STORAGE_KEY = 'mediflow:triage-config';

export function cargarConfig(): TriageConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_CONFIG);
    const parsed = JSON.parse(raw) as Partial<TriageConfig>;
    return {
      umbralConfianza:
        typeof parsed.umbralConfianza === 'number' && parsed.umbralConfianza >= 0 && parsed.umbralConfianza <= 1
          ? parsed.umbralConfianza
          : DEFAULT_CONFIG.umbralConfianza,
      palabrasUrgencia: Array.isArray(parsed.palabrasUrgencia) ? parsed.palabrasUrgencia : DEFAULT_CONFIG.palabrasUrgencia,
      destinos: Array.isArray(parsed.destinos) && parsed.destinos.length ? parsed.destinos : DEFAULT_CONFIG.destinos,
    };
  } catch {
    return structuredClone(DEFAULT_CONFIG);
  }
}

export type ResultadoGuardado = 'servidor' | 'local';

/** Guarda en el navegador y, si el backend lo soporta, también en el servidor. */
export async function guardarConfig(cfg: TriageConfig): Promise<ResultadoGuardado> {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  try {
    const res = await fetch(`${SERVICE_URLS.fastapi}/api/v1/configuracion`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    });
    return res.ok ? 'servidor' : 'local';
  } catch {
    return 'local';
  }
}

export function restablecerConfig(): TriageConfig {
  localStorage.removeItem(STORAGE_KEY);
  return structuredClone(DEFAULT_CONFIG);
}

const normalizar = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export interface EvaluacionReglas {
  sugiereAuditoria: boolean;
  sugiereUrgencia: boolean;
  palabrasDetectadas: string[];
  motivos: string[];
}

/** Compara el resultado del agente con las reglas configuradas. Solo orienta; no modifica el documento. */
export function evaluarReglas(doc: DocumentoUnificado, cfg: TriageConfig): EvaluacionReglas {
  const motivos: string[] = [];
  const texto = normalizar(`${doc.contenido} ${doc.diagnosticoPrincipal ?? ''} ${doc.estudioRealizado ?? ''}`);
  const palabrasDetectadas = cfg.palabrasUrgencia.filter((p) => p.trim() && texto.includes(normalizar(p)));

  const sugiereAuditoria = doc.scoreConfianza < cfg.umbralConfianza && !doc.requiereAuditoria;
  if (sugiereAuditoria) {
    motivos.push(
      `La confianza (${Math.round(doc.scoreConfianza * 100)}%) está por debajo del umbral configurado (${Math.round(cfg.umbralConfianza * 100)}%).`
    );
  }

  const sugiereUrgencia = palabrasDetectadas.length > 0 && doc.prioridad !== 'Urgente';
  if (sugiereUrgencia) {
    motivos.push(`Se detectaron términos de urgencia: ${palabrasDetectadas.join(', ')}.`);
  }

  return { sugiereAuditoria, sugiereUrgencia, palabrasDetectadas, motivos };
}
