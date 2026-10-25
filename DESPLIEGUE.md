# Despliegue en la nube: Vercel + Railway

```
Navegador ──► Vercel (frontend)  ──/spring/*──►  Railway: backend (Spring Boot, URL pública HTTPS)
                                                    ├─► Railway: fastapi (motor de IA, red privada)
                                                    └─► Railway: MySQL (red privada, disco persistente)
```

- **Vercel** sirve el frontend (`mediflow-frontend/vercel.json`) y reenvía `/spring/*` al backend.
- **Railway** corre los tres servicios del backend. Solo Spring tiene URL pública: FastAPI y MySQL quedan en la
  red privada, así nadie puede usar el motor de IA (ni gastar la cuota de Gemini) sin pasar por el login.
- En producción el modo **Directo** del frontend se desactiva solo, porque el motor de IA no es accesible
  desde el navegador. Se procesa en modo **Persistente**.

## 1. Proyecto en Railway

1. Entra a [railway.com](https://railway.com) con tu cuenta de GitHub → **New Project → Empty Project**.
2. El repositorio es de la organización *No-Country-simulation*: para desplegar desde GitHub, la app de Railway
   debe estar autorizada en esa organización (puede requerir aprobación de un administrador). Sin esa
   autorización, ver [Desplegar sin conectar GitHub](#desplegar-sin-conectar-github).

## 2. Base de datos

**+ New → Database → MySQL.** Railway la crea con disco persistente y sus propias credenciales. Las tablas las
crea Spring al arrancar (Flyway), con la base vacía.

## 3. Servicio `fastapi` (motor de IA, privado)

**+ New → GitHub Repo →** este repositorio. En **Settings**:

- **Nombre del servicio:** `fastapi` (Spring lo busca por ese nombre).
- **Root Directory:** `Backend_FastAPI` (usa su `Dockerfile`).
- **No** generes dominio público.

| Variable | Valor |
|---|---|
| `UVICORN_HOST` | `::` (escucha por IPv6, que usa la red privada de Railway) |
| `GEMINI_API_KEY` | Clave de Google Gemini |
| `GEMINI_MODEL` | `gemini-3.8-flash` |
| `OCI_USER` | Línea `user=` del archivo `config` de OCI (opcional, igual que las siguientes) |
| `OCI_TENANCY` | Línea `tenancy=` |
| `OCI_FINGERPRINT` | Línea `fingerprint=` |
| `OCI_REGION` | Línea `region=` |
| `OCI_KEY_CONTENT` | Contenido completo del archivo `.pem` de la llave privada (con sus líneas `BEGIN`/`END`). Si el panel no acepta varias líneas, escribe `\n` donde van los saltos |
| `ALERTA_WEBHOOK_URL` | Webhook de Slack, Discord o n8n para los casos urgentes (opcional) |

Sin las variables de OCI el agente funciona igual y solo omite el guardado en los buckets.

## 4. Servicio `backend` (Spring Boot, público)

**+ New → GitHub Repo →** el mismo repositorio. En **Settings**:

- **Nombre del servicio:** `backend` · **Root Directory:** `Back-End/MediFlow`.
- **Networking → Generate Domain** con el puerto que detecta Railway (Spring escucha en `PORT`, por defecto 8080).
  Da una URL `https://backend-xxxx.up.railway.app` con HTTPS incluido.

| Variable | Valor (copiar tal cual: Railway reemplaza lo de `${{…}}`) |
|---|---|
| `DB_URL` | `jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` |
| `DB_USER` | `${{MySQL.MYSQLUSER}}` |
| `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `PYTHON_URL` | `http://${{fastapi.RAILWAY_PRIVATE_DOMAIN}}:8000` |
| `JWT_SECRET` | 48 bytes aleatorios en base64 (ver abajo) |
| `MEDIFLOW_ADMIN_USER` | Usuario del administrador inicial |
| `MEDIFLOW_ADMIN_PASSWORD` | Contraseña del administrador inicial (mínimo 8 caracteres) |

Para generar `JWT_SECRET` en tu equipo (no lo pegues en chats ni en el repositorio):

```bash
openssl rand -base64 48
```

En Windows PowerShell 5.1:

```powershell
$b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

Comprobación: `https://backend-xxxx.up.railway.app/swagger-ui/index.html` debe abrir la documentación de la API.

## 5. Conectar Vercel con el backend

En `mediflow-frontend/vercel.json`, agrega esta regla **al inicio** de `rewrites` (con la URL real de Railway):

```json
{ "source": "/spring/:ruta*", "destination": "https://backend-xxxx.up.railway.app/:ruta*" },
```

Haz push a `main`: Vercel publica solo. Prueba el login con el administrador inicial y los tres casos de prueba.

Si los análisis largos de Gemini (1 a 5 minutos cuando está saturado) se cortan en el proxy de Vercel, la
alternativa es que el navegador llame directo a Railway: variable `VITE_SPRING_BOOT_URL` en el proyecto de Vercel
con la URL del backend, y en Spring permitir el origen del sitio de Vercel (CORS).

## Desplegar sin conectar GitHub

Con la CLI de Railway se sube el código desde tu equipo (como `vercel` con el frontend):

```bash
npx @railway/cli login
npx @railway/cli link                      # elige el proyecto
cd Backend_FastAPI    && npx @railway/cli up --service fastapi
cd ../Back-End/MediFlow && npx @railway/cli up --service backend
```

Los servicios y las variables se crean igual que arriba, desde el panel.

## Seguridad

- Las claves (Gemini, OCI, JWT, administrador) se escriben solo en el panel de Railway: nunca en el repositorio.
- Usa documentos de prueba con datos inventados: los archivos se envían a un servicio externo de IA.
- Al terminar el hackathon, rota las claves de Gemini y OCI.
