
package G10.EQUIPO13.MediFlow.GlobalException.handler;

import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.AIClientException;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    @Test
    void handleAIClient_debeDevolver502ConMensajeControlado() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/documentos/analyze/file");

        AIClientException exception = new AIClientException(
                "Detalle interno que no debe exponerse"
        );

        ResponseEntity<ErrorResponse> response =
                handler.handleAIClient(exception, request);

        assertEquals(HttpStatus.BAD_GATEWAY, response.getStatusCode());

        ErrorResponse body = response.getBody();

        assertEquals("AI_SERVICE_ERROR", body.codigo());
        assertEquals(502, body.status());
        assertEquals(
                "No fue posible completar el análisis del documento. Inténtalo más tarde.",
                body.mensaje()
        );
        assertEquals("/api/documentos/analyze/file", body.path());
    }
}
