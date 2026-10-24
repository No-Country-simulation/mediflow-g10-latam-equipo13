package G10.EQUIPO13.MediFlow.AiClient;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AIClientTest {

    @Test
    void mensajeDe_leeLosFormatosDeErrorDeFastApi() {
        assertEquals("El archivo está vacío.", AIClient.mensajeDe("{\"detail\":\"El archivo está vacío.\"}"));
        assertEquals("No fue posible procesar el documento.",
                AIClient.mensajeDe("{\"detail\":{\"mensaje\":\"No fue posible procesar el documento.\",\"documento_id\":\"x\"}}"));
        assertTrue(AIClient.mensajeDe("{\"detail\":[{\"msg\":\"Field required\"}]}").contains("Field required"));
        assertNull(AIClient.mensajeDe("<html>Bad gateway</html>"));
        assertNull(AIClient.mensajeDe(""));
    }

    @Test
    void nombreSeguro_dejaSoloCaracteresPermitidos() {
        assertEquals("receta_m_dica__1_.pdf", AIClient.nombreSeguro("receta médica (1).pdf"));
        assertEquals("documento", AIClient.nombreSeguro(null));
    }
}
