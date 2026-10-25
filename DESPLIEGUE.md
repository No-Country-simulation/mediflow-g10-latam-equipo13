# Despliegue gratis: Vercel (frontend) + VM Always Free de OCI (backend)

```
Navegador ──► Vercel (frontend) ──/spring/*──► VM de OCI: Caddy (HTTPS) ──► Spring Boot
                                                                         ├─► FastAPI (red interna)
                                                                         └─► MySQL (red interna)
```

- **Vercel** sirve el frontend (`mediflow-frontend/vercel.json`) y reenvía `/spring/*` a la VM.
- **La VM** corre el mismo Docker Compose del proyecto, más **Caddy**, que saca el certificado HTTPS gratis.
  Solo la API de Spring queda expuesta: FastAPI y MySQL quedan en la red interna, así nadie usa el motor de IA
  (ni gasta la cuota de Gemini) sin pasar por el login.
- En producción el modo **Directo** del frontend se desactiva solo; se procesa en modo **Persistente**.
- Costo: **0**. La VM Ampere de la capa Always Free de OCI no vence.

## 1. Crear la VM en OCI

1. En [cloud.oracle.com](https://cloud.oracle.com), menú ☰ → **Compute → Instances → Create instance**.
2. **Name:** `mediflow`.
3. **Image and shape → Edit:**
   - **Image:** Canonical **Ubuntu 24.04**.
   - **Shape:** **Ampere → VM.Standard.A1.Flex**, **2 OCPU y 12 GB** (dentro de la capa gratis, que llega a 4/24).
4. **Networking:** deja crear una VCN y una subred pública nuevas, con **Assign a public IPv4 address** activado.
5. **Add SSH keys:** **Generate a key pair for me → Save private key**. Guarda el archivo (por ejemplo en
   `C:\Users\<tu usuario>\.ssh\mediflow-oci.key`). Sin esa llave no se puede entrar a la VM.
6. **Create.** Cuando quede en **Running**, copia la **Public IP address**.

Si aparece **"Out of capacity"**: cambia el **Availability domain** (AD-2, AD-3), prueba con 1 OCPU y 6 GB, o
reintenta más tarde. Es frecuente en la capa gratis y no tiene que ver con tu cuenta.

## 2. Abrir los puertos 80 y 443

En la página de la instancia → **Subnet** (enlace) → **Security Lists → Default Security List → Add Ingress Rules**:

| Source CIDR | IP Protocol | Destination Port Range |
|---|---|---|
| `0.0.0.0/0` | TCP | `80` |
| `0.0.0.0/0` | TCP | `443` |

El 22 (SSH) ya viene abierto. El firewall interno de la VM lo abre el script del paso 3.

## 3. Instalar MediFlow en la VM

Desde tu equipo, entra por SSH (en Windows, PowerShell):

```powershell
ssh -i C:\Users\<tu usuario>\.ssh\mediflow-oci.key ubuntu@<IP-PUBLICA>
```

Si Windows reclama permisos de la llave ("UNPROTECTED PRIVATE KEY FILE"):

```powershell
icacls C:\Users\<tu usuario>\.ssh\mediflow-oci.key /inheritance:r /grant:r "$($env:USERNAME):R"
```

Ya en la VM:

```bash
git clone -b main https://github.com/No-Country-simulation/mediflow-g10-latam-equipo13.git mediflow
cd mediflow
bash scripts/instalar-servidor.sh
```

El script instala Docker, abre el firewall de la VM y te pide:

- **Dominio:** propone `<ip-con-guiones>.sslip.io`, una dirección gratis que apunta a la IP de la VM. Acepta con Enter.
- **Usuario y contraseña del administrador inicial** de MediFlow.
- **Clave de Google Gemini.**

Las contraseñas de la base y el secreto del JWT se generan al azar. Todo queda en `mediflow/.env`, que solo
puede leer tu usuario de la VM y nunca va al repositorio. Al final debe decir
**"Listo: https://…sslip.io/spring/ responde"**. La primera vez tarda varios minutos (compila Spring).

Para actualizar después de un cambio en `main`: `cd mediflow && bash scripts/instalar-servidor.sh`.

### OCI Object Storage (opcional)

Sin configurarlo, el agente funciona igual y solo omite los buckets. Para activarlo, agrega a `mediflow/.env`
las cinco variables `OCI_USER`, `OCI_TENANCY`, `OCI_FINGERPRINT`, `OCI_REGION` y `OCI_KEY_CONTENT` (ver
`.env.example`) y vuelve a correr el script.

## 4. Conectar Vercel con la VM

En `mediflow-frontend/vercel.json`, agrega esta regla **al inicio** de `rewrites` (el script la imprime con tu
dominio):

```json
{ "source": "/spring/:ruta*", "destination": "https://<ip-con-guiones>.sslip.io/spring/:ruta*" },
```

Haz push a `main`: Vercel publica solo. Prueba el login con el administrador inicial y los tres casos de prueba.

Si los análisis largos de Gemini (1 a 5 minutos cuando está saturado) se cortan en el proxy de Vercel, la
alternativa es que el navegador llame directo a la VM: variable `VITE_SPRING_BOOT_URL` en el proyecto de Vercel
con `https://<dominio>/spring` y, en Spring, permitir el origen del sitio de Vercel (CORS).

## Problemas frecuentes

| Síntoma | Qué revisar |
|---|---|
| El script se queda esperando y no dice "Listo" | `sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml logs backend caddy` |
| Caddy no obtiene el certificado | Que los puertos 80 y 443 estén abiertos en la Security List (paso 2) |
| No conecta por SSH | Usuario `ubuntu`, la IP pública correcta y la llave descargada al crear la VM |

## Seguridad

- Las claves (Gemini, OCI, administrador) se escriben solo en la terminal de la VM: nunca en el repositorio.
- Usa documentos de prueba con datos inventados: los archivos se envían a un servicio externo de IA.
- Al terminar el hackathon, rota las claves de Gemini y OCI.
- El código también acepta plataformas sin archivos (OCI por variables, puerto en `PORT`), por si algún día
  se mueve el backend a otro proveedor.
