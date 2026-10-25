package G10.EQUIPO13.MediFlow.AiClient.DTOs;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/** Respuesta del agente de triaje (FastAPI). Ignora campos nuevos para no romperse si FastAPI crece. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ResultadoTriaje(
        String status,
        @JsonProperty("documento_id") String documentoId,
        String fecha,
        @JsonProperty("canal_origen") String canalOrigen,
        @JsonProperty("nombre_archivo") String nombreArchivo,
        String contenido,
        Clasificacion clasificacion,
        @JsonProperty("datos_extraidos") DatosExtraidos datosExtraidos,
        @JsonProperty("decision_enrutamiento") DecisionEnrutamiento decisionEnrutamiento,
        Map<String, Object> validacion,
        @JsonProperty("almacenamiento_oci") AlmacenamientoOci almacenamientoOci,
        List<Map<String, Object>> traza
) {}
