package G10.EQUIPO13.MediFlow.GlobalException.Exceptions;

/** Error al hablar con el servicio de IA. Guarda el código HTTP que conviene devolver al cliente. */
public class AIClientException extends RuntimeException {

    private final int status;

    public AIClientException(String message, int status, Throwable cause) {
        super(message, cause);
        this.status = status;
    }

    public AIClientException(String message, Throwable cause) {
        this(message, 502, cause);
    }

    public AIClientException(String message) {
        this(message, 502, null);
    }

    public int getStatus() {
        return status;
    }
}
