"""Pruebas de la API sin red: la IA y OCI se simulan."""
import json
import uuid
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

import main
from agente.escenarios_demo import ESCENARIOS

cliente = TestClient(main.app)
URGENCIA = ESCENARIOS["urgencia"]["respuesta_ia"]
RUTINA = ESCENARIOS["rutina"]["respuesta_ia"]
AMBIGUO = ESCENARIOS["ambiguo"]["respuesta_ia"]


def test_estado_reglas_y_grafo():
    assert cliente.get("/").json()["message"] == "Mediflow API is running!"
    salud = cliente.get("/salud").json()
    assert salud["oci_habilitado"] is False
    assert "Receta" in cliente.get("/reglas").json()["categorias"]
    assert "detectar_urgencia" in cliente.get("/grafo").json()["mermaid"]


@pytest.mark.parametrize("escenario,destino", [
    ("rutina", "Farmacia_Hospitalaria"),
    ("urgencia", "Cola_Emergencia_Medica"),
    ("ambiguo", "Cola_Revision_Humana"),
])
def test_demo_de_los_tres_escenarios(escenario, destino):
    respuesta = cliente.get(f"/demo/{escenario}")
    assert respuesta.status_code == 200
    assert respuesta.json()["decision_enrutamiento"]["destino_principal"] == destino


def test_demo_inexistente():
    assert cliente.get("/demo/otro").status_code == 404


def test_analizar_texto_con_el_formato_del_brief():
    with patch.object(main.ia, "analizar_texto", return_value=URGENCIA) as ia:
        respuesta = cliente.post("/analizar-texto", json={
            "documento_id": "DOC-CLIN-2026-8942", "tipo_archivo": "PDF",
            "documento_texto": ESCENARIOS["urgencia"]["texto"], "canal_origen": "Guardia_Emergencias",
        })
    assert respuesta.status_code == 200, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["documento_id"] == "DOC-CLIN-2026-8942"
    assert cuerpo["clasificacion"]["nivel_prioridad"] == "Urgente"
    assert cuerpo["decision_enrutamiento"]["notificacion_generada"]["canal"] == "Alerta_Guardia_Medica"
    assert cuerpo["almacenamiento_oci"]["status_backup"] == "omitido"
    ia.assert_called_once()


def test_config_del_gestor_cambia_la_decision():
    with patch.object(main.ia, "analizar_texto", return_value=RUTINA):
        respuesta = cliente.post("/analizar-texto", json={
            "documento_texto": ESCENARIOS["rutina"]["texto"], "config": {"umbral": 0.99},
        })
    assert respuesta.json()["decision_enrutamiento"]["destino_principal"] == "Cola_Revision_Humana"


def test_analizar_txt_usa_el_texto_sin_subir_archivos():
    with patch.object(main.ia, "analizar_texto", return_value=RUTINA) as texto, \
         patch.object(main.ia, "analizar_archivo") as archivo:
        respuesta = cliente.post("/analizar", files={"archivo": ("receta.txt", ESCENARIOS["rutina"]["texto"].encode(), "text/plain")})
    assert respuesta.status_code == 200
    texto.assert_called_once()
    archivo.assert_not_called()


def test_analizar_pdf_con_config_y_canal():
    with patch.object(main.ia, "analizar_archivo", return_value=RUTINA) as archivo:
        respuesta = cliente.post(
            "/analizar",
            files={"archivo": ("receta.pdf", b"%PDF-1.4 sintetico", "application/pdf")},
            data={"canal_origen": "Guardia", "config": json.dumps({"umbral": 0.5})},
        )
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["canal_origen"] == "Guardia"
    assert cuerpo["decision_enrutamiento"]["destino_principal"] == "Cola_Emergencia_Medica"
    archivo.assert_called_once()


@pytest.mark.parametrize("archivo,codigo", [
    (("virus.exe", b"MZ", "application/octet-stream"), 415),
    (("vacio.pdf", b"", "application/pdf"), 400),
])
def test_validaciones_de_archivo(archivo, codigo):
    assert cliente.post("/analizar", files={"archivo": archivo}).status_code == codigo


def test_config_invalida():
    respuesta = cliente.post("/analizar", files={"archivo": ("a.txt", b"texto de prueba", "text/plain")}, data={"config": "{no-json"})
    assert respuesta.status_code == 400


def test_si_la_ia_no_responde_devuelve_503():
    with patch.object(main.ia, "analizar_texto", return_value=None):
        respuesta = cliente.post("/analizar-texto", json={"documento_texto": "texto de prueba largo"})
    assert respuesta.status_code == 503
    assert "Intenta de nuevo" in respuesta.json()["detail"]["mensaje"]


class TestIntegracionOCI:
    """Reemplaza a test_main_oci.py: mismo objetivo, flujo nuevo."""

    doc_id = str(uuid.uuid4())
    original = {"doc_id": doc_id, "bucket": "BktRecibidos", "object_name": f"2026/10/24/{doc_id}_prueba.pdf", "size_bytes": 12}
    referencia_json = {"doc_id": doc_id, "bucket": "BktRecibidos", "object_name": f"estructurados/2026/10/24/{doc_id}.json",
                       "sha256": "a" * 64, "original": original}

    def _post(self, respuesta_ia):
        with patch.object(main.oci_storage, "oci_habilitado", return_value=True), \
             patch.object(main.oci_storage, "subir_documento_crudo", return_value=self.original) as subir, \
             patch.object(main.oci_storage, "subir_json_estructurado", return_value=self.referencia_json) as subir_json, \
             patch.object(main.oci_storage, "enrutar_json_estructurado") as enrutar, \
             patch.object(main.ia, "analizar_archivo", return_value=respuesta_ia):
            enrutar.side_effect = lambda ref, destino: {
                "bucket": "BktAuditoria-humana" if destino == "auditoria_humana" else "BktProcesados",
                "object_name": ref["object_name"],
            }
            respuesta = cliente.post("/analizar", files={"archivo": ("prueba.pdf", b"contenido", "application/pdf")})
        return respuesta, subir, subir_json, enrutar

    def test_documento_estandar_va_a_procesados(self):
        respuesta, subir, subir_json, enrutar = self._post(RUTINA)
        cuerpo = respuesta.json()
        assert cuerpo["documento_id"] == self.doc_id
        assert cuerpo["almacenamiento_oci"] == {
            "bucket": "BktProcesados", "ruta_objeto": self.referencia_json["object_name"],
            "ruta_original": self.original["object_name"], "status_backup": "exito",
        }
        subir.assert_called_once()
        subir_json.assert_called_once()
        enrutar.assert_called_once_with(self.referencia_json, "procesados")

    def test_documento_ambiguo_va_a_auditoria(self):
        respuesta, _, _, enrutar = self._post(AMBIGUO)
        assert respuesta.json()["status"] == "pendiente_revision_humana"
        assert respuesta.json()["almacenamiento_oci"]["bucket"] == "BktAuditoria-humana"
        enrutar.assert_called_once_with(self.referencia_json, "auditoria_humana")

    def test_fallo_de_ia_conserva_el_original(self):
        respuesta, _, subir_json, enrutar = self._post(None)
        assert respuesta.status_code == 503
        assert respuesta.json()["detail"]["documento_id"] == self.doc_id
        assert respuesta.json()["detail"]["original_conservado"] is True
        subir_json.assert_not_called()
        enrutar.assert_not_called()

    def test_si_falla_el_respaldo_el_triaje_sigue(self):
        with patch.object(main.oci_storage, "oci_habilitado", return_value=True), \
             patch.object(main.oci_storage, "subir_documento_crudo", return_value=self.original), \
             patch.object(main.oci_storage, "subir_json_estructurado", side_effect=RuntimeError("caído")), \
             patch.object(main.ia, "analizar_archivo", return_value=RUTINA):
            respuesta = cliente.post("/analizar", files={"archivo": ("prueba.pdf", b"contenido", "application/pdf")})
        assert respuesta.status_code == 200
        assert respuesta.json()["almacenamiento_oci"]["status_backup"] == "error"


def test_revision_sin_oci_se_omite():
    respuesta = cliente.post("/documentos/revision", json={
        "documento_id": str(uuid.uuid4()), "ruta_objeto": "x", "decision": "aprobado",
    })
    assert respuesta.json()["status_backup"] == "omitido"


def test_revision_valida_la_ruta():
    with patch.object(main.oci_storage, "oci_habilitado", return_value=True):
        respuesta = cliente.post("/documentos/revision", json={
            "documento_id": str(uuid.uuid4()), "ruta_objeto": "estructurados/2026/10/24/otro.json", "decision": "aprobado",
        })
    assert respuesta.status_code == 400


def test_original_valida_la_ruta():
    with patch.object(main.oci_storage, "oci_habilitado", return_value=True):
        assert cliente.get("/documentos/original", params={"ruta": "../../secreto"}).status_code == 400
