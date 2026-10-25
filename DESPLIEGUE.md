# Despliegue gratis

```
Navegador ──► Vercel (frontend) ──/spring/*──► Hugging Face Space: Spring Boot ──► FastAPI (mismo contenedor)
                                                        │
                                                        └──► Aiven: MySQL (con SSL)
```

- **Vercel** sirve el frontend (`mediflow-frontend/vercel.json`) y reenvía `/spring/*` al backend.
- **Hugging Face Spaces** (Docker, plan gratis: 2 vCPU y 16 GB) corre Spring y el agente de IA en un solo
  contenedor (`deploy/huggingface/`). Solo Spring es público: FastAPI escucha dentro del contenedor, así nadie usa
  el motor de IA (ni gasta la cuota de Gemini) sin pasar por el login.
- **Aiven** aloja MySQL en su plan gratis, con conexión cifrada.
- En producción el modo **Directo** del frontend se desactiva solo; se procesa en modo **Persistente**.
- Costo: **0**, sin tarjeta. El Space se duerme tras 48 h sin visitas y despierta solo con la primera (1–2 min).

## 1. Base de datos en Aiven

1. Crea una cuenta en [aiven.io](https://aiven.io) (con GitHub o Google).
2. **Create service → MySQL → plan Free**, la región disponible más cercana, nombre `mediflow-db` → **Create**.
3. Cuando quede en **Running**, en **Overview → Connection information** están *Host*, *Port*, *User*
   (`avnadmin`), *Password* y *Database* (`defaultdb`).

La URL de conexión para Spring queda así (con tu host y puerto):

```
jdbc:mysql://HOST:PORT/defaultdb?sslMode=REQUIRED&serverTimezone=UTC
```

Las tablas las crea Spring al arrancar (Flyway). Aiven exige llave primaria en cada tabla y todas la tienen.

## 2. Space en Hugging Face

1. Crea una cuenta en [huggingface.co](https://huggingface.co) → **New Space**:
   - **Space name:** `mediflow-api` · **SDK:** **Docker** (plantilla *Blank*) · **Hardware:** *CPU basic* (gratis).
   - **Visibility:** **Public**. Vercel necesita llegar a la API; los archivos del Space no tienen claves.
2. En el Space → **Files → Add file → Upload files**: sube los tres archivos de `deploy/huggingface/`
   (`Dockerfile`, `arrancar.sh` y `README.md`, que reemplaza al que crea Hugging Face) → **Commit**.
3. **Settings → Variables and secrets.** Como *Secrets* (no se muestran después de guardarlos):

| Secreto | Valor |
|---|---|
| `DB_URL` | La URL `jdbc:mysql://…` del paso 1 |
| `DB_USER` | `avnadmin` |
| `DB_PASSWORD` | La contraseña de Aiven |
| `JWT_SECRET` | 48 bytes aleatorios en base64 (ver abajo) |
| `MEDIFLOW_ADMIN_USER` | Usuario del administrador inicial |
| `MEDIFLOW_ADMIN_PASSWORD` | Contraseña del administrador inicial (mínimo 8 caracteres) |
| `GEMINI_API_KEY` | Clave de Google Gemini |
| `OCI_USER`, `OCI_TENANCY`, `OCI_FINGERPRINT`, `OCI_REGION`, `OCI_KEY_CONTENT` | Opcionales: activan OCI Object Storage (ver `.env.example`) |

   Y como *Variable* (pública): `GEMINI_MODEL` = `gemini-3.8-flash`.

4. Hugging Face construye la imagen (la primera vez, 5–10 minutos; se ve en **Logs → Build**). Cuando diga
   **Running**, la API queda en `https://<usuario>-mediflow-api.hf.space`. Comprobación:
   `https://<usuario>-mediflow-api.hf.space/swagger-ui/index.html`.

Para generar `JWT_SECRET` en tu equipo (no lo pegues en chats ni en el repositorio):

```bash
openssl rand -base64 48
```

En Windows PowerShell 5.1:

```powershell
$b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

La imagen usa el código de la rama `main` de GitHub. Para tomar cambios nuevos: **Settings → Factory rebuild**.

## 3. Conectar Vercel con el backend

En `mediflow-frontend/vercel.json`, agrega esta regla **al inicio** de `rewrites`:

```json
{ "source": "/spring/:ruta*", "destination": "https://<usuario>-mediflow-api.hf.space/:ruta*" },
```

Haz push a `main`: Vercel publica solo. Prueba el login con el administrador inicial y los tres casos de prueba.

Si los análisis largos de Gemini (1 a 5 minutos cuando está saturado) se cortan en algún proxy, la alternativa
es que el navegador llame directo al Space: variable `VITE_SPRING_BOOT_URL` en el proyecto de Vercel con la URL
del Space y, en Spring, permitir el origen del sitio de Vercel (CORS).

## Problemas frecuentes

| Síntoma | Qué revisar |
|---|---|
| El Space queda en *Build error* | **Logs → Build**: casi siempre es la descarga de dependencias; **Factory rebuild** |
| El Space queda en *Runtime error* | **Logs → Container**: si dice *Communications link failure*, revisa `DB_URL`, usuario y contraseña de Aiven |
| El login dice "no está conectado a este despliegue" | Falta el rewrite del paso 3 o el Space está dormido (ábrelo una vez) |

## Alternativa: VM Always Free de OCI

Si hay capacidad Ampere en tu región, una VM gratis de OCI corre todo (incluido MySQL) con el Docker Compose
del proyecto y Caddy para el HTTPS (`docker-compose.prod.yml`, `infra/caddy/Caddyfile`).

1. **Compute → Instances → Create instance:** Ubuntu 24.04, *VM.Standard.A1.Flex* (1–4 OCPU, 6–24 GB), IP
   pública y **Generate a key pair for me** (guarda la llave privada).
2. **Subnet → Security Lists → Add Ingress Rules:** `0.0.0.0/0` TCP 80 y TCP 443.
3. Por SSH (`ssh -i <llave> ubuntu@<IP>`):

   ```bash
   git clone https://github.com/No-Country-simulation/mediflow-g10-latam-equipo13.git mediflow
   cd mediflow && bash scripts/instalar-servidor.sh
   ```

   El script instala Docker, abre el firewall de la VM, pide las claves en la terminal (las de la base y el JWT
   las genera al azar), propone un dominio gratis `<ip-con-guiones>.sslip.io` y levanta los contenedores.
4. En Vercel, el rewrite apunta a `https://<ip-con-guiones>.sslip.io/spring/:ruta*`.

"Out of capacity" es frecuente en la capa gratis: cambia de *Availability domain*, baja a 1 OCPU o reintenta
más tarde.

## Seguridad

- Las claves (Gemini, base de datos, JWT, OCI, administrador) van solo en los secretos del Space o en el `.env`
  del servidor: nunca en el repositorio.
- Usa documentos de prueba con datos inventados: los archivos se envían a un servicio externo de IA.
- Al terminar el hackathon, rota las claves de Gemini y OCI, y la contraseña de Aiven.
