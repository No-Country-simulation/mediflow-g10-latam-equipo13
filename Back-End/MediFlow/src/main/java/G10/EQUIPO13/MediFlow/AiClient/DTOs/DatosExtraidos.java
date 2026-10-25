package G10.EQUIPO13.MediFlow.AiClient.DTOs;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record DatosExtraidos(
        Paciente paciente,
        @JsonProperty("medico_solicitante") MedicoSolicitante medicoSolicitante,
        @JsonProperty("estudio_realizado") String estudioRealizado,
        @JsonProperty("diagnostico_principal") String diagnosticoPrincipal,
        @JsonProperty("cie10_sugerido") String cie10Sugerido,
        List<Medicamento> medicamentos
) {}
