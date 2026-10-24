"""Pruebas de integridad y recuperacion del movimiento, sin acceso a OCI."""
import hashlib
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

import oci_storage as s


def error_oci(status, code):
    return s.oci.exceptions.ServiceError(status, code, {}, "error simulado")


class EnrutamientoTests(unittest.TestCase):
    def setUp(self):
        self.doc_id = "2204f93e-3d6f-461b-a7b0-123074f8d300"
        self.objeto = f"estructurados/2026/01/31/{self.doc_id}.json"
        self.crudo = f"2026/01/31/{self.doc_id}_prueba.txt"
        self.contenido = b'{"es_prueba": true}'
        self.ref = {
            "doc_id": self.doc_id, "bucket": s.BUCKET_RECIBIDOS, "object_name": self.objeto,
            "sha256": hashlib.sha256(self.contenido).hexdigest(),
            "original": {"bucket": s.BUCKET_RECIBIDOS, "object_name": self.crudo},
        }
        headers = {
            "etag": "version-1", "content-type": "application/json; charset=utf-8",
            "opc-meta-doc-id": self.doc_id, "opc-meta-bucket-original": s.BUCKET_RECIBIDOS,
            "opc-meta-objeto-original": self.crudo, "opc-meta-estado": "pendiente-enrutamiento",
        }
        self.origen = (s.BUCKET_RECIBIDOS, self.objeto)
        self.objetos = {self.origen: SimpleNamespace(data=SimpleNamespace(content=self.contenido), headers=headers)}
        self.cliente = Mock()
        self.cliente.get_object.side_effect = self.leer
        self.cliente.put_object.side_effect = self.escribir
        self.cliente.delete_object.side_effect = self.borrar
        self.get_cliente = self.enterContext(patch.object(s, "_get_cliente", return_value=(self.cliente, "ns")))
        self.enterContext(self.assertLogs(s.logger))

    def leer(self, ns, bucket, objeto):
        if (bucket, objeto) not in self.objetos:
            raise error_oci(404, "ObjectNotFound")
        return self.objetos[bucket, objeto]

    def escribir(self, ns, bucket, objeto, contenido, **kwargs):
        self.assertEqual(kwargs["if_none_match"], "*")
        if (bucket, objeto) in self.objetos:
            raise error_oci(412, "NoEtagMatch")
        headers = {f"opc-meta-{k}": v for k, v in kwargs["opc_meta"].items()}
        headers.update({"etag": "destino-1", "content-type": kwargs["content_type"]})
        self.objetos[bucket, objeto] = SimpleNamespace(data=SimpleNamespace(content=contenido), headers=headers)

    def borrar(self, ns, bucket, objeto, **kwargs):
        self.assertEqual((bucket, objeto), self.origen)
        if self.objetos[bucket, objeto].headers["etag"] != kwargs["if_match"]:
            raise error_oci(412, "NoEtagMatch")
        del self.objetos[bucket, objeto]

    def test_procesado_y_reintento_con_origen_ya_retirado(self):
        final = s.enrutar_json_estructurado(self.ref, "procesados")
        self.assertEqual(final["bucket"], s.BUCKET_PROCESADOS)
        self.assertEqual(final["estado"], "procesado")
        self.assertNotIn(self.origen, self.objetos)
        self.assertEqual(s.enrutar_json_estructurado(self.ref, "procesados"), final)
        self.assertEqual(self.cliente.put_object.call_count, 1)
        self.assertEqual(self.cliente.delete_object.call_count, 1)

    def test_revision_humana(self):
        final = s.enrutar_json_estructurado(self.ref, "auditoria_humana")
        self.assertEqual(final["bucket"], s.BUCKET_AUDITORIA)
        self.assertEqual(final["estado"], "revision_humana")
        self.assertEqual(self.objetos[s.BUCKET_AUDITORIA, self.objeto].data.content, self.contenido)

    def test_decision_y_referencia_invalidas_no_conectan(self):
        for ref, destino in [(self.ref, "urgencias"), ({**self.ref, "sha256": ""}, "procesados"),
                             ({**self.ref, "object_name": "otro.json"}, "procesados")]:
            with self.assertRaises(ValueError):
                s.enrutar_json_estructurado(ref, destino)
        self.get_cliente.assert_not_called()

    def test_fallo_de_copia_conserva_origen(self):
        self.cliente.put_object.side_effect = error_oci(403, "NotAuthorized")
        with self.assertRaises(s.oci.exceptions.ServiceError):
            s.enrutar_json_estructurado(self.ref, "procesados")
        self.assertIn(self.origen, self.objetos)
        self.cliente.delete_object.assert_not_called()

    def test_copia_corrupta_no_permite_borrar_origen(self):
        def corrupta(*args, **kwargs):
            self.escribir(*args, **kwargs)
            self.objetos[s.BUCKET_PROCESADOS, self.objeto].data.content = b'corrupto'
        self.cliente.put_object.side_effect = corrupta
        with self.assertRaises(ValueError):
            s.enrutar_json_estructurado(self.ref, "procesados")
        self.cliente.delete_object.assert_not_called()

    def test_fallo_de_borrado_se_recupera_sin_sobrescribir_destino(self):
        self.cliente.delete_object.side_effect = error_oci(403, "NotAuthorized")
        with self.assertRaises(s.oci.exceptions.ServiceError):
            s.enrutar_json_estructurado(self.ref, "procesados")
        self.assertIn(self.origen, self.objetos)
        copia = self.objetos[s.BUCKET_PROCESADOS, self.objeto]
        self.cliente.delete_object.side_effect = self.borrar
        s.enrutar_json_estructurado(self.ref, "procesados")
        self.assertIs(copia, self.objetos[s.BUCKET_PROCESADOS, self.objeto])
        self.assertNotIn(self.origen, self.objetos)

    def test_origen_modificado_durante_copia_no_se_borra(self):
        def copia_con_cambio(*args, **kwargs):
            self.escribir(*args, **kwargs)
            self.objetos[self.origen].headers["etag"] = "version-2"
        self.cliente.put_object.side_effect = copia_con_cambio
        with self.assertRaises(s.oci.exceptions.ServiceError) as caught:
            s.enrutar_json_estructurado(self.ref, "procesados")
        self.assertEqual(caught.exception.status, 412)
        self.assertIn(self.origen, self.objetos)

    def test_referencia_de_contenido_anterior_es_rechazada(self):
        self.objetos[self.origen].data.content = b'{"nuevo": true}'
        with self.assertRaises(ValueError):
            s.enrutar_json_estructurado(self.ref, "procesados")
        self.cliente.put_object.assert_not_called()
        self.cliente.delete_object.assert_not_called()

    def test_destino_preexistente_distinto_no_se_sobrescribe(self):
        self.objetos[s.BUCKET_PROCESADOS, self.objeto] = SimpleNamespace(
            data=SimpleNamespace(content=b'otro contenido'), headers={})
        with self.assertRaises(ValueError):
            s.enrutar_json_estructurado(self.ref, "procesados")
        self.assertEqual(self.objetos[s.BUCKET_PROCESADOS, self.objeto].data.content, b'otro contenido')
        self.cliente.delete_object.assert_not_called()

    def test_no_reenruta_al_otro_bucket(self):
        s.enrutar_json_estructurado(self.ref, "procesados")
        with self.assertRaises(ValueError):
            s.enrutar_json_estructurado(self.ref, "auditoria_humana")
        self.assertNotIn((s.BUCKET_AUDITORIA, self.objeto), self.objetos)

    def test_ausencia_de_ambas_copias_no_informa_exito(self):
        self.objetos.clear()
        with self.assertRaises(ValueError):
            s.enrutar_json_estructurado(self.ref, "procesados")

    def test_error_de_bucket_no_se_confunde_con_objeto_ausente(self):
        self.cliente.get_object.side_effect = error_oci(404, "BucketNotFound")
        with self.assertRaises(s.oci.exceptions.ServiceError):
            s.enrutar_json_estructurado(self.ref, "procesados")
        self.cliente.put_object.assert_not_called()

    def test_metadatos_del_original_incorrectos_impiden_mover(self):
        self.objetos[self.origen].headers["opc-meta-doc-id"] = "otro-documento"
        with self.assertRaises(ValueError):
            s.enrutar_json_estructurado(self.ref, "procesados")
        self.cliente.put_object.assert_not_called()
        self.cliente.delete_object.assert_not_called()

    def test_tipo_mime_incorrecto_impide_mover(self):
        self.objetos[self.origen].headers["content-type"] = "text/plain"
        with self.assertRaises(ValueError):
            s.enrutar_json_estructurado(self.ref, "procesados")
        self.cliente.put_object.assert_not_called()

    def test_falta_de_etag_impide_copiar_y_borrar(self):
        del self.objetos[self.origen].headers["etag"]
        with self.assertRaises(ValueError):
            s.enrutar_json_estructurado(self.ref, "procesados")
        self.cliente.put_object.assert_not_called()
        self.cliente.delete_object.assert_not_called()

    def test_fallo_de_lectura_de_copia_conserva_origen(self):
        def lectura_con_fallo(ns, bucket, objeto):
            if bucket == s.BUCKET_PROCESADOS:
                raise error_oci(503, "ServiceUnavailable")
            return self.leer(ns, bucket, objeto)
        self.cliente.get_object.side_effect = lectura_con_fallo
        with self.assertRaises(s.oci.exceptions.ServiceError):
            s.enrutar_json_estructurado(self.ref, "procesados")
        self.assertIn(self.origen, self.objetos)
        self.cliente.delete_object.assert_not_called()


if __name__ == "__main__":
    unittest.main()
