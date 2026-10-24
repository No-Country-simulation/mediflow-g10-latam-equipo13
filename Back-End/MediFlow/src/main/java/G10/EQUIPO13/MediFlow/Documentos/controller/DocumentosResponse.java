package G10.EQUIPO13.MediFlow.Documentos.controller;

import G10.EQUIPO13.MediFlow.AiClient.DTOs.Medicamento;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * Documento procesado. Las fechas viajan en UTC con zona (ej. 2026-10-24T03:52:23Z).
 */
public record DocumentosResponse(
        Long id,
        String status,
        String tipo,
        String contenido,
        String especialidad,
        String prioridad,
        String documentoId,
        OffsetDateTime fechaRegistro,
        OffsetDateTime fechaActualizacion,
        BigDecimal score,
        Boolean requiereAuditoria,
        String colaEnrutamiento,
        String destino,
        String justificacion,
        String nombreMedico,
        String matricula,
        String nombrePaciente,
        String rutPaciente,
        Short edadPaciente,
        String estudioRealizado,
        String diagnosticoPrincipal,
        String cie10Sugerido,
        List<Medicamento> medicamentos,
        Notificacion notificacion,
        Map<String, Object> validacion,
        List<Map<String, Object>> traza,
        Almacenamiento almacenamiento,
        Revision revision,
        String canalOrigen,
        String nombreArchivo,
        String usuario
) {

    public record Notificacion(String canal, String mensaje) {
    }

    public record Almacenamiento(String bucket, String ruta, String rutaOriginal, String status) {
    }

    public record Revision(String decision, String comentario, String revisor, OffsetDateTime fecha) {
    }
}
