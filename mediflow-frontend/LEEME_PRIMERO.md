# Cómo aplicar estos archivos

Copia el contenido de esta carpeta sobre `mediflow-frontend/` respetando las rutas (reemplaza los existentes).

## 1. Borra los duplicados u obsoletos
```powershell
Remove-Item src\components\layout\AppShell.tsx
Remove-Item src\components\PriorityBadge.tsx, src\components\StatusBadge.tsx, src\components\StatCard.tsx
```
`src/components/AppShell.tsx` queda como único AppShell (export default).

## 2. Variables de entorno
```powershell
copy .env.example .env
```
Ajusta las URLs si tus backends usan otros puertos y reinicia `npm run dev`.

## 3. design-system.ts
Tu `src/lib/design-system.ts` no me llegó. Si el tuyo ya exporta `cn`, `colors`, `spacing`, `borderRadius`,
`shadows`, `typography`, `animation`, `breakpoints` y `zIndex`, déjalo. Si le faltan escalas de color
(`brand`, `success`, `warning`, `danger`, `info`, `neutral`, tonos 50 a 900), usa `OPCIONAL/design-system.ts`.

## 4. Verifica
```powershell
npm run typecheck
npm run dev
```

## Pantallas
| Ruta | Pantalla | Acceso |
|---|---|---|
| `/` | Landing | público |
| `/login`, `/registro` | Autenticación | público |
| `/inicio` | Dashboard | sesión |
| `/procesar` | Archivo, texto pegado y 3 casos de prueba | sesión |
| `/documentos/:id` | Detalle del documento | sesión |
| `/colas`, `/historial` | Colas e historial | sesión |
| `/auditoria` | Auditoría humana (aprobar, corregir, rechazar) | ADMIN, AUDITOR |
| `/configuracion` | Umbral, términos de urgencia y destinos | ADMIN |

Lo que el backend debe devolver está en `CONTRATO_BACKEND.md`.
