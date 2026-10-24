"""
oci_storage.py - Modulo de OCI Object Storage para MediFlow (Sprints 2 a 4)

Que hace:
  - subir_documento_crudo(): sube el documento original al bucket "BktRecibidos"
  - subir_json_estructurado(): guarda el JSON pendiente de enrutamiento con el mismo doc_id
  - enrutar_json_estructurado(): mueve el resultado al bucket decidido por Backend
  - listar_recibidos(): lista lo que hay en el bucket (para verificar)
  - Logging de cada operacion en consola y en el archivo mediflow_oci.log

Uso desde el backend (endpoint de ingesta):
    from oci_storage import subir_documento_crudo
    resultado = subir_documento_crudo(contenido_bytes, "receta_juan.pdf")
    # resultado -> {"doc_id": "...", "bucket": "BktRecibidos", "object_name": "...", "size_bytes": 1234}

Perfil de credenciales:
  Por defecto usa el perfil [DEFAULT] de ~/.oci/config.
  Para usar otro (ej. Hackaton), definir la variable de entorno OCI_PROFILE.
    PowerShell:  $env:OCI_PROFILE = "Hackaton"
"""
import hashlib
import json
import logging
import mimetypes
import os
import re
import time
import uuid
from datetime import datetime, timezone

import oci

PERFIL_OCI = os.getenv("OCI_PROFILE", "DEFAULT")
ARCHIVO_CONFIG_OCI = os.getenv("OCI_CONFIG_FILE", "~/.oci/config")

# Nombres exactos de los buckets existentes en mediflow-hackathon.
BUCKET_RECIBIDOS = "BktRecibidos"
BUCKET_PROCESADOS = "BktProcesados"
BUCKET_AUDITORIA = "BktAuditoria-humana"

logger = logging.getLogger("mediflow.oci")


def configurar_logging(archivo: str = "mediflow_oci.log") -> None:
    """Configura el logger una sola vez (consola + archivo)."""
    if logger.handlers:
        return
    logger.setLevel(logging.INFO)
    formato = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s")
    for handler in (logging.FileHandler(archivo, encoding="utf-8"), logging.StreamHandler()):
        handler.setFormatter(formato)
        logger.addHandler(handler)


configurar_logging()

_cliente = None
_namespace = None


def _get_cliente():
    """Crea el cliente OCI una sola vez y lo reutiliza."""
    global _cliente, _namespace
    if _cliente is None:
        config = oci.config.from_file(
            file_location=ARCHIVO_CONFIG_OCI,
            profile_name=PERFIL_OCI,
        )
        cliente = oci.object_storage.ObjectStorageClient(
            config, retry_strategy=oci.retry.DEFAULT_RETRY_STRATEGY
        )
        namespace = cliente.get_namespace().data
        _cliente, _namespace = cliente, namespace
        logger.info("Cliente OCI listo | perfil=%s | region=%s", PERFIL_OCI, config["region"])
    return _cliente, _namespace


def _nombre_seguro(nombre: str) -> str:
    """Deja solo letras, numeros, punto, guion y guion bajo (evita caracteres raros en OCI)."""
    return re.sub(r"[^A-Za-z0-9._-]", "_", nombre)


def subir_documento_crudo(contenido: bytes, nombre_original: str, tipo_mime: str | None = None) -> dict:
    """
    Sube el documento original al bucket 'BktRecibidos'.

    El objeto queda con esta ruta:  AAAA/MM/DD/<doc_id>_<nombre>
    El doc_id (UUID) identifica al documento en todo el pipeline: usarlo tambien al
    guardar el JSON estructurado en Sprint 3 para mantener la trazabilidad.
    """
    cliente, namespace = _get_cliente()

    doc_id = str(uuid.uuid4())
    hoy = datetime.now(timezone.utc)
    nombre = _nombre_seguro(nombre_original)
    object_name = f"{hoy:%Y/%m/%d}/{doc_id}_{nombre}"
    tipo = tipo_mime or mimetypes.guess_type(nombre_original)[0] or "application/octet-stream"

    inicio = time.perf_counter()
    try:
        cliente.put_object(
            namespace,
            BUCKET_RECIBIDOS,
            object_name,
            contenido,
            content_type=tipo,
            opc_meta={"doc-id": doc_id, "nombre-original": nombre},
        )
    except Exception as error:
        logger.error(
            "FALLO subida | bucket=%s | objeto=%s | error=%s", BUCKET_RECIBIDOS, object_name, error
        )
        raise

    duracion = time.perf_counter() - inicio
    logger.info(
        "SUBIDA OK | bucket=%s | objeto=%s | bytes=%d | %.2fs",
        BUCKET_RECIBIDOS, object_name, len(contenido), duracion,
    )
    return {
        "doc_id": doc_id,
        "bucket": BUCKET_RECIBIDOS,
        "object_name": object_name,
        "size_bytes": len(contenido),
    }


def _referencia_crudo(documento_crudo: dict) -> tuple[str, str, str]:
    """Valida la referencia devuelta por subir_documento_crudo, sin consultar OCI."""
    if not isinstance(documento_crudo, dict):
        raise TypeError("documento_crudo debe ser el diccionario devuelto por subir_documento_crudo.")
    doc_id = documento_crudo.get("doc_id")
    objeto = documento_crudo.get("object_name")
    if not isinstance(doc_id, str) or not isinstance(objeto, str):
        raise ValueError("La referencia debe incluir doc_id y object_name como texto.")
    if str(uuid.UUID(doc_id)) != doc_id:
        raise ValueError("doc_id debe ser un UUID en formato canonico.")
    if documento_crudo.get("bucket") != BUCKET_RECIBIDOS:
        raise ValueError("El original debe pertenecer a BktRecibidos.")
    patron = rf"(\d{{4}}/\d{{2}}/\d{{2}})/{re.escape(doc_id)}_[A-Za-z0-9._-]*"
    coincidencia = re.fullmatch(patron, objeto)
    if coincidencia is None:
        raise ValueError("La ruta del original no coincide con su doc_id o con el formato del Sprint 2.")
    fecha = coincidencia.group(1)
    datetime.strptime(fecha, "%Y/%m/%d")
    return doc_id, fecha, objeto


def subir_json_estructurado(datos: dict, documento_crudo: dict) -> dict:
    """
    Persiste el JSON validado por Backend, aun pendiente de enrutamiento.

    Usa BktRecibidos/estructurados/AAAA/MM/DD/<doc_id>.json, con la fecha UTC
    del original. No modifica el esquema clinico ni calcula scores.
    Repetir con la misma referencia actualiza el mismo objeto JSON.
    La referencia se valida localmente; Backend debe conservar la devuelta
    por una subida exitosa del original. No se comprueba su existencia remota.
    """
    inicio = time.perf_counter()
    try:
        doc_id, fecha, objeto_original = _referencia_crudo(documento_crudo)
        if not isinstance(datos, dict):
            raise TypeError("datos debe ser un diccionario JSON, no un texto JSON.")
        contenido = json.dumps(datos, ensure_ascii=False, allow_nan=False, indent=2).encode("utf-8")
        object_name = f"estructurados/{fecha}/{doc_id}.json"
        cliente, namespace = _get_cliente()
        respuesta = cliente.put_object(
            namespace,
            BUCKET_RECIBIDOS,
            object_name,
            contenido,
            content_type="application/json; charset=utf-8",
            opc_meta={
                "doc-id": doc_id,
                "bucket-original": BUCKET_RECIBIDOS,
                "objeto-original": objeto_original,
                "estado": "pendiente-enrutamiento",
            },
        )
    except Exception as error:
        # No registrar el JSON ni mensajes de error que puedan contener datos clinicos.
        logger.error(
            "FALLO JSON | tipo=%s | status=%s | codigo=%s",
            type(error).__name__, getattr(error, "status", "-"), getattr(error, "code", "-"),
        )
        raise

    logger.info(
        "JSON OK | doc_id=%s | bucket=%s | objeto=%s | bytes=%d | %.2fs | request_id=%s",
        doc_id, BUCKET_RECIBIDOS, object_name, len(contenido),
        time.perf_counter() - inicio, respuesta.headers.get("opc-request-id", "-"),
    )
    return {
        "doc_id": doc_id,
        "bucket": BUCKET_RECIBIDOS,
        "object_name": object_name,
        "size_bytes": len(contenido),
        "original": {"bucket": BUCKET_RECIBIDOS, "object_name": objeto_original},
        "estado": "pendiente_enrutamiento",
        "sha256": hashlib.sha256(contenido).hexdigest(),
    }


def _leer_si_existe(cliente, namespace: str, bucket: str, objeto: str):
    """Solo la ausencia del objeto es esperable; permisos y buckets fallidos se propagan."""
    try:
        return cliente.get_object(namespace, bucket, objeto)
    except oci.exceptions.ServiceError as error:
        if error.status == 404 and error.code == "ObjectNotFound":
            return None
        raise


def _comprobar_copia(respuesta, huella: str, metadata: dict) -> bytes:
    if respuesta is None:
        raise ValueError("No se encontro el JSON en la ubicacion esperada.")
    contenido = respuesta.data.content
    if hashlib.sha256(contenido).hexdigest() != huella:
        raise ValueError("El JSON remoto difiere del resultado que Backend solicito enrutar.")
    for clave, valor in metadata.items():
        if respuesta.headers.get(f"opc-meta-{clave}") != valor:
            raise ValueError("Los metadatos del JSON no coinciden con su referencia.")
    if respuesta.headers.get("content-type", "").split(";")[0].strip() != "application/json":
        raise ValueError("El objeto no tiene el tipo application/json.")
    return contenido


def enrutar_json_estructurado(referencia_json: dict, destino: str) -> dict:
    """
    Mueve el JSON pendiente a 'procesados' o 'auditoria_humana'.

    Recibe la referencia completa de subir_json_estructurado, incluido sha256.
    Verifica la copia antes de borrar el pendiente, usando ETag para proteger
    cambios concurrentes del origen. Los reintentos con la misma referencia y
    destino son recuperables. Backend debe serializar operaciones por doc_id:
    no hay una transaccion atomica entre buckets ni bloqueo distribuido.
    """
    inicio = time.perf_counter()
    try:
        rutas = {
            "procesados": (BUCKET_PROCESADOS, "procesado"),
            "auditoria_humana": (BUCKET_AUDITORIA, "revision_humana"),
        }
        if not isinstance(destino, str) or destino not in rutas:
            raise ValueError("destino debe ser 'procesados' o 'auditoria_humana'.")
        if not isinstance(referencia_json, dict) or not isinstance(referencia_json.get("original"), dict):
            raise ValueError("Se requiere la referencia completa del JSON y su original.")
        doc_id, fecha, original = _referencia_crudo({
            **referencia_json["original"], "doc_id": referencia_json.get("doc_id"),
        })
        objeto = f"estructurados/{fecha}/{doc_id}.json"
        if referencia_json.get("bucket") != BUCKET_RECIBIDOS or referencia_json.get("object_name") != objeto:
            raise ValueError("La referencia debe identificar el JSON pendiente en BktRecibidos.")
        huella = referencia_json.get("sha256")
        if not isinstance(huella, str) or re.fullmatch(r"[0-9a-f]{64}", huella) is None:
            raise ValueError("Falta sha256. Usa la referencia devuelta por la version actual de subir_json_estructurado.")
        bucket, estado = rutas[destino]
        metadata_base = {"doc-id": doc_id, "bucket-original": BUCKET_RECIBIDOS, "objeto-original": original}
        metadata_final = {
            **metadata_base, "estado": estado.replace("_", "-"), "sha256": huella,
            "bucket-origen": BUCKET_RECIBIDOS, "objeto-origen": objeto,
        }
        cliente, namespace = _get_cliente()
        otro_bucket = BUCKET_AUDITORIA if bucket == BUCKET_PROCESADOS else BUCKET_PROCESADOS
        if _leer_si_existe(cliente, namespace, otro_bucket, objeto) is not None:
            raise ValueError("Ya hay un resultado en el otro destino. Revisar la decision antes de reenrutar.")
        pendiente = _leer_si_existe(cliente, namespace, BUCKET_RECIBIDOS, objeto)
        if pendiente is None:
            # Recupera el caso donde se completo el movimiento pero se perdio la respuesta.
            final = _leer_si_existe(cliente, namespace, bucket, objeto)
            contenido = _comprobar_copia(final, huella, metadata_final)
        else:
            contenido = _comprobar_copia(pendiente, huella, {**metadata_base, "estado": "pendiente-enrutamiento"})
            etag = pendiente.headers.get("etag")
            if not etag:
                raise ValueError("OCI no devolvio el ETag necesario para proteger el origen.")
            try:
                cliente.put_object(
                    namespace, bucket, objeto, contenido,
                    content_type="application/json; charset=utf-8",
                    opc_meta=metadata_final, if_none_match="*",
                )
            except oci.exceptions.ServiceError as error:
                if error.status != 412:
                    raise
                # Un destino existente solo se acepta si coincide con esta operacion.
            final = cliente.get_object(namespace, bucket, objeto)
            _comprobar_copia(final, huella, metadata_final)
            try:
                cliente.delete_object(namespace, BUCKET_RECIBIDOS, objeto, if_match=etag)
            except oci.exceptions.ServiceError as error:
                if not (error.status == 404 and error.code == "ObjectNotFound"):
                    raise
        resultado = {
            "doc_id": doc_id, "bucket": bucket, "object_name": objeto,
            "size_bytes": len(contenido), "sha256": huella, "estado": estado,
            "original": {"bucket": BUCKET_RECIBIDOS, "object_name": original},
        }
    except Exception as error:
        logger.error(
            "FALLO ENRUTAMIENTO | tipo=%s | status=%s | codigo=%s",
            type(error).__name__, getattr(error, "status", "-"), getattr(error, "code", "-"),
        )
        raise
    logger.info(
        "ENRUTAMIENTO OK | doc_id=%s | destino=%s | objeto=%s | bytes=%d | %.2fs",
        doc_id, bucket, objeto, len(contenido), time.perf_counter() - inicio,
    )
    return resultado


def listar_recibidos(limite: int = 20) -> list[str]:
    """Devuelve hasta limite nombres de objetos (no ordenados por fecha de subida)."""
    cliente, namespace = _get_cliente()
    respuesta = cliente.list_objects(namespace, BUCKET_RECIBIDOS, limit=limite)
    nombres = [obj.name for obj in respuesta.data.objects]
    logger.info("LISTADO | bucket=%s | objetos=%d", BUCKET_RECIBIDOS, len(nombres))
    return nombres


if __name__ == "__main__":
    # Autotest: sube un texto de prueba y lista el bucket
    resultado = subir_documento_crudo("Receta de prueba MediFlow".encode("utf-8"), "prueba_sprint2.txt")
    print("Subido:", resultado)
    print(f"Contenido de '{BUCKET_RECIBIDOS}':")
    for nombre in listar_recibidos():
        print(" -", nombre)
