package G10.EQUIPO13.MediFlow.GlobalException.handler;


import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.List;

/**
 * Traduce cada error a una respuesta JSON { codigo, mensaje, status, path, timestamp, detalles }.
 * Los errores inesperados se registran con su stack trace; al cliente nunca le llegan detalles internos.
 */
@Slf4j
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

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleRutaInexistente(
            NoResourceFoundException ex, HttpServletRequest request) {

        return build(HttpStatus.NOT_FOUND, "NOT_FOUND", "La ruta solicitada no existe", request);
    }

    // ============================
    // 401 - Credenciales
    // ============================
    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ErrorResponse> handleDeshabilitado(
            DisabledException ex, HttpServletRequest request) {

        return build(HttpStatus.UNAUTHORIZED, "USUARIO_INACTIVO", "La cuenta está desactivada", request);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleCredenciales(
            AuthenticationException ex, HttpServletRequest request) {

        return build(HttpStatus.UNAUTHORIZED, "CREDENCIALES_INVALIDAS", "Usuario o contraseña incorrectos", request);
    }

    // ============================
    // 403 - Acceso denegado
    // ============================
    @ExceptionHandler(AccesoDenegadoException.class)
    public ResponseEntity<ErrorResponse> handleAccesoDenegado(
            AccesoDenegadoException ex, HttpServletRequest request) {

        return build(HttpStatus.FORBIDDEN, ex.getCodigo(), ex.getMessage(), request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleSpringAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {

        return build(HttpStatus.FORBIDDEN, "FORBIDDEN",
                "No tienes permisos para acceder a este recurso", request);
    }

    // ============================
    // 400 - Datos inválidos
    // ============================
    @ExceptionHandler(ReglaNegocioException.class)
    public ResponseEntity<ErrorResponse> handleReglaNegocio(
            ReglaNegocioException ex, HttpServletRequest request) {

        return build(HttpStatus.BAD_REQUEST, ex.getCodigo(), ex.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidacion(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        List<String> detalles = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .toList();

        return validacion(detalles, request);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidacionParametros(
            HandlerMethodValidationException ex, HttpServletRequest request) {

        List<String> detalles = ex.getAllErrors()
                .stream()
                .map(err -> err.getDefaultMessage())
                .toList();

        return validacion(detalles, request);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraint(
            ConstraintViolationException ex, HttpServletRequest request) {

        List<String> detalles = ex.getConstraintViolations()
                .stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .toList();

        return validacion(detalles, request);
    }

    @ExceptionHandler({
            MethodArgumentTypeMismatchException.class,
            HttpMessageNotReadableException.class,
            MissingServletRequestPartException.class,
            MissingServletRequestParameterException.class
    })
    public ResponseEntity<ErrorResponse> handleSolicitudMalFormada(
            Exception ex, HttpServletRequest request) {

        String mensaje = switch (ex) {
            case MissingServletRequestPartException e -> "Falta el archivo en el campo '" + e.getRequestPartName() + "'";
            case MissingServletRequestParameterException e -> "Falta el parámetro '" + e.getParameterName() + "'";
            case MethodArgumentTypeMismatchException e -> "Valor inválido para '" + e.getName() + "'";
            default -> "El cuerpo de la solicitud no es válido";
        };
        return build(HttpStatus.BAD_REQUEST, "BAD_REQUEST", mensaje, request);
    }

    // ============================
    // 405 / 409 / 413 / 415
    // ============================
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMetodo(
            HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {

        return build(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", "Método HTTP no permitido en esta ruta", request);
    }

    @ExceptionHandler(ConflictoException.class)
    public ResponseEntity<ErrorResponse> handleConflicto(
            ConflictoException ex, HttpServletRequest request) {

        return build(HttpStatus.CONFLICT, "CONFLICT", ex.getMessage(), request);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleIntegridad(
            DataIntegrityViolationException ex, HttpServletRequest request) {

        log.warn("Violación de integridad en {}: {}", request.getRequestURI(), ex.getMostSpecificCause().getMessage());
        return build(HttpStatus.CONFLICT, "CONFLICT",
                "La operación entra en conflicto con datos existentes (por ejemplo, registros asociados)", request);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleTamano(
            MaxUploadSizeExceededException ex, HttpServletRequest request) {

        return build(HttpStatus.PAYLOAD_TOO_LARGE, "ARCHIVO_DEMASIADO_GRANDE", "El archivo supera los 25 MB", request);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMediaType(
            HttpMediaTypeNotSupportedException ex, HttpServletRequest request) {

        return build(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_MEDIA_TYPE", "Tipo de contenido no soportado", request);
    }

    // ============================
    // 502 / 503 - Servicio de IA
    // ============================
    @ExceptionHandler(AIClientException.class)
    public ResponseEntity<ErrorResponse> handleAI(
            AIClientException ex, HttpServletRequest request) {

        log.error("Error del servicio de IA en {}: {}", request.getRequestURI(), ex.getMessage());
        HttpStatus status = HttpStatus.resolve(ex.getStatus());
        if (status == null || status.is2xxSuccessful()) {
            status = HttpStatus.BAD_GATEWAY;
        }
        return build(status, "AI_SERVICE_ERROR", ex.getMessage(), request);
    }

    // ============================
    // 500 - Cualquier otra excepción
    // ============================
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(
            Exception ex, HttpServletRequest request) {

        log.error("Error inesperado en {} {}", request.getMethod(), request.getRequestURI(), ex);

        return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "Ocurrió un error inesperado. Contacta al administrador.", request);
    }

    // ============================
    // Helpers
    // ============================
    private ResponseEntity<ErrorResponse> validacion(List<String> detalles, HttpServletRequest request) {
        ErrorResponse body = new ErrorResponse(
                "VALIDATION_ERROR",
                detalles.isEmpty() ? "Error de validación en los datos enviados" : detalles.get(0),
                HttpStatus.BAD_REQUEST.value(),
                request.getRequestURI(),
                detalles
        );

        return ResponseEntity.badRequest().body(body);
    }

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
