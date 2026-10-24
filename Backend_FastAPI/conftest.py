"""Configuración común de pytest: las pruebas nunca tocan OCI ni Gemini reales."""
import os

os.environ.setdefault("OCI_DESHABILITADO", "1")
os.environ.pop("ALERTA_WEBHOOK_URL", None)
