# Etapa 1: compila el jar con el Maven Wrapper (no hace falta Maven instalado).
FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw -B -q dependency:go-offline
COPY src/ src/
# Para correr las pruebas unitarias en la construcción: --build-arg SKIP_TESTS=false
ARG SKIP_TESTS=true
RUN ./mvnw -B -q package -DskipTests=${SKIP_TESTS}

# Etapa 2: imagen liviana solo con el JRE y un usuario sin privilegios.
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 1001 mediflow
COPY --from=build /src/target/*.jar app.jar
USER mediflow
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=120s --retries=5 \
    CMD curl -fs http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
