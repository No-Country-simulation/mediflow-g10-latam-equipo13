"""
Alertas en tiempo real para casos urgentes.

Si ALERTA_WEBHOOK_URL está definida, envía un POST JSON compatible con Slack ("text"),
Discord ("content") y n8n (recibe todo el cuerpo). Por privacidad, el nombre del paciente
solo viaja si ALERTA_INCLUIR_PACIENTE=true: el webhook suele ser un servicio externo.
"""
import logging
import os

import httpx

logger = logging.getLogger("mediflow.alertas")


def enviar_alerta(notificacion: dict, resumen: dict) -> str:
    """Devuelve 'enviada', 'no_configurada' o 'error'. Nunca interrumpe el triaje."""
    url = os.getenv("ALERTA_WEBHOOK_URL", "").strip()
    if not url:
        return "no_configurada"
    incluir_paciente = os.getenv("ALERTA_INCLUIR_PACIENTE", "").lower() in ("1", "true", "si", "sí")
    texto = (
        notificacion["mensaje"] if incluir_paciente
        else f"🚨 MediFlow: caso urgente ({resumen.get('tipo') or 'documento'}) con {resumen.get('hallazgo')}. "
             f"Destino: {resumen.get('destino')}. Documento {resumen.get('documento_id')}."
    )
    cuerpo = {
        "text": texto,
        "content": texto,
        "canal": notificacion.get("canal"),
        "documento_id": resumen.get("documento_id"),
        "destino": resumen.get("destino"),
        "tipo": resumen.get("tipo"),
    }
    try:
        respuesta = httpx.post(url, json=cuerpo, timeout=5.0)
        respuesta.raise_for_status()
        logger.info("Alerta enviada | doc=%s", resumen.get("documento_id"))
        return "enviada"
    except Exception as error:  # noqa: BLE001 - la alerta es complementaria
        logger.warning("No se pudo enviar la alerta (%s)", type(error).__name__)
        return "error"
