package G10.EQUIPO13.MediFlow.Estudios.Service;

import G10.EQUIPO13.MediFlow.Estudios.Entity.EstudiosEntity;
import G10.EQUIPO13.MediFlow.Pacientes.Entity.PacienteEntity;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosEntity;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class EstudiosDTOMapper {

public EstudiosEntity toDomain(EstudioRequest estudioRequest, UsuariosEntity medico, PacienteEntity paciente){

    EstudiosEntity estudiosEntity = new EstudiosEntity();
    estudiosEntity.setNombre(estudioRequest.nombre());
    estudiosEntity.setDiagnosticoPrincipal(estudioRequest.diagnosticoPrincipal());
    estudiosEntity.setPaciente(paciente);
    estudiosEntity.setMedico(medico);

    estudiosEntity.setFecha(LocalDateTime.now());

    return estudiosEntity;

}

public EstudioResponse toResponse(EstudiosEntity entity){

    EstudioResponse response = new EstudioResponse(
            entity.getId(),
            entity.getNombre(),
            entity.getDiagnosticoPrincipal(),
            entity.getFecha(),
            entity.getCie10Sugerido(),
            entity.getMedico().getNombre(),
            entity.getPaciente().getNombre()

    );

    return response;
}



}
