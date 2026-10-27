# MediFlow — Backend FastAPI

API de backend para el análisis de documentos del proyecto MediFlow. Desarrollada con Python y FastAPI, con integración de Google Gemini para la clasificación documental y Oracle Cloud Infrastructure (OCI) Object Storage para el almacenamiento de documentos originales.

## Tecnologías

- Python 3.11
- FastAPI
- Uvicorn
- Docker
- Google Gemini API
- Oracle Cloud Infrastructure (OCI) Object Storage

## Funcionalidades

- Recepción de documentos (PDF, imagen o texto) y de texto en JSON con el formato del brief.
- Almacenamiento del original y del resultado en OCI Object Storage, enrutado por estado.
- **Agente de triaje con LangGraph**: extracción con Gemini, validación clínica, score de confianza, detección de
  urgencias, enrutamiento condicional, alertas y persistencia. Cada paso queda en la `traza` de la respuesta.
- Reglas configurables por petición (umbral, términos de urgencia y destinos) que envía la API principal.
- Cierre del ciclo Human-in-the-Loop en OCI y descarga del original para el visor.
- Ejecución en contenedores Docker.

## Agente de triaje

| Archivo | Contenido |
|---|---|
| `agente/grafo.py` | Grafo LangGraph: `extraer → validar → evaluar_confianza → detectar_urgencia → ruta_* → notificar → persistir` |
| `agente/reglas.py` | Reglas deterministas: categorías, destinos, umbral (0.60), términos de urgencia, medicamentos de alto riesgo, penalizaciones |
| `agente/escenarios_demo.py` | Los 3 escenarios del brief con respuestas de IA simuladas (pruebas y `/demo`) |
| `clasificador/clasificador_multimodal.py` | Cliente de Gemini (archivo o texto), reintentos ante 503/429, sin registrar datos clínicos |
| `clasificador/adaptador.py` | Normaliza la respuesta de Gemini (variantes de claves, placeholders, edades) |
| `modelos.py` | Modelos Pydantic de entrada y salida |
| `notificaciones.py` | Alerta por webhook (Slack, Discord o n8n) |

La IA extrae y opina (confianza, prioridad, hallazgos, ambigüedades); las reglas deciden: una confianza final bajo el
umbral, una ambigüedad o un medicamento de alto riesgo mandan el documento a `Cola_Revision_Humana`; un caso urgente
va a `Cola_Emergencia_Medica` y genera la alerta; el resto sigue el destino de su tipo.

## Requisitos

- Docker, para ejecutar la imagen publicada.
- Una clave válida de Google Gemini.
- Configuración y credenciales de OCI para habilitar el almacenamiento en la nube.

## Ejecutar con Docker

Descarga la versión publicada:

```bash
docker pull tinocpp/mediflow-fastapi:1.0.1
```

Para comprobar el arranque básico de la API:

```bash
docker run -d \
  --name mediflow-fastapi \
  -p 8000:8000 \
  tinocpp/mediflow-fastapi:1.0.1
```

Endpoints de referencia:

- API: http://localhost:8000/
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

La disponibilidad de la documentación interactiva depende de la configuración de FastAPI.

> El arranque básico no configura por sí solo las credenciales de Gemini ni OCI. Para analizar documentos, configura las variables de entorno y los archivos necesarios.

## Configuración de Gemini y OCI

Variables de entorno utilizadas por la configuración actual:

| Variable | Descripción |
|---|---|
| `GEMINI_API_KEY` | Clave de acceso a Google Gemini. |
| `GEMINI_MODEL` | Modelo de Gemini (por defecto `gemini-3.8-flash`). |
| `GEMINI_MODELOS_RESPALDO` | Modelos, separados por comas, que se prueban al instante si el principal está saturado (503/429) o ya no existe (404). Por defecto `gemini-3.6-flash,gemini-3.5-flash`; vacío lo desactiva. |
| `OCI_CONFIG_FILE` | Ruta del archivo de configuración de OCI dentro del contenedor. Si no existe, se omite OCI. |
| `OCI_PROFILE` | Perfil de OCI. La configuración utilizada en el entorno de MediFlow usa `MediFlowBackend`. |
| `OCI_DESHABILITADO` | `true` para no usar OCI aunque haya configuración (pruebas). |
| `ALERTA_WEBHOOK_URL` | Webhook para avisar los casos urgentes (opcional). |
| `ALERTA_INCLUIR_PACIENTE` | `true` para incluir el nombre del paciente en el aviso (por defecto no). |
| `CORS_ORIGINS` | Orígenes permitidos para el modo Directo sin proxy. |

Ejemplo para PowerShell, suponiendo que el directorio privado de OCI está disponible en `C:\RUTA\PRIVADA\OCI`:

```powershell
docker run -d `
  --name mediflow-fastapi `
  -p 8000:8000 `
  --mount "type=bind,source=C:\RUTA\PRIVADA\OCI,target=/run/oci,readonly" `
  -e "GEMINI_API_KEY=$env:GEMINI_API_KEY" `
  -e "OCI_CONFIG_FILE=/run/oci/config" `
  -e "OCI_PROFILE=MediFlowBackend" `
  tinocpp/mediflow-fastapi:1.0.1
```

Antes de ejecutar el comando, configura `GEMINI_API_KEY` de forma segura en tu sesión de PowerShell. El directorio privado montado debe contener el archivo de configuración de OCI y la clave privada requerida por ese perfil.

No publiques credenciales, archivos `.env`, claves privadas ni configuraciones reales en GitHub o Docker Hub.

## Endpoints

| Método y ruta | Descripción |
|---|---|
| `POST /analizar` | Multipart: `archivo` (PDF, imagen, `.txt` o `.json`), `canal_origen` y `config` (JSON) opcionales |
| `POST /analizar-texto` | JSON: `documento_texto`, `documento_id`, `tipo_archivo`, `canal_origen`, `config` |
| `GET /demo/{rutina\|urgencia\|ambiguo}` | El grafo real con una respuesta de IA simulada (sin Gemini ni OCI) |
| `GET /grafo` | Diagrama Mermaid del grafo, generado por LangGraph |
| `GET /reglas` | Reglas por defecto del agente |
| `GET /salud` | Qué está configurado (sin exponer secretos) |
| `GET /documentos/original?ruta=` | Original guardado en `BktRecibidos` |
| `POST /documentos/revision` | Decisión del auditor: mueve el JSON de `BktAuditoria-humana` a `BktProcesados` |
| `POST /asistente` | Asistente virtual: `pregunta`, `rol_usuario` e `historial`. Responde dudas de uso con Gemini (un intento por modelo, sin esperas); 503 si no hay modelo disponible |

La respuesta sigue el formato del ejemplo del brief (`clasificacion`, `datos_extraidos`, `decision_enrutamiento`,
`almacenamiento_oci`) y agrega `validacion` y `traza`. El detalle está en `/docs`.

## Pruebas

```bash
pip install -r requirements.txt -r requirements-dev.txt
pytest -q
```

Cubren las reglas, el grafo con los 3 escenarios, el normalizador, la API y la integración con OCI (simulada).
No llaman a Gemini ni a OCI.

## Comprobación del servicio

La ruta raíz `GET /` respondió correctamente durante las pruebas de la versión `1.0.1`:

```json
{
  "message": "Mediflow API is running!"
}
```

## Errores y disponibilidad

Gemini puede devolver `503 UNAVAILABLE` cuando el modelo experimenta alta demanda. También pueden presentarse errores relacionados con cuotas o límites de uso.

En esos casos:

- Revisa los registros del contenedor.
- Verifica la disponibilidad del modelo y las cuotas de la API.
- Evita repetir solicitudes innecesariamente.
- Maneja los errores en el servicio que consume esta API.

El almacenamiento exitoso de un documento en OCI no garantiza que la clasificación haya terminado correctamente.

## Estado de la versión

- `2.0.0` (este código): agente con LangGraph, `/analizar-texto`, revisión en OCI, alertas y pruebas automáticas.
  Se construye con `docker compose build fastapi` desde la raíz del repositorio.
- `1.0.1`: imagen publicada `tinocpp/mediflow-fastapi:1.0.1` (clasificación directa con Gemini y enrutamiento a OCI).

## Seguridad

- Mantén las credenciales fuera del código fuente.
- Aplica permisos mínimos a las credenciales de OCI.
- No incluyas secretos en la imagen Docker.
- Protege el servicio antes de exponerlo públicamente.
- Utiliza datos de prueba autorizados para validar el flujo documental.

## Repositorio de imágenes

Docker Hub: https://hub.docker.com/r/tinocpp/mediflow-fastapi

Imagen publicada: `tinocpp/mediflow-fastapi:1.0.1`

---

MediFlow — Backend de análisis documental.
