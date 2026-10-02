package G10.EQUIPO13.MediFlow.Estudios.Service;

import java.time.LocalDateTime;

public record EstudioResponse(
        Long id,
        String nombre,
        String diagnistico_principal,
        LocalDateTime fecha,
        String cie10_sugerido,
        String nombreMedico,
        String nombrePaciente
) {
}
