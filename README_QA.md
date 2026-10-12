# 🧪 Reporte de Ejecución y Trazabilidad de Pruebas - QA Tester (MediFlow)

Este documento registra de manera formal el proceso de pruebas, la configuración del entorno, los escenarios validados y el registro detallado de incidencias y errores encontrados durante la ejecución del motor de clasificación y extracción multimodal de **MediFlow**.

---

## ⚙️ 1. Configuración y Prerrequisitos del Entorno
* **Sistema Operativo / Terminal:** Windows 11 / PowerShell
* **Entorno de Ejecución:** Python (vía comando `py`)
* **Librerías Dependientes:** `google-genai` instalada correctamente mediante `py -m pip install google-genai`.
* **Seguridad y Credenciales:** Variable de entorno `GEMINI_API_KEY` configurada exitosamente en la sesión de PowerShell.

---

## 📋 2. Casos de Prueba Ejecutados
* **Escenario de Ingesta:** Carga de los archivos de prueba ubicados en la carpeta `recibidos/` (receta escaneada y examen de laboratorio de 6 hojas).
* **Buffer de API:** Se verificó de forma exitosa que el script logra la conexión inicial y carga el documento pesado en el buffer de la API del modelo multimodal.

---

## ❌ 3. Registro de Errores e Incidencias en el Proceso

Durante las pruebas de ejecución del script principal (`clasificador_multimodal_v2.py`), se documentaron y analizaron dos tipos de errores críticos relacionados con la disponibilidad y consumo de los modelos de IA:

### Incidencia 1: Error 503 (Saturación y Alta Demanda)
* **Modelo evaluado:** `gemini-3.6-flash` (modelo oficial configurado en el proyecto).
* **Mensaje de error en consola:**
  ```text
  Falla en el intento 3: 503 UNAVAILABLE. {'error': {'code': 503, 'message': 'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.', 'status': 'UNAVAILABLE'}}
  Se agotarón los reintentos debido a la saturación del servidor (Error 503).

  Análisis de QA: Este comportamiento demuestra que la lógica de reintentos automáticos implementada en el código funciona correctamente al intentar reconectar en múltiples ocasiones (Intentos 1, 2 y 3). Sin embargo, el flujo se detiene de forma segura debido a una saturación temporal de los servidores de la API para ese modelo.

Incidente 2: Error 404 (Modelo no disponible / Descatalogado)
Modelo evaluado: gemini-2.5-flash (cambio temporal realizado para mitigar la saturación).

Mensaje de error en consola:

Texto plano
Falla en el intento 1: 404 NOT_FOUND. {'error': {'code': 404, 'message': 'This model models/gemini-2.5-flash is no longer available to new users. We recommend you to use models/gemini-3.6-flash for the latest features...', 'status': 'NOT_FOUND'}}
Se encontró un error diferente al de saturación. Deteniendo ejecución.
Análisis de QA: Se comprobó que las versiones anteriores del modelo están descontinuadas para nuevos usuarios, lo que confirma que la arquitectura del sistema depende estrictamente de la disponibilidad del modelo principal (gemini-3.6-flash).

🎯 4. Conclusiones y Estado Actual de QA
Infraestructura Validada: La configuración de dependencias, la lectura de la API Key y la ingesta multimodal de los documentos en la carpeta recibidos/ operan de forma correcta.

Resiliencia Comprobada: El script maneja adecuadamente las excepciones de red y saturación mediante los ciclos de reintento.

Bloqueo Externo: Actualmente el proceso se encuentra detenido por factores externos de disponibilidad del servidor de la API (503), requiriendo reintentos en ventanas de menor congestión para emitir el JSON estructurado final.




# REPORTE DE QA - CLASIFICADOR MULTIMODAL V2
**Responsable:** Vanesa (QA Tester)  
**Fecha:** 26/09/2026  
**Estado:** APROBADO  
**Entorno de Ejecución:** Google Colab
**Entorno de Pruebas:** Evaluación y validación de respuestas de Gemini API directamente desde Google Colab.

---

### TESTING REALIZADO

| # | Test | Resultado | Detalles |
|---|------|-----------|----------|
| 1 | Instalación | PASÓ | google-genai instala sin errores, sintaxis válida |
| 2 | Configuración | PASÓ | API Key configurada, cliente Gemini creado exitosamente |
| 3 | Entrada (PDFs) | PASÓ | PDF prueba.pdf (0.10 MB) carga en Gemini correctamente |
| 4 | Salida JSON | PASÓ | JSON válido, estructura completa, valores correctos |

---

### VALIDACIONES COMPLETADAS

- **Clasificación:** Detecta correctamente "Receta Médica"
- **Score de Confianza:** 0.98 (dentro de rango 0-1)
- **Documento ID:** Se genera automáticamente
- **Estructura JSON:** Contiene todos los campos requeridos
- **Manejo de reintentos:** Código tiene 3 intentos + espera configurada

---

### CONCLUSIÓN

El código `clasificador_multimodal_v2.py` está **LISTO para producción**.

**Puede usarse para:**
- Procesar PDFs clínicos
- Clasificar documentos
- Extraer datos estructurados
- Enrutar a auditoría automáticamente

---
*Reporte completado por: Vanesa María del Mar González*  
*Rol: QA Tester – MediFlow*




- https://colab.research.google.com/drive/1JtFIfmW_mn6OulXYjc2zR9NAY6IOPgzH?usp=sharing

-# REPORTE QA COMPLETO - SISTEMA DE LOGIN Y REGISTRO

**Proyecto:** MediFlow - Módulo de Autenticación  
**Estado General:** NO APROBADO - 6 ERRORES ENCONTRADOS

---

## RESUMEN EJECUTIVO

| Categoría | Cantidad | Severidad |
|-----------|----------|-----------|
| Errores Críticos | 4 | BLOQUEAN EJECUCIÓN |
| Errores Medios | 2 |  AFECTAN CALIDAD |
| **TOTAL** | **6** | **NO APTO PARA PRODUCCIÓN** |

---

##  ERRORES CRÍTICOS

### CRÍTICO 1: pip install db_sqlite3 (No existe)

**Ubicación:** Celda 1

```python
!pip install db_sqlite3  #  PAQUETE NO EXISTE
```

**Problema:**
- `db_sqlite3` no es un paquete real de Python
- SQLite3 viene **incluido por defecto** en Python

**Impacto:**  Colab falla al ejecutar

**Solución:**
```python
# ELIMINAR COMPLETAMENTE esta línea
# Solo se necesita:
import sqlite3  #  Ya funciona sin instalar nada
```

---

###  CRÍTICO 2: CREATE TABLE - Sintaxis incorrecta

**Ubicación:** Celda 2

```python
mi_cursor.execute("""
   CREATE TABLE IF NOT EXISTS personal_autorizado (
       USUARIO TEXT,
       CONTRASEÑA TEXT,
       AREA TEXT,
       HORARIO TEXT,
       )  #  COMA DESPUÉS DE ÚLTIMA COLUMNA (ERROR SINTÁCTICO)
""")
```

**Problema:**
- Hay una coma después de `HORARIO TEXT` sin más columnas
- Falta la columna `CODIGO TEXT`
- Esto causa **SyntaxError**

**Impacto:** CREATE TABLE falla

**Solución:**
```python
mi_cursor.execute("""
   CREATE TABLE IF NOT EXISTS personal_autorizado (
       USUARIO TEXT,
       CONTRASEÑA TEXT,
       AREA TEXT,
       HORARIO TEXT,
       CODIGO TEXT
   )
""")
```

---

### CRÍTICO 3: INSERT - Mismatch de columnas y placeholders

**Ubicación:** Celda 2, Línea 11-25

```python
AñadirDatos= [
("usuario1","contraseña1","area1","horario1","codigo1"),  # ← 5 VALORES
("usuario2","contraseña2","area2","horario2","codigo2"),
("usuario3","contraseña3","area3","horario3","codigo3"),
("usuario4","contraseña4","area4","horario4","codigo4"),
("usuario5","contraseña5","area5","horario5","codigo5"),
]

mi_cursor.executemany("INSERT INTO personal_autorizado VALUES (?,?,?,?)",AñadirDatos)
#                                                              SOLO 4 PLACEHOLDERS
```

**Problema:**
- Datos tienen **5 valores** por tupla
- INSERT espera **4 valores**
- **Mismatch → ValueError en runtime**

**Impacto:** INSERT falla, no se cargan datos

**Solución:**
```python
# Opción 1: Quitar CODIGO de los datos
AñadirDatos= [
("usuario1","contraseña1","area1","horario1"),  #  4 VALORES
("usuario2","contraseña2","area2","horario2"),
...
]

# Opción 2: Agregar CODIGO en INSERT (RECOMENDADO)
mi_cursor.executemany(
    "INSERT INTO personal_autorizado VALUES (?,?,?,?,?)",  # 5 PLACEHOLDERS
    AñadirDatos
)
```

---

### CRÍTICO 4: Registro - Falta CODIGO en INSERT query

**Ubicación:** Celda 3

```python
INSERT_QUERY = "INSERT INTO personal_autorizado (USUARIO, CONTRASEÑA, AREA, HORARIO) VALUES (?, ?, ?, ?)"
#                                                                                           4 PLACEHOLDERS
```

**Problema:**
- Query solo tiene **4 columnas y 4 placeholders**
- Pero la tabla tiene **5 columnas** (incluye CODIGO)
- Falta pedir `CODIGO` al usuario
- Falta insertar `CODIGO` en los datos

**Impacto:** Registro de nuevos usuarios falla

**Solución:**
```python
# PASO 1: Actualizar INSERT query
INSERT_QUERY = "INSERT INTO personal_autorizado (USUARIO, CONTRASEÑA, AREA, HORARIO, CODIGO) VALUES (?, ?, ?, ?, ?)"
#                                                                                                     ↑ 5 PLACEHOLDERS

# PASO 2: Pedir CODIGO al usuario ( después de horario_nuevo)
area_nueva = input("Ingrese la su área: ")
horario_nuevo = input("Ingrese su horario: ")
codigo_nuevo = input("Ingrese el código: ")  #  AGREGAR ESTO

# PASO 3: Agregar CODIGO a datos_a_insertar
datos_a_insertar = (user_nuevo, contrasena_nueva, area_nueva, horario_nuevo, codigo_nuevo)
#                   ↑ Ahora 5 valores
```

---

##  ERRORES MEDIOS

### MEDIO 1: Validación de contraseña redundante

**Ubicación:** Celda 3

```python
while True:
    print("\n Verifica que la contraseña cumpla...")
    contrasena_nueva = input("Ingrese la nueva contraseña: ")

    if validar_password(contrasena_nueva):
        break
    else:
        print("Por favor, ingrese una contraseña que cumpla con los requisitos.")
```

**Problema:**
- `validar_password()` **ya imprime mensajes de error específicos**
  - "La contraseña debe tener al menos 8 caracteres"
  - "Debe contener mayúsculas y minúsculas"
  - etc.
- El `else` imprime un mensaje **redundante y genérico**
- Usuario recibe 2 mensajes: uno específico + uno genérico

**Impacto:** UX pobre, mensajes confusos

**Solución:**
```python
while True:
    print("\n Reglas de contraseña:")
    print("  • Mínimo 8 caracteres")
    print("  • Mayúsculas + minúsculas")
    print("  • Al menos 1 número")
    print("  • Al menos 1 carácter especial (#$%*!)\n")
    
    contrasena_nueva = input("Ingrese la nueva contraseña: ")
    
    if validar_password(contrasena_nueva):
        break
    # ← SIN else, validar_password ya da feedback
```

---

### MEDIO 2: Sin manejo de excepciones en conexión inicial

**Ubicación:** Celda 3

```python
conn = sqlite3.connect("personal_autorizado.db")
cursor = conn.cursor()
# Si DB no existe o hay error, crashea sin mensaje
```

**Problema:**
- No hay `try/except` alrededor de la conexión
- Si `personal_autorizado.db` no existe → error críptico
- Si hay permiso denegado → error sin contexto

**Impacto:**  Debugging difícil, usuario se confunde

**Solución:**
```python
try:
    conn = sqlite3.connect("personal_autorizado.db")
    cursor = conn.cursor()
    
    # ... resto del código de registro ...
    
except sqlite3.Error as e:
    print(f" Error en base de datos: {e}")
    exit()
except Exception as e:
    print(f" Error inesperado: {e}")
    exit()
```

---

### Detalles menores

#### Import no usado (Celda 3)
```python
import sys  #  No se usa en ningún lado
```
**Solución:** Eliminar

#### Usuario sin validación (Celda 3)
```python
while True:
    user_nuevo = input("Ingrese el nuevo usuario: ")
    #  No valida que no esté vacío
```
**Solución:**
```python
while True:
    user_nuevo = input("Ingrese el nuevo usuario: ").strip()
    if not user_nuevo:
        print(" El usuario no puede estar vacío")
        continue
    # ... resto
```

#### Login sin retorno útil (Celda 2)
```python
return  #  Devuelve None, no es útil
```
**Solución:**
```python
return True  # Si login exitoso
# ...
return False  # Si falla
```

---

##  TABLA DE PRIORIDADES

| # | Error | Tipo | Severidad | Línea | Acción |
|---|-------|------|-----------|-------|--------|
| 1 | pip install db_sqlite3 | Config | CRÍTICA | Celda 1 | ELIMINAR |
| 2 | CREATE TABLE sintaxis | SQL |  CRÍTICA | Celda 2 | Arreglar coma y agregar CODIGO |
| 3 | INSERT mismatch columnas | SQL |  CRÍTICA | Celda 2 | 5 placeholders + 5 valores |
| 4 | Registro INSERT incompleto | SQL |  CRÍTICA | Celda 3 | Agregar CODIGO en 3 lugares |
| 5 | Validación redundante | Lógica |  MEDIA | Celda 3 | Eliminar else |
| 6 | Sin try/except conexión | Seguridad | MEDIA | Celda 3:43 | Envolver en try/except |

---

## LISTA DE CORRECCIONES

**ANTES DE REENVIAR CÓDIGO:**

-  ELIMINAR `!pip install db_sqlite3`
-  CREATE TABLE: quitar coma, agregar `CODIGO TEXT`
-  INSERT inicial: 5 placeholders (?,?,?,?,?)
-  Registro: agregar `CODIGO` en INSERT_QUERY
- Registro: pedir `codigo_nuevo` al usuario
-  Registro: agregar `codigo_nuevo` a `datos_a_insertar`
-  Eliminar `else` redundante en validación
-  Envolver conexión en try/except
-  Eliminar `import sys` no usado
- Agregar validación de usuario vacío

---

## SIGUIENTE PASO

**Una vez corregido:**
1. Reenviar código para re-testing
2. Ejecutar en Colab desde cero (simular usuario nuevo)
3. Probar login con credenciales correctas
4. Probar registro con nuevos usuarios
5. Validar que CODIGO se guarda correctamente

---

**Aprobación Actual: **NO APROBADO**

**Aprobación Esperada: **APROBADO** (después de correcciones)

---

**Analista QA:** Vanesa María del Mar González  
**Equipo:** MediFlow - Hackathon ONE G10 LATAM  
**Contacto:** Discord - Canal #qa-tester




# 📋 QA REPORT - Backend Spring Boot
## MediFlow - Hackathon ONE G10 LATAM (Equipo 133)

**QA Tester**: Vanesa María del Mar González-Juan Jose Coñoman Peralta  
**Fecha**: 2026-10-12  
**Backend Solicitante**: Back-End/MediFlow (Spring Boot Java)  
**Estado**: ⚠️ CRÍTICO - NO LISTO PARA PRODUCCIÓN

---

## Resumen Ejecutivo

El equipo de **Back-End/MediFlow** solicitó análisis QA de 30 archivos Java del proyecto Spring Boot.

**Resultado**: 
- **7 CRÍTICOS** (Bloquean GO-LIVE)
- **11 ALTOS** (Impacto severo)
- **6 MEDIOS** (Mejorar robustez)
- **Total**: 24 errores identificados

**Recomendación**: No hacer deploy a producción hasta resolver los 7 CRÍTICOS como mínimo.

---

## ERRORES CRÍTICOS (Bloquean GO-LIVE)

###  CRÍTICO #1: Sin validación de INPUT en `/api/auth/login`

**Archivo**: `AuthController.java` línea 24-37  
**Severidad**: CRÍTICO  
**Impacto**: Si `request`, `request.name()` o `request.password()` es null → `NullPointerException` → Crash inmediato → Error 500

####  CÓDIGO ORIGINAL:
```java
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    // ❌ No valida si request es null
    // ❌ No valida si request.name() está vacío
    // ❌ No valida si request.password() está vacío
    
    String username = request.name();  // ← Puede ser null
    String password = request.password();  // ← Puede ser null
    
    // Intenta autenticar sin validación
    Authentication auth = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(username, password)
    );
}
```

#### CÓDIGO CORREGIDO:
```java
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    
    // VALIDACIÓN 1: Request no es null
    if (request == null) {
        logger.warn("Intento de login sin request body");
        return ResponseEntity.badRequest()
            .body(new ErrorResponse("Request body requerido", 400));
    }
    
    //  VALIDACIÓN 2: Username no es null/vacío
    if (request.name() == null || request.name().trim().isEmpty()) {
        logger.warn("Intento de login sin username");
        return ResponseEntity.badRequest()
            .body(new ErrorResponse("Username requerido", 400));
    }
    
    // VALIDACIÓN 3: Password no es null/vacío
    if (request.password() == null || request.password().isEmpty()) {
        logger.warn("Intento de login sin password");
        return ResponseEntity.badRequest()
            .body(new ErrorResponse("Password requerido", 400));
    }
    
    try {
        // Intenta autenticar
        Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.name().trim(), 
                request.password()
            )
        );
        
        logger.info("Login exitoso para usuario: {}", request.name());
        // ... resto del código
        
    } catch (BadCredentialsException e) {
        logger.warn("Credenciales inválidas para usuario: {}", request.name());
        return ResponseEntity.status(401)
            .body(new ErrorResponse("Usuario o contraseña inválida", 401));
    } catch (UsernameNotFoundException e) {
        logger.warn("Usuario no encontrado: {}", request.name());
        return ResponseEntity.status(401)
            .body(new ErrorResponse("Usuario o contraseña inválida", 401));
    }
}
```

**Qué cambió**: 
- Validación explícita de request no null
- Validación de username (no null, no vacío)
- Validación de password (no null, no vacío)
- Try-catch para `BadCredentialsException` y `UsernameNotFoundException`
- HTTP 400 para input inválido, HTTP 401 para credenciales incorrectas
- Logging en cada etapa

**HTTP Status**: 400 Bad Request (input vacío) | 401 Unauthorized (credenciales inválidas)

---

### CRÍTICO #2: HARDCODEO de URL de FastAPI

**Archivo**: `AIClient.java` línea 33  
**Severidad**:  CRÍTICO  
**Impacto**: En **producción**, FastAPI NO está en `localhost:8000` → **TODOS los análisis de documentos fallan** → Error 503

####  CÓDIGO ORIGINAL:
```java
public class AIClient {
    
    private final RestTemplate restTemplate;
    
    public AIClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
    
    public AnalisisResultado analizarDocumento(String rutaArchivo) {
        //  URL HARDCODEADA
        String url = "http://localhost:8000/analizar";
        
        // Enviar a FastAPI
        ResponseEntity<AnalisisResultado> response = restTemplate.postForEntity(
            url,
            archivo,
            AnalisisResultado.class
        );
        
        return response.getBody();
    }
}
```

####  CÓDIGO CORREGIDO:
```java
@Component
public class AIClient {
    
    private final RestTemplate restTemplate;
    private final String fastApiUrl;  //  Inyectado desde properties
    
    public AIClient(
        RestTemplate restTemplate,
        @Value("${fastapi.url:http://localhost:8000}") String fastApiUrl
    ) {
        this.restTemplate = restTemplate;
        this.fastApiUrl = fastApiUrl;
    }
    
    public AnalisisResultado analizarDocumento(String rutaArchivo) {
        //  URL desde properties
        String url = fastApiUrl + "/analizar";
        
        logger.info("Enviando documento a FastAPI: {}", url);
        
        try {
            ResponseEntity<AnalisisResultado> response = restTemplate.postForEntity(
                url,
                archivo,
                AnalisisResultado.class
            );
            
            if (response.getStatusCode() != HttpStatus.OK) {
                logger.error("FastAPI retornó status {}: {}", 
                    response.getStatusCode(), response.getBody());
                return null;
            }
            
            logger.info("Análisis completado exitosamente");
            return response.getBody();
            
        } catch (Exception e) {
            logger.error("Error conectando a FastAPI ({}): {}", url, e.getMessage());
            throw new RuntimeException("No se pudo conectar a FastAPI: " + e.getMessage());
        }
    }
}
```

**En `application.properties` o `application.yml`**:
```properties
# Development
fastapi.url=http://localhost:8000

# Production (override en application-prod.properties)
# fastapi.url=https://fastapi-mediflow.herokuapp.com
```

**Qué cambió**: 
- URL movida a `application.properties` con `@Value`
- Fallback a `localhost:8000` si no está configurada
- Diferentes configs para dev/prod/staging
- Logging de URL que se está usando
- Manejo de errores de conexión

---

###  CRÍTICO #3: SIN TIMEOUT en RestClient

**Archivo**: `AIClient.java` línea 25-35  
**Severidad**:  CRÍTICO  
**Impacto**: Si FastAPI tarda o cuelga → Request queda esperando **indefinidamente** → Memory leak → Servidor colapsa

####  CÓDIGO ORIGINAL:
```java
@Configuration
public class RestTemplateConfig {
    
    @Bean
    public RestTemplate restTemplate() {
        //  Sin timeout
        return new RestTemplate();
    }
}
```

####  CÓDIGO CORREGIDO:
```java
@Configuration
public class RestTemplateConfig {
    
    @Bean
    public RestTemplate restTemplate() {
        
        //  Configurar timeout
        HttpComponentsClientHttpRequestFactory factory = 
            new HttpComponentsClientHttpRequestFactory();
        
        // Timeout de conexión: 10 segundos
        factory.setConnectTimeout(10_000);
        
        // Timeout de lectura: 30 segundos
        factory.setReadTimeout(30_000);
        
        logger.info("RestTemplate configurado con timeout 10s conexión, 30s lectura");
        
        return new RestTemplate(factory);
    }
}
```

**O si usas WebClient (recomendado para Spring Boot 5.3+)**:
```java
@Configuration
public class WebClientConfig {
    
    @Bean
    public WebClient webClient() {
        
        //  Configurar timeout en WebClient
        HttpClient httpClient = HttpClient.create()
            .responseTimeout(Duration.ofSeconds(30))
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10_000);
        
        ClientHttpConnector connector = new ReactorClientHttpConnector(httpClient);
        
        logger.info("WebClient configurado con timeout 10s conexión, 30s lectura");
        
        return WebClient.builder()
            .clientConnector(connector)
            .build();
    }
}
```

**Qué cambió**: 
- `connectTimeout`: 10 segundos (espera máxima para conectar)
- `readTimeout`: 30 segundos (espera máxima para recibir respuesta)
- Fail-fast si FastAPI tarda más
- Logging de configuración

---

###  CRÍTICO #4: SIN MANEJO DE EXCEPCIONES en AuthController

**Archivo**: `AuthController.java` línea 24-37  
**Severidad**: CRÍTICO  
**Impacto**: Usuario incorrecto/password incorrecto → Exception no manejada → Error 500 (debería ser 401)

#### CÓDIGO ORIGINAL:
```java
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    //  Sin try-catch
    
    Authentication auth = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(username, password)
    );
    // BadCredentialsException → ERROR 500 
    // UsernameNotFoundException → ERROR 500 
}
```

#### CÓDIGO CORREGIDO:
```java
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    
    try {
        Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.name().trim(),
                request.password()
            )
        );
        
        String token = jwtService.generateToken(auth);
        logger.info("Login exitoso para: {}", request.name());
        
        return ResponseEntity.ok(new LoginResponse(token));
        
    } catch (BadCredentialsException e) {
        //  Contraseña incorrecta → 401
        logger.warn("BadCredentialsException para usuario: {}", request.name());
        return ResponseEntity.status(401)
            .body(new ErrorResponse("Usuario o contraseña inválida", 401));
            
    } catch (UsernameNotFoundException e) {
        //  Usuario no existe → 401
        logger.warn("UsernameNotFoundException para: {}", request.name());
        return ResponseEntity.status(401)
            .body(new ErrorResponse("Usuario o contraseña inválida", 401));
            
    } catch (Exception e) {
        //  Error inesperado → 500 con log
        logger.error("Error inesperado en login: {}", e.getMessage(), e);
        return ResponseEntity.status(500)
            .body(new ErrorResponse("Error interno del servidor", 500));
    }
}
```

**O mejor aún, usar `@RestControllerAdvice` global**:
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<?> handleBadCredentials(BadCredentialsException e) {
        logger.warn("BadCredentialsException: {}", e.getMessage());
        return ResponseEntity.status(401)
            .body(new ErrorResponse("Usuario o contraseña inválida", 401));
    }
    
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<?> handleUserNotFound(UsernameNotFoundException e) {
        logger.warn("UsernameNotFoundException: {}", e.getMessage());
        return ResponseEntity.status(401)
            .body(new ErrorResponse("Usuario o contraseña inválida", 401));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGenericException(Exception e) {
        logger.error("Exception no manejada: {}", e.getMessage(), e);
        return ResponseEntity.status(500)
            .body(new ErrorResponse("Error interno del servidor", 500));
    }
}
```

**Qué cambió**: 
- Try-catch específicos para cada tipo de excepción
- HTTP 401 para credenciales inválidas
- HTTP 500 solo para errores inesperados
- Logging en cada rama
- Centralized error handling con `@RestControllerAdvice`

---

### CRÍTICO #5: NullPointerException en `UsuariosService.roleChange()`

**Archivo**: `UsuariosService.java` línea 75-76  
**Severidad**:  CRÍTICO  
**Impacto**: Si usuario no existe → retorna null → Intenta `entity.setRol()` → **NPE** → Error 500

#### CÓDIGO ORIGINAL:
```java
public void roleChange(Long usuarioId, String nuevoRol) {
    // Si usuario no existe, retorna null
    Usuario entity = usuarioRepository.findById(usuarioId).orElse(null);
    
    //  NPE aquí si entity es null
    entity.setRol(nuevoRol);
    usuarioRepository.save(entity);
}
```

####  CÓDIGO CORREGIDO:
```java
public void roleChange(Long usuarioId, String nuevoRol) {
    
    logger.info("Intentando cambiar rol de usuario {} a {}", usuarioId, nuevoRol);
    
    // Validar que usuario existe
    Usuario entity = usuarioRepository.findById(usuarioId)
        .orElseThrow(() -> {
            logger.error("Usuario no encontrado: {}", usuarioId);
            return new UsernameNotFoundException(
                "Usuario con ID " + usuarioId + " no encontrado"
            );
        });
    
    //  Validar que el nuevo rol es válido
    if (nuevoRol == null || nuevoRol.trim().isEmpty()) {
        logger.error("Rol vacío para usuario: {}", usuarioId);
        throw new IllegalArgumentException("Rol no puede estar vacío");
    }
    
    // Validar que el rol existe en el enum/lista permitida
    List<String> rolesValidos = Arrays.asList("USER", "ADMIN", "AUDITOR");
    if (!rolesValidos.contains(nuevoRol.toUpperCase())) {
        logger.error("Rol inválido: {}", nuevoRol);
        throw new IllegalArgumentException(
            "Rol inválido. Roles permitidos: " + rolesValidos
        );
    }
    
    String rolAnterior = entity.getRol();
    entity.setRol(nuevoRol.toUpperCase());
    
    try {
        usuarioRepository.save(entity);
        logger.info("Rol cambiado exitosamente de {} a {} para usuario {}", 
            rolAnterior, nuevoRol, usuarioId);
    } catch (Exception e) {
        logger.error("Error guardando cambio de rol: {}", e.getMessage(), e);
        throw new RuntimeException("No se pudo cambiar el rol: " + e.getMessage());
    }
}
```

**Qué cambió**: 
- `.orElseThrow()` en lugar de `.orElse(null)`
- Validación de rol no null/vacío
- Validación de rol contra lista permitida
- Logging de cambio exitoso
- Try-catch para guardar en BD

---

###  CRÍTICO #6: SIN VALIDACIÓN DE ARCHIVO en `DocumentosService`

**Archivo**: `DocumentosService.java` línea 28-31  
**Severidad**: CRÍTICO  
**Impacto**: Usuario puede subir archivo de 1GB, corrupto, o malicioso → OutOfMemory o Gemini falla

#### CÓDIGO ORIGINAL:
```java
public void procesarDocumento(MultipartFile archivo) {
    // No valida nada
    
    // Guardar en temp
    File temp = new File("/tmp/" + archivo.getOriginalFilename());
    archivo.transferTo(temp);
    
    // Enviar a FastAPI
    aiClient.analizarDocumento(temp.getAbsolutePath());
}
```

####  CÓDIGO CORREGIDO:
```java
@Service
public class DocumentosService {
    
    private static final long MAX_FILE_SIZE = 10_000_000L;  // 10MB
    private static final Set<String> ALLOWED_EXTENSIONS = 
        Set.of("pdf", "jpg", "jpeg", "png", "docx");
    
    private final AIClient aiClient;
    private final Logger logger = LoggerFactory.getLogger(DocumentosService.class);
    
    public void procesarDocumento(MultipartFile archivo) {
        
        logger.info("Procesando archivo: {}", archivo.getOriginalFilename());
        
        //  VALIDACIÓN 1: Archivo no es null
        if (archivo == null || archivo.isEmpty()) {
            logger.warn("Archivo vacío o null");
            throw new IllegalArgumentException("El archivo está vacío");
        }
        
        // VALIDACIÓN 2: Archivo no está vacío
        if (archivo.getSize() == 0) {
            logger.warn("Archivo sin contenido: {}", archivo.getOriginalFilename());
            throw new IllegalArgumentException("El archivo no contiene datos");
        }
        
        //  VALIDACIÓN 3: Tamaño máximo 10MB
        if (archivo.getSize() > MAX_FILE_SIZE) {
            logger.warn("Archivo demasiado grande: {} bytes", archivo.getSize());
            throw new IllegalArgumentException(
                "Archivo demasiado grande (máximo 10MB)"
            );
        }
        
        //  VALIDACIÓN 4: Extensión permitida
        String filename = archivo.getOriginalFilename();
        String extension = filename.substring(filename.lastIndexOf(".") + 1)
            .toLowerCase();
        
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            logger.warn("Extensión no permitida: {}", extension);
            throw new IllegalArgumentException(
                "Formato no permitido. Permitidos: " + ALLOWED_EXTENSIONS
            );
        }
        
        //  VALIDACIÓN 5: MIME type válido
        String mimeType = archivo.getContentType();
        if (!isValidMimeType(mimeType)) {
            logger.warn("MIME type sospechoso: {}", mimeType);
            throw new IllegalArgumentException(
                "Tipo de archivo sospechoso"
            );
        }
        
        try {
            // Guardar en temp con nombre seguro
            String tempFilename = UUID.randomUUID() + "." + extension;
            File temp = new File("/tmp/" + tempFilename);
            archivo.transferTo(temp);
            
            logger.info("Archivo guardado temporalmente: {}", temp.getAbsolutePath());
            
            // Enviar a FastAPI
            aiClient.analizarDocumento(temp.getAbsolutePath());
            
            // Limpiar temp
            temp.delete();
            logger.info("Archivo temporal eliminado");
            
        } catch (IOException e) {
            logger.error("Error guardando archivo: {}", e.getMessage(), e);
            throw new RuntimeException("No se pudo procesar el archivo: " + e.getMessage());
        }
    }
    
    private boolean isValidMimeType(String mimeType) {
        List<String> validMimes = Arrays.asList(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        return validMimes.contains(mimeType);
    }
}
```

**Qué cambió**: 
- Validación null + isEmpty
- Validación de tamaño (10MB max)
- Whitelist de extensiones
- Validación de MIME type
- Nombre de archivo seguro (UUID)
- Limpieza de temp file
- Logging en cada etapa

---

### CRÍTICO #7: SIN VALIDACIÓN EN DTOs

**Archivo**: `LoginRequest.java`, `DocumentosRequest.java`  
**Severidad**:  CRÍTICO  
**Impacto**: Datos malformados pasan a la lógica de negocio sin validación

#### CÓDIGO ORIGINAL:
```java
public class LoginRequest {
    private String name;
    private String password;
    // Getters/setters sin validación
}

public class DocumentosRequest {
    private MultipartFile archivo;
    // Sin validación
}
```

#### CÓDIGO CORREGIDO:
```java
public class LoginRequest {
    
    @NotNull(message = "Username no puede ser null")
    @NotBlank(message = "Username no puede estar vacío")
    @Size(min = 3, max = 50, message = "Username debe tener entre 3 y 50 caracteres")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", 
             message = "Username solo puede contener letras, números, puntos, guiones y guiones bajos")
    private String name;
    
    @NotNull(message = "Password no puede ser null")
    @NotBlank(message = "Password no puede estar vacío")
    @Size(min = 6, message = "Password debe tener mínimo 6 caracteres")
    private String password;
    
    public LoginRequest(String name, String password) {
        this.name = name;
        this.password = password;
    }
    
    public String name() { return name; }
    public String password() { return password; }
}
```

**En el Controller**:
```java
@PostMapping("/login")
public ResponseEntity<?> login(
    @Valid @RequestBody LoginRequest request,  //  @Valid valida anotaciones
    BindingResult bindingResult
) {
    // Validación automática de anotaciones
    if (bindingResult.hasErrors()) {
        logger.warn("ValidationException: {}", bindingResult.getFieldErrors());
        return ResponseEntity.badRequest()
            .body(new ErrorResponse(
                "Campos inválidos: " + bindingResult.getFieldErrors(),
                400
            ));
    }
    
    // Procesar login ...
}
```

**Para DocumentosRequest**:
```java
public class DocumentosRequest {
    
    @NotNull(message = "Archivo no puede ser null")
    private MultipartFile archivo;
    
    public MultipartFile getArchivo() { return archivo; }
    public void setArchivo(MultipartFile archivo) { this.archivo = archivo; }
}
```

**Qué cambió**: 
- `@NotNull`, `@NotBlank`, `@Size` en campos
- `@Pattern` para validar formato
- `@Valid` en los parámetros del controller
- Manejo de `BindingResult` para errores de validación

---

##  ERRORES ALTOS (Impacto Severo)

### ALTO #1: FALTA VALIDACIÓN DE CONTRASEÑA SEGURA

**Archivo**: `UsuariosController.java` o `UsuariosService.java`  
**Impacto**: Usuarios pueden registrarse con passwords débiles → Seguridad comprometida

#### SOLUCIÓN:
```java
@Component
public class PasswordValidator {
    
    private static final String PASSWORD_PATTERN =
        "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$";
    
    private Pattern pattern = Pattern.compile(PASSWORD_PATTERN);
    
    public boolean isValid(String password) {
        return password != null && pattern.matcher(password).matches();
    }
    
    public String getRequirements() {
        return "Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial";
    }
}
```

**En el registro**:
```java
@PostMapping("/registro")
public ResponseEntity<?> registro(@Valid @RequestBody RegisterRequest request) {
    
    if (!passwordValidator.isValid(request.getPassword())) {
        logger.warn("Password débil para usuario: {}", request.getUsername());
        return ResponseEntity.badRequest()
            .body(new ErrorResponse(
                "Password débil. Requisitos: " + passwordValidator.getRequirements(),
                400
            ));
    }
    
    // ... crear usuario
}
```

---

###  ALTO #2: SIN LOGGING ESTRUCTURADO

**Impacto**: Debugging y auditoría imposibles en producción

#### CÓDIGO ORIGINAL:
```java
System.out.println("Usuario logueado: " + username);
e.printStackTrace();
```

#### CÓDIGO CORREGIDO:
```java
private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

logger.info("Usuario logueado: {}", username);
logger.error("Error en login: {}", e.getMessage(), e);
logger.debug("Token generado: {}", token);
logger.warn("Intento de login fallido para: {}", username);
```

---

###  ALTO #3: SIN RATE LIMITING / THROTTLING

**Impacto**: Vulnerable a brute force en login y DDoS en `/api/documentos/analyze`

#### SOLUCIÓN (con Spring Security):
```java
@Configuration
public class RateLimitConfig {
    
    @Bean
    public RateLimiter rateLimiter() {
        // 10 requests por minuto
        return RateLimiter.create(10.0 / 60.0);
    }
}

@Component
public class RateLimitFilter extends OncePerRequestFilter {
    
    @Autowired
    private RateLimiter rateLimiter;
    
    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        
        if (!rateLimiter.tryAcquire()) {
            logger.warn("Rate limit exceeded para: {}", request.getRemoteAddr());
            response.setStatus(429);  // Too Many Requests
            response.getWriter().write("Rate limit exceeded");
            return;
        }
        
        filterChain.doFilter(request, response);
    }
}
```

---

### ALTO #4: SIN CORS CONFIGURADO EXPLÍCITAMENTE

**Impacto**: Si frontend está en otro dominio → Error CORS

#### SOLUCIÓN:
```java
@Configuration
public class CorsConfig {
    
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                    .allowedOrigins("http://localhost:3000", "https://mediflow.app")
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true)
                    .maxAge(3600);
            }
        };
    }
}
```

---

###  ALTO #5: SIN AUDITORÍA DE CAMBIOS DE ROL

**Impacto**: No se sabe quién cambió roles de qué usuario

#### SOLUCIÓN:
```java
@Entity
@Table(name = "auditoria_cambios_rol")
public class AuditoriaCambioRol {
    @Id @GeneratedValue
    private Long id;
    
    @Column(nullable = false)
    private Long usuarioIdModificado;
    
    @Column(nullable = false)
    private String rolAnterior;
    
    @Column(nullable = false)
    private String rolNuevo;
    
    @Column(nullable = false)
    private String usuarioQueCambio;
    
    @Column(nullable = false)
    private LocalDateTime fechaCambio;
}

@Service
public class UsuariosServiceAuditado {
    
    @Autowired
    private AuditoriaCambioRolRepository auditRepository;
    
    public void roleChange(Long usuarioId, String nuevoRol, String usuarioQueCambia) {
        
        Usuario entity = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
        
        String rolAnterior = entity.getRol();
        entity.setRol(nuevoRol);
        usuarioRepository.save(entity);
        
        //  Registrar en auditoría
        AuditoriaCambioRol auditoria = new AuditoriaCambioRol();
        auditoria.setUsuarioIdModificado(usuarioId);
        auditoria.setRolAnterior(rolAnterior);
        auditoria.setRolNuevo(nuevoRol);
        auditoria.setUsuarioQueCambio(usuarioQueCambia);
        auditoria.setFechaCambio(LocalDateTime.now());
        
        auditRepository.save(auditoria);
        logger.info("Rol cambiado por {} de {} a {} para usuario {}", 
            usuarioQueCambia, rolAnterior, nuevoRol, usuarioId);
    }
}
```

---

### ALTO #6-11: (Continuación...)

- **#6 SIN MANEJO DE ARCHIVO CORRUPTO**: Agregar try-catch específicos para corrupción
- **#7 SIN REFRESH TOKEN ENDPOINT**: Crear endpoint `/api/auth/refresh` con refresh tokens
- **#8 SIN VALIDACIÓN DE EXTENSIÓN**: Implementar whitelist en Controller
- **#9 SIN MAX FILE SIZE CONFIG**: Agregar en `application.properties`: `spring.servlet.multipart.max-file-size=10MB`
- **#10 FALTA VALIDACIÓN JWT SECRET**: Validar en startup que `jwt.secret` existe
- **#11 SIN ERROR HANDLING GLOBAL**: Crear `@RestControllerAdvice` centralizado

---

## 📋 Checklist de Prioridades

### CRÍTICOS (Implementar ANTES de GO-LIVE):
- [x] Validación de input en `/api/auth/login`
- [x] Remover hardcodeo de URL FastAPI
- [x] Configurar timeout en RestTemplate/WebClient
- [x] Manejo de excepciones específicas
- [x] Validación en UsuariosService.roleChange()
- [x] Validación de archivo en DocumentosService
- [x] Validación de DTOs con anotaciones

###  ALTOS (Implementar ANTES de Demo Day):
- [x] Validación de password segura
- [x] Logging estructurado con SLF4J
- [x] Rate limiting
- [x] CORS configurado
- [x] Auditoría de cambios de rol
- [x] Manejo de archivo corrupto
- [x] Refresh token endpoint
- [x] Validación de extensión de archivo
- [x] Max file size en properties
- [x] Validación de JWT secret
- [x] Error handling global

---

## Roadmap de Implementación

**Semana 1 (CRÍTICOS)**:
- Lunes-Martes: Validación de input + DTOs
- Miércoles: Configuración de URL y timeout
- Jueves: Exception handling + UsuariosService
- Viernes: Testing y validación

**Semana 2 (ALTOS)**:
- Lunes: Logging estructurado
- Martes-Miércoles: Rate limiting + CORS
- Jueves: Auditoría + error handling global
- Viernes: Testing

**Semana 3**: Polish y preparación para Demo Day

---

##  Impacto

| Aspecto | ANTES | DESPUÉS |
|--------|-------|---------|
| **Validación** |  Nula |  Múltiples capas |
| **Seguridad** |  Alta riesgo |  Robusta |
| **Logging** |  print/println |  SLF4J estructurado |
| **Error Handling** |  Básico |  Centralizado |
| **Production Ready** |  No |  Sí |
| **Time to implement** | - | ~20 horas |

---

##  Notas QA

**Aprobado por**: Vanesa Marí del mar González-revisado por Juan Jose Coñoman Peralta  
**Fecha de análisis**: 2026-10-12  
**Backend solicitante**: Back-End/MediFlow (Spring Boot)  
**Prioridad**:  CRÍTICO - Bloquea GO-LIVE  
**Deadline mínimo para CRÍTICOS**: ANTES del merge a main  

---

**Estado**:  **NO LISTO PARA PRODUCCIÓN - REQUIERE CORRECCIONES CRÍTICAS**

*Para cualquier duda sobre las correcciones, contactar a QA Tester *


