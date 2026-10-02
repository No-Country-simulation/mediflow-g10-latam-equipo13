package G10.EQUIPO13.MediFlow.GlobalException.Exceptions;

import java.time.LocalDateTime;
import java.util.List;

public record ErrorResponse(
        String codigo,
        String mensaje,
        int status,
        String path,
        LocalDateTime timestamp,
        List<String> detalles
) {

    public ErrorResponse(String codigo, String mensaje, int status, String path) {
        this(codigo, mensaje, status, path, LocalDateTime.now(), List.of());
    }

    public ErrorResponse(String codigo, String mensaje, int status, String path, List<String> detalles) {
        this(codigo, mensaje, status, path, LocalDateTime.now(), detalles);
    }

}
