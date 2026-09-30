# MediFlow — Frontend

Interfaz web del proyecto MediFlow (Hackathon ONE G10), construida con **React + TypeScript + Vite + Tailwind CSS**, ya conectada al backend en FastAPI.

## Interfaces incluidas

1. **Landing (`/`)** — presentación del producto.
2. **Inicio / Dashboard (`/inicio`)** — documentos procesados, en revisión y enrutados, con tabla en vivo desde el backend.
3. **Procesar documento (`/procesar`)** — sube un documento real y lo envía al backend para su análisis.
4. **Detalle de documento (`/documentos/:id`)** — datos extraídos y decisión de enrutamiento, con pestañas.
5. **Colas de enrutamiento (`/colas`)** — documentos agrupados por destino, en vivo desde el backend.

## Cómo correrlo

```bash
npm install
cp .env.example .env
npm run dev
```

Se abre en `http://localhost:5173`. **Necesita el backend corriendo** en `http://localhost:8000` (ver `/mediflow-backend/README.md`) para poder subir y ver documentos reales.

## Conexión con el backend

El archivo `.env` define la URL del backend:
```
VITE_API_BASE_URL=http://localhost:8000
```

Toda la comunicación vive en `src/lib/api.ts`:
- `procesarDocumento(file)` → `POST /api/v1/documentos/procesar`
- `listarDocumentos()` → `GET /api/v1/documentos`
- `obtenerDocumento(id)` → `GET /api/v1/documentos/{id}`

Si el backend no está corriendo, cada pantalla muestra un aviso de error en vez de fallar en silencio.

## Estructura

```
src/
├── components/    # Sidebar, badges, tarjetas de estadísticas
├── pages/         # Una carpeta por interfaz/pantalla
├── lib/           # Cliente de API real (api.ts)
├── types/         # Tipos TypeScript que reflejan el contrato JSON del backend
```

## Diseño

Paleta y tipografía en `tailwind.config.js`. Color principal: azul (`brand-500` #2f6fed). Estados: verde = rutina/ok, ámbar = advertencia, rojo = urgente.
