"""Modelos Pydantic de la API: validan la entrada, la salida y generan la documentación OpenAPI."""
from typing import Any, Literal

from pydantic import BaseModel, Field


class ConfigEntrada(BaseModel):
    """Reglas que el gestor configura desde la interfaz (todas opcionales)."""

    umbral: float | None = Field(default=None, ge=0, le=1, description="Confianza mínima para no pasar por revisión humana")
    terminos_urgencia: list[str] | None = Field(default=None, description="Palabras que marcan un caso como urgente")
    destinos: dict[str, str] | None = Field(default=None, description="Destino por tipo de documento")


class SolicitudTexto(BaseModel):
    """Entrada en texto, con el formato del ejemplo del brief."""

    documento_id: str | None = Field(default=None, max_length=120, examples=["DOC-CLIN-2026-8942"])
    tipo_archivo: str | None = Field(default="TEXTO", max_length=20)
    documento_texto: str = Field(min_length=10, max_length=50_000)
    canal_origen: str | None = Field(default=None, max_length=80, examples=["Guardia_Emergencias"])
    config: ConfigEntrada | None = None


class SolicitudRevision(BaseModel):
    documento_id: str
    ruta_objeto: str = Field(description="Ruta del JSON en OCI (estructurados/AAAA/MM/DD/<doc_id>.json)")
    decision: Literal["aprobado", "corregido", "rechazado"]
    revisor: str | None = None
    comentario: str | None = None
    datos_corregidos: dict[str, Any] | None = None


class Paciente(BaseModel):
    nombre: str | None = None
    rut: str | None = None
    edad: int | None = None


class MedicoSolicitante(BaseModel):
    nombre: str | None = None
    matricula: str | None = None


class Medicamento(BaseModel):
    nombre: str
    dosis: str | None = None
    frecuencia: str | None = None
    via: str | None = None
    duracion: str | None = None


class Clasificacion(BaseModel):
    tipo_documento: str
    especialidad: str | None = None
    nivel_prioridad: Literal["Urgente", "Rutina"]
    score_confianza_clasificacion: float = Field(ge=0, le=1)
    confianza_ia: float | None = None
    requiere_auditoria_humana: bool = False
    cola_enrutamiento: str | None = None


class DatosExtraidos(BaseModel):
    paciente: Paciente
    medico_solicitante: MedicoSolicitante
    estudio_realizado: str | None = None
    diagnostico_principal: str | None = None
    cie10_sugerido: str | None = None
    medicamentos: list[Medicamento] = []


class Notificacion(BaseModel):
    canal: str
    mensaje: str


class DecisionEnrutamiento(BaseModel):
    destino_principal: str | None = None
    requiere_auditoria_humana: bool
    justificacion_enrutamiento: str | None = None
    notificacion_generada: Notificacion | None = None


class Validacion(BaseModel):
    campos_faltantes: list[str] = []
    inconsistencias: list[str] = []
    ambiguedades: list[str] = []
    medicamentos_alto_riesgo: list[str] = []
    motivos_urgencia: list[str] = []
    detalle_confianza: dict[str, Any] = {}
    umbral: float


class AlmacenamientoOCI(BaseModel):
    bucket: str | None = None
    ruta_objeto: str | None = None
    ruta_original: str | None = None
    status_backup: str


class PasoTraza(BaseModel):
    nodo: str
    titulo: str
    resultado: str
    detalle: dict[str, Any] = {}
    duracion_ms: float


class ResultadoTriaje(BaseModel):
    status: Literal["procesado", "pendiente_revision_humana"]
    documento_id: str
    fecha: str
    canal_origen: str | None = None
    nombre_archivo: str | None = None
    contenido: str | None = None
    clasificacion: Clasificacion
    datos_extraidos: DatosExtraidos
    decision_enrutamiento: DecisionEnrutamiento
    validacion: Validacion
    almacenamiento_oci: AlmacenamientoOCI
    traza: list[PasoTraza]
