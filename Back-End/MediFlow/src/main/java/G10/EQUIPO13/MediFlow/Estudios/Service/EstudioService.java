package G10.EQUIPO13.MediFlow.Estudios.Service;


import G10.EQUIPO13.MediFlow.Estudios.Entity.EstudiosEntity;
import G10.EQUIPO13.MediFlow.Estudios.Entity.EstudiosRepository;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.ResourceNotFoundException;
import G10.EQUIPO13.MediFlow.Pacientes.Entity.PacienteEntity;
import G10.EQUIPO13.MediFlow.Pacientes.Entity.PacienteRepository;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosEntity;
import G10.EQUIPO13.MediFlow.Usuarios.Service.CurrentUserService;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;

@AllArgsConstructor
@Service
public class EstudioService {

    private final EstudiosRepository repository;

    private final CurrentUserService currentUserService;

    private final PacienteRepository pacienteRepository;

    private final EstudiosDTOMapper mapper;


    @Transactional
    public  EstudioResponse create(EstudioRequest request) {

        UsuariosEntity user = currentUserService.getCurrentUserId();


        PacienteEntity paciente = pacienteRepository.findById(request.idPaciente())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente no encontrado"));

        EstudiosEntity entity = mapper.toDomain(request,user,paciente);

        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public  EstudioResponse update(EstudioRequest request, Long id) {

        UsuariosEntity user = currentUserService.getCurrentUserId();

        EstudiosEntity entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estudio no encontrado"));

        return  mapper.toResponse(repository.save(mapper.toDomain(request,user,entity.getPaciente())));

    }


    public  List<EstudioResponse> findall() {

        UsuariosEntity user = currentUserService.getCurrentUserId();

        return repository.findAll()
                .stream()
                .map(mapper::toResponse)
                .toList();
    }


    public  EstudioResponse FindById(Long id) {

        UsuariosEntity user = currentUserService.getCurrentUserId();

        EstudiosEntity entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estudio no encontrado"));

        return mapper.toResponse(entity);
    }


    public  List<EstudioResponse> findByIdMedico(Long id) {

        UsuariosEntity user = currentUserService.getCurrentUserId();

        return repository.findAllByMedicoId(id)
                .stream()
                .map(mapper::toResponse)
                .toList();

    }


    public  List<EstudioResponse> findByNombreMedico(String nombre) {

        UsuariosEntity user = currentUserService.getCurrentUserId();

        return repository.findAllByMedicoNombre(nombre)
                .stream()
                .map(mapper::toResponse)
                .toList();

    }


    public  List<EstudioResponse> findByIdPaciente(Long id) {

        UsuariosEntity user = currentUserService.getCurrentUserId();

        return repository.findAllByPacienteId(id)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    public  List<EstudioResponse> findByNombrePaciente(String nombre) {

        UsuariosEntity user = currentUserService.getCurrentUserId();

        return repository.findAllByPacienteNombre(nombre)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional
    public void Delete(Long id) {

        UsuariosEntity user = currentUserService.getCurrentUserId();


        repository.deleteById(id);

    }

}
