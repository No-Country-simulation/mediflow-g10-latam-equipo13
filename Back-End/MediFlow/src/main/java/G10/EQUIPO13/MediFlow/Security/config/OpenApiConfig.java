package G10.EQUIPO13.MediFlow.Security.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Swagger UI en /swagger-ui.html, con botón "Authorize" para pegar el JWT. */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI mediflowOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("MediFlow — API principal")
                        .version("2.0.0")
                        .description("Documentos clínicos, colas de enrutamiento, revisión humana, usuarios y reglas de triaje. "
                                + "Inicia sesión en /api/auth/login y usa el token en Authorize."))
                .components(new Components().addSecuritySchemes("bearer",
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList("bearer"));
    }
}
