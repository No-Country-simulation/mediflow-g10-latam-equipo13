package G10.EQUIPO13.MediFlow.AiClient;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;


@Configuration
public class RestClientConfig {

    @Value("${python.connect-timeout:5s}")
    private Duration connectTimeout = Duration.ofSeconds(5);

    @Value("${python.read-timeout:180s}")
    private Duration readTimeout = Duration.ofSeconds(180);

    @Bean
    public RestClient.Builder restClientBuilder() {

        // Gemini puede tardar con PDFs largos: lectura generosa, conexión corta.
        SimpleClientHttpRequestFactory factory =
                new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeout);
        factory.setReadTimeout(readTimeout);

        return RestClient.builder()
                .requestFactory(factory);
    }
}
