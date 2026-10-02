package G10.EQUIPO13.MediFlow.AiClient;

import java.math.BigDecimal;

public record AIResponse(
        //documentos
        String tipo,
        String contenido,
        String especialidad,
        String documentoId,
        BigDecimal score,

        //Paciente
        String nombrePaciente,
        String DiagnosticoPaciente,
        Short edad,
        String rut,

        //Estudio
        String estudioRealizado,
        String diagnostico,
        String cie10Sugerido,

        //medico
        String nombreMedico,
        String matricula
) {
}
