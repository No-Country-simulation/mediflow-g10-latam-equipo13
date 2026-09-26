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
