package G10.EQUIPO13.MediFlow.AiClient.DTOs;

import com.fasterxml.jackson.annotation.JsonProperty;

public record Clasificacion(
        @JsonProperty("tipo_documento") String tipoDocumento,
        String especialidad,
        @JsonProperty("nivel_prioridad") String nivelPrioridad,
        @JsonProperty("score_confianza_clasificacion") Double scoreConfianzaClasificacion,
        @JsonProperty("requiere_auditoria_humana") Boolean auditoria,
        @JsonProperty("cola_enrutamiento") String colaEnrutamiento
) {}