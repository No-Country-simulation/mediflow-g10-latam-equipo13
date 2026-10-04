import os
import json
import time

from google import genai
from google.genai import types


# Inicializar cliente de Gemini
client = genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY")
)


def clasificar_documento(ruta_archivo):
    """
    Recibe la ruta de un documento y utiliza Gemini
    para clasificarlo y extraer información clínica.
    """

    print(f"Cargando documento: {ruta_archivo}...")

    max_intentos = 3
    tiempo_espera = 4

    for intento in range(1, max_intentos + 1):

        try:
            print(
                f"\n[Intento {intento} de {max_intentos}] "
                "Subiendo archivo y conectando con Gemini..."
            )

            # Subir documento a Gemini
            archivo_subido = client.files.upload(
                file=ruta_archivo
            )

            print("¡Archivo cargado exitosamente en Gemini!")

            # Prompt de clasificación y extracción
            prompt_multimodal = """
            Actúa como el motor de clasificación y extracción inteligente
            de documentos clínicos para el proyecto MediFlow.

            Analiza el documento adjunto completo.

            1. Clasifícalo estrictamente en una de estas categorías:
               Receta, Informe de Estudio por Imágenes,
               Orden de Procedimiento, Epicrisis o Certificado Médico.

            2. Extrae los datos clave del paciente y del médico solicitante.

            3. Determina el nivel de prioridad:
               - Rutina
               - Urgente

            4. Extrae, cuando estén disponibles, los siguientes datos
               clínicos adicionales:

               - estudio_realizado
               - diagnostico_principal
               - cie10_sugerido

            REGLAS IMPORTANTES:

            - No inventes información.
            - Si un dato no aparece claramente en el documento,
              devuelve null para ese campo.
            - La edad del paciente debe devolverse como un número entero,
              sin unidades como "años".
            - El score de confianza debe ser un número entre 0 y 1.

            INSTRUCCIONES DE UMBRAL Y ENRUTAMIENTO:

            - Si el score de confianza es menor a 0.60 o existe
              ambigüedad crítica, marca:
              "requiere_auditoria_humana": true

            - Si el score es menor a 0.60 o existe ambigüedad crítica,
              la cola de enrutamiento debe ser la cola de revisión.

            - Si el score es mayor o igual a 0.60,
              enruta según la prioridad clínica.

            DEVUELVE ÚNICAMENTE UN JSON VÁLIDO.
            """

            # Enviar documento + instrucciones a Gemini
            response = client.models.generate_content(
                model="gemini-3.7-flash",
                contents=[
                    archivo_subido,
                    prompt_multimodal
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )

            # Convertir respuesta de Gemini a objeto Python
            resultado_json = json.loads(response.text)

            print(
                "\n--- RESULTADO DE CLASIFICACIÓN Y "
                "EXTRACCIÓN EXITOSO ---"
            )

            print(
                json.dumps(
                    resultado_json,
                    indent=4,
                    ensure_ascii=False
                )
            )

            # Entregar resultado al código que llamó a la función
            return resultado_json

        except Exception as e:

            error_str = str(e)

            print(
                f"\nFalla en el intento {intento}: "
                f"{error_str}"
            )

            # Comprobar si es un error temporal de Gemini
            if "503" in error_str or "UNAVAILABLE" in error_str:

                if intento < max_intentos:

                    print(
                        f"Servidores ocupados. "
                        f"Esperando {tiempo_espera} segundos "
                        "antes de reintentar..."
                    )

                    time.sleep(tiempo_espera)

                else:

                    print(
                        "\nSe agotaron los reintentos "
                        "por saturación del servidor."
                    )

            else:

                print(
                    "\nSe encontró un error diferente "
                    "al de saturación. "
                    "Deteniendo ejecución."
                )

                break

    print(
        "\nEl proceso no pudo completarse."
    )

    return None