package G10.EQUIPO13.MediFlow.AiClient;

import G10.EQUIPO13.MediFlow.AiClient.DTOs.ArchivoOriginal;
import G10.EQUIPO13.MediFlow.AiClient.DTOs.ResultadoTriaje;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.AIClientException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.json.JsonMapper;

import java.util.HashMap;
import java.util.Map;

/**
 * Cliente del agente de triaje (FastAPI). No registra contenido clínico en los logs.
 */
@Slf4j
@Service
public class AIClient {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final RestClient restClient;

    public AIClient(
            RestClient.Builder builder,
            @Value("${python.url}") String baseUrl
    ) {
        this.restClient = builder.baseUrl(baseUrl).build();
    }

    /**
     * Envía el archivo a POST /analizar.
     * El multipart se arma con LinkedMultiValueMap: MultipartBodyBuilder es de WebFlux y
     * necesita reactive-streams, que este proyecto (webmvc) no incluye.
     */
    public ResultadoTriaje analizarDocumento(MultipartFile archivo, String canalOrigen, Map<String, Object> config) {
        String nombre = nombreSeguro(archivo.getOriginalFilename());

        HttpHeaders cabeceras = new HttpHeaders();
        cabeceras.setContentType(archivo.getContentType() != null
                ? MediaType.parseMediaType(archivo.getContentType())
                : MediaType.APPLICATION_OCTET_STREAM);
        cabeceras.setContentDispositionFormData("archivo", nombre);

        MultiValueMap<String, Object> partes = new LinkedMultiValueMap<>();
        partes.add("archivo", new HttpEntity<>(archivo.getResource(), cabeceras));
        if (canalOrigen != null && !canalOrigen.isBlank()) {
            partes.add("canal_origen", canalOrigen);
        }
        if (config != null) {
            partes.add("config", JSON.writeValueAsString(config));
        }

        return ejecutar("analizar archivo", () -> restClient.post()
                .uri("/analizar")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(partes)
                .retrieve()
                .body(ResultadoTriaje.class));
    }

    /** Envía texto a POST /analizar-texto con el formato de entrada del brief. */
    public ResultadoTriaje analizarTexto(String texto, String canalOrigen, Map<String, Object> config) {
        Map<String, Object> cuerpo = new HashMap<>();
        cuerpo.put("documento_texto", texto);
        cuerpo.put("tipo_archivo", "TEXTO");
        cuerpo.put("canal_origen", canalOrigen);
        cuerpo.put("config", config);

        return ejecutar("analizar texto", () -> restClient.post()
                .uri("/analizar-texto")
                .contentType(MediaType.APPLICATION_JSON)
                .body(cuerpo)
                .retrieve()
                .body(ResultadoTriaje.class));
    }

    /** Descarga el original guardado en OCI (BktRecibidos). */
    public ArchivoOriginal descargarOriginal(String rutaOriginal) {
        ResponseEntity<byte[]> respuesta = ejecutar("descargar original", () -> restClient.get()
                .uri(uri -> uri.path("/documentos/original").queryParam("ruta", rutaOriginal).build())
                .retrieve()
                .toEntity(byte[].class));
        MediaType tipo = respuesta.getHeaders().getContentType();
        return new ArchivoOriginal(
                respuesta.getBody() != null ? respuesta.getBody() : new byte[0],
                tipo != null ? tipo.toString() : MediaType.APPLICATION_OCTET_STREAM_VALUE
        );
    }

    /** Mueve el JSON revisado en OCI (de auditoría a procesados, o lo marca rechazado). */
    public Map<String, Object> registrarRevision(Map<String, Object> solicitud) {
        return ejecutar("registrar revisión", () -> restClient.post()
                .uri("/documentos/revision")
                .contentType(MediaType.APPLICATION_JSON)
                .body(solicitud)
                .retrieve()
                .body(new ParameterizedTypeReference<Map<String, Object>>() {}));
    }

    // ------------------------------------------------------------------

    private interface Llamada<T> {
        T ejecutar();
    }

    private <T> T ejecutar(String operacion, Llamada<T> llamada) {
        try {
            T resultado = llamada.ejecutar();
            if (resultado == null) {
                throw new AIClientException("El servicio de IA devolvió una respuesta vacía.");
            }
            return resultado;
        } catch (ResourceAccessException e) {
            log.error("IA no disponible al {}: {}", operacion, e.getClass().getSimpleName());
            throw new AIClientException("No se pudo conectar con el servicio de IA. Verifica que FastAPI esté encendido.", 503, e);
        } catch (HttpStatusCodeException e) {
            int status = e.getStatusCode().value();
            String mensaje = mensajeDe(e.getResponseBodyAsString());
            log.warn("La IA respondió {} al {}", status, operacion);
            int estadoCliente = status == 503 ? 503 : status >= 400 && status < 500 ? status : 502;
            throw new AIClientException(mensaje != null ? mensaje : "El servicio de IA respondió con error " + status + ".", estadoCliente, e);
        } catch (RestClientException e) {
            log.error("Error al {}: {}", operacion, e.getClass().getSimpleName());
            throw new AIClientException("No se pudo interpretar la respuesta del servicio de IA.", 502, e);
        }
    }

    /** FastAPI devuelve {"detail": "..."} o {"detail": {"mensaje": "..."}}. */
    static String mensajeDe(String cuerpo) {
        if (cuerpo == null || cuerpo.isBlank()) {
            return null;
        }
        try {
            Object detalle = JSON.readValue(cuerpo, Map.class).get("detail");
            if (detalle instanceof String texto) {
                return texto;
            }
            if (detalle instanceof Map<?, ?> mapa && mapa.get("mensaje") instanceof String mensaje) {
                return mensaje;
            }
            if (detalle instanceof java.util.List<?> lista && !lista.isEmpty() && lista.get(0) instanceof Map<?, ?> error) {
                return "Datos inválidos para el servicio de IA: " + error.get("msg");
            }
        } catch (RuntimeException ignorado) {
            // cuerpo que no es JSON
        }
        return null;
    }

    static String nombreSeguro(String nombre) {
        String base = nombre == null || nombre.isBlank() ? "documento" : nombre;
        return base.replaceAll("[^A-Za-z0-9._-]", "_");
    }
}
