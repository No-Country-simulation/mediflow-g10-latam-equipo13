package G10.EQUIPO13.MediFlow.Documentos.controller;

import java.time.OffsetDateTime;

/** Caso urgente reciente, para las alertas en tiempo real de la interfaz. */
public record AlertaResponse(
        Long id,
        String documentoId,
        String tipo,
        String paciente,
        String destino,
        String mensaje,
        Boolean requiereAuditoria,
        OffsetDateTime fecha
) {
}
