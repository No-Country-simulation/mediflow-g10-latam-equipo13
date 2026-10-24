
from dotenv import load_dotenv
load_dotenv()

import os
import tempfile

from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

from clasificador.clasificador_multimodal import clasificar_documento
from clasificador.adaptador import adaptar_resultado

from oci_storage import (
    subir_documento_crudo,
    subir_json_estructurado,
    enrutar_json_estructurado,
)


app = FastAPI(
    title="Mediflow API",
    version="0.1.0",
)


@app.get("/")
def home():
    return {"message": "Mediflow API is running!"}


class Paciente(BaseModel):
    nombre: str
    rut: str
    edad: int | None = None


class MedicoSolicitante(BaseModel):
    nombre: str
    matricula: str


class Clasificacion(BaseModel):
    tipo_documento: str
    especialidad: str
    nivel_prioridad: str
    score_confianza_clasificacion: float
    requiere_auditoria_humana: bool = False
    cola_enrutamiento: str = "SIN DEFINIR"


class DatosExtraidos(BaseModel):
    paciente: Paciente
    medico_solicitante: MedicoSolicitante
    estudio_realizado: str | None = None
    diagnostico_principal: str | None = None
    cie10_sugerido: str | None = None


class ResultadoTriaje(BaseModel):
    status: str
    documento_id: str
    contenido: str | None = None
    clasificacion: Clasificacion
    datos_extraidos: DatosExtraidos


@app.get(
    "/resultado-prueba",
    response_model=ResultadoTriaje,
)
def resultado_prueba():
    return {
        "status": "pendiente_revision_humana",
        "documento_id": "102820976",
        "contenido": "texto extraido ....",
        "clasificacion": {
            "tipo_documento": "Orden de Procedimiento",
            "especialidad": "Laboratorio Clínico",
            "nivel_prioridad": "Rutina",
            "score_confianza_clasificacion": 0.55,
            "requiere_auditoria_humana": True,
            "cola_enrutamiento": "Revision",
        },
        "datos_extraidos": {
            "paciente": {
                "nombre": "APELLIDO, NOMBRE",
                "rut": "00.000.000-0",
                "edad": 0,
            },
            "medico_solicitante": {
                "nombre": "DR. NOMBRE",
                "matricula": "...",
            },
            "estudio_realizado": None,
            "diagnostico_principal": None,
            "cie10_sugerido": None,
        },
    }


@app.post(
    "/analizar",
    response_model=ResultadoTriaje,
)
async def analizar_documento(
    archivo: UploadFile = File(...),
):
    nombre_archivo = archivo.filename or "documento"
    archivo_temporal = None
    documento_crudo = None
    etapa = "recepcion"

    try:
        # 1. Leer y validar el archivo.
        contenido_bytes = await archivo.read()

        if not contenido_bytes:
            raise HTTPException(
                status_code=400,
                detail="El archivo está vacío.",
            )

        # 2. Guardar el original en OCI.
        etapa = "almacenamiento_original"

        documento_crudo = await run_in_threadpool(
            subir_documento_crudo,
            contenido_bytes,
            nombre_archivo,
            archivo.content_type,
        )

        doc_id = documento_crudo["doc_id"]

        # 3. Crear el archivo temporal para el clasificador.
        extension = os.path.splitext(nombre_archivo)[1]

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension,
        ) as temporal:
            temporal.write(contenido_bytes)
            archivo_temporal = temporal.name

        # 4. Ejecutar la clasificación sin bloquear FastAPI.
        etapa = "clasificacion"

        resultado = await run_in_threadpool(
            clasificar_documento,
            archivo_temporal,
        )

        if resultado is None:
            raise HTTPException(
                status_code=503,
                detail={
                    "mensaje": (
                        "No fue posible procesar el documento "
                        "con el servicio de IA."
                    ),
                    "documento_id": doc_id,
                    "original_conservado": True,
                },
            )

        # 5. Adaptar el resultado al contrato de MediFlow.
        etapa = "adaptacion"

        resultado_adaptado = adaptar_resultado(
            resultado,
            nombre_archivo,
        )

        # Utilizar el identificador persistente de OCI.
        resultado_adaptado["documento_id"] = doc_id

        requiere_auditoria = resultado_adaptado[
            "clasificacion"
        ]["requiere_auditoria_humana"]

        destino = (
            "auditoria_humana"
            if requiere_auditoria
            else "procesados"
        )

        # Diferenciar análisis completado de revisión pendiente.
        resultado_adaptado["status"] = (
            "pendiente_revision_humana"
            if requiere_auditoria
            else "procesado"
        )

        # 6. Persistir el resultado estructurado.
        etapa = "almacenamiento_json"

        referencia_json = await run_in_threadpool(
            subir_json_estructurado,
            resultado_adaptado,
            documento_crudo,
        )

        # 7. Enrutar el JSON al destino elegido.
        etapa = "enrutamiento"

        await run_in_threadpool(
            enrutar_json_estructurado,
            referencia_json,
            destino,
        )

        return resultado_adaptado

    except HTTPException:
        raise

    except Exception:
        # No registrar contenido clínico, archivos ni credenciales.
        doc_id = (
            documento_crudo.get("doc_id")
            if documento_crudo
            else None
        )

        print(
            f"Error en etapa={etapa}; "
            f"documento_id={doc_id or 'no_asignado'}"
        )

        detalle = {
            "mensaje": "No se pudo completar el procesamiento.",
            "etapa": etapa,
        }

        if doc_id:
            detalle["documento_id"] = doc_id
            detalle["original_conservado"] = True

        raise HTTPException(
            status_code=502,
            detail=detalle,
        )

    finally:
        # El original permanece en OCI; solo se elimina el temporal.
        if (
            archivo_temporal
            and os.path.exists(archivo_temporal)
        ):
            os.unlink(archivo_temporal)
