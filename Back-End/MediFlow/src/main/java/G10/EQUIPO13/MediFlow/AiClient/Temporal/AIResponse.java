package G10.EQUIPO13.MediFlow.AiClient.Temporal;

import java.math.BigDecimal;

public record AIResponse(
        String tipo,
        String contenido,
        String especialidad,
        String documentoId,
        BigDecimal score,
        String nombrePaciente,
        String diagnosticoPaciente,
        Short edad,
        String rut,
        String estudioRealizado,
        String diagnostico,
        String cie10Sugerido,
        String nombreMedico,
        String matricula,
        String prioridad
) {}
