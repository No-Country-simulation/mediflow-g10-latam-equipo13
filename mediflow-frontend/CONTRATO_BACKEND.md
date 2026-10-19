# Contrato que espera el frontend

## GET /api/documentos/findall (Spring)
Además de `id, documentoId, tipo, contenido, especialidad, score, nombreMedico, prioridad, usuarioId, fechaRegistro`,
cada documento debe incluir estos campos (opcionales; sin ellos el panel de auditoría queda vacío):

```json
{
  "status": "procesado | en_revision | error",
  "requiereAuditoria": true,
  "destino": "Cola_Revision_Humana",
  "justificacion": "Confianza menor al umbral",
  "nombrePaciente": "...", "rutPaciente": "...", "edadPaciente": 44,
  "matricula": "...", "estudioRealizado": "...",
  "diagnosticoPrincipal": "...", "cie10Sugerido": "...",
  "medicamentos": [{ "nombre": "...", "dosis": "...", "frecuencia": "...", "via": "...", "duracion": "..." }],
  "notificacion": { "canal": "Alerta_Guardia_Medica", "mensaje": "..." },
  "revision": null
}
```

## PATCH /api/documentos/{id}/revision (Spring) — nuevo
```json
{
  "decision": "aprobado | corregido | rechazado",
  "comentario": "obligatorio si es rechazado",
  "revisor": "Nombre del auditor",
  "datosCorregidos": {
    "nombrePaciente": "", "rutPaciente": "", "edadPaciente": 0, "nombreMedico": "", "matricula": "",
    "estudioRealizado": "", "diagnosticoPrincipal": "", "cie10Sugerido": "", "prioridad": "Rutina | Urgente"
  }
}
```
Responde con el documento actualizado (200) o 204. Debe guardar `revision { decision, comentario, revisor, fecha }`
y poner `requiereAuditoria = false`.

## PUT /api/v1/configuracion (FastAPI) — opcional
Recibe `{ umbralConfianza, palabrasUrgencia[], destinos[] }`. Si no existe, la configuración queda en el navegador
y el agente no la usa (la pantalla lo avisa).

## POST /analizar-texto (FastAPI)
Body: `{ "texto", "documento_texto", "tipo_archivo": "TEXTO", "canal_origen" }`.

## Roles
`POST /api/auth/register` crea usuarios sin rol (NO_ASIGNADO). El registro ya no deja elegir rol: antes cualquiera
podía registrarse como ADMIN. Falta un endpoint para que un ADMIN asigne roles.


---

# Para el equipo de FastAPI (lo que el frontend necesita y hoy no existe)

1. **CORS.** Permitir el origen `http://localhost:5173` (`CORSMiddleware`). Sin esto el navegador bloquea las llamadas directas al motor de IA.
2. **`POST /analizar`** debería devolver, además de lo actual, `decision_enrutamiento`
   (`destino_principal`, `requiere_auditoria_humana`, `justificacion_enrutamiento`, `notificacion_generada`)
   y `almacenamiento_oci` (`bucket`, `ruta_objeto`, `status_backup`). Hoy el `response_model` los elimina.
   Mientras no existan, el frontend muestra "Sin destino asignado" y no marca auditoría.
3. **`POST /analizar-texto`** con `{ "texto", "documento_texto", "tipo_archivo", "canal_origen" }`. Hoy no existe: la pestaña "Pegar texto" en modo directo mostrará un aviso.
4. `status` debería ser `en_revision` cuando la confianza sea menor al umbral (hoy siempre dice `procesado`).
5. `datos_extraidos.medicamentos` (lista) para mostrar recetas completas.

---

# Usuarios y roles (pantalla `/usuarios`, solo ADMIN)

## GET /api/usuarios?page=0&size=200
Devuelve la lista de usuarios, paginada (`{ "content": [...] }`) o como arreglo simple. Cada usuario:
```json
{ "id": 1, "nombre": "ana.perez", "rol": "NO_ASIGNADO", "activo": true, "fechaCreacion": "2026-10-11T14:00:00" }
```

## PATCH /api/usuarios/{id}/rol
Body: `{ "rol": "ADMIN | AUDITOR | PERSONAL | NO_ASIGNADO" }`. Responde con el usuario actualizado (200) o 204.

Reglas que debe validar el servidor (el frontend solo las refleja en pantalla):
- Solo un ADMIN puede usar estos dos endpoints.
- Un ADMIN no puede cambiar su propio rol ni dejar el sistema sin administradores.

# Archivo original (visor en `/auditoria`)

## GET /api/documentos/{id}/archivo
Devuelve el archivo original que se subió (PDF, PNG o JPG) con su `Content-Type`. El frontend lo pide con el
header `Authorization: Bearer <token>` y lo muestra en pantalla; si el `Content-Type` es genérico
(`application/octet-stream`) lo detecta por los primeros bytes.
- 404 si el documento no tiene archivo guardado (el visor lo avisa y ofrece ver el texto extraído).
- Solo ADMIN y AUDITOR deberían poder pedirlo: son documentos clínicos.
- El archivo debe guardarse al procesar (por ejemplo en el bucket de OCI) para poder devolverlo después.


---

# Autenticación por nombre de usuario (sin correo)

Decisión del equipo: se inicia sesión con **nombre de usuario y contraseña**. El frontend ya no usa correo.

## POST /api/auth/login
Body: `{ "name": "ana.perez", "password": "Clave123" }`
Respuesta: `{ "token": "...", "tipo": "Bearer", "usuario": { "id", "nombre", "rol", "activo", "fechaCreacion" } }`
Credenciales incorrectas: 401 (idealmente con `{ "message": "..." }`).

## POST /api/auth/register
Body: `{ "nombre": "ana.perez", "name": "ana.perez", "password": "Clave123" }`
El frontend manda el nombre en los dos campos (`nombre` y `name`) hasta que se confirme cuál usa el registro; Spring puede ignorar el que no necesite.
- El nombre de usuario debe ser **único**: si ya existe, responder 409 (o 400) con un `message` claro.
- El rol nuevo debe quedar en `NO_ASIGNADO` (el registro no deja elegir rol).
