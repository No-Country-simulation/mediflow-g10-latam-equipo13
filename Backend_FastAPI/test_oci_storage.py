"""Pruebas sin red ni credenciales: python -m unittest -v test_oci_storage."""
import json
import unittest
from unittest.mock import Mock, patch

import oci_storage as storage


class JsonEstructuradoTests(unittest.TestCase):
    def setUp(self):
        self.doc_id = "2204f93e-3d6f-461b-a7b0-123074f8d300"
        self.original = {
            "doc_id": self.doc_id,
            "bucket": "BktRecibidos",
            "object_name": f"2026/01/31/{self.doc_id}_prueba.txt",
            "size_bytes": 12,
        }
        self.cliente = Mock()
        self.cliente.put_object.return_value.headers = {"opc-request-id": "prueba-local"}
        self.get_cliente = self.enterContext(patch.object(storage, "_get_cliente", return_value=(self.cliente, "namespace-prueba")))
        self.logs = self.enterContext(self.assertLogs(storage.logger, level="INFO"))

    def test_conserva_json_unicode_y_vinculo_al_original(self):
        datos = {"texto": "niñez y extracción", "lista": [None, True, 0.95], "anidado": {"campo": "valor"}}
        resultado = storage.subir_json_estructurado(datos, self.original)
        args, kwargs = self.cliente.put_object.call_args
        self.assertEqual(json.loads(args[3]), datos)
        self.assertIn("niñez".encode(), args[3])
        self.assertEqual(args[1], "BktRecibidos")
        self.assertEqual(args[2], f"estructurados/2026/01/31/{self.doc_id}.json")
        self.assertEqual(resultado["doc_id"], self.doc_id)
        self.assertEqual(resultado["size_bytes"], len(args[3]))
        self.assertEqual(kwargs["opc_meta"]["objeto-original"], self.original["object_name"])
        self.assertEqual(kwargs["opc_meta"]["estado"], "pendiente-enrutamiento")
        self.assertEqual(kwargs["content_type"], "application/json; charset=utf-8")
        self.assertNotIn("niñez", "\n".join(self.logs.output))

    def test_reproceso_usa_misma_ruta_y_fecha_del_original(self):
        primero = storage.subir_json_estructurado({"version": 1}, self.original)
        segundo = storage.subir_json_estructurado({"version": 2}, self.original)
        self.assertEqual(primero["object_name"], segundo["object_name"])
        self.assertEqual(json.loads(self.cliente.put_object.call_args.args[3]), {"version": 2})

    def test_rechaza_referencias_inconsistentes_antes_de_conectar(self):
        casos = [None, {}, {**self.original, "doc_id": "invalido"},
                 {**self.original, "bucket": "BktProcesados"},
                 {**self.original, "object_name": "2026/01/31/otro-id_prueba.txt"},
                 {**self.original, "object_name": f"2026/02/30/{self.doc_id}_prueba.txt"}]
        for referencia in casos:
            with self.subTest(referencia=referencia), self.assertRaises((TypeError, ValueError)):
                storage.subir_json_estructurado({}, referencia)
        self.get_cliente.assert_not_called()

    def test_rechaza_datos_no_json_sin_subir(self):
        for datos in ['{"campo": 1}', [], {"score": float("nan")}, {"score": float("inf")}, {"valor": object()}]:
            with self.subTest(tipo=type(datos).__name__), self.assertRaises((TypeError, ValueError)):
                storage.subir_json_estructurado(datos, self.original)
        self.cliente.put_object.assert_not_called()
        self.get_cliente.assert_not_called()

    def test_error_oci_se_propaga_y_no_expone_contenido_en_log(self):
        error = RuntimeError("contenido-que-no-debe-aparecer")
        self.cliente.put_object.side_effect = error
        with self.assertRaises(RuntimeError) as recibido:
            storage.subir_json_estructurado({"dato": "contenido-que-no-debe-aparecer"}, self.original)
        self.assertIs(recibido.exception, error)
        salida = "\n".join(self.logs.output)
        self.assertIn("FALLO JSON", salida)
        self.assertNotIn("contenido-que-no-debe-aparecer", salida)
        self.assertNotIn("JSON OK", salida)


class InicializacionTests(unittest.TestCase):
    def test_fallo_de_namespace_permite_reintentar_inicializacion(self):
        cliente = Mock()
        cliente.get_namespace.side_effect = [RuntimeError("fallo temporal"), Mock(data="namespace-prueba")]
        with patch.object(storage, "_cliente", None), patch.object(storage, "_namespace", None), \
             patch.object(storage.oci.config, "from_file", return_value={"region": "sa-saopaulo-1"}), \
             patch.object(storage.oci.object_storage, "ObjectStorageClient", return_value=cliente), \
             self.assertLogs(storage.logger):
            with self.assertRaises(RuntimeError):
                storage._get_cliente()
            self.assertIsNone(storage._cliente)
            self.assertEqual(storage._get_cliente(), (cliente, "namespace-prueba"))


if __name__ == "__main__":
    unittest.main()
