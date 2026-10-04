package G10.EQUIPO13.MediFlow.Documentos.controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DocumentosRequest(
        @NotBlank(message = "El contenido es obligatorio")
        @Size(max = 10_000, message = "El contenido no puede superar los 10.000 caracteres")
        String content
) {
}
