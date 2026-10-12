
package G10.EQUIPO13.MediFlow.AiClient;

import G10.EQUIPO13.MediFlow.AiClient.DTOs.ResultadoTriaje;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.AIClientException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AIClient {

    private final RestClient restClient;

    public AIClient(
            RestClient.Builder builder,
            @Value("${PYTHON_URL}") String baseUrl
    ) {
        this.restClient = builder
                .baseUrl(baseUrl)
                .build();
    }

    public ResultadoTriaje analizarDocumento(MultipartFile archivo) {
        try {
            MultipartBodyBuilder builder = new MultipartBodyBuilder();

            builder.part("archivo", archivo.getResource())
                    .filename(archivo.getOriginalFilename())
                    .contentType(
                            archivo.getContentType() != null
                                    ? MediaType.parseMediaType(
                                            archivo.getContentType()
                                    )
                                    : MediaType.APPLICATION_OCTET_STREAM
                    );

            return restClient.post()
                    .uri("/analizar")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(builder.build())
                    .retrieve()
                    .body(ResultadoTriaje.class);

        } catch (ResourceAccessException e) {
            throw new AIClientException(
                    "No se pudo conectar con el servicio de IA", e
            );

        } catch (HttpClientErrorException e) {
            throw new AIClientException(
                    "El servicio de IA rechazó la solicitud: "
                            + e.getStatusCode(), e
            );

        } catch (HttpServerErrorException e) {
            throw new AIClientException(
                    "El servicio de IA devolvió un error: "
                            + e.getStatusCode(), e
            );
        }
    }
}
