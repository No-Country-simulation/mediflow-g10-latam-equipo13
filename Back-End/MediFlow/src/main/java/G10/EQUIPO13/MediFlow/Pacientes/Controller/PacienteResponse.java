package G10.EQUIPO13.MediFlow.Pacientes.Controller;

import G10.EQUIPO13.MediFlow.Pacientes.Entity.Estado;

import java.time.LocalDateTime;

public record PacienteResponse(
        Long id,
        String nombre,
        String diagnostico,
        Short edad,
        String rut,
        LocalDateTime fechaRegistro,
        LocalDateTime fechaActualizacion,
        Estado estado,
        String nombreMedico
) {
}
