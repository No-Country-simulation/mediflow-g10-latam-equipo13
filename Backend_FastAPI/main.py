"""
API de MediFlow (FastAPI): recibe documentos clínicos, ejecuta el agente de triaje
(grafo LangGraph) y persiste el original y el resultado en OCI Object Storage.
"""
from dotenv import load_dotenv

load_dotenv()

import json  # noqa: E402
import logging  # noqa: E402
import os  # noqa: E402
import re  # noqa: E402
import tempfile  # noqa: E402
import uuid  # noqa: E402
from datetime import datetime, timezone  # noqa: E402

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import Response  # noqa: E402
from starlette.concurrency import run_in_threadpool  # noqa: E402

import notificaciones  # noqa: E402
import oci_storage  # noqa: E402
from agente import reglas  # noqa: E402
from agente.escenarios_demo import ESCENARIOS  # noqa: E402
from agente.grafo import IANoDisponible, construir_grafo, ejecutar_triaje  # noqa: E402
from agente.reglas import ConfigTriaje  # noqa: E402
from clasificador import clasificador_multimodal as ia  # noqa: E402
from modelos import ConfigEntrada, ResultadoTriaje, SolicitudRevision, SolicitudTexto  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger("mediflow.api")

VERSION = "2.0.0"
TAMANO_MAXIMO = 25 * 1024 * 1024
EXTENSIONES_TEXTO = {".txt", ".json", ".md", ".csv"}
EXTENSIONES_PERMITIDAS = EXTENSIONES_TEXTO | {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".tif", ".tiff", ".bmp", ".heic"}

app = FastAPI(
    title="MediFlow API — Agente de triaje clínico",
    version=VERSION,
    description="Clasifica documentos clínicos, extrae sus datos con IA multimodal, evalúa la confianza, "
                "detecta urgencias y los enruta mediante un grafo de decisión (LangGraph), con revisión humana "
                "para los casos dudosos y persistencia en OCI Object Storage.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",") if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------
# Dependencias del grafo: IA, OCI y alertas
# --------------------------------------------------------------------------

def extraer_con_ia(estado) -> dict | None:
    if estado.get("texto"):
        return ia.analizar_texto(estado["texto"])
    return ia.analizar_archivo(estado["ruta_archivo"])


def persistir_en_oci(estado, resultado: dict) -> dict:
    referencia = estado.get("referencia_original")
    if not referencia:
        return {"bucket": None, "ruta_objeto": None, "ruta_original": None,
                "status_backup": "error" if oci_storage.oci_habilitado() else "omitido"}
    try:
        referencia_json = oci_storage.subir_json_estructurado(resultado, referencia)
        destino = "auditoria_humana" if estado.get("requiere_auditoria") else "procesados"
        final = oci_storage.enrutar_json_estructurado(referencia_json, destino)
        return {"bucket": final["bucket"], "ruta_objeto": final["object_name"],
                "ruta_original": referencia["object_name"], "status_backup": "exito"}
    except Exception as error:  # noqa: BLE001 - el triaje vale aunque falle el respaldo
        logger.error("Fallo al persistir en OCI (%s) | doc=%s", type(error).__name__, estado.get("documento_id"))
        return {"bucket": None, "ruta_objeto": None, "ruta_original": referencia.get("object_name"), "status_backup": "error"}


grafo = construir_grafo(extraer_con_ia, persistir_en_oci, notificaciones.enviar_alerta)


def _config(entrada: ConfigEntrada | dict | None) -> ConfigTriaje:
    if isinstance(entrada, ConfigEntrada):
        entrada = entrada.model_dump(exclude_none=True)
    return ConfigTriaje.desde_dict(entrada)


async def _guardar_original(contenido: bytes, nombre: str, tipo: str | None) -> tuple[str, dict | None]:
    """Sube el original a BktRecibidos. Si OCI no está disponible, sigue con un id local."""
    if not oci_storage.oci_habilitado():
        return str(uuid.uuid4()), None
    try:
        referencia = await run_in_threadpool(oci_storage.subir_documento_crudo, contenido, nombre, tipo)
        return referencia["doc_id"], referencia
    except Exception as error:  # noqa: BLE001
        logger.error("No se pudo subir el original a OCI (%s)", type(error).__name__)
        return str(uuid.uuid4()), None


async def _triaje(**kwargs) -> dict:
    try:
        return await run_in_threadpool(lambda: ejecutar_triaje(grafo, **kwargs))
    except IANoDisponible as error:
        raise HTTPException(status_code=503, detail={
            "mensaje": f"{error} Intenta de nuevo en unos segundos.",
            "documento_id": kwargs.get("documento_id"),
            "original_conservado": kwargs.get("referencia_original") is not None,
        }) from error
    except Exception as error:
        logger.exception("Error inesperado en el triaje | doc=%s", kwargs.get("documento_id"))
        raise HTTPException(status_code=502, detail={
            "mensaje": "No se pudo completar el procesamiento.",
            "documento_id": kwargs.get("documento_id"),
        }) from error


# --------------------------------------------------------------------------
# Endpoints
# --------------------------------------------------------------------------

@app.get("/", tags=["Estado"])
def home():
    return {"message": "Mediflow API is running!", "version": VERSION}


@app.get("/salud", tags=["Estado"])
def salud():
    """Qué está configurado (sin exponer secretos)."""
    return {
        "estado": "ok",
        "version": VERSION,
        "modelo_ia": ia.MODELO,
        "modelos_respaldo": ia.modelos()[1:],
        "gemini_configurado": bool(os.getenv("GEMINI_API_KEY")),
        "oci_habilitado": oci_storage.oci_habilitado(),
        "alertas_webhook": bool(os.getenv("ALERTA_WEBHOOK_URL")),
        "umbral_por_defecto": reglas.UMBRAL_CONFIANZA,
    }


@app.get("/grafo", tags=["Agente"])
def ver_grafo():
    """Diagrama del grafo de decisión, generado desde el código (Mermaid)."""
    return {"mermaid": grafo.get_graph().draw_mermaid()}


@app.get("/reglas", tags=["Agente"])
def ver_reglas():
    """Reglas por defecto del agente: categorías, destinos, términos de urgencia y medicamentos de alto riesgo."""
    return {
        "categorias": reglas.CATEGORIAS,
        "umbral": reglas.UMBRAL_CONFIANZA,
        "destinos_por_tipo": reglas.DESTINOS_POR_TIPO,
        "destino_urgencia": reglas.DESTINO_URGENCIA,
        "destino_revision": reglas.DESTINO_REVISION,
        "terminos_urgencia": reglas.TERMINOS_URGENCIA,
        "canales_urgentes": reglas.CANALES_URGENTES,
        "medicamentos_alto_riesgo": reglas.MEDICAMENTOS_ALTO_RIESGO,
    }


@app.post("/analizar", response_model=ResultadoTriaje, tags=["Triaje"])
async def analizar_documento(
    archivo: UploadFile = File(..., description="PDF, imagen o texto"),
    canal_origen: str | None = Form(default=None),
    config: str | None = Form(default=None, description="ConfigEntrada en JSON (opcional)"),
):
    nombre = archivo.filename or "documento"
    extension = os.path.splitext(nombre)[1].lower()
    if extension and extension not in EXTENSIONES_PERMITIDAS:
        raise HTTPException(status_code=415, detail=f"Formato no soportado ({extension}). Usa PDF, imagen o texto.")
    contenido = await archivo.read()
    if not contenido:
        raise HTTPException(status_code=400, detail="El archivo está vacío.")
    if len(contenido) > TAMANO_MAXIMO:
        raise HTTPException(status_code=413, detail="El archivo supera los 25 MB.")
    try:
        configuracion = _config(json.loads(config) if config else None)
    except (json.JSONDecodeError, TypeError) as error:
        raise HTTPException(status_code=400, detail="El campo config no es un JSON válido.") from error

    doc_id, referencia = await _guardar_original(contenido, nombre, archivo.content_type)

    texto = None
    if extension in EXTENSIONES_TEXTO:
        texto = contenido.decode("utf-8", errors="replace")
        if extension == ".json":
            try:
                cuerpo = json.loads(texto)
                if isinstance(cuerpo, dict):
                    texto = cuerpo.get("documento_texto") or texto
                    canal_origen = canal_origen or cuerpo.get("canal_origen")
            except json.JSONDecodeError:
                pass
        return await _triaje(documento_id=doc_id, config=configuracion, canal_origen=canal_origen,
                             texto=texto, nombre_archivo=nombre, referencia_original=referencia)

    with tempfile.NamedTemporaryFile(delete=False, suffix=extension or ".bin") as temporal:
        temporal.write(contenido)
        ruta = temporal.name
    try:
        return await _triaje(documento_id=doc_id, config=configuracion, canal_origen=canal_origen,
                             ruta_archivo=ruta, nombre_archivo=nombre, referencia_original=referencia)
    finally:
        os.unlink(ruta)


@app.post("/analizar-texto", response_model=ResultadoTriaje, tags=["Triaje"])
async def analizar_texto(solicitud: SolicitudTexto):
    """Misma lógica que /analizar, con el formato de entrada JSON del brief."""
    nombre = re.sub(r"[^A-Za-z0-9._-]", "_", solicitud.documento_id or "texto-clinico") + ".txt"
    doc_id, referencia = await _guardar_original(solicitud.documento_texto.encode("utf-8"), nombre, "text/plain")
    resultado = await _triaje(documento_id=doc_id, config=_config(solicitud.config), canal_origen=solicitud.canal_origen,
                              texto=solicitud.documento_texto, nombre_archivo=nombre, referencia_original=referencia)
    if solicitud.documento_id:
        resultado["documento_id"] = solicitud.documento_id
    return resultado


@app.get("/demo/{escenario}", response_model=ResultadoTriaje, tags=["Triaje"])
def demo(escenario: str):
    """Recorre el grafo real con una respuesta de IA simulada (sin Gemini ni OCI): rutina, urgencia o ambiguo."""
    caso = ESCENARIOS.get(escenario)
    if caso is None:
        raise HTTPException(status_code=404, detail="Escenarios disponibles: " + ", ".join(ESCENARIOS))
    grafo_demo = construir_grafo(
        lambda _estado: caso["respuesta_ia"],
        lambda _estado, _resultado: {"bucket": None, "ruta_objeto": None, "ruta_original": None, "status_backup": "omitido (demo)"},
        lambda _notificacion, _resumen: "simulada",
    )
    return ejecutar_triaje(grafo_demo, documento_id=f"DEMO-{escenario.upper()}", config=ConfigTriaje(),
                           canal_origen=caso["canal_origen"], texto=caso["texto"])


@app.get("/documentos/original", tags=["Documentos"])
async def descargar_original(ruta: str = Query(..., description="ruta_original devuelta por el triaje")):
    if not oci_storage.oci_habilitado():
        raise HTTPException(status_code=404, detail="OCI no está configurado en este entorno.")
    try:
        contenido, tipo = await run_in_threadpool(oci_storage.descargar_original, ruta)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:  # noqa: BLE001
        if getattr(error, "status", None) == 404:
            raise HTTPException(status_code=404, detail="El archivo original no existe en OCI.") from error
        logger.error("Fallo al descargar el original (%s)", type(error).__name__)
        raise HTTPException(status_code=502, detail="No se pudo descargar el archivo de OCI.") from error
    return Response(content=contenido, media_type=tipo, headers={"Cache-Control": "private, max-age=300"})


@app.post("/documentos/revision", tags=["Documentos"])
async def registrar_revision(solicitud: SolicitudRevision):
    """Cierra el ciclo Human-in-the-Loop en OCI: mueve el JSON revisado de auditoría a procesados (o lo marca rechazado)."""
    if not oci_storage.oci_habilitado():
        return {"bucket": None, "ruta_objeto": None, "status_backup": "omitido"}
    coincidencia = re.fullmatch(r"estructurados/(\d{4}/\d{2}/\d{2})/([0-9a-f-]{36})\.json", solicitud.ruta_objeto or "")
    if coincidencia is None or coincidencia.group(2) != solicitud.documento_id:
        raise HTTPException(status_code=400, detail="ruta_objeto no corresponde al documento.")
    revision = {
        "decision": solicitud.decision,
        "revisor": solicitud.revisor,
        "comentario": solicitud.comentario,
        "datos_corregidos": solicitud.datos_corregidos,
        "fecha": datetime.now(timezone.utc).isoformat(),
    }
    try:
        return await run_in_threadpool(oci_storage.registrar_revision, solicitud.documento_id, coincidencia.group(1), revision)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except Exception as error:  # noqa: BLE001
        logger.error("Fallo al registrar la revisión en OCI (%s)", type(error).__name__)
        raise HTTPException(status_code=502, detail="No se pudo actualizar OCI.") from error


@app.get("/resultado-prueba", response_model=ResultadoTriaje, tags=["Triaje"])
def resultado_prueba():
    """Ejemplo de respuesta (escenario de urgencia del brief)."""
    return demo("urgencia")
