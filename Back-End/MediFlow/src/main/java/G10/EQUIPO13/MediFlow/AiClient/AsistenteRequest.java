package G10.EQUIPO13.MediFlow.AiClient;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Pregunta al asistente virtual, con los últimos mensajes del chat como contexto. */
public record AsistenteRequest(
        @NotBlank(message = "La pregunta es obligatoria")
        @Size(min = 2, max = 500, message = "La pregunta debe tener entre 2 y 500 caracteres")
        String pregunta,

        @Valid
        @Size(max = 20, message = "El historial no puede tener más de 20 mensajes")
        List<Mensaje> historial
) {

    public record Mensaje(
            @NotBlank
            @Pattern(regexp = "usuario|asistente", message = "El rol del mensaje debe ser usuario o asistente")
            String rol,

            @Size(max = 2000, message = "Cada mensaje puede tener hasta 2000 caracteres")
            String texto
    ) {
    }
}
