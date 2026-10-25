/**
 * MediFlow API Layer
 * Conecta con Spring Boot (auth, persistencia) y FastAPI (procesamiento IA)
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ============================================
// CONFIGURACIÓN
// ============================================

export const UNAUTHORIZED_EVENT = 'mediflow:unauthorized';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const ROLES_VALIDOS: Usuario['rol'][] = ['ADMIN', 'AUDITOR', 'PERSONAL', 'NO_ASIGNADO'];

/** Lee los datos (claims) de un JWT. No verifica la firma: eso lo hace el servidor. */
export function decodificarJwt(token: string): Record<string, unknown> | null {
  try {
    const parte = token.split('.')[1];
    if (!parte) return null;
    const b64 = parte.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(parte.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function rolDesde(valor: unknown): Usuario['rol'] | null {
  const lista = Array.isArray(valor) ? valor : [valor];
  for (const v of lista) {
    const crudo = typeof v === 'object' && v !== null ? (v as { authority?: unknown }).authority : v;
    const texto = String(crudo ?? '').replace(/^ROLE_/i, '').toUpperCase();
    if (ROLES_VALIDOS.includes(texto as Usuario['rol'])) return texto as Usuario['rol'];
  }
  return null;
}

/** Convierte un usuario del backend (campo `name` o `nombre`, `rol`...) al formato del frontend. */
export function normalizarUsuario(u: Record<string, unknown>): Usuario {
  const texto = (v: unknown) => (typeof v === 'string' ? v : undefined);
  return {
    id: Number(u.id ?? 0) || 0,
    nombre: String(u.nombre ?? u.name ?? ''),
    email: texto(u.email),
    rol: rolDesde(u.rol ?? u.role) ?? 'NO_ASIGNADO',
    activo: u.activo !== false && u.active !== false,
    fechaCreacion: texto(u.fechaCreacion),
    fechaRegistro: texto(u.fechaRegistro) ?? texto(u.fecha_registro),
  };
}

/**
 * Convierte la respuesta del login a { token, usuario }. Acepta varias formas (usuario/user, accessToken...)
 * y, si la respuesta no trae el usuario, lo arma con los datos del propio JWT.
 */
export function normalizarSesion(data: Record<string, unknown>): { token: string; usuario: Usuario } {
  const token = String(data.token ?? data.accessToken ?? data.access_token ?? data.jwt ?? '');
  if (!token) throw { message: 'El servidor no devolvió un token de sesión.', status: 0 } as ApiError;

  const claims = decodificarJwt(token) ?? {};
  const u = (data.usuario ?? data.user ?? {}) as Record<string, unknown>;
  const rol =
    rolDesde(u.rol ?? u.role ?? data.rol ?? data.role ?? claims.rol ?? claims.role ?? claims.roles ?? claims.authorities) ??
    'NO_ASIGNADO';
  const nombre = String(u.nombre ?? u.name ?? data.nombre ?? data.name ?? data.username ?? claims.nombre ?? claims.name ?? claims.sub ?? '');

  return {
    token,
    usuario: {
      id: Number(u.id ?? data.id ?? claims.id ?? claims.userId ?? 0) || 0,
      nombre,
      rol,
      activo: u.activo !== false,
    },
  };
}

/**
 * Una respuesta HTML en una ruta relativa nunca viene del backend (Spring y FastAPI responden JSON o vacío):
 * es la página del hosting (p. ej. Vercel) porque ese despliegue no tiene el backend conectado.
 */
const esPaginaDelHosting = (response: Response) => (response.headers.get('content-type') ?? '').includes('text/html');

/**
 * Con un proxy (Vite, nginx o Vercel; URL relativa), si el backend está apagado el proxy responde 500/502/504
 * con el cuerpo vacío, o el hosting devuelve su propia página HTML. Un error real del backend trae cuerpo JSON.
 */
async function backendApagado(response: Response, baseUrl: string): Promise<boolean> {
  if (!baseUrl.startsWith('/')) return false;
  if (esPaginaDelHosting(response)) return true;
  if (![500, 502, 503, 504].includes(response.status)) return false;
  const cuerpo = await response.clone().text().catch(() => '');
  return cuerpo.trim() === '';
}

const MENSAJE_BACKEND_APAGADO = (nombre: string) =>
  `No se pudo conectar con ${nombre}. El servidor está apagado o no está conectado a este despliegue.`;

// Por defecto, rutas relativas: el proxy de Vite (desarrollo), nginx (Docker) o Vercel las reenvía al backend.
const SPRING_BOOT_URL = import.meta.env.VITE_SPRING_BOOT_URL || '/spring';
const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || '/fastapi';

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
  email?: string; // el backend actual no maneja correo
  rol: 'ADMIN' | 'PERSONAL' | 'AUDITOR' | 'NO_ASIGNADO';
  activo: boolean;
  fechaCreacion?: string;
  fechaRegistro?: string; // así se llama en la base de datos
}

export interface AuthResponse {
  token: string;
  tipo: string;
  usuario: Usuario;
}

export interface LoginRequest {
  /** Nombre de usuario con el que se inicia sesión. */
  nombre: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  password: string;
}

/**
 * Documento tal como lo devuelve Spring (`DocumentosResponse`, backend 2.0).
 * Es un record de Java: cualquier campo puede venir en null.
 */
export interface DocumentoSpring {
  id: number;
  status: string | null; // "procesado", "pendiente_revision_humana", "revisado" o "rechazado"
  tipo: string | null;
  contenido: string | null; // texto que la IA leyó del documento
  especialidad: string | null;
  prioridad: string | null; // "Rutina" o "Urgente"
  documentoId: string | null; // UUID del original en OCI
  fechaRegistro: string | null; // UTC con zona (2026-10-24T03:52:23Z)
  fechaActualizacion: string | null;
  score: number | null;
  requiereAuditoria: boolean | null;
  colaEnrutamiento?: string | null;
  destino?: string | null;
  justificacion?: string | null;
  nombreMedico?: string | null;
  matricula?: string | null;
  nombrePaciente?: string | null;
  rutPaciente?: string | null;
  edadPaciente?: number | null;
  estudioRealizado?: string | null;
  diagnosticoPrincipal?: string | null;
  cie10Sugerido?: string | null;
  medicamentos?: Medicamento[] | null;
  notificacion?: NotificacionGenerada | null;
  validacion?: Record<string, unknown> | null;
  traza?: PasoTraza[] | null;
  almacenamiento?: { bucket: string | null; ruta: string | null; rutaOriginal: string | null; status: string | null } | null;
  revision?: RevisionHumana | null;
  canalOrigen?: string | null;
  nombreArchivo?: string | null;
  usuario?: string | null; // quién subió el documento
  /** Backend 1.0.1 (con errata). Se lee solo por compatibilidad. */
  colaEnruatamiento?: string | null;
}

/** Un paso del grafo de decisión del agente (lo que decidió cada nodo y por qué). */
export interface PasoTraza {
  nodo: string;
  titulo: string;
  resultado: string;
  detalle?: Record<string, unknown>;
  duracion_ms?: number;
}

/** Observaciones del agente sobre el documento. */
export interface ValidacionAgente {
  camposFaltantes: string[];
  inconsistencias: string[];
  ambiguedades: string[];
  medicamentosAltoRiesgo: string[];
  motivosUrgencia: string[];
  confianzaIa: number | null;
  umbral: number | null;
}

/** Caso urgente reciente (alertas en tiempo real). */
export interface AlertaUrgente {
  id: number;
  documentoId: string | null;
  tipo: string | null;
  paciente: string | null;
  destino: string | null;
  mensaje: string | null;
  requiereAuditoria: boolean | null;
  fecha: string | null;
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
  nivel_prioridad: string; // "Rutina", "Urgente" o "SIN PRIORIDAD"
  score_confianza_clasificacion: number;
  // FastAPI 1.0.1 manda la decisión de enrutamiento aquí, no en `decision_enrutamiento`.
  requiere_auditoria_humana?: boolean;
  cola_enrutamiento?: string;
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
  status: string; // "procesado" o "pendiente_revision_humana"
  documento_id: string; // UUID del original en OCI
  clasificacion: ClasificacionFastAPI;
  datos_extraidos: DatosExtraidosFastAPI;
  decision_enrutamiento?: DecisionEnrutamientoFastAPI;
  almacenamiento_oci?: AlmacenamientoOCI & { ruta_original?: string | null };
  validacion?: Record<string, unknown>;
  traza?: PasoTraza[];
  canal_origen?: string | null;
  nombre_archivo?: string | null;
  fecha?: string;
  contenido?: string | null;
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

  // Decisión del agente
  traza: PasoTraza[];
  validacion: ValidacionAgente | null;
  canalOrigen: string;
  nombreArchivo: string;
  usuario: string;

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
    this.token = localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  /** Recupera el usuario de una sesión anterior (no hay endpoint "mi perfil"). Devuelve null si venció o no hay. */
  restaurarSesion(): Usuario | null {
    if (!this.token) return null;
    const claims = decodificarJwt(this.token);
    const exp = typeof claims?.exp === 'number' ? claims.exp * 1000 : null;
    if (exp !== null && exp < Date.now()) {
      this.setToken(null);
      return null;
    }
    try {
      const guardado = localStorage.getItem(USER_KEY);
      if (guardado) return JSON.parse(guardado) as Usuario;
    } catch {
      // se ignora: se arma con el JWT
    }
    return normalizarSesion({ token: this.token }).usuario;
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

    if (!response.ok && (await backendApagado(response, this.baseUrl))) {
      throw { message: MENSAJE_BACKEND_APAGADO('el servidor principal (Spring Boot)'), status: 0 } as ApiError;
    }

    if (!response.ok) {
      const error: ApiError = {
        message: `Error ${response.status}: ${response.statusText}`,
        status: response.status,
      };
      try {
        const data = await response.json();
        error.message = data.mensaje || data.message || error.message;
        error.code = data.codigo ?? data.code;
        error.details = data.detalles ?? data.details;
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

    if (!response.ok && (await backendApagado(response, this.baseUrl))) {
      throw { message: MENSAJE_BACKEND_APAGADO('el servidor principal (Spring Boot)'), status: 0 } as ApiError;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw {
        message: data.mensaje || data.message || (response.status >= 500 ? `Error del servidor (${response.status})` : errorPorDefecto),
        status: response.status,
        code: data.codigo ?? data.code,
      } as ApiError;
    }

    const texto = await response.text();
    return (texto ? JSON.parse(texto) : {}) as T;
  }

  /** Usuario de la sesión con su rol vigente (refresca el rol sin volver a iniciar sesión). */
  async me(): Promise<Usuario> {
    const data = await this.request<Record<string, unknown>>('/api/auth/me');
    const usuario = normalizarUsuario(data);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
    return usuario;
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    // Spring espera los campos `name` y `password`.
    const data = await this.postPublico<Record<string, unknown>>(
      '/api/auth/login',
      { name: credentials.nombre, password: credentials.password },
      'Usuario o contraseña incorrectos'
    );
    const { token, usuario } = normalizarSesion(data);
    this.setToken(token);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
    return { token, tipo: String(data.tipo ?? 'Bearer'), usuario };
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    // POST /api/user/register es público y no devuelve sesión: se registra y luego se inicia sesión.
    // El nombre se manda como `nombre` y como `name` hasta confirmar cuál campo lee el registro.
    await this.postPublico<unknown>(
      '/api/user/register',
      { nombre: data.nombre, name: data.nombre, password: data.password },
      'Error al registrar'
    );
    return this.login({ nombre: data.nombre, password: data.password });
  }

  logout() {
    this.setToken(null);
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Documentos
  async getDocumentos(page = 0, size = 20): Promise<PaginatedResponse<DocumentoSpring>> {
    const data = await this.request<PaginatedResponse<DocumentoSpring> | DocumentoSpring[]>(
      `/api/documentos/findall?page=${page}&size=${size}`
    );
    if (Array.isArray(data)) {
      // El backend devuelve la lista completa, sin paginar.
      return { content: data, totalElements: data.length, totalPages: 1, number: 0, size: data.length, first: true, last: true };
    }
    return data;
  }

  async getDocumento(id: number): Promise<DocumentoSpring> {
    return this.request<DocumentoSpring>(`/api/documentos/findbyid/${id}`);
  }

  async analyzeText(texto: string, canalOrigen?: string): Promise<DocumentoSpring> {
    return this.request<DocumentoSpring>('/api/documentos/analyze/text', {
      method: 'POST',
      body: JSON.stringify({ texto, canalOrigen }),
    });
  }

  async analyzeFile(file: File, canalOrigen?: string): Promise<DocumentoSpring> {
    const formData = new FormData();
    formData.append('archivo', file);
    if (canalOrigen) formData.append('canalOrigen', canalOrigen);

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
      throw { message: data.mensaje || data.message || `Error al procesar el archivo (${response.status})`, status: response.status } as ApiError;
    }

    return response.json();
  }

  async revisarDocumento(id: number, payload: RevisionRequest): Promise<DocumentoSpring> {
    try {
      return await this.request<DocumentoSpring>(`/api/documentos/${id}/revision`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } catch (e) {
      const status = (e as ApiError)?.status;
      if (status === 404 || status === 405) {
        throw {
          message: 'El servidor todavía no permite guardar revisiones (falta el endpoint de revisión).',
          status,
        } as ApiError;
      }
      throw e;
    }
  }

  // ---- Usuarios y roles (rutas reales del backend; solo ADMIN) ----
  async listarUsuarios(): Promise<Usuario[]> {
    type Crudo = Record<string, unknown>;
    const data = await this.request<{ content: Crudo[] } | Crudo[]>('/api/user/findAll');
    return (Array.isArray(data) ? data : data.content ?? []).map(normalizarUsuario);
  }

  async cambiarRolUsuario(id: number, rol: Usuario['rol']): Promise<Usuario | undefined> {
    const r = await this.request<Record<string, unknown> | undefined>(`/api/user/${id}/rol/${rol}`, { method: 'PATCH' });
    return r && typeof r === 'object' && Object.keys(r).length ? normalizarUsuario(r) : undefined;
  }

  // ---- Archivo original del documento (contrato propuesto: GET /api/documentos/{id}/archivo) ----
  async obtenerArchivoDocumento(id: number, signal?: AbortSignal): Promise<{ blob: Blob; tipo: string }> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/documentos/${id}/archivo`, {
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : undefined,
        signal,
      });
    } catch (e) {
      if (signal?.aborted) throw e;
      throw { message: 'No se pudo conectar con el servidor para descargar el archivo.', status: 0 } as ApiError;
    }

    if (response.status === 401 && this.token) {
      this.setToken(null);
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    if (!response.ok && (await backendApagado(response, this.baseUrl))) {
      throw { message: MENSAJE_BACKEND_APAGADO('el servidor principal (Spring Boot)'), status: 0 } as ApiError;
    }
    if (response.status === 404 || response.status === 405) {
      throw {
        message: 'El servidor todavía no entrega el archivo original de este documento.',
        status: response.status,
      } as ApiError;
    }
    if (!response.ok) {
      throw { message: `No se pudo descargar el archivo (error ${response.status}).`, status: response.status } as ApiError;
    }

    const blob = await response.blob();
    return { blob, tipo: response.headers.get('Content-Type') ?? blob.type };
  }

  async deleteDocumento(id: number): Promise<void> {
    return this.request<void>(`/api/documentos/${id}`, { method: 'DELETE' });
  }

  /** Casos urgentes desde una fecha (por defecto, las últimas 24 h). */
  async alertas(desde?: string): Promise<AlertaUrgente[]> {
    const query = desde ? `?desde=${encodeURIComponent(desde)}` : '';
    return this.request<AlertaUrgente[]>(`/api/documentos/alertas${query}`);
  }

  // ---- Reglas de triaje (las aplica el agente en cada documento) ----
  async getConfiguracion<T>(): Promise<T> {
    return this.request<T>('/api/configuracion');
  }

  async guardarConfiguracion<T>(config: unknown): Promise<T> {
    return this.request<T>('/api/configuracion', { method: 'PUT', body: JSON.stringify(config) });
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

  /** FastAPI responde `detail` como texto, como objeto { mensaje } o como lista de errores de validación. */
  private async error(response: Response, porDefecto: string): Promise<ApiError> {
    const cuerpo = await response.json().catch(() => ({}));
    const detalle = cuerpo.detail;
    const mensaje =
      typeof detalle === 'string' ? detalle : Array.isArray(detalle) ? detalle[0]?.msg : detalle?.mensaje;
    return { message: mensaje || `${porDefecto} (${response.status})`, status: response.status };
  }

  private async enviar(ruta: string, init: RequestInit): Promise<DocumentoProcesadoFastAPI> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${ruta}`, init);
    } catch {
      throw { message: 'No se pudo conectar con el motor de IA (FastAPI).', status: 0 } as ApiError;
    }
    if (!response.ok && (await backendApagado(response, this.baseUrl))) {
      throw { message: MENSAJE_BACKEND_APAGADO('el motor de IA (FastAPI)'), status: 0 } as ApiError;
    }
    if (!response.ok) throw await this.error(response, 'Error al procesar el documento');
    return response.json();
  }

  async procesarDocumento(file: File, canalOrigen?: string): Promise<DocumentoProcesadoFastAPI> {
    const formData = new FormData();
    formData.append('archivo', file);
    if (canalOrigen) formData.append('canal_origen', canalOrigen);
    return this.enviar('/analizar', { method: 'POST', body: formData });
  }

  /** Mismo formato de entrada que el ejemplo del brief. */
  async procesarTexto(texto: string, canalOrigen?: string): Promise<DocumentoProcesadoFastAPI> {
    return this.enviar('/analizar-texto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documento_texto: texto, tipo_archivo: 'TEXTO', canal_origen: canalOrigen }),
    });
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
  return /^SIN (NOMBRE|RUT|MATRICULA|MATRÍCULA|ESPECIALIDAD|DEFINIR)$/i.test(v) ? '' : v;
}

/** La IA devuelve la prioridad como texto libre ("Urgente", "urgente", "SIN PRIORIDAD"...). */
function normalizarPrioridad(valor: string | null | undefined): DocumentoUnificado['prioridad'] {
  return /urgent/i.test(valor ?? '') ? 'Urgente' : 'Rutina';
}

/** FastAPI marca los dudosos como "pendiente_revision_humana"; en el frontend eso es 'en_revision'. */
function normalizarStatus(valor: string | null | undefined, requiereAuditoria: boolean): DocumentoUnificado['status'] {
  const v = (valor ?? '').toLowerCase();
  if (v === 'error') return 'error';
  if (requiereAuditoria || /revisi/.test(v)) return 'en_revision';
  return 'procesado';
}

/**
 * Spring 2.0 manda las fechas en UTC con zona ("...Z"). La 1.0.1 las mandaba sin zona (también en UTC):
 * sin zona, el navegador las leería como hora local (5 horas corridas en Colombia), así que se leen como UTC.
 */
function fechaDelServidor(valor: string | null | undefined): string {
  const texto = (valor ?? '').trim();
  if (!texto) return '';
  const fecha = new Date(/(Z|[+-]\d{2}:?\d{2})$/i.test(texto) ? texto : `${texto}Z`);
  return Number.isNaN(fecha.getTime()) ? texto : fecha.toISOString();
}

/** Lee las observaciones del agente (mismo JSON en FastAPI y en Spring, en snake_case). */
function leerValidacion(v: Record<string, unknown> | null | undefined): ValidacionAgente | null {
  if (!v || typeof v !== 'object') return null;
  const lista = (clave: string) => (Array.isArray(v[clave]) ? (v[clave] as unknown[]).map(String) : []);
  const detalle = (v.detalle_confianza ?? {}) as Record<string, unknown>;
  return {
    camposFaltantes: lista('campos_faltantes'),
    inconsistencias: lista('inconsistencias'),
    ambiguedades: lista('ambiguedades'),
    medicamentosAltoRiesgo: lista('medicamentos_alto_riesgo'),
    motivosUrgencia: lista('motivos_urgencia'),
    confianzaIa: typeof detalle.confianza_ia === 'number' ? detalle.confianza_ia : null,
    umbral: typeof v.umbral === 'number' ? v.umbral : null,
  };
}

export function springToUnificado(doc: DocumentoSpring): DocumentoUnificado {
  const requiereAuditoria = doc.requiereAuditoria ?? false;
  return {
    id: doc.id,
    documentoId: doc.documentoId ?? String(doc.id),
    tipo: doc.tipo ?? 'Sin clasificar',
    especialidad: doc.especialidad ?? '',
    prioridad: normalizarPrioridad(doc.prioridad),
    scoreConfianza: Number(doc.score ?? 0),
    paciente: {
      nombre: sinPlaceholder(doc.nombrePaciente),
      rut: sinPlaceholder(doc.rutPaciente),
      edad: doc.edadPaciente ?? null,
    },
    medico: {
      // El backend 1.0.1 (el de la errata colaEnruatamiento) ponía aquí al usuario que subió el documento.
      nombre: doc.colaEnruatamiento !== undefined ? '' : sinPlaceholder(doc.nombreMedico),
      matricula: sinPlaceholder(doc.matricula),
    },
    estudioRealizado: doc.estudioRealizado ?? null,
    diagnosticoPrincipal: doc.diagnosticoPrincipal ?? null,
    cie10Sugerido: doc.cie10Sugerido ?? null,
    destino: sinPlaceholder(doc.destino ?? doc.colaEnrutamiento ?? doc.colaEnruatamiento),
    requiereAuditoria,
    justificacion: doc.justificacion ?? '',
    almacenamiento: {
      bucket: doc.almacenamiento?.bucket ?? '',
      ruta: doc.almacenamiento?.ruta ?? '',
      status: doc.almacenamiento?.status ?? '',
    },
    contenido: doc.contenido ?? '',
    fecha: fechaDelServidor(doc.fechaRegistro ?? doc.fechaActualizacion),
    status: normalizarStatus(doc.status, requiereAuditoria),
    medicamentos: doc.medicamentos ?? [],
    notificacion: doc.notificacion ?? null,
    revision: doc.revision ?? null,
    traza: doc.traza ?? [],
    validacion: leerValidacion(doc.validacion),
    canalOrigen: doc.canalOrigen ?? '',
    nombreArchivo: doc.nombreArchivo ?? '',
    usuario: doc.usuario ?? '',
    origen: 'spring',
  };
}

export function fastapiToUnificado(doc: DocumentoProcesadoFastAPI): DocumentoUnificado {
  const requiereAuditoria =
    doc.decision_enrutamiento?.requiere_auditoria_humana ?? doc.clasificacion.requiere_auditoria_humana ?? false;
  return {
    id: doc.documento_id,
    documentoId: doc.documento_id,
    tipo: doc.clasificacion.tipo_documento,
    especialidad: doc.clasificacion.especialidad ?? '',
    prioridad: normalizarPrioridad(doc.clasificacion.nivel_prioridad),
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
    destino: sinPlaceholder(doc.decision_enrutamiento?.destino_principal ?? doc.clasificacion.cola_enrutamiento),
    requiereAuditoria,
    justificacion: doc.decision_enrutamiento?.justificacion_enrutamiento ?? '',
    almacenamiento: {
      bucket: doc.almacenamiento_oci?.bucket ?? '',
      ruta: doc.almacenamiento_oci?.ruta_objeto ?? '',
      status: doc.almacenamiento_oci?.status_backup ?? '',
    },
    contenido: doc.contenido || '',
    fecha: doc.fecha || new Date().toISOString(),
    status: normalizarStatus(doc.status, requiereAuditoria),
    medicamentos: doc.datos_extraidos.medicamentos ?? [],
    notificacion: doc.decision_enrutamiento?.notificacion_generada ?? null,
    revision: null,
    traza: doc.traza ?? [],
    validacion: leerValidacion(doc.validacion),
    canalOrigen: doc.canal_origen ?? '',
    nombreArchivo: doc.nombre_archivo ?? '',
    usuario: '',
    origen: 'fastapi',
  };
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

export async function procesarArchivo(file: File, modo: ModoProcesamiento, canalOrigen?: string): Promise<DocumentoUnificado> {
  if (modo === 'fastapi') {
    return fastapiToUnificado(await fastApi.procesarDocumento(file, canalOrigen));
  }
  return springToUnificado(await springApi.analyzeFile(file, canalOrigen));
}

export async function procesarTexto(texto: string, modo: ModoProcesamiento, canalOrigen?: string): Promise<DocumentoUnificado> {
  if (modo === 'fastapi') {
    return fastapiToUnificado(await fastApi.procesarTexto(texto, canalOrigen));
  }
  return springToUnificado(await springApi.analyzeText(texto, canalOrigen));
}

/** Busca un documento guardado por su id numérico o por su documentoId (UUID de OCI). */
export async function obtenerDocumentoUnificado(id: string): Promise<DocumentoUnificado> {
  if (/^\d+$/.test(id)) {
    return springToUnificado(await springApi.getDocumento(Number(id)));
  }
  const page = await springApi.getDocumentos(0, 500);
  const found = page.content.find((d) => d.documentoId === id);
  if (!found) throw { message: 'No se encontró el documento.', status: 404 } as ApiError;
  return springToUnificado(found);
}

async function responde(url: string): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 4000);
  try {
    if (url.startsWith('/')) {
      // Mismo origen (proxy): si el destino está caído el proxy responde 5xx; si el despliegue no tiene
      // backend conectado, el hosting devuelve su página HTML.
      const r = await fetch(url, { signal: ctrl.signal });
      return r.status < 500 && !esPaginaDelHosting(r);
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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restaurado = springApi.restaurarSesion();
    setUser(restaurado);
    setLoading(false);
    // Refresca el rol en segundo plano: si un administrador lo cambió, se ve sin volver a iniciar sesión.
    if (restaurado) {
      springApi.me().then(setUser).catch(() => undefined);
    }

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