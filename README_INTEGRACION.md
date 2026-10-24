# Integración OCI en MediFlow

La entrega OCI está incorporada en este repositorio local:

- `Backend_FastAPI/oci_storage.py`: implementación de almacenamiento y primer enrutamiento.
- `Backend_FastAPI/test_oci_storage.py` y `Backend_FastAPI/test_enrutamiento_oci.py`: pruebas del módulo.
- [Backend_FastAPI/README_OCI.md](Backend_FastAPI/README_OCI.md): configuración, arquitectura y contrato de uso.

Se agregó `oci==2.187.0` a `Backend_FastAPI/requirements.txt` y se combinaron las reglas OCI con el `.gitignore` existente. No se incluyeron credenciales, logs ni lanzadores dependientes de rutas personales.

## Pendiente de Backend

1. Configurar el perfil OCI en la máquina que ejecutará la API y definir `OCI_PROFILE` antes de iniciarla.
2. Llamar a `subir_documento_crudo()` durante la ingesta y conservar la referencia completa.
3. Pasar el diccionario validado a `subir_json_estructurado()` y guardar la referencia pendiente, incluido `sha256`.
4. Entregar la decisión de Orquestación a `enrutar_json_estructurado()`: `procesados` o `auditoria_humana`.
5. Guardar la ubicación final y gestionar errores/reintentos. Serializar las operaciones por `doc_id` y adaptar las llamadas síncronas al endpoint asíncrono.
6. Probar el flujo real de rutina, urgencia y ambigüedad, e implementar con HITL la transición posterior a la revisión humana.

`main.py` todavía no invoca el módulo OCI. Incorporar estos archivos no activa por sí solo las subidas desde el endpoint ni despliega una aplicación. Compute o Container Instances siguen pendientes de decisión con el equipo.

## Comprobación local

Desde la raíz del repositorio, con las dependencias instaladas:

```powershell
python -m unittest discover -s Backend_FastAPI -p "test_*.py" -v
```

Las pruebas simulan OCI. No sustituyen la prueba conjunta del endpoint, la IA y el panel humano.
