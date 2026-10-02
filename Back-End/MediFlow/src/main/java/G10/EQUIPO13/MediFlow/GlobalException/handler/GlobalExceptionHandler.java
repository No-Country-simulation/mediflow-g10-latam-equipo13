package G10.EQUIPO13.MediFlow.GlobalException.handler;


import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ============================
    // 404 - Recurso no encontrado
    // ============================
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            ResourceNotFoundException ex, HttpServletRequest request) {

        return build(HttpStatus.NOT_FOUND, ex.getCodigo(), ex.getMessage(), request);
    }

    // ============================
    // 403 - Acceso denegado (custom)
    // ============================
    @ExceptionHandler(AccesoDenegadoException.class)
    public ResponseEntity<ErrorResponse> handleAccesoDenegado(
            AccesoDenegadoException ex, HttpServletRequest request) {

        return build(HttpStatus.FORBIDDEN, ex.getCodigo(), ex.getMessage(), request);
    }

    // ============================
    // 403 - Acceso denegado (Spring Security)
    // ============================
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleSpringAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {

        return build(HttpStatus.FORBIDDEN, "FORBIDDEN",
                "No tienes permisos para acceder a este recurso", request);
    }

    // ============================
    // 400 - Regla de negocio
    // ============================
    @ExceptionHandler(ReglaNegocioException.class)
    public ResponseEntity<ErrorResponse> handleReglaNegocio(
            ReglaNegocioException ex, HttpServletRequest request) {

        return build(HttpStatus.BAD_REQUEST, ex.getCodigo(), ex.getMessage(), request);
    }

    // ============================
    // 409 - Conflicto
    // ============================
    @ExceptionHandler(ConflictoException.class)
    public ResponseEntity<ErrorResponse> handleConflicto(
            ConflictoException ex, HttpServletRequest request) {

        return build(HttpStatus.CONFLICT, ex.getCodigo(), ex.getMessage(), request);
    }

    // ============================
    // 400 - Validaciones @Valid en DTOs
    // ============================
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidacion(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        List<String> detalles = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .toList();

        ErrorResponse body = new ErrorResponse(
                "VALIDATION_ERROR",
                "Error de validación en los datos enviados",
                HttpStatus.BAD_REQUEST.value(),
                request.getRequestURI(),
                detalles
        );

        return ResponseEntity.badRequest().body(body);
    }

    // ============================
    // 500 - Cualquier otra excepción
    // ============================
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(
            Exception ex, HttpServletRequest request) {

        // ⚠️ Aquí SÍ conviene loguear el stacktrace
        // log.error("Error inesperado", ex);

        return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "Ocurrió un error inesperado. Contacta al administrador.", request);
    }

    // ============================
    // Helper para construir la respuesta
    // ============================
    private ResponseEntity<ErrorResponse> build(
            HttpStatus status, String codigo, String mensaje, HttpServletRequest request) {

        ErrorResponse body = new ErrorResponse(
                codigo,
                mensaje,
                status.value(),
                request.getRequestURI()
        );

        return ResponseEntity.status(status).body(body);
    }

}
