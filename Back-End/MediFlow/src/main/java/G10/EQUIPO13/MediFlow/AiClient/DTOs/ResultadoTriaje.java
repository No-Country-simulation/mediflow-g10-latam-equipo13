package G10.EQUIPO13.MediFlow.AiClient.DTOs;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ResultadoTriaje(
        String status,
        @JsonProperty("documento_id") String documentoId,
        String contenido,
        Clasificacion clasificacion,
        @JsonProperty("datos_extraidos") DatosExtraidos datosExtraidos
) {}





