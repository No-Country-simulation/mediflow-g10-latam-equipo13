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
