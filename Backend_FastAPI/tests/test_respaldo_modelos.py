"""Cambio automático de modelo de Gemini cuando uno está saturado o ya no existe. Sin red."""
import pytest

from clasificador import clasificador_multimodal as ia


class _Respuesta:
    text = '{"tipo_documento": "Receta"}'


class _ClienteFalso:
    """Cliente de Gemini simulado: cada modelo responde con lo que diga `fallas` (un error) o con éxito."""

    def __init__(self, fallas):
        self.fallas = fallas
        self.llamadas = []
        self.models = self

    def generate_content(self, model, contents, config):
        self.llamadas.append(model)
        error = self.fallas.get(model)
        if error:
            raise error
        return _Respuesta()


@pytest.fixture(autouse=True)
def sin_esperas(monkeypatch):
    esperas = []
    monkeypatch.setattr(ia.time, "sleep", esperas.append)
    monkeypatch.setattr(ia, "MODELO", "principal")
    monkeypatch.setenv("GEMINI_MODELOS_RESPALDO", "respaldo-1, respaldo-2")
    return esperas


def test_lista_de_modelos_sin_repetidos(monkeypatch):
    assert ia.modelos() == ["principal", "respaldo-1", "respaldo-2"]
    monkeypatch.setenv("GEMINI_MODELOS_RESPALDO", "principal,respaldo-1")
    assert ia.modelos() == ["principal", "respaldo-1"]
    monkeypatch.setenv("GEMINI_MODELOS_RESPALDO", "")
    assert ia.modelos() == ["principal"]


def test_principal_saturado_pasa_al_respaldo_sin_esperar(sin_esperas):
    cliente = _ClienteFalso({"principal": Exception("503 UNAVAILABLE")})
    assert ia._generar(cliente, ["doc"]) == {"tipo_documento": "Receta"}
    assert cliente.llamadas == ["principal", "respaldo-1"]
    assert sin_esperas == []


def test_modelo_inexistente_tambien_pasa_al_siguiente():
    cliente = _ClienteFalso({"principal": Exception("404 NOT_FOUND"), "respaldo-1": Exception("429 RESOURCE_EXHAUSTED")})
    assert ia._generar(cliente, ["doc"]) == {"tipo_documento": "Receta"}
    assert cliente.llamadas == ["principal", "respaldo-1", "respaldo-2"]


def test_todos_saturados_reintenta_la_lista_con_esperas(sin_esperas):
    saturado = Exception("503 UNAVAILABLE")
    cliente = _ClienteFalso({"principal": saturado, "respaldo-1": saturado, "respaldo-2": saturado})
    assert ia._generar(cliente, ["doc"]) is None
    assert len(cliente.llamadas) == 3 * ia.MAX_INTENTOS
    assert sin_esperas == list(ia.ESPERAS_REINTENTO)


def test_una_sola_ronda_no_espera(sin_esperas):
    saturado = Exception("503 UNAVAILABLE")
    cliente = _ClienteFalso({"principal": saturado, "respaldo-1": saturado, "respaldo-2": saturado})
    assert ia._generar(cliente, ["doc"], rondas=1) is None
    assert cliente.llamadas == ["principal", "respaldo-1", "respaldo-2"]
    assert sin_esperas == []


def test_ninguno_existe_no_espera(sin_esperas):
    falta = Exception("404 NOT_FOUND")
    cliente = _ClienteFalso({"principal": falta, "respaldo-1": falta, "respaldo-2": falta})
    assert ia._generar(cliente, ["doc"]) is None
    assert len(cliente.llamadas) == 3
    assert sin_esperas == []


def test_error_no_transitorio_no_prueba_otros_modelos():
    cliente = _ClienteFalso({"principal": ValueError("API key not valid")})
    assert ia._generar(cliente, ["doc"]) is None
    assert cliente.llamadas == ["principal"]
