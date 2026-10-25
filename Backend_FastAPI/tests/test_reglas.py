from agente import reglas
from agente.reglas import ConfigTriaje


def test_normaliza_el_tipo_a_las_categorias_oficiales():
    assert reglas.normalizar_tipo("RECETA MÉDICA") == "Receta"
    assert reglas.normalizar_tipo("Informe de laboratorio") == "Informe de Estudio por Imágenes"
    assert reglas.normalizar_tipo("Orden de laboratorio") == "Orden de Procedimiento"
    assert reglas.normalizar_tipo("Epicrisis / Informe de alta") == "Epicrisis"
    assert reglas.normalizar_tipo("Informe de imágenes de alta resolución") == "Informe de Estudio por Imágenes"
    assert reglas.normalizar_tipo("Certificado médico laboral") == "Certificado Médico"
    assert reglas.normalizar_tipo("carta comercial") is None


def test_limpia_placeholders_de_la_ia():
    for valor in ("SIN NOMBRE", "Sin RUT", "sin matrícula", "N/A", "null", "  ", "---", None):
        assert reglas.limpiar(valor) is None
    assert reglas.limpiar(" Juan ") == "Juan"


def test_receta_sin_medicamentos_ni_matricula():
    faltantes, _ = reglas.validar({
        "tipo_documento": "Receta", "contenido": "x",
        "paciente": {"nombre": "A"}, "medico": {"nombre": "B"}, "medicamentos": [],
    })
    assert "Medicamentos de la receta" in faltantes
    assert "Matrícula del médico" in faltantes


def test_edad_fuera_de_rango_y_cie10_invalido():
    datos = {
        "tipo_documento": "Certificado Médico", "contenido": "x", "cie10_sugerido": "XYZ",
        "paciente": {"nombre": "A", "edad": 150}, "medico": {"nombre": "B"},
    }
    _, inconsistencias = reglas.validar(datos)
    assert any("Edad fuera de rango" in i for i in inconsistencias)
    assert any("CIE-10" in i for i in inconsistencias)
    assert datos["paciente"]["edad"] is None


def test_confianza_penaliza_y_queda_entre_0_y_1():
    confianza, detalle = reglas.calcular_confianza(0.9, ["a"], ["b"], ["c"])
    assert confianza == round(0.9 - 0.08 - 0.06 - 0.10, 4)
    assert detalle["confianza_ia"] == 0.9
    assert reglas.calcular_confianza(0.1, ["a"] * 5, [], [])[0] == 0.0
    assert reglas.calcular_confianza("no es número", [], [], [])[0] == 0.0
    assert reglas.calcular_confianza(7, [], [], [])[0] == 1.0


def test_urgencia_por_termino_sin_tildes_y_por_canal():
    es, motivos = reglas.detectar_urgencia({"contenido": "Compatible con TROMBOEMBOLISMO pulmonar"}, None, reglas.TERMINOS_URGENCIA)
    assert es and "tromboembolismo" in motivos[0]
    es, motivos = reglas.detectar_urgencia({"contenido": "control"}, "Guardia_Emergencias", reglas.TERMINOS_URGENCIA)
    assert es and "canal" in motivos[0]


def test_urgencia_no_confunde_palabras_que_contienen_el_termino():
    es, _ = reglas.detectar_urgencia({"contenido": "Estatura normal, estado general bueno"}, "Consulta", reglas.TERMINOS_URGENCIA)
    assert not es


def test_medicamentos_de_alto_riesgo():
    meds = [{"nombre": "Insulina glargina"}, {"nombre": "Paracetamol"}]
    assert reglas.medicamentos_de_alto_riesgo(meds) == ["Insulina glargina"]


def test_decision_de_ruta():
    assert reglas.decidir_ruta(0.95, 0.6, [], [], False) == "estandar"
    assert reglas.decidir_ruta(0.95, 0.6, [], [], True) == "urgencia"
    assert reglas.decidir_ruta(0.50, 0.6, [], [], True) == "revision_humana"
    assert reglas.decidir_ruta(0.95, 0.6, ["ilegible"], [], False) == "revision_humana"
    assert reglas.decidir_ruta(0.95, 0.6, [], ["Heparina"], False) == "revision_humana"


def test_config_desde_dict_valida_los_valores():
    config = ConfigTriaje.desde_dict({
        "umbral": 3, "terminos_urgencia": [" sangrado ", ""],
        "destinos": {"Receta": "Farmacia_Central", "Tipo inventado": "X"},
    })
    assert config.umbral == 1.0
    assert config.terminos_urgencia == ("sangrado",)
    assert config.destinos["Receta"] == "Farmacia_Central"
    assert "Tipo inventado" not in config.destinos
    assert ConfigTriaje.desde_dict({"umbral": "abc"}).umbral == reglas.UMBRAL_CONFIANZA
