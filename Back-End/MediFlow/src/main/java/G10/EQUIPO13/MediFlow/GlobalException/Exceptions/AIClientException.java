package G10.EQUIPO13.MediFlow.GlobalException.Exceptions;

public class AIClientException extends RuntimeException {

    public AIClientException(String message, Throwable cause) {
        super(message, cause);
    }
    public AIClientException(String message) {
        super(message);
    }

}
