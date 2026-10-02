package G10.EQUIPO13.MediFlow.AiClient;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class AIClient {

    private final RestClient restClient;

    public AIClient(RestClient.Builder builder,
                          @Value("${PYTHON_URL}") String baseUrl) {
        this.restClient = builder.baseUrl(baseUrl).build();
    }

    public AIResponse analizarDocumento(MultipartFile archivo) {
        try {
            return restClient.post()
                    .uri("/analizar")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(new LinkedMultiValueMap<>() {{
                        add("archivo", new ByteArrayResource(archivo.getBytes()) {
                            @Override
                            public String getFilename() {
                                return archivo.getOriginalFilename();
                            }
                        });
                    }})
                    .retrieve()
                    .body(AIResponse.class);
        } catch (IOException e) {
            throw new RuntimeException("Error leyendo archivo", e);
        }
    }


}
