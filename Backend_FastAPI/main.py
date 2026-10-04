from dotenv import load_dotenv
load_dotenv()

import os
import shutil
import tempfile

from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel


from clasificador.clasificador_multimodal import clasificar_documento
from clasificador.adaptador import adaptar_resultado

from fastapi import Request


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
    response_model=ResultadoTriaje
)
def resultado_prueba():

    return {
        "status": "procesado",

        "documento_id": "102820976",

        "contenido":"texto extraido ....",

        "clasificacion": {
            "tipo_documento": "Orden de Procedimiento",
            "especialidad": "Laboratorio Clínico",
            "nivel_prioridad": "Rutina",
            "score_confianza_clasificacion": 0.55
        },

        "datos_extraidos": {

            "paciente": {
                "nombre": "APELLIDO, NOMBRE",
                "rut": "00.000.000-0",
                "edad": 0
            },

            "medico_solicitante": {
                "nombre": "DR. NOMBRE",
                "matricula": "..."
            },

            "estudio_realizado": None,
            "diagnostico_principal": None,
            "cie10_sugerido": None
        }
    }


@app.post(
    "/analizar",
    response_model=ResultadoTriaje
)
async def analizar_documento(
    archivo: UploadFile = File(...)
):
    print(f">>> Archivo recibido: {archivo.filename}")
    print(f">>> Content type: {archivo.content_type}")
    archivo_temporal = None

    try:

        # Crear un archivo temporal con la misma extensión
        extension = os.path.splitext(
            archivo.filename
        )[1]

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension
        ) as temporal:

            shutil.copyfileobj(
                archivo.file,
                temporal
            )

            archivo_temporal = temporal.name

        print(
            f"Archivo guardado temporalmente en: "
            f"{archivo_temporal}"
        )

        # Enviar la ruta al clasificador
        resultado = clasificar_documento(
            archivo_temporal
        )

        # Si Gemini no pudo procesar el documento
        if resultado is None:

            raise HTTPException(
                status_code=503,
                detail=(
                    "No fue posible procesar el documento "
                    "con el servicio de IA."
                )
            )

        # Adaptar el resultado de Gemini
        # al formato que espera MediFlow
        resultado_adaptado = adaptar_resultado(
            resultado,
            archivo.filename
        )

        return resultado_adaptado

    finally:

        # Eliminar el archivo temporal
        if (
            archivo_temporal
            and os.path.exists(archivo_temporal)
        ):
            os.unlink(archivo_temporal)