
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient

import main


class IntegracionAnalizarOCITests(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(main.app)

        self.original = {
            "doc_id": "test-doc-123",
            "bucket": "BktRecibidos",
            "object_name": "2026/10/13/test-doc-123_prueba.pdf",
            "size_bytes": 12,
        }

        self.referencia_json = {
            "doc_id": "test-doc-123",
            "bucket": "BktRecibidos",
            "object_name": "estructurados/2026/10/13/test-doc-123.json",
            "sha256": "a" * 64,
            "original": self.original,
        }

    def resultado_clasificador(self, auditoria=False):
        return {
            "contenido": "Documento de prueba",
            "tipo_documento": "Orden de laboratorio",
            "datos_extraidos": {
                "paciente": {
                    "nombre": "Paciente de prueba",
                    "rut": "00.000.000-0",
                    "edad": 30,
                },
                "medico": {
                    "nombre": "Medico de prueba",
                    "matricula": "MAT-001",
                    "especialidad": "Laboratorio",
                },
            },
            "prioridad": "Rutina",
            "score_confianza": 0.55 if auditoria else 0.95,
            "requiere_auditoria_humana": auditoria,
            "cola_enrutamiento": (
                "Revision" if auditoria else "Rutina"
            ),
        }

    @patch("main.enrutar_json_estructurado")
    @patch("main.subir_json_estructurado")
    @patch("main.subir_documento_crudo")
    @patch("main.clasificar_documento")
    def test_documento_se_enruta_a_procesados(
        self, clasificar, subir_original, subir_json, enrutar
    ):
        clasificar.return_value = self.resultado_clasificador()
        subir_original.return_value = self.original
        subir_json.return_value = self.referencia_json
        enrutar.return_value = {"status": "ok"}

        respuesta = self.client.post(
            "/analizar",
            files={
                "archivo": (
                    "prueba.pdf",
                    b"contenido de prueba",
                    "application/pdf",
                )
            },
        )

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(
            respuesta.json()["documento_id"], "test-doc-123"
        )
        self.assertEqual(respuesta.json()["status"], "procesado")

        subir_original.assert_called_once()
        subir_json.assert_called_once()
        enrutar.assert_called_once_with(
            self.referencia_json, "procesados"
        )

    @patch("main.enrutar_json_estructurado")
    @patch("main.subir_json_estructurado")
    @patch("main.subir_documento_crudo")
    @patch("main.clasificar_documento")
    def test_documento_se_enruta_a_auditoria(
        self, clasificar, subir_original, subir_json, enrutar
    ):
        clasificar.return_value = self.resultado_clasificador(
            auditoria=True
        )
        subir_original.return_value = self.original
        subir_json.return_value = self.referencia_json
        enrutar.return_value = {"status": "ok"}

        respuesta = self.client.post(
            "/analizar",
            files={
                "archivo": (
                    "ambiguo.pdf",
                    b"contenido de prueba",
                    "application/pdf",
                )
            },
        )

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(
            respuesta.json()["status"],
            "pendiente_revision_humana",
        )
        self.assertTrue(
            respuesta.json()["clasificacion"][
                "requiere_auditoria_humana"
            ]
        )
        enrutar.assert_called_once_with(
            self.referencia_json, "auditoria_humana"
        )

    @patch("main.enrutar_json_estructurado")
    @patch("main.subir_json_estructurado")
    @patch("main.subir_documento_crudo")
    @patch("main.clasificar_documento")
    def test_fallo_de_ia_conserva_referencia_del_original(
        self, clasificar, subir_original, subir_json, enrutar
    ):
        clasificar.return_value = None
        subir_original.return_value = self.original

        respuesta = self.client.post(
            "/analizar",
            files={
                "archivo": (
                    "prueba.pdf",
                    b"contenido de prueba",
                    "application/pdf",
                )
            },
        )

        self.assertEqual(respuesta.status_code, 503)
        self.assertEqual(
            respuesta.json()["detail"]["documento_id"],
            "test-doc-123",
        )
        self.assertTrue(
            respuesta.json()["detail"]["original_conservado"]
        )
        subir_json.assert_not_called()
        enrutar.assert_not_called()


if __name__ == "__main__":
    unittest.main()
