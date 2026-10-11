/**
 * MediFlow API Layer
 * Conecta con Spring Boot (auth, persistencia) y FastAPI (procesamiento IA)
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ============================================
// CONFIGURACIÓN
// ============================================

export const UNAUTHORIZED_EVENT = 'mediflow:unauthorized';

const SPRING_BOOT_URL = import.meta.env.VITE_SPRING_BOOT_URL || 'http://localhost:8080';
const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';

// ============================================
// TIPOS COMPARTIDOS
// ============================================

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ============================================
// TIPOS SPRING BOOT (Backend principal)
// ============================================

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'PERSONAL' | 'AUDITOR' | 'NO_ASIGNADO';
  activo: boolean;
  fechaCreacion: string;
}

export interface AuthResponse {
  token: string;
  tipo: string;
  usuario: Usuario;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
}

export interface DocumentoSpring {
  id: number;
  tipo: string;
  contenido: string;
  especialidad: string;
  documentoId: string;
  fechaRegistro: string;
  fechaActualizacion: string;
  score: number;
  nombreMedico: string;
  prioridad: 'Rutina' | 'Urgente';
  usuarioId: number;
  // --- Campos que el backend debe persistir y devolver (contrato propuesto) ---
  status?: 'procesado' | 'en_revision' | 'error';
  requiereAuditoria?: boolean;
  destino?: string;
  justificacion?: string;
  nombrePaciente?: string;
  rutPaciente?: string;
  edadPaciente?: number | null;
  matricula?: string;
  estudioRealizado?: string | null;
  diagnosticoPrincipal?: string | null;
  cie10Sugerido?: string | null;
  medicamentos?: Medicamento[];
  notificacion?: NotificacionGenerada | null;
  revision?: RevisionHumana | null;
}

export interface Medicamento {
  nombre: string;
  dosis?: string | null;
  frecuencia?: string | null;
  via?: string | null;
  duracion?: string | null;
}

export interface NotificacionGenerada {
  canal: string;
  mensaje: string;
}

export type DecisionRevision = 'aprobado' | 'corregido' | 'rechazado';

export interface RevisionHumana {
  decision: DecisionRevision;
  comentario?: string;
  revisor?: string;
  fecha: string;
}

export interface DatosCorregidos {
  nombrePaciente: string;
  rutPaciente: string;
  edadPaciente: number | null;
  nombreMedico: string;
  matricula: string;
  estudioRealizado: string | null;
  diagnosticoPrincipal: string | null;
  cie10Sugerido: string | null;
  prioridad: 'Rutina' | 'Urgente';
}

export interface RevisionRequest {
  decision: DecisionRevision;
  comentario?: string;
  revisor?: string;
  datosCorregidos?: DatosCorregidos;
}

export interface DocumentoRequest {
  content: string;
}

export interface PacienteSpring {
  id: number;
  nombre: string;
  rut: string;
  edad: number | null;
  usuarioId: number;
  fechaCreacion: string;
}

export interface EstudioSpring {
  id: number;
  nombre: string;
  tipo: string;
  pacienteId: number;
  documentoId: number;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO';
  prioridad: 'Rutina' | 'Urgente';
  fechaCreacion: string;
  fechaActualizacion: string;
}

// ============================================
// TIPOS FASTAPI (Procesamiento IA)
// ============================================

export interface PacienteFastAPI {
  nombre: string;
  rut: string;
  edad: number | null;
}

export interface MedicoSolicitanteFastAPI {
  nombre: string;
  matricula: string;
}

export interface ClasificacionFastAPI {
  tipo_documento: string;
  especialidad: string;
  nivel_prioridad: 'Rutina' | 'Urgente';
  score_confianza_clasificacion: number;
}

export interface DatosExtraidosFastAPI {
  paciente: PacienteFastAPI;
  medico_solicitante: MedicoSolicitanteFastAPI;
  estudio_realizado: string | null;
  diagnostico_principal: string | null;
  cie10_sugerido: string | null;
  medicamentos?: Medicamento[];
}

export interface DecisionEnrutamientoFastAPI {
  destino_principal: string;
  requiere_auditoria_humana: boolean;
  justificacion_enrutamiento: string;
  notificacion_generada?: NotificacionGenerada | null;
}

export interface AlmacenamientoOCI {
  bucket: string;
  ruta_objeto: string;
  status_backup: string;
}

export interface DocumentoProcesadoFastAPI {
  status: 'procesado' | 'en_revision' | 'error';
  documento_id: string;
  clasificacion: ClasificacionFastAPI;
  datos_extraidos: DatosExtraidosFastAPI;
  // Opcionales: dependen de la versión del backend (la actual de FastAPI aún no los devuelve).
  decision_enrutamiento?: DecisionEnrutamientoFastAPI;
  almacenamiento_oci?: AlmacenamientoOCI;
  fecha?: string;
  contenido?: string;
}

// ============================================
// TIPOS UNIFICADOS PARA EL FRONTEND
// ============================================

export interface DocumentoUnificado {
  // IDs
  id: number | string;
  documentoId: string;

  // Clasificación
  tipo: string;
  especialidad: string;
  prioridad: 'Rutina' | 'Urgente';
  scoreConfianza: number;

  // Datos extraídos
  paciente: {
    nombre: string;
    rut: string;
    edad: number | null;
  };
  medico: {
    nombre: string;
    matricula: string;
  };
  estudioRealizado: string | null;
  diagnosticoPrincipal: string | null;
  cie10Sugerido: string | null;

  // Enrutamiento
  destino: string;
  requiereAuditoria: boolean;
  justificacion: string;

  // Almacenamiento
  almacenamiento: {
    bucket: string;
    ruta: string;
    status: string;
  };

  // Metadatos
  contenido: string;
  fecha: string;
  status: 'procesado' | 'en_revision' | 'error' | 'pendiente';

  // Extras
  medicamentos: Medicamento[];
  notificacion: NotificacionGenerada | null;
  revision: RevisionHumana | null;

  // Origen
  origen: 'spring' | 'fastapi';
}

// ============================================
// CLIENTE HTTP BASE
// ============================================

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
    } catch {
      throw { message: 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.', status: 0 } as ApiError;
    }

    if (response.status === 401 && this.token) {
      this.setToken(null);
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    if (!response.ok) {
      const error: ApiError = {
        message: `Error ${response.status}: ${response.statusText}`,
        status: response.status,
      };
      try {
        const data = await response.json();
        error.message = data.message || error.message;
        error.code = data.code;
        error.details = data.details;
      } catch {
        // Ignore parse error
      }
      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Auth
  private async postPublico<T>(endpoint: string, body: unknown, errorPorDefecto: string): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      throw {
        message: `No se pudo conectar con el servidor (${this.baseUrl}). Verifica que Spring Boot esté en ejecución y que permita CORS desde ${window.location.origin}.`,
        status: 0,
      } as ApiError;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw {
        message: data.message || (response.status >= 500 ? `Error del servidor (${response.status})` : errorPorDefecto),
        status: response.status,
      } as ApiError;
    }

    return response.json();
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const data = await this.postPublico<AuthResponse>('/api/auth/login', credentials, 'Credenciales inválidas');
    this.setToken(data.token);
    return data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const result = await this.postPublico<AuthResponse>('/api/auth/register', data, 'Error al registrar');
    this.setToken(result.token);
    return result;
  }

  async getCurrentUser(): Promise<Usuario> {
    return this.request<Usuario>('/api/usuarios/me');
  }

  logout() {
    this.setToken(null);
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Documentos
  async getDocumentos(page = 0, size = 20): Promise<PaginatedResponse<DocumentoSpring>> {
    return this.request<PaginatedResponse<DocumentoSpring>>(`/api/documentos/findall?page=${page}&size=${size}`);
  }

  async getDocumento(id: number): Promise<DocumentoSpring> {
    return this.request<DocumentoSpring>(`/api/documentos/findbyid/${id}`);
  }

  async analyzeText(content: string): Promise<DocumentoSpring> {
    return this.request<DocumentoSpring>('/api/documentos/analyze/text', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async analyzeFile(file: File): Promise<DocumentoSpring> {
    const formData = new FormData();
    formData.append('archivo', file);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/documentos/analyze/file`, {
        method: 'POST',
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : undefined,
        body: formData,
      });
    } catch {
      throw { message: 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.', status: 0 } as ApiError;
    }

    if (response.status === 401 && this.token) {
      this.setToken(null);
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw { message: data.message || `Error al procesar el archivo (${response.status})`, status: response.status } as ApiError;
    }

    return response.json();
  }

  async revisarDocumento(id: number, payload: RevisionRequest): Promise<DocumentoSpring> {
    return this.request<DocumentoSpring>(`/api/documentos/${id}/revision`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteDocumento(id: number): Promise<void> {
    return this.request<void>(`/api/documentos/${id}`, { method: 'DELETE' });
  }

  // Pacientes
  async getPacientes(): Promise<PacienteSpring[]> {
    return this.request<PacienteSpring[]>('/api/pacientes');
  }

  async getPaciente(id: number): Promise<PacienteSpring> {
    return this.request<PacienteSpring>(`/api/pacientes/${id}`);
  }

  // Estudios
  async getEstudios(): Promise<EstudioSpring[]> {
    return this.request<EstudioSpring[]>('/api/estudios');
  }

  async getEstudio(id: number): Promise<EstudioSpring> {
    return this.request<EstudioSpring>(`/api/estudios/${id}`);
  }

  async updateEstudioEstado(id: number, estado: EstudioSpring['estado']): Promise<EstudioSpring> {
    return this.request<EstudioSpring>(`/api/estudios/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    });
  }
}

// ============================================
// CLIENTE FASTAPI (Solo procesamiento IA)
// ============================================

class FastApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${this.baseUrl}/`);
    return response.json();
  }

  async procesarDocumento(file: File): Promise<DocumentoProcesadoFastAPI> {
    const formData = new FormData();
    formData.append('archivo', file);

    const response = await fetch(`${this.baseUrl}/analizar`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw {
        message: error.detail || `Error ${response.status}: ${response.statusText}`,
        status: response.status,
      } as ApiError;
    }

    return response.json();
  }

  async procesarTexto(texto: string, canalOrigen?: string): Promise<DocumentoProcesadoFastAPI> {
    const response = await fetch(`${this.baseUrl}/analizar-texto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texto,
        documento_texto: texto,
        tipo_archivo: 'TEXTO',
        canal_origen: canalOrigen,
      }),
    }).catch(() => {
      throw { message: 'No se pudo conectar con el motor de IA (FastAPI).', status: 0 } as ApiError;
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 405) {
        throw {
          message: 'El motor de IA todavía no tiene el endpoint /analizar-texto. Usa "Subir archivo" o pide al equipo de backend que lo agregue.',
          status: response.status,
        } as ApiError;
      }
      const error = await response.json().catch(() => ({}));
      throw { message: error.detail || `Error al procesar el texto (${response.status})`, status: response.status } as ApiError;
    }

    return response.json();
  }

  async obtenerResultadoPrueba(): Promise<DocumentoProcesadoFastAPI> {
    const response = await fetch(`${this.baseUrl}/resultado-prueba`);
    return response.json();
  }
}

// ============================================
// INSTANCIAS SINGLETON
// ============================================

export const springApi = new ApiClient(SPRING_BOOT_URL);
export const fastApi = new FastApiClient(FASTAPI_URL);

// ============================================
// FUNCIONES DE CONVERSIÓN
// ============================================

/** El backend rellena los datos que faltan con textos como "SIN NOMBRE": aquí se tratan como vacíos. */
export function sinPlaceholder(valor: string | null | undefined): string {
  const v = (valor ?? '').trim();
  return /^SIN (NOMBRE|RUT|MATRICULA|MATRÍCULA|ESPECIALIDAD)$/i.test(v) ? '' : v;
}

export function springToUnificado(doc: DocumentoSpring): DocumentoUnificado {
  const requiereAuditoria = doc.requiereAuditoria ?? false;
  return {
    id: doc.id,
    documentoId: doc.documentoId,
    tipo: doc.tipo,
    especialidad: doc.especialidad,
    prioridad: doc.prioridad,
    scoreConfianza: doc.score,
    paciente: {
      nombre: sinPlaceholder(doc.nombrePaciente),
      rut: sinPlaceholder(doc.rutPaciente),
      edad: doc.edadPaciente ?? null,
    },
    medico: {
      nombre: sinPlaceholder(doc.nombreMedico),
      matricula: sinPlaceholder(doc.matricula),
    },
    estudioRealizado: doc.estudioRealizado ?? null,
    diagnosticoPrincipal: doc.diagnosticoPrincipal ?? null,
    cie10Sugerido: doc.cie10Sugerido ?? null,
    destino: doc.destino ?? '',
    requiereAuditoria,
    justificacion: doc.justificacion ?? '',
    almacenamiento: {
      bucket: '',
      ruta: '',
      status: '',
    },
    contenido: doc.contenido,
    fecha: doc.fechaRegistro,
    status: doc.status ?? (requiereAuditoria ? 'en_revision' : 'procesado'),
    medicamentos: doc.medicamentos ?? [],
    notificacion: doc.notificacion ?? null,
    revision: doc.revision ?? null,
    origen: 'spring',
  };
}

export function fastapiToUnificado(doc: DocumentoProcesadoFastAPI): DocumentoUnificado {
  return {
    id: doc.documento_id,
    documentoId: doc.documento_id,
    tipo: doc.clasificacion.tipo_documento,
    especialidad: doc.clasificacion.especialidad,
    prioridad: doc.clasificacion.nivel_prioridad,
    scoreConfianza: doc.clasificacion.score_confianza_clasificacion,
    paciente: {
      nombre: sinPlaceholder(doc.datos_extraidos.paciente.nombre),
      rut: sinPlaceholder(doc.datos_extraidos.paciente.rut),
      edad: doc.datos_extraidos.paciente.edad,
    },
    medico: {
      nombre: sinPlaceholder(doc.datos_extraidos.medico_solicitante.nombre),
      matricula: sinPlaceholder(doc.datos_extraidos.medico_solicitante.matricula),
    },
    estudioRealizado: doc.datos_extraidos.estudio_realizado,
    diagnosticoPrincipal: doc.datos_extraidos.diagnostico_principal,
    cie10Sugerido: doc.datos_extraidos.cie10_sugerido,
    destino: doc.decision_enrutamiento?.destino_principal ?? '',
    requiereAuditoria: doc.decision_enrutamiento?.requiere_auditoria_humana ?? doc.status === 'en_revision',
    justificacion: doc.decision_enrutamiento?.justificacion_enrutamiento ?? '',
    almacenamiento: {
      bucket: doc.almacenamiento_oci?.bucket ?? '',
      ruta: doc.almacenamiento_oci?.ruta_objeto ?? '',
      status: doc.almacenamiento_oci?.status_backup ?? '',
    },
    contenido: doc.contenido || '',
    fecha: doc.fecha || new Date().toISOString(),
    status: doc.status,
    medicamentos: doc.datos_extraidos.medicamentos ?? [],
    notificacion: doc.decision_enrutamiento?.notificacion_generada ?? null,
    revision: null,
    origen: 'fastapi',
  };
}

// ============================================
// FUNCIONES DE COMPATIBILIDAD (API Legacy - FastAPI directo)
// ============================================

// Estos mantienen la compatibilidad con código existente que usa la API directa de FastAPI

export async function procesarDocumento(file: File): Promise<DocumentoProcesadoFastAPI> {
  const formData = new FormData();
  formData.append("documento", file);

  const response = await fetch(`${FASTAPI_URL}/api/v1/documentos/procesar`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Error al procesar el documento: ${response.status}`);
  }

  return response.json();
}

export async function obtenerDocumento(id: string): Promise<DocumentoProcesadoFastAPI> {
  const response = await fetch(`${FASTAPI_URL}/api/v1/documentos/${id}`);
  if (!response.ok) {
    throw new Error(`Documento no encontrado: ${id}`);
  }
  return response.json();
}

export async function listarDocumentos(): Promise<DocumentoProcesadoFastAPI[]> {
  const response = await fetch(`${FASTAPI_URL}/api/v1/documentos`);
  if (!response.ok) {
    throw new Error("No se pudo obtener el listado de documentos");
  }
  return response.json();
}

// ============================================
// FLUJO UNIFICADO (usado por las pantallas)
// ============================================

/** 'spring' = persiste el documento (requiere sesión). 'fastapi' = análisis directo, sin persistencia. */
export type ModoProcesamiento = 'spring' | 'fastapi';

export function mensajeError(e: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (e instanceof Error && e.message) return e.message;
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return fallback;
}

export async function procesarArchivo(file: File, modo: ModoProcesamiento): Promise<DocumentoUnificado> {
  if (modo === 'fastapi') {
    return fastapiToUnificado(await fastApi.procesarDocumento(file));
  }
  return springToUnificado(await springApi.analyzeFile(file));
}

export async function procesarTexto(texto: string, modo: ModoProcesamiento, canalOrigen?: string): Promise<DocumentoUnificado> {
  if (modo === 'fastapi') {
    return fastapiToUnificado(await fastApi.procesarTexto(texto, canalOrigen));
  }
  return springToUnificado(await springApi.analyzeText(texto));
}

/**
 * Busca un documento por su documentoId (o por id numérico).
 * 1) Spring (tiene el estado de revisión). 2) FastAPI como respaldo.
 */
export async function obtenerDocumentoUnificado(id: string): Promise<DocumentoUnificado> {
  try {
    const page = await springApi.getDocumentos(0, 500);
    const found = page.content.find((d) => d.documentoId === id || String(d.id) === id);
    if (found) return springToUnificado(found);
  } catch {
    // Si Spring no responde se intenta con FastAPI.
  }
  return fastapiToUnificado(await obtenerDocumento(id));
}

async function responde(url: string): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 4000);
  try {
    if (url.startsWith('/')) {
      // Mismo origen (proxy de Vite): si el servidor de destino está caído, Vite responde 5xx.
      const r = await fetch(url, { signal: ctrl.signal });
      return r.status < 500;
    }
    // no-cors: resuelve si el servidor responde (aunque sea 401/404), falla si no está accesible.
    await fetch(url, { mode: 'no-cors', signal: ctrl.signal });
    return true;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function verificarServicios(): Promise<{ spring: boolean; fastapi: boolean }> {
  const [spring, fastapi] = await Promise.all([responde(SPRING_BOOT_URL), responde(FASTAPI_URL)]);
  return { spring, fastapi };
}

export const SERVICE_URLS = { spring: SPRING_BOOT_URL, fastapi: FASTAPI_URL } as const;

// ============================================
// HOOKS DE AUTENTICACIÓN
// ============================================

interface AuthContextType {
  user: Usuario | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (springApi.isAuthenticated()) {
        try {
          const userData = await springApi.getCurrentUser();
          setUser(userData);
        } catch {
          springApi.logout();
        }
      }
      setLoading(false);
    };
    initAuth();

    const onUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = async (credentials: LoginRequest) => {
    const response = await springApi.login(credentials);
    setUser(response.usuario);
  };

  const register = async (data: RegisterRequest) => {
    const response = await springApi.register(data);
    setUser(response.usuario);
  };

  const logout = () => {
    springApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}