"""Datos 100 % sintéticos: nunca usar documentos reales en pruebas."""
from clasificador.adaptador import adaptar_resultado


def test_acepta_variantes_de_claves_y_limpia_placeholders():
    resultado = adaptar_resultado({
        "clasificacion": "Receta",
        "confianza_clasificacion": 0.91,
        "prioridad": "URGENTE",
        "texto": "Receta de prueba",
        "datos_extraidos": {
            "paciente": {"nombre_completo": "Paciente Ficticio Uno", "rut": "SIN RUT", "edad": "47 años"},
            "medico": {"nombre_completo": "Médica Ficticia", "rut": "MP 00001", "especialidad": "Medicina General"},
            "medicamentos": ["Paracetamol", {"medicamento": "Ibuprofeno", "dosis": "400 mg", "via_administracion": "oral"}],
        },
    })
    assert resultado["tipo_documento"] == "Receta"
    assert resultado["score_confianza"] == 0.91
    assert resultado["prioridad"] == "Urgente"
    assert resultado["contenido"] == "Receta de prueba"
    assert resultado["paciente"] == {"nombre": "Paciente Ficticio Uno", "rut": None, "edad": 47}
    assert resultado["medico"]["matricula"] == "MP 00001"
    assert resultado["especialidad"] == "Medicina General"
    assert resultado["medicamentos"][1] == {"nombre": "Ibuprofeno", "dosis": "400 mg", "frecuencia": None, "via": "oral", "duracion": None}


def test_formato_nuevo_del_prompt():
    resultado = adaptar_resultado({
        "tipo_documento": "Informe de laboratorio",
        "score_confianza": 0.8,
        "paciente": {"nombre": "Paciente Ficticio Dos", "edad": None},
        "medico": {"nombre": None, "matricula": None},
        "cie10_sugerido": " i26.9 ",
        "hallazgos_criticos": ["Potasio crítico"],
        "ambiguedades": [],
    })
    assert resultado["tipo_documento"] == "Informe de Estudio por Imágenes"
    assert resultado["tipo_original"] == "Informe de laboratorio"
    assert resultado["cie10_sugerido"] == "I26.9"
    assert resultado["hallazgos_criticos"] == ["Potasio crítico"]
    assert resultado["prioridad"] == "Rutina"


def test_rechaza_lo_que_no_es_diccionario():
    import pytest

    with pytest.raises(ValueError):
        adaptar_resultado(["no", "es", "dict"])
