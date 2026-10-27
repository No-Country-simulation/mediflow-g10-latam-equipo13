"""Asistente virtual: arma el prompt según el rol, responde rápido y falla con 503 si Gemini no está. Sin red."""
from fastapi.testclient import TestClient

import asistente
import main
from clasificador import clasificador_multimodal as ia

cliente = TestClient(main.app)


def test_el_prompt_usa_el_rol_y_las_reglas_reales():
    prompt = asistente.construir_prompt("AUDITOR")
    assert "La persona tiene el rol: Auditor" in prompt
    assert "Umbral por defecto: 60 %" in prompt
    assert "Farmacia_Hospitalaria" in prompt
    assert "Nunca des diagnósticos" in prompt
    assert "rol: desconocido" in asistente.construir_prompt(None)


def test_la_conversacion_solo_lleva_los_ultimos_mensajes():
    historial = [{"rol": "usuario", "texto": f"mensaje {i}"} for i in range(10)]
    texto = asistente.conversacion("¿Y cómo lo hago?", historial)
    assert "mensaje 3" not in texto
    assert "Persona: mensaje 9" in texto
    assert texto.endswith("PREGUNTA ACTUAL:\n¿Y cómo lo hago?")
    assert asistente.conversacion("Hola") == "PREGUNTA ACTUAL:\nHola"


def test_responde_con_un_solo_intento_por_modelo(monkeypatch):
    llamadas = []

    def generar(cliente_ia, contenido, rondas):
        llamadas.append(rondas)
        return {"respuesta": "  Ve a **Auditoría humana**.  "}

    monkeypatch.setattr(ia, "_cliente", lambda: object())
    monkeypatch.setattr(ia, "_generar", generar)
    assert asistente.responder("¿Dónde reviso los casos?", "AUDITOR") == "Ve a **Auditoría humana**."
    assert llamadas == [1]


def test_sin_respuesta_valida_devuelve_none(monkeypatch):
    monkeypatch.setattr(ia, "_cliente", lambda: object())
    monkeypatch.setattr(ia, "_generar", lambda *a, **k: None)
    assert asistente.responder("Hola") is None
    monkeypatch.setattr(ia, "_generar", lambda *a, **k: {"respuesta": "   "})
    assert asistente.responder("Hola") is None

    def sin_clave():
        raise RuntimeError("Falta configurar la variable de entorno GEMINI_API_KEY.")

    monkeypatch.setattr(ia, "_cliente", sin_clave)
    assert asistente.responder("Hola") is None


def test_endpoint_responde_y_pasa_el_rol_y_el_historial(monkeypatch):
    recibido = {}

    def responder(pregunta, rol, historial):
        recibido.update(pregunta=pregunta, rol=rol, historial=historial)
        return "Desde **Usuarios y roles**."

    monkeypatch.setattr(asistente, "responder", responder)
    respuesta = cliente.post("/asistente", json={
        "pregunta": "¿Cómo apruebo una cuenta?",
        "rol_usuario": "ADMIN",
        "historial": [{"rol": "usuario", "texto": "Hola"}, {"rol": "asistente", "texto": "¡Hola!"}],
    })
    assert respuesta.status_code == 200
    assert respuesta.json() == {"respuesta": "Desde **Usuarios y roles**."}
    assert recibido["rol"] == "ADMIN"
    assert recibido["historial"][1] == {"rol": "asistente", "texto": "¡Hola!"}


def test_endpoint_503_si_gemini_no_responde(monkeypatch):
    monkeypatch.setattr(asistente, "responder", lambda *a: None)
    respuesta = cliente.post("/asistente", json={"pregunta": "¿Qué es MediFlow?"})
    assert respuesta.status_code == 503


def test_endpoint_valida_la_pregunta():
    assert cliente.post("/asistente", json={"pregunta": ""}).status_code == 422
    assert cliente.post("/asistente", json={"pregunta": "x" * 501}).status_code == 422
    assert cliente.post("/asistente", json={"pregunta": "Hola", "rol_usuario": "ROOT"}).status_code == 422
