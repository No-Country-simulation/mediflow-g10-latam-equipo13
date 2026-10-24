"""
Reglas clínicas del agente: validación, confianza, urgencia y enrutamiento.

Todo es código determinista y sin dependencias externas, para que las decisiones
sean explicables y se puedan probar sin llamar a la IA. La IA extrae los datos;
estas reglas deciden qué hacer con ellos.
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field

# --------------------------------------------------------------------------
# Catálogos
# --------------------------------------------------------------------------

CATEGORIAS = (
    "Receta",
    "Informe de Estudio por Imágenes",  # incluye informes de laboratorio
    "Orden de Procedimiento",
    "Epicrisis",
    "Certificado Médico",
)

DESTINO_URGENCIA = "Cola_Emergencia_Medica"
DESTINO_REVISION = "Cola_Revision_Humana"

DESTINOS_POR_TIPO = {
    "Receta": "Farmacia_Hospitalaria",
    "Informe de Estudio por Imágenes": "Historia_Clinica_Electronica",
    "Orden de Procedimiento": "Auditoria_Autorizaciones",
    "Epicrisis": "Historia_Clinica_Electronica",
    "Certificado Médico": "Historia_Clinica_Electronica",
}

UMBRAL_CONFIANZA = 0.60

# Hallazgos o pedidos que exigen atención inmediata.
TERMINOS_URGENCIA = (
    "tromboembolismo", "embolia pulmonar", "tep", "infarto", "iam", "sindrome coronario",
    "acv", "accidente cerebrovascular", "ictus", "sepsis", "shock", "hemorragia",
    "paro cardiorrespiratorio", "neumotorax", "diseccion aortica", "abdomen agudo",
    "crisis hipertensiva", "anafilaxia", "status epileptico", "urgente", "emergencia", "stat",
)

# Canales de ingreso que por sí mismos indican urgencia.
CANALES_URGENTES = ("guardia", "emergencia", "urgencia")

# Medicamentos de alto riesgo (ISMP): una receta con ellos pasa por un humano.
MEDICAMENTOS_ALTO_RIESGO = (
    "insulina", "heparina", "enoxaparina", "warfarina", "acenocumarol", "morfina", "fentanilo",
    "metadona", "oxicodona", "metotrexato", "cloruro de potasio", "digoxina", "amiodarona",
    "vincristina", "ciclofosfamida", "propofol", "midazolam",
)

PLACEHOLDERS = re.compile(r"^(sin (nombre|rut|matricula|especialidad|definir|prioridad|clasificar)|n/?a|null|none|-+)$")
PATRON_CIE10 = re.compile(r"^[A-Z][0-9]{2}(\.[0-9A-Z]{1,4})?$")

# Penalizaciones sobre la confianza que reporta la IA.
PENALIZACION_FALTANTE = 0.08
PENALIZACION_INCONSISTENCIA = 0.06
PENALIZACION_AMBIGUEDAD = 0.10


@dataclass
class ConfigTriaje:
    """Parámetros que el gestor puede cambiar desde la pantalla de Configuración."""

    umbral: float = UMBRAL_CONFIANZA
    terminos_urgencia: tuple[str, ...] = TERMINOS_URGENCIA
    destinos: dict[str, str] = field(default_factory=lambda: dict(DESTINOS_POR_TIPO))

    @classmethod
    def desde_dict(cls, datos: dict | None) -> "ConfigTriaje":
        datos = datos or {}
        umbral = datos.get("umbral", UMBRAL_CONFIANZA)
        try:
            umbral = min(max(float(umbral), 0.0), 1.0)
        except (TypeError, ValueError):
            umbral = UMBRAL_CONFIANZA
        terminos = [str(t).strip() for t in (datos.get("terminos_urgencia") or []) if str(t).strip()]
        destinos = dict(DESTINOS_POR_TIPO)
        for tipo, destino in (datos.get("destinos") or {}).items():
            if tipo in destinos and str(destino).strip():
                destinos[tipo] = str(destino).strip()
        return cls(umbral=umbral, terminos_urgencia=tuple(terminos) or TERMINOS_URGENCIA, destinos=destinos)


# --------------------------------------------------------------------------
# Utilidades de texto
# --------------------------------------------------------------------------

def sin_tildes(texto: str) -> str:
    normalizado = unicodedata.normalize("NFD", texto or "")
    return "".join(c for c in normalizado if unicodedata.category(c) != "Mn").lower()


def limpiar(valor) -> str | None:
    """Convierte placeholders de la IA ("SIN NOMBRE", "N/A"...) y vacíos en None."""
    if valor is None:
        return None
    texto = str(valor).strip()
    if not texto or PLACEHOLDERS.match(sin_tildes(texto)):
        return None
    return texto


def contiene_termino(texto: str, termino: str) -> bool:
    """Busca el término como palabra completa, sin importar tildes ni mayúsculas."""
    return re.search(rf"(?<![a-z0-9]){re.escape(sin_tildes(termino))}(?![a-z0-9])", sin_tildes(texto)) is not None


def normalizar_tipo(tipo: str | None) -> str | None:
    """Lleva el tipo que devuelve la IA a una de las 5 categorías oficiales."""
    t = sin_tildes(tipo or "")
    if not t:
        return None
    if "receta" in t or "prescrip" in t:
        return "Receta"
    if "epicrisis" in t or contiene_termino(t, "informe de alta") or contiene_termino(t, "alta medica"):
        return "Epicrisis"
    if "certificado" in t:
        return "Certificado Médico"
    if "orden" in t or "solicitud" in t or "procedimiento" in t:
        return "Orden de Procedimiento"
    if "informe" in t or "estudio" in t or "imagen" in t or "laboratorio" in t or "examen" in t:
        return "Informe de Estudio por Imágenes"
    return None


def normalizar_cie10(codigo: str | None) -> str | None:
    texto = limpiar(codigo)
    if not texto:
        return None
    return texto.upper().replace(" ", "")


def edad_valida(edad) -> int | None:
    if edad is None or isinstance(edad, bool):
        return None
    if isinstance(edad, str):
        coincidencia = re.search(r"\d{1,3}", edad)
        if not coincidencia:
            return None
        edad = coincidencia.group(0)
    try:
        valor = int(float(edad))
    except (TypeError, ValueError):
        return None
    return valor


# --------------------------------------------------------------------------
# Validación clínica
# --------------------------------------------------------------------------

def validar(datos: dict) -> tuple[list[str], list[str]]:
    """
    Devuelve (campos_faltantes, inconsistencias) del documento ya normalizado.
    Los campos exigidos dependen del tipo de documento.
    """
    faltantes: list[str] = []
    inconsistencias: list[str] = []
    tipo = datos.get("tipo_documento")
    paciente = datos.get("paciente") or {}
    medico = datos.get("medico") or {}
    medicamentos = datos.get("medicamentos") or []

    if not tipo:
        inconsistencias.append("El tipo de documento no corresponde a ninguna categoría conocida")
    if not paciente.get("nombre"):
        faltantes.append("Nombre del paciente")
    if not medico.get("nombre"):
        faltantes.append("Médico solicitante")

    if tipo == "Receta":
        if not medicamentos:
            faltantes.append("Medicamentos de la receta")
        if not medico.get("matricula"):
            faltantes.append("Matrícula del médico")
        for med in medicamentos:
            if not med.get("dosis"):
                inconsistencias.append(f"El medicamento '{med.get('nombre')}' no indica dosis")
    elif tipo == "Orden de Procedimiento" and not datos.get("estudio_realizado"):
        faltantes.append("Estudio o procedimiento solicitado")
    elif tipo == "Informe de Estudio por Imágenes" and not (datos.get("estudio_realizado") or datos.get("diagnostico_principal")):
        faltantes.append("Estudio realizado o conclusión")

    edad = paciente.get("edad")
    if edad is not None and not 0 <= edad <= 120:
        inconsistencias.append(f"Edad fuera de rango ({edad})")
        paciente["edad"] = None
    cie10 = datos.get("cie10_sugerido")
    if cie10 and not PATRON_CIE10.match(cie10):
        inconsistencias.append(f"Código CIE-10 con formato inválido ({cie10})")
    if not datos.get("contenido"):
        inconsistencias.append("No se pudo leer texto del documento")
    return faltantes, inconsistencias


def medicamentos_de_alto_riesgo(medicamentos: list[dict]) -> list[str]:
    encontrados = []
    for med in medicamentos or []:
        nombre = med.get("nombre") or ""
        if any(contiene_termino(nombre, riesgo) for riesgo in MEDICAMENTOS_ALTO_RIESGO):
            encontrados.append(nombre)
    return encontrados


# --------------------------------------------------------------------------
# Confianza y urgencia
# --------------------------------------------------------------------------

def calcular_confianza(score_ia: float | None, faltantes: list, inconsistencias: list, ambiguedades: list) -> tuple[float, dict]:
    """
    Confianza final = confianza que reporta la IA menos penalizaciones por datos
    faltantes, inconsistencias y ambigüedades detectadas. Devuelve el detalle.
    """
    try:
        base = min(max(float(score_ia), 0.0), 1.0)
    except (TypeError, ValueError):
        base = 0.0
    penalizacion = (
        PENALIZACION_FALTANTE * len(faltantes)
        + PENALIZACION_INCONSISTENCIA * len(inconsistencias)
        + PENALIZACION_AMBIGUEDAD * len(ambiguedades)
    )
    final = round(min(max(base - penalizacion, 0.0), 1.0), 4)
    return final, {
        "confianza_ia": round(base, 4),
        "penalizacion": round(penalizacion, 4),
        "faltantes": len(faltantes),
        "inconsistencias": len(inconsistencias),
        "ambiguedades": len(ambiguedades),
    }


def detectar_urgencia(datos: dict, canal_origen: str | None, terminos: tuple[str, ...]) -> tuple[bool, list[str]]:
    """Urgente si la IA lo marca, si hay hallazgos críticos o términos de urgencia, o si llega por guardia."""
    motivos: list[str] = []
    if sin_tildes(datos.get("prioridad") or "").startswith("urgent"):
        motivos.append("La IA clasificó la prioridad como Urgente")
    for hallazgo in datos.get("hallazgos_criticos") or []:
        motivos.append(f"Hallazgo crítico: {hallazgo}")
    texto = " ".join(
        str(datos.get(campo) or "") for campo in ("contenido", "diagnostico_principal", "estudio_realizado")
    )
    encontrados = sorted({t for t in terminos if contiene_termino(texto, t)})
    if encontrados:
        motivos.append("Términos de urgencia en el documento: " + ", ".join(encontrados))
    canal = sin_tildes(canal_origen or "")
    if any(c in canal for c in CANALES_URGENTES):
        motivos.append(f"Ingresó por un canal de urgencia ({canal_origen})")
    return bool(motivos), motivos


def decidir_ruta(confianza: float, umbral: float, ambiguedades: list, alto_riesgo: list, es_urgente: bool) -> str:
    """
    Nodo condicional del grafo:
      - confianza baja, ambigüedad o medicamento de alto riesgo -> revisión humana
      - urgente -> cola de emergencias
      - el resto -> destino estándar según el tipo de documento
    La revisión humana tiene prioridad: un caso urgente pero dudoso lo ve un humano (y se alerta igual).
    """
    if confianza < umbral or ambiguedades or alto_riesgo:
        return "revision_humana"
    if es_urgente:
        return "urgencia"
    return "estandar"
