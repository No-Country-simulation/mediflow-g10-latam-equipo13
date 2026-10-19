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

- Recepción de documentos para su análisis.
- Almacenamiento de documentos originales en OCI Object Storage.
- Clasificación documental mediante Google Gemini.
- Exposición de endpoints HTTP para la integración con otros servicios de MediFlow.
- Ejecución en contenedores Docker.

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
| `OCI_CONFIG_FILE` | Ruta del archivo de configuración de OCI dentro del contenedor. |
| `OCI_PROFILE` | Perfil de OCI. La configuración utilizada en el entorno de MediFlow usa `MediFlowBackend`. |

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

## Endpoint de análisis

### `POST /analizar`

Recibe un documento e inicia el flujo de análisis, que incluye el almacenamiento del archivo original en OCI y la clasificación mediante Gemini.

Consulta `/docs` en la instancia en ejecución para verificar el formato exacto de la petición, el campo multipart requerido, los parámetros y las respuestas.

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

La imagen Docker `tinocpp/mediflow-fastapi:1.0.1` fue publicada y se comprobó que el contenedor inicia y responde en la ruta raíz.

Esta comprobación no representa una validación completa de todos los escenarios de análisis ni una auditoría integral de seguridad.

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
