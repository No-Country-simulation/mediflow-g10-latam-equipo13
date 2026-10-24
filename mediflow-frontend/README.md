# MediFlow — Frontend

Interfaz web de MediFlow (Hackathon ONE G10, equipo 13): procesa documentos clínicos con IA, los clasifica, extrae sus
datos y los enruta; las personas auditoras revisan los casos dudosos.

**Stack:** React 18 · TypeScript · Vite 5 · Tailwind CSS 3 · React Router 6 · lucide-react.

## Requisitos
- Node.js 18 o superior
- Backends en marcha (ver "Servicios"): Spring Boot (API principal) y FastAPI (motor de IA)

## Puesta en marcha
```bash
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm run dev               # http://localhost:5173
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con proxy a los backends |
| `npm run typecheck` | Revisa los tipos de TypeScript |
| `npm run build` | Compila para producción (`dist/`) |
| `npm run preview` | Sirve el build local |

## Variables de entorno (`.env`)
| Variable | Para qué sirve |
|---|---|
| `VITE_SPRING_BOOT_URL` | URL de la API principal. Con `/spring` usa el proxy de Vite |
| `VITE_FASTAPI_URL` | URL del motor de IA. Con `/fastapi` usa el proxy de Vite |
| `SPRING_TARGET` | Dónde corre Spring (por ejemplo `http://localhost:8088`) |
| `FASTAPI_TARGET` | Dónde corre FastAPI (por ejemplo `http://localhost:8002`) |
| `VITE_SKIP_AUTH` | `true` salta el login. **Solo para revisar pantallas en desarrollo** |

Después de cambiar el `.env`, reinicia `npm run dev`. El `.env` nunca se sube a Git.

## Servicios que consume
```
Navegador (:5173) ──► Spring Boot   login, documentos, colas, historial, usuarios
                 └──► FastAPI       análisis con IA (modo "Directo")
```
El contrato exacto de cada endpoint está en [`CONTRATO_BACKEND.md`](./CONTRATO_BACKEND.md).

## Pantallas y roles
| Ruta | Pantalla | Quién entra |
|---|---|---|
| `/` | Landing | Público |
| `/login`, `/registro` | Acceso por nombre de usuario y contraseña | Público |
| `/inicio` | Resumen | Con rol asignado |
| `/procesar` | Subir archivo, pegar texto o usar casos de prueba | Con rol asignado |
| `/documentos/:id` | Detalle del documento | Con rol asignado |
| `/colas`, `/historial` | Colas de enrutamiento e historial | Con rol asignado |
| `/auditoria` | Aprobar, corregir o rechazar documentos de baja confianza | ADMIN, AUDITOR |
| `/usuarios` | Asignar roles a las cuentas nuevas | ADMIN |
| `/configuracion` | Umbral de confianza, términos de urgencia y destinos | ADMIN |

Las cuentas nuevas quedan como `NO_ASIGNADO` y ven "Tu cuenta está pendiente de aprobación" hasta que un administrador
les asigne un rol. Después de que se lo asignen, deben cerrar sesión y volver a entrar (el rol viaja dentro del token).

## Modos de procesamiento
- **Persistente** (por defecto con sesión): el documento se guarda y aparece en colas, historial y auditoría.
- **Directo**: solo analiza con la IA; no se guarda nada.

La "confianza" que se muestra es una **estimación del modelo de IA**, no una probabilidad exacta. Los documentos por
debajo del umbral configurado se marcan para revisión humana.

## Estructura
```
src/
├── components/   AppShell, ProtectedRoute, DocumentViewer, Logo y ui/ (Button, Card, Modal, Toast...)
├── lib/          api.tsx (clientes y tipos), triageConfig.ts, demoCases.ts, archivo.ts, design-system.ts
└── pages/        una pantalla por ruta
```

## Probar el flujo completo
1. Regístrate en `/registro` y pide a un administrador que te asigne un rol (o asígnatelo en la base de datos si eres el primero).
2. En `/procesar` → **Casos de prueba**, procesa los tres: rutina, urgencia y ambiguo.
3. Revisa que aparezcan en **Colas** e **Historial**, y que el ambiguo llegue a **Auditoría**.

Usa documentos con datos inventados: los archivos se envían a un servicio externo de IA.

## Solución de problemas
| Síntoma | Causa probable |
|---|---|
| "No se pudo conectar con el servidor principal" | Spring apagado, o `SPRING_TARGET` con otro puerto |
| Barra lateral con "sin conexión" | El servicio de esa fila no responde |
| 401 en todas las pantallas | Sesión vencida; vuelve a iniciar sesión (o quedó `VITE_SKIP_AUTH=true`) |
| "Acceso restringido" | Tu rol no incluye esa pantalla |
| Colas o auditoría vacías | Aún no hay documentos procesados en modo Persistente (el modo Directo no guarda nada) |
| Médico vacío en Colas, Historial o Detalle | Spring todavía no guarda el médico (ver "Errores del backend" en el contrato) |
