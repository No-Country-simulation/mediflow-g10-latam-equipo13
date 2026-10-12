package G10.EQUIPO13.MediFlow.AiClient.DTOs;

import com.fasterxml.jackson.annotation.JsonProperty;

public record DatosExtraidos(
        Paciente paciente,
        @JsonProperty("medico_solicitante") MedicoSolicitante medicoSolicitante,
        @JsonProperty("estudio_realizado") String estudioRealizado,
        @JsonProperty("diagnostico_principal") String diagnosticoPrincipal,
        @JsonProperty("cie10_sugerido") String cie10Sugerido
) {}