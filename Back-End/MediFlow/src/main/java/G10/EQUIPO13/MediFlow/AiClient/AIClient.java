package G10.EQUIPO13.MediFlow.AiClient;

import org.springframework.http.client.MultipartBodyBuilder;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.AIClientException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Service
public class AIClient {

    private final AIResponseMapper aiResponseMapper;
    private final RestClient restClient;

    public AIClient(
            AIResponseMapper aiResponseMapper,
            RestClient.Builder builder,
            @Value("${PYTHON_URL}") String baseUrl
    ) {
        this.aiResponseMapper = aiResponseMapper;

        this.restClient = builder
                .baseUrl(baseUrl)
                .requestInterceptor((request, body, execution) -> {

                    System.out.println(">>> HTTP REQUEST");
                    System.out.println(">>> URI: " + request.getURI());
                    System.out.println(">>> METHOD: " + request.getMethod());

                    System.out.println(">>> HEADERS:");

                    request.getHeaders().forEach((name, values) ->
                            System.out.println("    " + name + ": " + values)
                    );

                    return execution.execute(request, body);
                })
                .build();
    }

    public AIResponse analizarDocumento(MultipartFile archivo) {
        try {

            MultipartBodyBuilder builder = new MultipartBodyBuilder();

            builder.part("archivo", archivo.getResource())
                    .filename(archivo.getOriginalFilename())
                    .contentType(
                            archivo.getContentType() != null
                                    ? MediaType.parseMediaType(archivo.getContentType())
                                    : MediaType.APPLICATION_OCTET_STREAM
                    );

            ResultadoTriaje resultadoCrudo = restClient.post()
                    .uri("/analizar")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(builder.build())
                    .retrieve()
                    .body(ResultadoTriaje.class);

            System.out.println(">>> RESULTADO PYTHON: ");

            System.out.println(resultadoCrudo);

            String contenido =
                    resultadoCrudo != null
                            ? resultadoCrudo.contenido()
                            : null;

            return aiResponseMapper.toAIResponse(
                    resultadoCrudo,
                    contenido
            );

        } catch (ResourceAccessException e) {
            throw new AIClientException(
                    "No se pudo conectar con el servicio de IA", e
            );

        } catch (HttpClientErrorException e) {
            System.out.println(
                    "Respuesta Python: " + e.getResponseBodyAsString()
            );

            throw new AIClientException(
                    "Error del cliente al llamar al servicio de IA: "
                            + e.getStatusCode(),
                    e
            );

        } catch (HttpServerErrorException e) {
            throw new AIClientException(
                    "El servicio de IA falló: " + e.getStatusCode(),
                    e
            );
        }
    }
}