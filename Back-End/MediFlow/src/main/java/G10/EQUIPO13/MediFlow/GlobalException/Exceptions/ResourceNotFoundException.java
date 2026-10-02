package G10.EQUIPO13.MediFlow.GlobalException.Exceptions;

public class ResourceNotFoundException extends BaseException {

    public ResourceNotFoundException(String mensaje) {
        super("NOT_FOUND", mensaje);
    }

}
