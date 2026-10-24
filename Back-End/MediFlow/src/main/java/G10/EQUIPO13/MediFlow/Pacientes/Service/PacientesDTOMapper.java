package G10.EQUIPO13.MediFlow.Pacientes.Service;

import G10.EQUIPO13.MediFlow.AiClient.DTOs.ResultadoTriaje;
import G10.EQUIPO13.MediFlow.Pacientes.Entity.Estado;
import G10.EQUIPO13.MediFlow.Pacientes.Controller.PacienteRequest;
import G10.EQUIPO13.MediFlow.Pacientes.Controller.PacienteResponse;
import G10.EQUIPO13.MediFlow.Pacientes.Entity.PacienteEntity;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosEntity;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class PacientesDTOMapper {


    public PacienteEntity toDomainFromAI(ResultadoTriaje r, UsuariosEntity user){

        Integer edad = r.datosExtraidos().paciente().edad();

        PacienteEntity pacienteEntity = new PacienteEntity();
        pacienteEntity.setNombre(recortar(r.datosExtraidos().paciente().nombre()));
        pacienteEntity.setDiagnostico(r.datosExtraidos().diagnosticoPrincipal());
        // La columna admite 0 a 120: fuera de rango se deja vacía en vez de fallar el guardado.
        pacienteEntity.setEdad(edad != null && edad >= 0 && edad <= 120 ? edad.shortValue() : null);
        pacienteEntity.setRut(recortar(r.datosExtraidos().paciente().rut()));
        pacienteEntity.setFechaRegistro(LocalDateTime.now());
        pacienteEntity.setFechaActualizacion(LocalDateTime.now());
        pacienteEntity.setEstado(Estado.INTERNADO);
        pacienteEntity.setUsuario(user);

        return pacienteEntity;

    }

    private static String recortar(String valor) {
        return valor != null && valor.length() > 255 ? valor.substring(0, 255) : valor;
    }

    public PacienteEntity toDomainFromDTO(PacienteRequest request, UsuariosEntity user){


        PacienteEntity pacienteEntity = new PacienteEntity();
        pacienteEntity.setNombre(request.nombre());
        pacienteEntity.setDiagnostico(request.diagnostico());
        pacienteEntity.setEdad(request.edad());
        pacienteEntity.setRut(request.rut());
        pacienteEntity.setFechaActualizacion(LocalDateTime.now());
        pacienteEntity.setEstado(request.estado());
        pacienteEntity.setUsuario(user);

        return pacienteEntity;
    }

    public PacienteResponse toResponse(PacienteEntity pacienteEntity){

        PacienteResponse response = new PacienteResponse(
                pacienteEntity.getId(),
                pacienteEntity.getNombre(),
                pacienteEntity.getDiagnostico(),
                pacienteEntity.getEdad(),
                pacienteEntity.getRut(),
                pacienteEntity.getFechaRegistro(),
                pacienteEntity.getFechaActualizacion(),
                pacienteEntity.getEstado(),
                pacienteEntity.getUsuario().getNombre()
        );

        return response;

    }


}
