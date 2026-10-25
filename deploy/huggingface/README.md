---
title: MediFlow API
emoji: 🏥
colorFrom: indigo
colorTo: green
sdk: docker
app_port: 7860
pinned: false
short_description: Backend de MediFlow (Spring Boot + agente de IA)
---

# MediFlow API

Backend del agente de triaje clínico MediFlow (Hackathon ONE G10, equipo 13 LATAM): API de Spring Boot y
agente de IA en FastAPI con LangGraph y Gemini. El frontend está en Vercel.

- Código fuente: https://github.com/No-Country-simulation/mediflow-g10-latam-equipo13
- Documentación de la API: `/swagger-ui/index.html`

La imagen se construye con el código de la rama `main` del repositorio. Las claves (Gemini, base de datos,
JWT y administrador) se configuran como secretos del Space; no están en estos archivos.
