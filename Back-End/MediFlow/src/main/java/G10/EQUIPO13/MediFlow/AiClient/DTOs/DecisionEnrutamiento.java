package G10.EQUIPO13.MediFlow.AiClient.DTOs;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record DecisionEnrutamiento(
        @JsonProperty("destino_principal") String destinoPrincipal,
        @JsonProperty("requiere_auditoria_humana") Boolean requiereAuditoriaHumana,
        @JsonProperty("justificacion_enrutamiento") String justificacionEnrutamiento,
        @JsonProperty("notificacion_generada") Notificacion notificacionGenerada
) {}
