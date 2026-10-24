# Integración OCI en MediFlow

La entrega OCI (rama `Subida-OCI`, Victor Marin) está integrada en el flujo completo:

- `Backend_FastAPI/oci_storage.py`: almacenamiento del original, JSON estructurado, enrutamiento y cierre de la revisión humana.
- `Backend_FastAPI/test_oci_storage.py` y `Backend_FastAPI/test_enrutamiento_oci.py`: pruebas del módulo.
- [Backend_FastAPI/README_OCI.md](Backend_FastAPI/README_OCI.md): configuración, arquitectura y contrato de uso.

## Estado de los pendientes originales

1. ✅ El perfil OCI se configura con `OCI_CONFIG_DIR` y `OCI_PROFILE` (ver `.env.example`); sin configuración, se omite OCI.
2. ✅ `POST /analizar` y `POST /analizar-texto` llaman a `subir_documento_crudo()` y conservan la referencia.
3. ✅ El nodo `persistir` del grafo pasa el resultado validado a `subir_json_estructurado()`.
4. ✅ La decisión del agente se entrega a `enrutar_json_estructurado()`: `procesados` o `auditoria_humana`.
5. ✅ Spring guarda la ubicación final (`oci_bucket`, `oci_objeto`, `oci_original`); si OCI falla, el triaje sigue y el
   estado queda en `error`. Las llamadas síncronas se ejecutan en un hilo aparte (`run_in_threadpool`).
6. ✅ Los tres escenarios se prueban en `tests/test_grafo.py`; la revisión humana mueve el JSON con
   `registrar_revision()` (aprobado/corregido → `BktProcesados`, rechazado → `BktAuditoria-humana/rechazados/`).

## Comprobación local

```powershell
cd Backend_FastAPI
pytest -q
```

Las pruebas simulan OCI y Gemini.
