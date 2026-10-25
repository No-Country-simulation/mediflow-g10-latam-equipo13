#!/usr/bin/env bash
# Arranca el agente de IA (solo dentro del contenedor) y la API de Spring (pública en $PORT).
# Si cualquiera de los dos se detiene, el contenedor termina y Hugging Face lo reinicia.
set -euo pipefail

cd /home/user/app/fastapi
uvicorn main:app --host 127.0.0.1 --port 8000 &

cd /home/user/app
java -XX:MaxRAMPercentage=50 -jar app.jar &

wait -n
exit $?
