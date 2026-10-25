package G10.EQUIPO13.MediFlow.AiClient.DTOs;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AlmacenamientoOci(
        String bucket,
        @JsonProperty("ruta_objeto") String rutaObjeto,
        @JsonProperty("ruta_original") String rutaOriginal,
        @JsonProperty("status_backup") String statusBackup
) {}
