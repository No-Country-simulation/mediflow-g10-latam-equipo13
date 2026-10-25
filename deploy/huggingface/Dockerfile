# Backend de MediFlow para Hugging Face Spaces (SDK Docker), en un solo contenedor:
#   - Spring Boot: API pública en el puerto 7860 (el que expone el Space).
#   - FastAPI (agente de IA): solo dentro del contenedor, en 127.0.0.1:8000.
# El código se descarga de GitHub al construir. La base de datos es externa (MySQL en Aiven) y las claves
# llegan como secretos del Space (variables de entorno en tiempo de ejecución).

# --- Etapa 1: código fuente y compilación de Spring ---
FROM eclipse-temurin:21-jdk AS spring
ARG REPO=No-Country-simulation/mediflow-g10-latam-equipo13
ARG RAMA=main
# Si la rama cambia, el archivo descargado cambia y Docker vuelve a construir desde aquí.
ADD https://github.com/${REPO}/archive/refs/heads/${RAMA}.tar.gz /tmp/codigo.tar.gz
RUN mkdir /src && tar -xzf /tmp/codigo.tar.gz --strip-components=1 -C /src
WORKDIR /src/Back-End/MediFlow
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw -B -q package -DskipTests

# --- Etapa 2: imagen final con Python 3.11 y el JRE 21 ---
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    JAVA_HOME=/opt/java/openjdk
ENV PATH="${JAVA_HOME}/bin:${PATH}"
COPY --from=eclipse-temurin:21-jre /opt/java/openjdk /opt/java/openjdk

# Hugging Face corre el contenedor con el usuario 1000.
RUN useradd -m -u 1000 user
WORKDIR /home/user/app

COPY --from=spring /src/Backend_FastAPI/requirements.txt fastapi/requirements.txt
RUN pip install -r fastapi/requirements.txt
COPY --from=spring --chown=user /src/Backend_FastAPI/ fastapi/
COPY --from=spring --chown=user /src/Back-End/MediFlow/target/*.jar app.jar
COPY --chown=user arrancar.sh .
RUN sed -i 's/\r$//' arrancar.sh && chmod +x arrancar.sh

USER user
ENV HOME=/home/user \
    PORT=7860 \
    SERVER_PORT=7860 \
    PYTHON_URL=http://127.0.0.1:8000
EXPOSE 7860
CMD ["./arrancar.sh"]
