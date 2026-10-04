package G10.EQUIPO13.MediFlow.Estudios.Service;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record EstudioRequest(

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
        String nombre,

        @NotBlank(message = "El diagnóstico principal es obligatorio")
        @Size(max = 500, message = "El diagnóstico principal no puede superar los 500 caracteres")
        String diagnosticoPrincipal,

        @Positive(message = "El id del médico debe ser positivo")
        Long idMedico,

        @NotNull(message = "El id del paciente es obligatorio")
        @Positive(message = "El id del paciente debe ser positivo")
        Long idPaciente
) {

}
