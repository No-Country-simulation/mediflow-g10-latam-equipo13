import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/spring': { target: 'http://localhost:8080', changeOrigin: true, rewrite: (p) => p.replace(/^\/spring/, '') },
      '/fastapi': { target: 'http://localhost:8000', changeOrigin: true, rewrite: (p) => p.replace(/^\/fastapi/, '') },
    },
  },
})