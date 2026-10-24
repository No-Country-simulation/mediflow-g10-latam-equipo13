# Etapa 1: compila la SPA con Vite.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Las llamadas a /spring y /fastapi las resuelve nginx (mismo origen: sin CORS).
ENV VITE_SPRING_BOOT_URL=/spring \
    VITE_FASTAPI_URL=/fastapi
RUN npm run build

# Etapa 2: nginx sirve los archivos estáticos y hace de proxy a los backends.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=5s --retries=5 CMD wget -qO- http://localhost/ >/dev/null || exit 1
