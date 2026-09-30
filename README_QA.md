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

