# Cómo aplicar este paquete

Este paquete contiene el frontend **completo**. Cópialo sobre `mediflow-frontend/` de tu repositorio y sobrescribe.

## 1. Borra los archivos obsoletos (ya no se usan)
```powershell
cd C:\Users\USUARIO\mediflow-g10-latam-equipo13\mediflow-frontend
Remove-Item src\components\layout -Recurse -ErrorAction SilentlyContinue
Remove-Item src\components\PriorityBadge.tsx, src\components\StatusBadge.tsx, src\components\StatCard.tsx -ErrorAction SilentlyContinue
Remove-Item src\types -Recurse -ErrorAction SilentlyContinue
```

## 2. No sobrescribas `src/lib/design-system.ts`
Ese archivo es el de tu repositorio y no viene en este paquete. Solo si no existe o le faltan escalas de color,
usa `OPCIONAL/design-system.ts`.

## 3. Variables de entorno
```powershell
copy .env.example .env
```
Ajusta `SPRING_TARGET` y `FASTAPI_TARGET` a los puertos donde corren tus backends. Reinicia `npm run dev` después.

## 4. Verifica
```powershell
npm run typecheck
npm run dev
```
El `typecheck` debe terminar sin errores.

## 5. Sube los cambios
```powershell
cd C:\Users\USUARIO\mediflow-g10-latam-equipo13
git checkout -b feature/frontend-coherente
git add mediflow-frontend
git diff --cached --name-only | Select-String "node_modules|\.env$"
git commit -m "feat(frontend): login por nombre, cuenta pendiente, usuarios, visor y configuración"
git push -u origin feature/frontend-coherente
```
La tercera línea no debe imprimir nada.
