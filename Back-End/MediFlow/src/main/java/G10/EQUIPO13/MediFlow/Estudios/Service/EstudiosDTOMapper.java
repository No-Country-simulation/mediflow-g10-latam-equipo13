package G10.EQUIPO13.MediFlow.Estudios.Service;

import G10.EQUIPO13.MediFlow.AiClient.DTOs.ResultadoTriaje;
import G10.EQUIPO13.MediFlow.Estudios.Entity.EstudiosEntity;
import G10.EQUIPO13.MediFlow.Pacientes.Entity.PacienteEntity;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosEntity;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class EstudiosDTOMapper {

private static String recortar(String valor) {
    return valor != null && valor.length() > 255 ? valor.substring(0, 255) : valor;
}

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

    public EstudiosEntity toDomainFromAI(ResultadoTriaje resultadoTriaje, UsuariosEntity medico, PacienteEntity paciente){


        if (resultadoTriaje.datosExtraidos().estudioRealizado() == null) {

        return null;

        }

        EstudiosEntity estudiosEntity = new EstudiosEntity();
        // Las columnas de estudios son VARCHAR(255): se recorta para no fallar con textos largos de la IA.
        estudiosEntity.setNombre(recortar(resultadoTriaje.datosExtraidos().estudioRealizado()));
        estudiosEntity.setDiagnosticoPrincipal(recortar(resultadoTriaje.datosExtraidos().diagnosticoPrincipal()));
        estudiosEntity.setCie10Sugerido(recortar(resultadoTriaje.datosExtraidos().cie10Sugerido()));
        estudiosEntity.setPaciente(paciente);
        estudiosEntity.setMedico(medico);

        estudiosEntity.setFecha(LocalDateTime.now());

        return estudiosEntity;

    }


}
