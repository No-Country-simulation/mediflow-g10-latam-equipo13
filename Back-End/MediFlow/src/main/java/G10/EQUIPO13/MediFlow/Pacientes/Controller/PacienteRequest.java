package G10.EQUIPO13.MediFlow.Pacientes.Controller;

import G10.EQUIPO13.MediFlow.Pacientes.Entity.Estado;

public record PacienteRequest(
        String nombre,
        String diagnostico,
        Short edad,
        String rut,
        Estado estado
) {
}
