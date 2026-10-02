package G10.EQUIPO13.MediFlow.Estudios.Service;

public record EstudioRequest(
        String nombre,
        String diagnistico_principal,
        Long idMedico,
        Long idPaciente
) {
}
