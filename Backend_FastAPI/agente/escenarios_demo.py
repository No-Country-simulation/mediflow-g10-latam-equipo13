"""
Los 3 escenarios que exige el brief (rutina, urgencia y ambigüedad), con datos sintéticos.

"respuesta_ia" es lo que devuelve Gemini para ese texto. Se usa en las pruebas y en el
endpoint /demo/{escenario}, que recorre el grafo real sin llamar a la IA ni a OCI.
"""

ESCENARIOS = {
    "rutina": {
        "canal_origen": "Consulta_Externa",
        "texto": (
            "CENTRO MEDICO LOS ALAMOS - RECETA MEDICA\n"
            "Paciente: Marta Lucia Rojas Pineda, 41 años. RUT 12.345.678-5\n"
            "Medico: Dr. Andres Felipe Cardenas, Medicina General, MP 20311\n"
            "Diagnostico: Cefalea tensional (G44.2)\n"
            "Rp: 1) Paracetamol 500 mg cada 8 horas por 5 dias, via oral.\n"
            "2) Ibuprofeno 400 mg cada 12 horas por 3 dias, via oral, con alimentos."
        ),
        "respuesta_ia": {
            "tipo_documento": "Receta",
            "especialidad": "Medicina General",
            "prioridad": "Rutina",
            "score_confianza": 0.96,
            "contenido": "RECETA MEDICA. Paracetamol 500 mg cada 8 horas; Ibuprofeno 400 mg cada 12 horas.",
            "paciente": {"nombre": "Marta Lucia Rojas Pineda", "rut": "12.345.678-5", "edad": 41},
            "medico": {"nombre": "Dr. Andres Felipe Cardenas", "matricula": "MP 20311", "especialidad": "Medicina General"},
            "estudio_realizado": None,
            "diagnostico_principal": "Cefalea tensional",
            "cie10_sugerido": "G44.2",
            "medicamentos": [
                {"nombre": "Paracetamol", "dosis": "500 mg", "frecuencia": "cada 8 horas", "via": "oral", "duracion": "5 días"},
                {"nombre": "Ibuprofeno", "dosis": "400 mg", "frecuencia": "cada 12 horas", "via": "oral", "duracion": "3 días"},
            ],
            "hallazgos_criticos": [],
            "ambiguedades": [],
            "justificacion": "Documento con encabezado de receta y prescripción de dos fármacos.",
        },
    },
    "urgencia": {
        "canal_origen": "Guardia_Emergencias",
        "texto": (
            "HOSPITAL SANTA LUCIA - INFORME DE ESTUDIO RADIOLOGICO. Paciente: Carlos Eduardo Mendes, 52 anos. "
            "Medico Solicitante: Dra. Renata Silveira MP 145892. Estudio: Tomografia de Torax con contraste. "
            "Hallazgos: Defecto de llenado en arteria pulmonar principal derecha compatible con TEP agudo. "
            "CONCLUSION: Cuadro compatible con Tromboembolismo Pulmonar Agudo. Se sugiere correlacion clinica urgente."
        ),
        "respuesta_ia": {
            "tipo_documento": "Informe de Estudio por Imágenes",
            "especialidad": "Radiología / Neumonología",
            "prioridad": "Urgente",
            "score_confianza": 0.97,
            "contenido": "INFORME DE ESTUDIO RADIOLOGICO. Defecto de llenado compatible con TEP agudo. "
                         "Cuadro compatible con Tromboembolismo Pulmonar Agudo.",
            "paciente": {"nombre": "Carlos Eduardo Mendes", "rut": None, "edad": 52},
            "medico": {"nombre": "Dra. Renata Silveira", "matricula": "145892", "especialidad": None},
            "estudio_realizado": "Tomografía de Tórax con contraste",
            "diagnostico_principal": "Tromboembolismo Pulmonar Agudo (TEP)",
            "cie10_sugerido": "I26.9",
            "medicamentos": [],
            "hallazgos_criticos": ["TEP agudo"],
            "ambiguedades": [],
            "justificacion": "Informe radiológico con hallazgo crítico de alta gravedad.",
        },
    },
    "ambiguo": {
        "canal_origen": "Admision",
        "texto": (
            "Clinica ???? - orden\nPcte: [ilegible] edad ??\nDr/a: firma ilegible   matricula: ----\n"
            "Estudio: ec... [borrado] abdo?\nDx: dolor, no se lee bien\nIndic.: ver anexo (no adjunto)"
        ),
        "respuesta_ia": {
            "tipo_documento": "Orden de Procedimiento",
            "especialidad": None,
            "prioridad": "Rutina",
            "score_confianza": 0.48,
            "contenido": "Clinica - orden. Estudio: ec... abdo? Dx: dolor.",
            "paciente": {"nombre": None, "rut": None, "edad": None},
            "medico": {"nombre": None, "matricula": None, "especialidad": None},
            "estudio_realizado": "Posible ecografía abdominal",
            "diagnostico_principal": "Dolor (no especificado)",
            "cie10_sugerido": None,
            "medicamentos": [],
            "hallazgos_criticos": [],
            "ambiguedades": ["Nombre del paciente ilegible", "El estudio solicitado está incompleto"],
            "justificacion": "Parece una orden de estudio, pero gran parte del texto es ilegible.",
        },
    },
}
