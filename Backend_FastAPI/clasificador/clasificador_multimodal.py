"""
Cliente de Gemini: lee el documento (archivo o texto) y devuelve los datos en JSON.

Solo extrae y describe. Las decisiones (confianza final, urgencia y destino) las toma
el grafo del agente con reglas explícitas, no el modelo.
"""
import json
import logging
import os
import time

from google import genai
from google.genai import types

from agente.reglas import CATEGORIAS

logger = logging.getLogger("mediflow.ia")

MODELO = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")
# Ante saturación de Gemini (503/429) se reintenta con esperas crecientes: ~50 s en total.
ESPERAS_REINTENTO = (5, 15, 30)
MAX_INTENTOS = len(ESPERAS_REINTENTO) + 1

PROMPT = f"""
Actúas como el motor de extracción de documentos clínicos de MediFlow.
Analiza el documento completo y responde SOLO con un JSON válido.

1. Clasifícalo en UNA de estas categorías exactas: {", ".join(CATEGORIAS)}.
   Los informes de laboratorio van en "Informe de Estudio por Imágenes".
2. Extrae paciente, médico solicitante (nombre y matrícula), especialidad,
   estudio realizado o solicitado, diagnóstico principal y CIE-10 sugerido.
3. Si hay medicamentos, extrae cada uno con dosis, frecuencia, vía y duración.
4. Indica la prioridad clínica: "Urgente" o "Rutina".
5. En "hallazgos_criticos" lista hallazgos graves que requieran atención inmediata
   (por ejemplo: TEP agudo, infarto, ACV, sepsis). Lista vacía si no hay.
6. En "ambiguedades" lista lo que impide un procesamiento confiable: texto ilegible,
   datos que se contradicen, campos esenciales ausentes. Lista vacía si no hay.
7. "score_confianza" (0 a 1) es tu confianza en la clasificación y la extracción.
8. "contenido" es el texto que puedas leer del documento, sin inventar nada.

Reglas: no inventes datos; si algo no aparece, usa null. La edad es un entero sin unidades.

Estructura exacta:
{{
  "tipo_documento": "Receta",
  "especialidad": null,
  "prioridad": "Rutina",
  "score_confianza": 0.0,
  "contenido": null,
  "paciente": {{"nombre": null, "rut": null, "edad": null}},
  "medico": {{"nombre": null, "matricula": null, "especialidad": null}},
  "estudio_realizado": null,
  "diagnostico_principal": null,
  "cie10_sugerido": null,
  "medicamentos": [{{"nombre": "", "dosis": null, "frecuencia": null, "via": null, "duracion": null}}],
  "hallazgos_criticos": [],
  "ambiguedades": [],
  "justificacion": "por qué clasificaste así, en una oración"
}}
"""


def _cliente():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("Falta configurar la variable de entorno GEMINI_API_KEY.")
    return genai.Client(api_key=api_key)


def _es_transitorio(error: Exception) -> bool:
    texto = str(error)
    return any(marca in texto for marca in ("503", "429", "UNAVAILABLE", "RESOURCE_EXHAUSTED", "overloaded"))


def _generar(cliente, contenido) -> dict | None:
    """Llama al modelo con reintentos ante saturación (503/429). No registra datos clínicos."""
    for intento in range(1, MAX_INTENTOS + 1):
        try:
            respuesta = cliente.models.generate_content(
                model=MODELO,
                contents=contenido,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                    # No se usan herramientas: se desactiva la llamada automática de funciones.
                    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                ),
            )
            datos = json.loads(respuesta.text)
            if isinstance(datos, list) and datos:
                datos = datos[0]
            return datos if isinstance(datos, dict) else None
        except Exception as error:  # noqa: BLE001 - se informa el tipo, nunca el contenido
            if _es_transitorio(error) and intento < MAX_INTENTOS:
                espera = ESPERAS_REINTENTO[intento - 1]
                logger.warning("Gemini saturado (intento %d/%d); reintento en %ds", intento, MAX_INTENTOS, espera)
                time.sleep(espera)
                continue
            logger.error("Fallo de Gemini (%s) en el intento %d", type(error).__name__, intento)
            return None
    return None


def analizar_archivo(ruta_archivo: str) -> dict | None:
    """Sube el archivo a Gemini, lo analiza y lo borra de Gemini al terminar."""
    try:
        cliente = _cliente()
        archivo = cliente.files.upload(file=ruta_archivo)
    except Exception as error:  # noqa: BLE001
        logger.error("No se pudo preparar el documento para Gemini (%s)", type(error).__name__)
        return None
    try:
        return _generar(cliente, [archivo, PROMPT])
    finally:
        try:
            cliente.files.delete(name=archivo.name)
        except Exception:  # noqa: BLE001 - Gemini lo borra solo a las 48 h
            pass


def analizar_texto(texto: str) -> dict | None:
    """Analiza texto plano sin subir archivos."""
    try:
        cliente = _cliente()
    except Exception as error:  # noqa: BLE001
        logger.error("No se pudo crear el cliente de Gemini (%s)", type(error).__name__)
        return None
    return _generar(cliente, [PROMPT, "DOCUMENTO:\n" + texto])


# Compatibilidad con el nombre anterior.
clasificar_documento = analizar_archivo
