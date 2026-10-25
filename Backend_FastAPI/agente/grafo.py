"""
Grafo de decisión del agente de triaje (LangGraph).

    extraer -> validar -> evaluar_confianza -> detectar_urgencia
        -> [condicional] ruta_revision | ruta_urgencia | ruta_estandar
        -> [condicional] notificar (solo urgentes) -> persistir -> FIN

Cada nodo agrega un paso a la "traza", que se devuelve con el resultado para que
cualquier persona pueda ver qué decidió el agente y por qué.
"""
import logging
import operator
import time
from datetime import datetime, timezone
from typing import Annotated, Callable, TypedDict

from langgraph.graph import END, START, StateGraph

from agente import reglas
from agente.reglas import ConfigTriaje
from clasificador.adaptador import adaptar_resultado

logger = logging.getLogger("mediflow.agente")


class IANoDisponible(RuntimeError):
    """La IA no respondió (saturación, clave inválida o archivo ilegible para el modelo)."""


class EstadoTriaje(TypedDict, total=False):
    # Entrada
    documento_id: str
    canal_origen: str | None
    texto: str | None
    ruta_archivo: str | None
    nombre_archivo: str | None
    config: ConfigTriaje
    referencia_original: dict | None
    # Resultados de cada nodo
    datos: dict
    faltantes: list[str]
    inconsistencias: list[str]
    ambiguedades: list[str]
    alto_riesgo: list[str]
    confianza: float
    detalle_confianza: dict
    es_urgente: bool
    motivos_urgencia: list[str]
    ruta: str
    destino: str
    requiere_auditoria: bool
    status: str
    justificacion: str
    notificacion: dict | None
    estado_alerta: str | None
    almacenamiento: dict
    traza: Annotated[list[dict], operator.add]


Extractor = Callable[[EstadoTriaje], dict | None]
Persistidor = Callable[[EstadoTriaje, dict], dict]
Notificador = Callable[[dict, dict], str]


def _paso(nodo: str, titulo: str, resultado: str, inicio: float, **detalle) -> dict:
    return {
        "nodo": nodo,
        "titulo": titulo,
        "resultado": resultado,
        "detalle": detalle,
        "duracion_ms": round((time.perf_counter() - inicio) * 1000, 1),
    }


# --------------------------------------------------------------------------
# Resultado final (formato del brief + validación y traza)
# --------------------------------------------------------------------------

def construir_resultado(estado: EstadoTriaje) -> dict:
    datos = estado.get("datos") or {}
    paciente = datos.get("paciente") or {}
    medico = datos.get("medico") or {}
    requiere = bool(estado.get("requiere_auditoria"))
    return {
        "status": estado.get("status", "procesado"),
        "documento_id": estado.get("documento_id"),
        "fecha": datetime.now(timezone.utc).isoformat(),
        "canal_origen": estado.get("canal_origen"),
        "nombre_archivo": estado.get("nombre_archivo"),
        "contenido": datos.get("contenido"),
        "clasificacion": {
            "tipo_documento": datos.get("tipo_documento") or datos.get("tipo_original") or "Sin clasificar",
            "especialidad": datos.get("especialidad") or medico.get("especialidad"),
            "nivel_prioridad": "Urgente" if estado.get("es_urgente") else "Rutina",
            "score_confianza_clasificacion": estado.get("confianza", 0.0),
            "confianza_ia": (estado.get("detalle_confianza") or {}).get("confianza_ia"),
            # Compatibilidad con clientes anteriores (Spring 1.0.1).
            "requiere_auditoria_humana": requiere,
            "cola_enrutamiento": estado.get("destino"),
        },
        "datos_extraidos": {
            "paciente": {"nombre": paciente.get("nombre"), "rut": paciente.get("rut"), "edad": paciente.get("edad")},
            "medico_solicitante": {"nombre": medico.get("nombre"), "matricula": medico.get("matricula")},
            "estudio_realizado": datos.get("estudio_realizado"),
            "diagnostico_principal": datos.get("diagnostico_principal"),
            "cie10_sugerido": datos.get("cie10_sugerido"),
            "medicamentos": datos.get("medicamentos") or [],
        },
        "decision_enrutamiento": {
            "destino_principal": estado.get("destino"),
            "requiere_auditoria_humana": requiere,
            "justificacion_enrutamiento": estado.get("justificacion"),
            "notificacion_generada": estado.get("notificacion"),
        },
        "validacion": {
            "campos_faltantes": estado.get("faltantes") or [],
            "inconsistencias": estado.get("inconsistencias") or [],
            "ambiguedades": estado.get("ambiguedades") or [],
            "medicamentos_alto_riesgo": estado.get("alto_riesgo") or [],
            "motivos_urgencia": estado.get("motivos_urgencia") or [],
            "detalle_confianza": estado.get("detalle_confianza") or {},
            "umbral": estado["config"].umbral if estado.get("config") else reglas.UMBRAL_CONFIANZA,
        },
        "almacenamiento_oci": estado.get("almacenamiento") or {"status_backup": "pendiente"},
        "traza": estado.get("traza") or [],
    }


# --------------------------------------------------------------------------
# Construcción del grafo
# --------------------------------------------------------------------------

def construir_grafo(extractor: Extractor, persistidor: Persistidor, notificador: Notificador):
    """Las dependencias externas (IA, OCI, alertas) se inyectan para poder probar el grafo sin red."""

    def extraer(estado: EstadoTriaje):
        inicio = time.perf_counter()
        crudo = extractor(estado)
        if crudo is None:
            raise IANoDisponible("No fue posible procesar el documento con el servicio de IA.")
        datos = adaptar_resultado(crudo)
        if not datos.get("contenido") and estado.get("texto"):
            datos["contenido"] = estado["texto"][:20000]
        tipo = datos.get("tipo_documento") or "sin categoría"
        return {
            "datos": datos,
            "traza": [_paso(
                "extraer", "Extracción con IA multimodal",
                f"{tipo} · confianza de la IA {datos.get('score_confianza')}", inicio,
                tipo_detectado=datos.get("tipo_original"), prioridad_ia=datos.get("prioridad"),
                medicamentos=len(datos.get("medicamentos") or []),
                hallazgos_criticos=datos.get("hallazgos_criticos") or [],
            )],
        }

    def validar(estado: EstadoTriaje):
        inicio = time.perf_counter()
        datos = estado["datos"]
        faltantes, inconsistencias = reglas.validar(datos)
        alto_riesgo = reglas.medicamentos_de_alto_riesgo(datos.get("medicamentos"))
        ambiguedades = list(datos.get("ambiguedades") or [])
        problemas = len(faltantes) + len(inconsistencias) + len(ambiguedades)
        return {
            "faltantes": faltantes, "inconsistencias": inconsistencias,
            "ambiguedades": ambiguedades, "alto_riesgo": alto_riesgo,
            "traza": [_paso(
                "validar", "Validación clínica y de consistencia",
                "Sin observaciones" if problemas == 0 else f"{problemas} observación(es)", inicio,
                campos_faltantes=faltantes, inconsistencias=inconsistencias,
                ambiguedades=ambiguedades, medicamentos_alto_riesgo=alto_riesgo,
            )],
        }

    def evaluar_confianza(estado: EstadoTriaje):
        inicio = time.perf_counter()
        confianza, detalle = reglas.calcular_confianza(
            estado["datos"].get("score_confianza"), estado["faltantes"], estado["inconsistencias"], estado["ambiguedades"],
        )
        umbral = estado["config"].umbral
        return {
            "confianza": confianza, "detalle_confianza": detalle,
            "traza": [_paso(
                "evaluar_confianza", "Cálculo del score de confianza",
                f"{confianza:.2f} ({'≥' if confianza >= umbral else '<'} umbral {umbral:.2f})", inicio, **detalle,
            )],
        }

    def detectar_urgencia(estado: EstadoTriaje):
        inicio = time.perf_counter()
        es_urgente, motivos = reglas.detectar_urgencia(
            estado["datos"], estado.get("canal_origen"), estado["config"].terminos_urgencia,
        )
        return {
            "es_urgente": es_urgente, "motivos_urgencia": motivos,
            "traza": [_paso(
                "detectar_urgencia", "Detección de urgencia médica",
                "Urgente" if es_urgente else "Sin signos de urgencia", inicio, motivos=motivos,
            )],
        }

    def elegir_ruta(estado: EstadoTriaje) -> str:
        return reglas.decidir_ruta(
            estado["confianza"], estado["config"].umbral, estado["ambiguedades"],
            estado["alto_riesgo"], estado["es_urgente"],
        )

    def ruta_revision(estado: EstadoTriaje):
        inicio = time.perf_counter()
        motivos = []
        umbral = estado["config"].umbral
        if estado["confianza"] < umbral:
            motivos.append(f"confianza {estado['confianza']:.2f} menor al umbral {umbral:.2f}")
        if estado["ambiguedades"]:
            motivos.append("ambigüedades: " + "; ".join(estado["ambiguedades"]))
        if estado["alto_riesgo"]:
            motivos.append("medicamentos de alto riesgo: " + ", ".join(estado["alto_riesgo"]))
        justificacion = "Derivado a revisión humana por " + " y ".join(motivos) + "."
        if estado["es_urgente"]:
            justificacion += " Es un caso urgente: se alertó a la guardia mientras se revisa."
        return {
            "ruta": "revision_humana", "destino": reglas.DESTINO_REVISION, "requiere_auditoria": True,
            "status": "pendiente_revision_humana", "justificacion": justificacion,
            "traza": [_paso("ruta_revision", "Enrutamiento: revisión humana", reglas.DESTINO_REVISION, inicio, motivos=motivos)],
        }

    def ruta_urgencia(estado: EstadoTriaje):
        inicio = time.perf_counter()
        motivos = estado["motivos_urgencia"]
        justificacion = "Caso urgente derivado a emergencias: " + "; ".join(motivos) + "."
        return {
            "ruta": "urgencia", "destino": reglas.DESTINO_URGENCIA, "requiere_auditoria": False,
            "status": "procesado", "justificacion": justificacion,
            "traza": [_paso("ruta_urgencia", "Enrutamiento: urgencia médica", reglas.DESTINO_URGENCIA, inicio, motivos=motivos)],
        }

    def ruta_estandar(estado: EstadoTriaje):
        inicio = time.perf_counter()
        tipo = estado["datos"].get("tipo_documento")
        destino = estado["config"].destinos.get(tipo, "Historia_Clinica_Electronica")
        justificacion = (
            f"{tipo} con confianza {estado['confianza']:.2f} (umbral {estado['config'].umbral:.2f}) "
            f"y sin signos de urgencia: flujo estándar hacia {destino}."
        )
        return {
            "ruta": "estandar", "destino": destino, "requiere_auditoria": False,
            "status": "procesado", "justificacion": justificacion,
            "traza": [_paso("ruta_estandar", "Enrutamiento: flujo estándar", destino, inicio, tipo=tipo)],
        }

    def despues_de_rutear(estado: EstadoTriaje) -> str:
        return "notificar" if estado["es_urgente"] else "persistir"

    def notificar(estado: EstadoTriaje):
        inicio = time.perf_counter()
        datos = estado["datos"]
        paciente = (datos.get("paciente") or {}).get("nombre") or "paciente sin identificar"
        hallazgo = (datos.get("hallazgos_criticos") or [datos.get("diagnostico_principal") or "hallazgo crítico"])[0]
        canal = estado.get("canal_origen") or "Guardia"
        notificacion = {
            "canal": "Alerta_Guardia_Medica",
            "mensaje": f"ALERTA URGENTE: {datos.get('tipo_documento') or 'Documento'} con {hallazgo} "
                       f"para {paciente} ({canal}). Destino: {estado['destino']}.",
        }
        resumen = {
            "documento_id": estado.get("documento_id"), "tipo": datos.get("tipo_documento"),
            "destino": estado["destino"], "hallazgo": hallazgo, "paciente": paciente,
        }
        estado_alerta = notificador(notificacion, resumen)
        return {
            "notificacion": notificacion, "estado_alerta": estado_alerta,
            "traza": [_paso("notificar", "Alerta a la guardia médica", f"Alerta generada ({estado_alerta})", inicio,
                            canal=notificacion["canal"])],
        }

    def persistir(estado: EstadoTriaje):
        inicio = time.perf_counter()
        almacenamiento = persistidor(estado, construir_resultado(estado))
        return {
            "almacenamiento": almacenamiento,
            "traza": [_paso("persistir", "Persistencia en OCI Object Storage",
                            f"{almacenamiento.get('bucket') or 'sin bucket'} · {almacenamiento.get('status_backup')}",
                            inicio, ruta_objeto=almacenamiento.get("ruta_objeto"))],
        }

    grafo = StateGraph(EstadoTriaje)
    for nombre, nodo in (
        ("extraer", extraer), ("validar", validar), ("evaluar_confianza", evaluar_confianza),
        ("detectar_urgencia", detectar_urgencia), ("ruta_revision", ruta_revision),
        ("ruta_urgencia", ruta_urgencia), ("ruta_estandar", ruta_estandar),
        ("notificar", notificar), ("persistir", persistir),
    ):
        grafo.add_node(nombre, nodo)

    grafo.add_edge(START, "extraer")
    grafo.add_edge("extraer", "validar")
    grafo.add_edge("validar", "evaluar_confianza")
    grafo.add_edge("evaluar_confianza", "detectar_urgencia")
    grafo.add_conditional_edges("detectar_urgencia", elegir_ruta, {
        "revision_humana": "ruta_revision", "urgencia": "ruta_urgencia", "estandar": "ruta_estandar",
    })
    for nodo_ruta in ("ruta_revision", "ruta_urgencia", "ruta_estandar"):
        grafo.add_conditional_edges(nodo_ruta, despues_de_rutear, {"notificar": "notificar", "persistir": "persistir"})
    grafo.add_edge("notificar", "persistir")
    grafo.add_edge("persistir", END)
    return grafo.compile()


def ejecutar_triaje(grafo, *, documento_id: str, config: ConfigTriaje, canal_origen: str | None = None,
                    texto: str | None = None, ruta_archivo: str | None = None, nombre_archivo: str | None = None,
                    referencia_original: dict | None = None) -> dict:
    """Ejecuta el grafo completo y devuelve el resultado listo para la API."""
    estado = grafo.invoke({
        "documento_id": documento_id, "canal_origen": canal_origen, "texto": texto,
        "ruta_archivo": ruta_archivo, "nombre_archivo": nombre_archivo, "config": config,
        "referencia_original": referencia_original, "traza": [],
    })
    resultado = construir_resultado(estado)
    logger.info(
        "Triaje listo | doc=%s | tipo=%s | confianza=%.2f | destino=%s | auditoria=%s",
        documento_id, resultado["clasificacion"]["tipo_documento"], estado.get("confianza", 0.0),
        estado.get("destino"), estado.get("requiere_auditoria"),
    )
    return resultado
