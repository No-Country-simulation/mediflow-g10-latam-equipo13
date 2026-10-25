import copy

import pytest

from agente import reglas
from agente.escenarios_demo import ESCENARIOS
from agente.grafo import IANoDisponible, construir_grafo, ejecutar_triaje
from agente.reglas import ConfigTriaje


def correr(respuesta_ia, *, config=None, canal="Consulta_Externa", texto="texto sintético"):
    persistidos, alertas = [], []

    def persistidor(estado, resultado):
        persistidos.append((estado["requiere_auditoria"], resultado))
        return {"bucket": "BktPrueba", "ruta_objeto": "x.json", "ruta_original": "y.pdf", "status_backup": "exito"}

    def notificador(notificacion, resumen):
        alertas.append(notificacion)
        return "enviada"

    grafo = construir_grafo(lambda _e: copy.deepcopy(respuesta_ia), persistidor, notificador)
    resultado = ejecutar_triaje(grafo, documento_id="doc-1", config=config or ConfigTriaje(),
                                canal_origen=canal, texto=texto)
    return resultado, persistidos, alertas


def nodos(resultado):
    return [paso["nodo"] for paso in resultado["traza"]]


def test_escenario_rutina_va_al_flujo_estandar():
    caso = ESCENARIOS["rutina"]
    resultado, persistidos, alertas = correr(caso["respuesta_ia"], canal=caso["canal_origen"])
    assert resultado["status"] == "procesado"
    assert resultado["decision_enrutamiento"]["destino_principal"] == "Farmacia_Hospitalaria"
    assert resultado["decision_enrutamiento"]["requiere_auditoria_humana"] is False
    assert resultado["clasificacion"]["nivel_prioridad"] == "Rutina"
    assert resultado["datos_extraidos"]["medicamentos"][0]["nombre"] == "Paracetamol"
    assert alertas == []
    assert persistidos[0][0] is False
    assert nodos(resultado) == ["extraer", "validar", "evaluar_confianza", "detectar_urgencia", "ruta_estandar", "persistir"]


def test_escenario_urgencia_alerta_a_la_guardia():
    caso = ESCENARIOS["urgencia"]
    resultado, _, alertas = correr(caso["respuesta_ia"], canal=caso["canal_origen"])
    decision = resultado["decision_enrutamiento"]
    assert decision["destino_principal"] == reglas.DESTINO_URGENCIA
    assert decision["notificacion_generada"]["canal"] == "Alerta_Guardia_Medica"
    assert "Carlos Eduardo Mendes" in decision["notificacion_generada"]["mensaje"]
    assert resultado["clasificacion"]["nivel_prioridad"] == "Urgente"
    assert resultado["datos_extraidos"]["cie10_sugerido"] == "I26.9"
    assert len(alertas) == 1
    assert nodos(resultado)[-3:] == ["ruta_urgencia", "notificar", "persistir"]


def test_escenario_ambiguo_va_a_revision_humana():
    caso = ESCENARIOS["ambiguo"]
    resultado, persistidos, _ = correr(caso["respuesta_ia"], canal=caso["canal_origen"])
    assert resultado["status"] == "pendiente_revision_humana"
    assert resultado["decision_enrutamiento"]["destino_principal"] == reglas.DESTINO_REVISION
    assert resultado["clasificacion"]["score_confianza_clasificacion"] < 0.60
    assert "Nombre del paciente" in resultado["validacion"]["campos_faltantes"]
    assert "revisión humana" in resultado["decision_enrutamiento"]["justificacion_enrutamiento"]
    assert persistidos[0][0] is True


def test_umbral_configurable_manda_a_revision():
    resultado, _, _ = correr(ESCENARIOS["rutina"]["respuesta_ia"], config=ConfigTriaje(umbral=0.99))
    assert resultado["decision_enrutamiento"]["destino_principal"] == reglas.DESTINO_REVISION
    assert resultado["validacion"]["umbral"] == 0.99


def test_destino_configurable_por_tipo():
    config = ConfigTriaje.desde_dict({"destinos": {"Receta": "Farmacia_Central"}})
    resultado, _, _ = correr(ESCENARIOS["rutina"]["respuesta_ia"], config=config)
    assert resultado["decision_enrutamiento"]["destino_principal"] == "Farmacia_Central"


def test_termino_de_urgencia_configurable():
    config = ConfigTriaje.desde_dict({"terminos_urgencia": ["cefalea"]})
    resultado, _, alertas = correr(ESCENARIOS["rutina"]["respuesta_ia"], config=config)
    assert resultado["decision_enrutamiento"]["destino_principal"] == reglas.DESTINO_URGENCIA
    assert len(alertas) == 1


def test_receta_con_medicamento_de_alto_riesgo_pasa_por_un_humano():
    respuesta = copy.deepcopy(ESCENARIOS["rutina"]["respuesta_ia"])
    respuesta["medicamentos"].append({"nombre": "Heparina", "dosis": "5000 UI", "frecuencia": "cada 12 h"})
    resultado, _, _ = correr(respuesta)
    assert resultado["decision_enrutamiento"]["destino_principal"] == reglas.DESTINO_REVISION
    assert resultado["validacion"]["medicamentos_alto_riesgo"] == ["Heparina"]


def test_urgente_pero_dudoso_se_revisa_y_se_alerta_igual():
    respuesta = copy.deepcopy(ESCENARIOS["urgencia"]["respuesta_ia"])
    respuesta["score_confianza"] = 0.4
    resultado, _, alertas = correr(respuesta, canal="Guardia_Emergencias")
    assert resultado["decision_enrutamiento"]["destino_principal"] == reglas.DESTINO_REVISION
    assert "alertó a la guardia" in resultado["decision_enrutamiento"]["justificacion_enrutamiento"]
    assert len(alertas) == 1


def test_si_la_ia_no_responde_se_informa():
    grafo = construir_grafo(lambda _e: None, lambda *_: {}, lambda *_: "no_configurada")
    with pytest.raises(IANoDisponible):
        ejecutar_triaje(grafo, documento_id="doc-1", config=ConfigTriaje(), texto="x")


def test_el_grafo_exporta_su_diagrama():
    grafo = construir_grafo(lambda _e: {}, lambda *_: {}, lambda *_: "")
    mermaid = grafo.get_graph().draw_mermaid()
    for nodo in ("extraer", "detectar_urgencia", "ruta_revision", "notificar", "persistir"):
        assert nodo in mermaid
