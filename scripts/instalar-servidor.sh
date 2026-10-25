#!/usr/bin/env bash
# Instala el backend de MediFlow en una VM Ubuntu (OCI Always Free): Docker, firewall, .env y
# contenedores (MySQL, FastAPI, Spring y Caddy con HTTPS). El frontend lo sirve Vercel.
#
# Uso, en la VM y desde la carpeta del repositorio:   bash scripts/instalar-servidor.sh
# Se puede volver a correr: actualiza el código y reinicia los contenedores sin tocar el .env ni la base.
# Las claves se escriben aquí, en la terminal de la VM: nunca van al repositorio.
set -euo pipefail

cd "$(dirname "$0")/.."

# Solo Caddy (80/443) queda abierto; los demás puertos escuchan únicamente dentro de la VM.
COMPOSE=(sudo env MYSQL_PORT=127.0.0.1:3306 FASTAPI_PORT=127.0.0.1:8002 BACKEND_PORT=127.0.0.1:8088
  docker compose -f docker-compose.yml -f docker-compose.prod.yml)

paso() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }

paso "1/5 Docker y herramientas"
if ! command -v docker >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo apt-get install -y docker.io docker-compose-v2 git openssl curl
  sudo systemctl enable --now docker
fi
sudo docker compose version

paso "2/5 Firewall de la VM (puertos 80 y 443)"
# Las imágenes Ubuntu de OCI traen reglas de iptables que rechazan todo salvo SSH.
for regla in "tcp 80" "tcp 443" "udp 443"; do
  set -- $regla
  sudo iptables -C INPUT -p "$1" --dport "$2" -j ACCEPT 2>/dev/null || sudo iptables -I INPUT 1 -p "$1" --dport "$2" -j ACCEPT
done
if command -v netfilter-persistent >/dev/null 2>&1; then sudo netfilter-persistent save; fi

paso "3/5 Código"
git pull --ff-only || echo "Aviso: no se pudo actualizar el código (¿cambios locales?). Se usa el actual."

paso "4/5 Configuración (.env)"
if [ -f .env ]; then
  echo "Ya existe .env: se mantiene. Para regenerarlo, bórralo y vuelve a correr el script."
else
  ip=$(curl -fsS --max-time 10 https://api.ipify.org || true)
  sugerido=${ip:+${ip//./-}.sslip.io}
  read -rp "Dominio para HTTPS [${sugerido}]: " dominio
  dominio=${dominio:-$sugerido}
  [ -n "$dominio" ] || { echo "Falta el dominio."; exit 1; }

  read -rp "Usuario del administrador inicial [admin]: " admin
  admin=${admin:-admin}
  while :; do
    read -rsp "Contraseña del administrador (mínimo 8 caracteres, sin comillas simples): " clave; echo
    if [ ${#clave} -lt 8 ]; then echo "Muy corta."; elif [[ $clave == *"'"* ]]; then echo "Sin comillas simples."; else break; fi
  done
  read -rsp "Clave de Google Gemini (GEMINI_API_KEY): " gemini; echo
  [ -n "$gemini" ] || { echo "Falta la clave de Gemini."; exit 1; }

  aleatorio() { openssl rand -base64 48 | tr -d '\n/+=' | cut -c1-"$1"; }
  umask 077
  cat > .env <<EOF
DOMINIO=$dominio
MYSQL_DATABASE=mediflow
DB_USER=mediflow
DB_PASSWORD=$(aleatorio 32)
MYSQL_ROOT_PASSWORD=$(aleatorio 32)
JWT_SECRET=$(aleatorio 64)
MEDIFLOW_ADMIN_USER='$admin'
MEDIFLOW_ADMIN_PASSWORD='$clave'
GEMINI_API_KEY='$gemini'
GEMINI_MODEL=gemini-3.8-flash
OCI_PROFILE=DEFAULT
ALERTA_WEBHOOK_URL=
ALERTA_INCLUIR_PACIENTE=false
EOF
  unset clave gemini
  echo "Se creó .env (solo lo puede leer tu usuario). Las claves de la base y del JWT se generaron al azar."
fi
dominio=$(sed -n 's/^DOMINIO=//p' .env)

paso "5/5 Contenedores (la primera vez compila y tarda varios minutos)"
"${COMPOSE[@]}" up -d --build mysql fastapi backend caddy

echo "Esperando a que la API responda en https://$dominio/spring/ ..."
for _ in $(seq 1 60); do
  codigo=$(curl -s -o /dev/null --max-time 10 -w '%{http_code}' "https://$dominio/spring/v3/api-docs" || true)
  if [ "$codigo" = "200" ]; then
    printf '\n\033[1;32mListo: https://%s/spring/ responde.\033[0m\n' "$dominio"
    break
  fi
  sleep 10
done
"${COMPOSE[@]}" ps
echo
echo "Siguiente paso: en mediflow-frontend/vercel.json, agrega al inicio de \"rewrites\":"
echo "  { \"source\": \"/spring/:ruta*\", \"destination\": \"https://$dominio/spring/:ruta*\" },"
echo "Logs:      ${COMPOSE[*]} logs -f backend"
