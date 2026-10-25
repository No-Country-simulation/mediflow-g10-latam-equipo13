"""Configuración de OCI por variables de entorno (plataformas sin archivos, como Railway). Sin red."""
import pytest

import oci_storage

LLAVE = "-----BEGIN PRIVATE KEY-----\\nABC123\\n-----END PRIVATE KEY-----"


@pytest.fixture
def variables_oci(monkeypatch):
    valores = {
        "OCI_USER": "ocid1.user.oc1..prueba",
        "OCI_TENANCY": "ocid1.tenancy.oc1..prueba",
        "OCI_FINGERPRINT": "aa:bb:cc",
        "OCI_REGION": "sa-bogota-1",
        "OCI_KEY_CONTENT": LLAVE,
    }
    for nombre, valor in valores.items():
        monkeypatch.setenv(nombre, valor)
    monkeypatch.delenv("OCI_KEY_PASSPHRASE", raising=False)
    monkeypatch.delenv("OCI_DESHABILITADO", raising=False)
    return valores


def test_sin_variables_no_hay_config(monkeypatch):
    for variable in oci_storage.VARIABLES_OCI.values():
        monkeypatch.delenv(variable, raising=False)
    assert oci_storage.config_desde_variables() is None


def test_variables_completas_arman_la_config(variables_oci):
    config = oci_storage.config_desde_variables()
    assert config["user"] == variables_oci["OCI_USER"]
    assert config["region"] == "sa-bogota-1"
    # Los "\n" escritos en el panel se convierten en saltos de línea reales.
    assert config["key_content"] == "-----BEGIN PRIVATE KEY-----\nABC123\n-----END PRIVATE KEY-----"
    assert "pass_phrase" not in config


def test_falta_una_variable(variables_oci, monkeypatch):
    monkeypatch.setenv("OCI_FINGERPRINT", "  ")
    assert oci_storage.config_desde_variables() is None


def test_frase_de_la_llave(variables_oci, monkeypatch):
    monkeypatch.setenv("OCI_KEY_PASSPHRASE", "secreta")
    assert oci_storage.config_desde_variables()["pass_phrase"] == "secreta"


def test_oci_habilitado_con_variables(variables_oci, monkeypatch):
    monkeypatch.setattr(oci_storage, "ARCHIVO_CONFIG_OCI", "/no/existe/config")
    assert oci_storage.oci_habilitado() is True
    monkeypatch.setenv("OCI_DESHABILITADO", "true")
    assert oci_storage.oci_habilitado() is False
