package G10.EQUIPO13.MediFlow.Pacientes.Service;


import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.AccesoDenegadoException;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.ResourceNotFoundException;
import G10.EQUIPO13.MediFlow.Pacientes.Controller.PacienteRequest;
import G10.EQUIPO13.MediFlow.Pacientes.Controller.PacienteResponse;
import G10.EQUIPO13.MediFlow.Pacientes.Entity.PacienteEntity;
import G10.EQUIPO13.MediFlow.Pacientes.Entity.PacienteRepository;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.Roles;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosEntity;
import G10.EQUIPO13.MediFlow.Usuarios.Service.CurrentUserService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;


@AllArgsConstructor
@Service
public class PacienteService {

    private final PacienteRepository pacienteRepository;

    private final PacientesDTOMapper mapper;

    private final CurrentUserService currentUserService;


    @Transactional
    public PacienteResponse create(PacienteRequest pacienteRequest){

        UsuariosEntity user = currentUserService.getCurrentUserId();

        if (user.getRol() == Roles.AUDITOR || user.getRol() == Roles.NO_ASIGNADO){

            throw new AccesoDenegadoException(
                    "El rol " + user.getRol() + " no tiene permisos para realizar esta acción"
            );        }

        return mapper.toResponse(pacienteRepository.save(mapper.toDomainFromDTO(pacienteRequest,user)));


    }

    @Transactional
    public PacienteResponse update(PacienteRequest pacienteRequest, Long id){



        UsuariosEntity user = currentUserService.getCurrentUserId();

        if (user.getRol() == Roles.AUDITOR || user.getRol() == Roles.NO_ASIGNADO){

            throw new AccesoDenegadoException(
                    "El rol " + user.getRol() + " no tiene permisos para realizar esta acción"
            );        }

        PacienteEntity entity = pacienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente no encontrado: " +  pacienteRequest.nombre()));

        return mapper.toResponse(pacienteRepository.save(entity));

    }

    public List<PacienteResponse> findAll(){

        UsuariosEntity user = currentUserService.getCurrentUserId();

        if (user.getRol() == Roles.NO_ASIGNADO){

            throw new AccesoDenegadoException(
                    "El rol " + user.getRol() + " no tiene permisos para realizar esta acción"
            );        }

        List<PacienteEntity> pacienteEntity = pacienteRepository.findAll();

        List<PacienteResponse> response = pacienteEntity
                                                .stream()
                                                .map(mapper::toResponse)
                                                .toList();


        return response;

    }

    public PacienteResponse findById(Long id){

        UsuariosEntity user = currentUserService.getCurrentUserId();

        if (user.getRol() == Roles.NO_ASIGNADO){

            throw new AccesoDenegadoException(
                    "El rol " + user.getRol() + " no tiene permisos para realizar esta acción"
            );        }


        PacienteEntity entity = pacienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente no encontrado: " +  id));

        return mapper.toResponse(entity);

    }

    @Transactional
    public void deleteById(Long id){

        UsuariosEntity user = currentUserService.getCurrentUserId();

        if (user.getRol() == Roles.ADMIN ){

            pacienteRepository.deleteById(id);

        }
        else{
            throw new AccesoDenegadoException(
                    "El rol " + user.getRol() + " no tiene permisos para realizar esta acción"
            );
        }


    }






}
