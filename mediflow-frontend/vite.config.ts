import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Los destinos del proxy se leen del archivo .env (sin prefijo VITE_, así no llegan al navegador).
//   SPRING_TARGET=http://localhost:8088   -> API principal (Spring Boot)
//   FASTAPI_TARGET=http://localhost:8002  -> motor de IA (FastAPI)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const spring = env.SPRING_TARGET || 'http://localhost:8080'
  const fastapi = env.FASTAPI_TARGET || 'http://localhost:8000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/spring': { target: spring, changeOrigin: true, rewrite: (p: string) => p.replace(/^\/spring/, '') },
        '/fastapi': { target: fastapi, changeOrigin: true, rewrite: (p: string) => p.replace(/^\/fastapi/, '') },
      },
    },
  }
})
