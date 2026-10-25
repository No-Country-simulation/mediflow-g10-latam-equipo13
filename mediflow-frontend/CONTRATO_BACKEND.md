# Contrato frontend ↔ backend (versión 2.0)

Todo lo que usa el frontend existe en el backend. La documentación interactiva está en
`/swagger-ui.html` (Spring) y `/docs` (FastAPI).

## Errores
Spring responde `{ codigo, mensaje, status, path, timestamp, detalles }`; el frontend muestra `mensaje`.

| Código | Cuándo |
|---|---|
| 400 | Datos inválidos (`detalles` lista cada campo) o falta el archivo |
| 401 | Sin sesión, token vencido o credenciales incorrectas (el frontend cierra la sesión) |
| 403 | El rol no tiene permiso |
| 404 | Recurso o ruta inexistente |
| 409 | Conflicto (usuario duplicado, documento que ya no está pendiente de revisión) |
| 413 | Archivo de más de 25 MB |
| 502 / 503 | El motor de IA falló o no está disponible (el mensaje explica qué hacer) |

FastAPI responde `{ detail }`, donde `detail` es texto, `{ mensaje, documento_id, original_conservado }` o la lista de
errores de validación; el frontend muestra el mensaje en los tres casos.

## Sesión
- `POST /api/auth/login` con `{ name, password }` → `{ token, usuario: { id, name, rol } }`.
- `GET /api/auth/me` → `{ id, name, rol }`. El frontend lo llama al restaurar la sesión: un cambio de rol se ve sin
  volver a iniciar sesión.
- `POST /api/user/register` con `{ name, password }` crea la cuenta como `NO_ASIGNADO`.

## Documentos
| Ruta | Uso en el frontend |
|---|---|
| `POST /api/documentos/analyze/file` | Multipart: `archivo` y `canalOrigen` (opcional). Modo Persistente |
| `POST /api/documentos/analyze/text` | `{ texto, canalOrigen }`. Texto pegado y casos de prueba |
| `GET /api/documentos/findall` | Lista ordenada del más reciente al más antiguo |
| `GET /api/documentos/findbyid/{id}` | Detalle |
| `PATCH /api/documentos/{id}/revision` | `{ decision, comentario, datosCorregidos }` (ADMIN, AUDITOR) |
| `GET /api/documentos/{id}/archivo` | Archivo original desde OCI (visor) |
| `GET /api/documentos/alertas?desde=` | Casos urgentes recientes (campana de alertas) |
| `DELETE /api/documentos/{id}` | Solo ADMIN |

### JSON de cada documento (`DocumentosResponse`)
`id`, `status` (`procesado`, `pendiente_revision_humana`, `revisado`, `rechazado`), `tipo`, `contenido`,
`especialidad`, `prioridad`, `documentoId` (UUID en OCI), `fechaRegistro` y `fechaActualizacion` (UTC con zona),
`score`, `requiereAuditoria`, `colaEnrutamiento`, `destino`, `justificacion`, `nombreMedico`, `matricula`,
`nombrePaciente`, `rutPaciente`, `edadPaciente`, `estudioRealizado`, `diagnosticoPrincipal`, `cie10Sugerido`,
`medicamentos[]`, `notificacion { canal, mensaje }`, `validacion` (faltantes, inconsistencias, ambigüedades, alto riesgo,
motivos de urgencia, detalle de la confianza, umbral), `traza[]` (pasos del grafo), `almacenamiento { bucket, ruta,
rutaOriginal, status }`, `revision { decision, comentario, revisor, fecha }`, `canalOrigen`, `nombreArchivo`, `usuario`.

El conversor `springToUnificado` sigue aceptando la respuesta de la versión 1.0.1 (campo `colaEnruatamiento`).

## Reglas de triaje
- `GET /api/configuracion` → `{ umbralConfianza, palabrasUrgencia[], destinos[], actualizadoPor, fechaActualizacion }`.
- `PUT /api/configuracion` (ADMIN) con los tres primeros campos. Spring los envía al agente en cada análisis.

## Usuarios (solo ADMIN)
`GET /api/user/findAll`, `PATCH /api/user/{id}/rol/{rol}`, `DELETE /api/user/{id}` (409 si tiene documentos).

## FastAPI (modo Directo)
`POST /analizar` (multipart `archivo` + `canal_origen`) y `POST /analizar-texto`
(`{ documento_texto, canal_origen, tipo_archivo }`). La respuesta incluye `decision_enrutamiento`, `validacion`,
`traza` y `almacenamiento_oci`. El modo Directo no guarda el documento en la base.
