"""
Normaliza la respuesta de la IA a un formato estable para el agente.

Gemini no siempre usa las mismas claves (nombre / nombre_completo, score_confianza /
confianza_clasificacion, etc.). Aquí se aceptan las variantes conocidas, se limpian
los placeholders ("SIN NOMBRE", "N/A") y se tipan los valores. No se toman decisiones
de enrutamiento: eso lo hace el grafo con las reglas de agente/reglas.py.
"""
from agente.reglas import edad_valida, limpiar, normalizar_cie10, normalizar_tipo, sin_tildes


def _primero(*valores):
    for valor in valores:
        if valor not in (None, "", [], {}):
            return valor
    return None


def _dict(valor) -> dict:
    return valor if isinstance(valor, dict) else {}


def _lista_textos(valor) -> list[str]:
    if isinstance(valor, str):
        valor = [valor]
    if not isinstance(valor, list):
        return []
    return [texto for texto in (limpiar(v) for v in valor) if texto]


def _medicamentos(valor) -> list[dict]:
    if not isinstance(valor, list):
        return []
    resultado = []
    for item in valor:
        if isinstance(item, str):
            item = {"nombre": item}
        if not isinstance(item, dict):
            continue
        nombre = limpiar(_primero(item.get("nombre"), item.get("medicamento"), item.get("principio_activo")))
        if not nombre:
            continue
        resultado.append({
            "nombre": nombre,
            "dosis": limpiar(item.get("dosis")),
            "frecuencia": limpiar(item.get("frecuencia")),
            "via": limpiar(_primero(item.get("via"), item.get("via_administracion"))),
            "duracion": limpiar(item.get("duracion")),
        })
    return resultado


def adaptar_resultado(resultado: dict) -> dict:
    """Convierte la respuesta cruda de la IA en el diccionario normalizado del agente."""
    if not isinstance(resultado, dict):
        raise ValueError("El resultado del clasificador debe ser un diccionario.")

    extraidos = _dict(resultado.get("datos_extraidos"))
    paciente = _dict(_primero(extraidos.get("paciente"), resultado.get("datos_paciente"), resultado.get("paciente")))
    medico = _dict(_primero(
        extraidos.get("medico"), extraidos.get("medico_solicitante"),
        resultado.get("datos_medico"), resultado.get("medico"), resultado.get("medico_solicitante"),
    ))

    tipo_original = limpiar(_primero(resultado.get("tipo_documento"), resultado.get("categoria"),
                                     resultado.get("clasificacion") if isinstance(resultado.get("clasificacion"), str) else None))
    prioridad = sin_tildes(limpiar(_primero(resultado.get("prioridad"), resultado.get("nivel_prioridad"))) or "")

    return {
        "tipo_documento": normalizar_tipo(tipo_original),
        "tipo_original": tipo_original,
        "especialidad": limpiar(_primero(resultado.get("especialidad"), medico.get("especialidad"))),
        "prioridad": "Urgente" if prioridad.startswith("urgent") else "Rutina",
        "score_confianza": _primero(resultado.get("score_confianza"), resultado.get("confianza_clasificacion"),
                                    resultado.get("score_confianza_clasificacion")),
        "contenido": limpiar(_primero(resultado.get("contenido"), resultado.get("texto"), resultado.get("texto_extraido"))),
        "paciente": {
            "nombre": limpiar(_primero(paciente.get("nombre_completo"), paciente.get("nombre"))),
            "rut": limpiar(_primero(paciente.get("rut"), paciente.get("documento"), paciente.get("dni"))),
            "edad": edad_valida(paciente.get("edad")),
        },
        "medico": {
            "nombre": limpiar(_primero(medico.get("nombre_completo"), medico.get("nombre"))),
            "matricula": limpiar(_primero(medico.get("matricula"), medico.get("rut"))),
            "especialidad": limpiar(medico.get("especialidad")),
        },
        "estudio_realizado": limpiar(_primero(extraidos.get("estudio_realizado"), resultado.get("estudio_realizado"),
                                              resultado.get("estudio_solicitado"))),
        "diagnostico_principal": limpiar(_primero(extraidos.get("diagnostico_principal"), resultado.get("diagnostico_principal"))),
        "cie10_sugerido": normalizar_cie10(_primero(extraidos.get("cie10_sugerido"), resultado.get("cie10_sugerido"))),
        "medicamentos": _medicamentos(_primero(extraidos.get("medicamentos"), resultado.get("medicamentos"))),
        "hallazgos_criticos": _lista_textos(resultado.get("hallazgos_criticos")),
        "ambiguedades": _lista_textos(resultado.get("ambiguedades")),
        "justificacion_ia": limpiar(resultado.get("justificacion")),
    }
