import os
import json
import time
from google import genai
from google.genai import types

# 1. Inicializar el cliente oficial de Gemini con tu API Key
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# 2. Definir la ruta del archivo del examen de laboratorio
ruta_archivo = "recibidos/prueba.pdf"  

print(f"Cargando documento desde el repositorio de ingesta: {ruta_archivo}...")

# Configuración de reintentos para lidiar con el error 503
max_intentos = 3
tiempo_espera = 4  
exito = False

for intento in range(1, max_intentos + 1):
    try:
        print(f"\n[Intento {intento} de {max_intentos}] Subiendo archivo y conectando con Gemini...")
        
        # 3. Subir el archivo completo al buffer de la API de Gemini
        archivo_subido = client.files.upload(file=ruta_archivo)
        print("¡Archivo de 6 páginas cargado exitosamente en el buffer de la API!")

        # 4. Prompt avanzado para Clasificación + Extracción de Entidades (Alineado con rúbrica oficial)
        prompt_multimodal = """
        Actúa como el motor de clasificación y extracción inteligente de documentos clínicos para el proyecto MediFlow.
        Analiza el documento adjunto completo y realiza las siguientes tareas:
        1. Clasifícalo estrictamente en una de estas categorías: Receta, Informe de Estudio por Imágenes, Orden de Procedimiento, Epicrisis o Certificado Médico.
        2. Extrae los datos clave del paciente, del médico solicitante y determina el nivel de prioridad (Rutina o Urgente).

        INSTRUCCIONES DE UMBRAL Y ENRUTAMIENTO:
        - Calcula un score de confianza numérico (entre 0 y 1) para la clasificación.
        - Si el score es menor a 0.60 o hay ambigüedad crítica, marca "requiere_auditoria_humana": true y enruta a la cola de revisión. Si es mayor o igual, enruta según la urgencia clínica.

        DEVUELVE ÚNICAMENTE UN JSON VÁLIDO CON ESTA ESTRUCTURA EXACTA (sin texto adicional ni bloques markdown extra):
        {
          "status": "procesado",
          "documento_id": "...",
          "clasificacion": {
            "tipo_documento": "...",
            "especialidad": "...",
            "nivel_prioridad": "Rutina",
            "score_confianza_clasificacion": 0.00
          },
          "datos_extraidos": {
            "paciente": {
              "nombre": "...",
              "rut": "...",
              "edad": 0
            },
            "medico_solicitante": {
              "nombre": "...",
              "matricula": "..."
            },
            "estudio_realizado": "...",
            "diagnostico_principal": "...",
            "cie10_sugerido": "..."
          },
          "decision_enrutamiento": {
            "destino_principal": "...",
            "requiere_auditoria_humana": false,
            "justificacion_enrutamiento": "..."
          },
          "almacenamiento_oci": {
            "bucket": "mediflow-documentos-clinicos",
            "ruta_objeto": "...",
            "status_backup": "exito"
          }
        }
        
        """

        print("Enviando archivo y prompt estructurado a Gemini 3.6 Flash...")

        # 5. Llamada multimodal con el archivo subido y el prompt
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=[archivo_subido, prompt_multimodal],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )

        # 6. Parsear e imprimir el resultado completo en formato JSON
        resultado_json = json.loads(response.text)
        print("\n--- RESULTADO DE CLASIFICACIÓN Y EXTRACCIÓN EXITOSO ---")
        print(json.dumps(resultado_json, indent=4, ensure_ascii=False))
        
        exito = True
        break  

    except Exception as e:
        error_str = str(e)
        print(f"Falla en el intento {intento}: {error_str}")
        
        if "503" in error_str or "UNAVAILABLE" in error_str:
            if intento < max_intentos:
                print(f"Servidores ocupados (Error 503). Esperando {tiempo_espera} segundos antes de reintentar...")
                time.sleep(tiempo_espera)
            else:
                print("\nSe agotaron los reintentos debido a la saturación del servidor (Error 503).")
        else:
            print("\nSe encontró un error diferente al de saturación. Deteniendo ejecución.")
            break

if not exito:
    print("\nEl proceso no pudo completarse. Vuelve a intentarlo más tarde.")