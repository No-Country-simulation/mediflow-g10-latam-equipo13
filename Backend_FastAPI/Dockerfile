FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1
WORKDIR /app
COPY requirements.txt .
RUN python -m pip install --upgrade pip && pip install -r requirements.txt
COPY . .
# uvicorn lee UVICORN_HOST y UVICORN_PORT. En Railway se define UVICORN_HOST=:: para escuchar también
# por IPv6 (la red privada entre servicios lo necesita).
ENV UVICORN_HOST=0.0.0.0 \
    UVICORN_PORT=8000
EXPOSE 8000
CMD ["uvicorn", "main:app"]
