package G10.EQUIPO13.MediFlow.AiClient;

import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.AIClientException;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AsistenteControllerTest {

    private static UsernamePasswordAuthenticationToken sesion(String rol) {
        return new UsernamePasswordAuthenticationToken("ana", null, List.of(new SimpleGrantedAuthority(rol)));
    }

    @Test
    void preguntar_usaElRolDeLaSesionYReenviaElHistorial() {
        AIClient aiClient = mock(AIClient.class);
        AsistenteController controller = new AsistenteController(aiClient);
        when(aiClient.preguntarAsistente(anyString(), any(), anyList())).thenReturn("Ve a Auditoría humana.");

        var solicitud = new AsistenteRequest("  ¿Cuándo rechazo un caso?  ",
                List.of(new AsistenteRequest.Mensaje("usuario", "Hola"), new AsistenteRequest.Mensaje("asistente", null)));
        var respuesta = controller.preguntar(solicitud, sesion("ROLE_AUDITOR"));

        assertEquals("Ve a Auditoría humana.", respuesta.getBody().get("respuesta"));
        verify(aiClient).preguntarAsistente("¿Cuándo rechazo un caso?", "AUDITOR", List.of(
                Map.of("rol", "usuario", "texto", "Hola"),
                Map.of("rol", "asistente", "texto", "")));
    }

    @Test
    void rolDe_soloAceptaRolesConGuia() {
        assertEquals("ADMIN", AsistenteController.rolDe(sesion("ROLE_ADMIN")));
        assertEquals("PERSONAL", AsistenteController.rolDe(sesion("ROLE_PERSONAL")));
        assertNull(AsistenteController.rolDe(sesion("ROLE_NO_ASIGNADO")));
        assertNull(AsistenteController.rolDe(null));
    }

    @Test
    void preguntarAsistente_responde503SiElAgenteNoEstaEncendido() {
        // Puerto cerrado en la propia máquina: la conexión se rechaza al instante.
        AIClient aiClient = new AIClient(RestClient.builder(), "http://127.0.0.1:9");
        AIClientException error = assertThrows(AIClientException.class,
                () -> aiClient.preguntarAsistente("Hola", null, List.of()));
        assertEquals(503, error.getStatus());
    }
}
