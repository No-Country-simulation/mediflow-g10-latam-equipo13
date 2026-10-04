package G10.EQUIPO13.MediFlow.AiClient;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

public record ResultadoTriaje(
        String status,
        @JsonProperty("documento_id") String documentoId,
        String contenido,
        Clasificacion clasificacion,
        @JsonProperty("datos_extraidos") DatosExtraidos datosExtraidos
) {}

 record Clasificacion(
        @JsonProperty("tipo_documento") String tipoDocumento,
        String especialidad,
        @JsonProperty("nivel_prioridad") String nivelPrioridad,
        @JsonProperty("score_confianza_clasificacion") Double scoreConfianzaClasificacion
) {}

 record DatosExtraidos(
        Paciente paciente,
        @JsonProperty("medico_solicitante") MedicoSolicitante medicoSolicitante,
        @JsonProperty("estudio_realizado") String estudioRealizado,
        @JsonProperty("diagnostico_principal") String diagnosticoPrincipal,
        @JsonProperty("cie10_sugerido") String cie10Sugerido
) {}

 record Paciente(String nombre, String rut, Short edad) {}

 record MedicoSolicitante(String nombre, String matricula) {}
