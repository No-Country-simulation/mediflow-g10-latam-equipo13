package G10.EQUIPO13.MediFlow.GlobalException.Exceptions;

public abstract  class BaseException extends RuntimeException {

    private final String codigo;

    protected BaseException(String codigo, String mensaje) {
        super(mensaje);
        this.codigo = codigo;
    }

    public String getCodigo() {
        return codigo;
    }
}
