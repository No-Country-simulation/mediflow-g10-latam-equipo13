package G10.EQUIPO13.MediFlow.Pacientes.Controller;

import G10.EQUIPO13.MediFlow.Pacientes.Entity.Estado;
import jakarta.validation.constraints.*;

public record PacienteRequest(

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
        String nombre,

        @NotBlank(message = "El diagnóstico es obligatorio")
        @Size(max = 500, message = "El diagnóstico no puede superar los 500 caracteres")
        String diagnostico,

        @NotNull(message = "La edad es obligatoria")
        @Min(value = 0, message = "La edad no puede ser negativa")
        @Max(value = 120, message = "La edad no puede superar los 120 años")
        Short edad,

        @NotBlank(message = "El RUT es obligatorio")
        String rut,

        @NotNull(message = "El estado es obligatorio")
        Estado estado
) {
}