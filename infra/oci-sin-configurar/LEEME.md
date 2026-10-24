# Carpeta vacía a propósito

Docker Compose la monta en el contenedor de FastAPI cuando no defines `OCI_CONFIG_DIR` en `.env`.
Como no tiene un archivo `config`, el agente funciona sin OCI y marca el respaldo como `omitido`.

Para usar OCI, define `OCI_CONFIG_DIR` con la ruta de tu carpeta que contiene `config` y la clave privada.
**Nunca pongas credenciales en esta carpeta**: está dentro del repositorio.
