package G10.EQUIPO13.MediFlow.AiClient;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EstadoControllerTest {

    @Test
    void estado_informaSiElMotorDeIaResponde() {
        AIClient aiClient = mock(AIClient.class);
        EstadoController controller = new EstadoController(aiClient);

        when(aiClient.motorDisponible()).thenReturn(true);
        assertEquals(Boolean.TRUE, controller.estado().getBody().get("motorIa"));

        when(aiClient.motorDisponible()).thenReturn(false);
        var cuerpo = controller.estado().getBody();
        assertEquals(Boolean.FALSE, cuerpo.get("motorIa"));
        assertEquals(Boolean.TRUE, cuerpo.get("api"));
    }

    @Test
    void motorDisponible_esFalsoSiElAgenteNoEstaEncendido() {
        // Puerto cerrado en la propia máquina: la conexión se rechaza al instante y no debe lanzar excepciones.
        AIClient aiClient = new AIClient(org.springframework.web.client.RestClient.builder(), "http://127.0.0.1:9");
        assertFalse(aiClient.motorDisponible());
    }
}
