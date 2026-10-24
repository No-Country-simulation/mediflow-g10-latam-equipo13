# Contrato frontend ↔ backend (rutas reales de Spring Boot)

Rutas confirmadas en el código de `Back-End/MediFlow` (controladores y `SecurityConfig`). El frontend ya las usa.

## Autenticación (públicas)
| Ruta | Uso |
|---|---|
| `POST /api/auth/login` | Body `{ "name", "password" }`. Devuelve el JWT. |
| `POST /api/user/register` | Crea la cuenta con rol `NO_ASIGNADO`. El frontend envía `{ "nombre", "name", "password" }` e inicia sesión a continuación. |

Errores: el backend responde `{ codigo, mensaje, status, path, timestamp, detalles }`; el frontend muestra `mensaje`.

**Sesión:** el rol y el usuario se leen de la respuesta del login o, si no vienen, de los datos del JWT (`sub` y `roles`/`rol`).
No hay endpoint "mi perfil", así que el rol que ve la persona es el que tenía al iniciar sesión: tras un cambio de rol debe
volver a iniciar sesión.

## Usuarios y roles (solo ADMIN)
| Ruta | Uso en el frontend |
|---|---|
| `GET /api/user/findAll` | Lista de usuarios (lista simple o página) |
| `PATCH /api/user/{id}/rol/{rol}` | Cambia el rol (`ADMIN`, `AUDITOR`, `PERSONAL`, `NO_ASIGNADO`) |

## Documentos
| Ruta | Uso en el frontend |
|---|---|
| `POST /api/documentos/analyze/file` | Subida del archivo (campo `archivo`). Roles ADMIN, PERSONAL y AUDITOR |
| `GET /api/documentos/findall` | Lista para Inicio, Colas, Historial y Auditoría (lista simple o página) |
| `GET /api/documentos/findbyid/{id}` | Detalle |

El texto pegado se envía como archivo `.txt` a `analyze/file` (no existe endpoint de texto).

### JSON real de cada documento (`DocumentosResponse`, imagen `jm29r/mediflow-backend:1.0.1`)
Confirmado en las clases compiladas de la imagen (no hay estrategia de nombres de Jackson configurada). Son 13 campos y
cualquiera puede venir en `null`. `findall` devuelve una lista simple, sin paginar.

| Campo | Tipo | Qué trae | Cómo lo usa el frontend |
|---|---|---|---|
| `id` | número | id de la tabla | Identificador |
| `status` | texto | `procesado` o `pendiente_revision_humana` (lo decide FastAPI) | `pendiente_revision_humana` → "en revisión" |
| `tipo` | texto | tipo de documento según la IA (o `SIN CLASIFICAR`) | Tal cual |
| `contenido` | texto | texto que la IA leyó del documento | Tal cual |
| `especialidad` | texto | especialidad (o `SIN ESPECIALIDAD`) | Tal cual |
| `prioridad` | texto | `Rutina` o `Urgente` (o `SIN PRIORIDAD`) | Todo lo que no diga "urgente" se trata como Rutina |
| `documentoId` | texto | UUID del original en OCI | Ruta del detalle |
| `fechaRegistro`, `fechaActualizacion` | texto | `LocalDateTime` **sin zona horaria** | Se lee como UTC (ver errores) |
| `score` | número | confianza estimada por la IA (0 a 1) | Confianza |
| `requiereAuditoria` | booleano | lo decide la IA | Manda el documento a Auditoría |
| `colaEnruatamiento` | texto | cola que eligió la IA (texto libre) | Destino. **Ojo: el nombre tiene una errata** |
| `nombreMedico` | texto | **el nombre del usuario que subió el documento** | No se usa (ver errores) |

No existen `usuarioId` ni los datos extraídos (paciente, médico, diagnóstico, CIE-10). En modo Persistente la ficha de datos
extraídos sale vacía; en modo Directo (FastAPI) sí se ven.

### 🚨 Bloqueante: el modo Persistente no funciona (`POST /api/documentos/analyze/file` → 500)
Toda subida a Spring responde `500 INTERNAL_ERROR` ("Ocurrió un error inesperado") y nunca llega a FastAPI. El modo Directo
sí funciona porque no pasa por Spring. Sin esto no hay documentos en Colas, Historial ni Auditoría.

- **Causa:** `AIClient.java` (línea 45) usa `org.springframework.http.client.MultipartBodyBuilder`, una clase de WebFlux que
  necesita la librería `reactive-streams`. El proyecto solo tiene `spring-boot-starter-webmvc`, así que al ejecutarse lanza
  `java.lang.NoClassDefFoundError: org/reactivestreams/Publisher`. Se reprodujo con las clases y librerías de la imagen
  1.0.1, y el código de `main` tiene el mismo problema.
- **Por qué no aparece en el log:** `GlobalExceptionHandler.handleGeneric` tiene el `log.error(...)` comentado.
- **Solución (cualquiera de las dos):**
  1. Armar el multipart sin `MultipartBodyBuilder` (recomendada, no agrega dependencias; probada con las librerías de la imagen):
     ```java
     HttpHeaders cabeceras = new HttpHeaders();
     cabeceras.setContentType(archivo.getContentType() != null
             ? MediaType.parseMediaType(archivo.getContentType()) : MediaType.APPLICATION_OCTET_STREAM);
     cabeceras.setContentDispositionFormData("archivo", archivo.getOriginalFilename());
     MultiValueMap<String, Object> partes = new LinkedMultiValueMap<>();
     partes.add("archivo", new HttpEntity<>(archivo.getResource(), cabeceras));
     // ... .contentType(MediaType.MULTIPART_FORM_DATA).body(partes) ...
     ```
  2. O agregar al `pom.xml` la dependencia `org.reactivestreams:reactive-streams` (la versión la maneja Spring Boot).
- **Además:** descomentar el `log.error("Error inesperado", ex)` del manejador genérico, y publicar una imagen nueva (1.0.2).

### Errores del backend encontrados (para el equipo de backend)
1. **Errata en `DocumentosResponse`:** el campo se llama `colaEnruatamiento`. Lo correcto es `colaEnrutamiento`. El frontend lee
   los dos nombres, así que corregirlo no rompe nada.
2. **`nombreMedico` no trae al médico.** En la imagen 1.0.1 trae el nombre del usuario que subió el documento. En el código de
   `main` (commit `9d90d2a`) tampoco sirve: `DocumentosDTOMapper.toResponse`, línea 58, pasa `getDocumentoId()` donde va
   `getNombreMedico()`. Además, la imagen 1.0.1 no incluye la migración V5 (`nombre_medico`). Mientras no se corrija, el
   frontend no muestra ese campo como médico.
3. **Fechas sin zona horaria:** `LocalDateTime.now()` se guarda en la hora del contenedor (UTC) y se envía sin zona. El
   frontend las interpreta como UTC. Si Spring corre fuera de Docker con otra zona horaria, las horas saldrán corridas.
   Propuesta: usar `Instant` u `OffsetDateTime` para que el JSON lleve la zona (por ejemplo `2026-10-24T03:52:23Z`).

## Lo que falta en el backend (el frontend ya lo contempla y avisa si no existe)
| Falta | Efecto hoy |
|---|---|
| `PATCH /api/documentos/{id}/revision` (aprobar, corregir o rechazar) | Auditoría muestra "falta el endpoint de revisión" |
| `GET /api/documentos/{id}/archivo` (archivo original) | El visor avisa que el servidor no lo entrega |
| Datos del paciente en `documentos` (nombre, RUT, edad), médico, diagnóstico, CIE-10, medicamentos | La ficha de datos extraídos sale vacía |
| `notificacion` de urgencia | No se muestra la alerta |
| Respuesta 401 (hoy 500 `INTERNAL_ERROR`) para credenciales incorrectas | El mensaje del login es genérico |
| Migración V5 con `nombre_medico` y el mapper corregido (ver "Errores del backend", punto 2) | El médico no aparece en modo Persistente |

### Cuerpo esperado del `PATCH /api/documentos/{id}/revision`
```json
{ "decision": "aprobado | corregido | rechazado", "comentario": "...", "revisor": "...",
  "datosCorregidos": { "nombrePaciente": "", "rutPaciente": "", "edadPaciente": 0, "nombreMedico": "", "matricula": "",
                       "estudioRealizado": "", "diagnosticoPrincipal": "", "cie10Sugerido": "", "prioridad": "Rutina | Urgente" } }
```
Debe guardar la revisión y poner `requiereAuditoria = false`.

## FastAPI (imagen `tinocpp/mediflow-fastapi:1.0.1`)
- `POST /analizar` con el campo `archivo` (usado en el modo "Directo").
- Respuesta: `status` (`procesado` o `pendiente_revision_humana`), `documento_id` (UUID del original en OCI), `contenido`,
  `clasificacion` y `datos_extraidos`. `requiere_auditoria_humana` y `cola_enrutamiento` vienen **dentro de `clasificacion`**
  (no hay `decision_enrutamiento`, `justificacion` ni `medicamentos`). Los datos que faltan llegan como `SIN NOMBRE`,
  `SIN RUT`, `SIN MATRICULA`, `SIN DEFINIR`, etc.
- Errores: `detail` puede ser un objeto `{ mensaje, etapa, documento_id }`; el frontend muestra `mensaje`.
- El modo directo desde el navegador necesita CORS para `http://localhost:5173`, o usar el proxy de Vite.
- Hoy no existe `/analizar-texto`: el frontend envía el texto como archivo `.txt`.
