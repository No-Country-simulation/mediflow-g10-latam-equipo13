package G10.EQUIPO13.MediFlow.GlobalException.Exceptions;

public class ConflictoException    extends BaseException {
    public ConflictoException(String mensaje) {
        super("CONFLICT " , mensaje);
    }
}
