package G10.EQUIPO13.MediFlow.GlobalException.Exceptions;

public class AccesoDenegadoException extends BaseException{

    public AccesoDenegadoException(String mensaje) {
        super("FORBIDDEN", mensaje);
    }

}
