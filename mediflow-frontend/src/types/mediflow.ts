export type NivelPrioridad = "Rutina" | "Urgente";

export interface Paciente {
  nombre: string;
  rut?: string;
  edad?: number;
}

export interface MedicoSolicitante {
  nombre: string;
  matricula?: string;
}

export interface Clasificacion {
  tipo_documento: string;
  especialidad: string;
  nivel_prioridad: NivelPrioridad;
  score_confianza_clasificacion: number;
}

export interface DatosExtraidos {
  paciente: Paciente;
  medico_solicitante: MedicoSolicitante;
  estudio_realizado: string;
  diagnostico_principal: string;
  cie10_sugerido: string;
}

export interface DecisionEnrutamiento {
  destino_principal: string;
  requiere_auditoria_humana: boolean;
  justificacion_enrutamiento: string;
}

export interface AlmacenamientoOCI {
  bucket: string;
  ruta_objeto: string;
  status_backup: string;
}

export interface DocumentoProcesado {
  status: "procesado" | "en_revision" | "error";
  documento_id: string;
  clasificacion: Clasificacion;
  datos_extraidos: DatosExtraidos;
  decision_enrutamiento: DecisionEnrutamiento;
  almacenamiento_oci: AlmacenamientoOCI;
  fecha?: string;
}

export interface DocumentoEnCola {
  id: string;
  tipo: string;
  especialidad: string;
  prioridad: NivelPrioridad;
  destino: string;
  tiempoEnCola: string;
}
