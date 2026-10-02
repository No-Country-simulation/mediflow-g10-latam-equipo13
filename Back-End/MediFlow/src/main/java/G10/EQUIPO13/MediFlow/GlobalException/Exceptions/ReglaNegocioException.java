package G10.EQUIPO13.MediFlow.GlobalException.Exceptions;

public class ReglaNegocioException extends BaseException  {

    public ReglaNegocioException(String mensaje) {
        super("BAD_REQUEST", mensaje);
    }

}
