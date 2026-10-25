package G10.EQUIPO13.MediFlow.Documentos.controller;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Texto clínico pegado en la interfaz (POST /api/documentos/analyze/text). */
public record DocumentosRequest(
        @JsonAlias("content")
        @NotBlank(message = "El texto es obligatorio")
        @Size(min = 10, max = 50_000, message = "El texto debe tener entre 10 y 50.000 caracteres")
        String texto,

        @Size(max = 80, message = "El canal de origen no puede superar los 80 caracteres")
        String canalOrigen
) {
}
