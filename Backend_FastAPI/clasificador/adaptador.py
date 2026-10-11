
def adaptar_resultado(resultado, nombre_archivo):
    """
    Convierte la respuesta del clasificador al formato
    estándar que espera el backend de MediFlow.
    """

    # -----------------------------------------
    # 1. Validar resultado del clasificador
    # -----------------------------------------

    if not isinstance(resultado, dict):
        raise ValueError(
            "El resultado del clasificador debe ser un diccionario."
        )

    # -----------------------------------------
    # 2. Datos del paciente
    # -----------------------------------------

    datos_extraidos = resultado.get("datos_extraidos") or {}

    paciente = datos_extraidos.get("paciente")

    if paciente is None:
        paciente = resultado.get("datos_paciente") or {}

    if not paciente:
        paciente = resultado.get("paciente") or {}

    # -----------------------------------------
    # 3. Datos del médico
    # -----------------------------------------

    medico = datos_extraidos.get("medico")

    if medico is None:
        medico = resultado.get("datos_medico") or {}

    if not medico:
        medico = resultado.get("medico") or {}

    # Evitar errores si los datos vienen nulos
    if not isinstance(paciente, dict):
        paciente = {}

    if not isinstance(medico, dict):
        medico = {}

    # -----------------------------------------
    # 4. Tipo de documento
    # -----------------------------------------

    tipo_documento = resultado.get("tipo_documento")

    if tipo_documento is None:
        tipo_documento = resultado.get("clasificacion")

    if tipo_documento is None:
        tipo_documento = resultado.get("categoria")

    # -----------------------------------------
    # 5. Confianza
    # -----------------------------------------

    score_confianza = resultado.get("confianza_clasificacion")

    if score_confianza is None:
        score_confianza = resultado.get("score_confianza")

    if score_confianza is None:
        score_confianza = 0.0

    # -----------------------------------------
    # 6. Auditoría humana y enrutamiento
    # -----------------------------------------

    if "requiere_auditoria_humana" not in resultado:
        raise ValueError(
            "El clasificador no devolvió el campo "
            "'requiere_auditoria_humana'."
        )

    requiere_auditoria = resultado["requiere_auditoria_humana"]

    if not isinstance(requiere_auditoria, bool):
        raise ValueError(
            "El campo 'requiere_auditoria_humana' "
            "debe ser un booleano."
        )

    cola_enrutamiento = resultado.get("cola_enrutamiento")

    if not isinstance(cola_enrutamiento, str) or not cola_enrutamiento.strip():
        raise ValueError(
            "El clasificador no devolvió una cola de enrutamiento válida."
        )

    # -----------------------------------------
    # 7. Normalizar edad
    # -----------------------------------------

    edad = paciente.get("edad")

    if isinstance(edad, str):
        edad = (
            edad
            .replace("años", "")
            .replace("año", "")
            .strip()
        )

        try:
            edad = int(edad)
        except ValueError:
            edad = None

    # -----------------------------------------
    # 8. Contenido extraído
    # -----------------------------------------

    contenido = (
        resultado.get("contenido")
        or resultado.get("texto")
        or resultado.get("texto_extraido")
    )

    # -----------------------------------------
    # 9. Resultado estándar de MediFlow
    # -----------------------------------------

    return {
        "status": "procesado",
        "documento_id": nombre_archivo,
        "contenido": contenido,

        "clasificacion": {
            "tipo_documento": tipo_documento or "SIN CLASIFICAR",

            "especialidad": (
                medico.get("especialidad")
                or "SIN ESPECIALIDAD"
            ),

            "nivel_prioridad": (
                resultado.get("prioridad")
                or "SIN PRIORIDAD"
            ),

            "score_confianza_clasificacion": score_confianza,

            "requiere_auditoria_humana": requiere_auditoria,

            "cola_enrutamiento": cola_enrutamiento
        },

        "datos_extraidos": {
            "paciente": {
                "nombre": (
                    paciente.get("nombre_completo")
                    or paciente.get("nombre")
                    or "SIN NOMBRE"
                ),

                "rut": paciente.get("rut") or "SIN RUT",
                "edad": edad
            },

            "medico_solicitante": {
                "nombre": (
                    medico.get("nombre_completo")
                    or medico.get("nombre")
                    or "SIN NOMBRE"
                ),

                "matricula": (
                    medico.get("matricula")
                    or medico.get("rut")
                    or "SIN MATRICULA"
                )
            },

            "estudio_realizado": resultado.get(
                "estudio_realizado"
            ),

            "diagnostico_principal": resultado.get(
                "diagnostico_principal"
            ),

            "cie10_sugerido": resultado.get(
                "cie10_sugerido"
            )
        }
    }
