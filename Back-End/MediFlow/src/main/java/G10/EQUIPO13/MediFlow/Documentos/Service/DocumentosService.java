package G10.EQUIPO13.MediFlow.Documentos.Service;

import G10.EQUIPO13.MediFlow.AiClient.AIClient;
import G10.EQUIPO13.MediFlow.AiClient.DTOs.ResultadoTriaje;
import G10.EQUIPO13.MediFlow.Documentos.Entity.DocumentosEntity;
import G10.EQUIPO13.MediFlow.Documentos.Entity.DocumentosRepository;
import G10.EQUIPO13.MediFlow.Documentos.controller.DocumentosResponse;
import G10.EQUIPO13.MediFlow.Estudios.Entity.EstudiosEntity;
import G10.EQUIPO13.MediFlow.Estudios.Entity.EstudiosRepository;
import G10.EQUIPO13.MediFlow.Estudios.Service.EstudiosDTOMapper;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.AccesoDenegadoException;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.ResourceNotFoundException;
import G10.EQUIPO13.MediFlow.Pacientes.Entity.Estado;
import G10.EQUIPO13.MediFlow.Pacientes.Entity.PacienteEntity;
import G10.EQUIPO13.MediFlow.Pacientes.Entity.PacienteRepository;
import G10.EQUIPO13.MediFlow.Pacientes.Service.PacientesDTOMapper;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.Roles;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosEntity;
import G10.EQUIPO13.MediFlow.Usuarios.Service.CurrentUserService;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@AllArgsConstructor
@Service
public class DocumentosService {

    private final DocumentosRepository documentosRepository;

    private final CurrentUserService currentUserService;

    private final DocumentosDTOMapper mapper;

    private final AIClient aiClient;

    private final PacienteRepository pacienteRepository;

    private final PacientesDTOMapper pacientesMapper;

    private final EstudiosRepository estudiosRepository;

    private final EstudiosDTOMapper estudiosMapper;





    @Transactional
    public DocumentosResponse analizeFile(MultipartFile archivo) {

        UsuariosEntity user = currentUserService.getCurrentUserId();

        if (user.getRol() == Roles.NO_ASIGNADO) {

            throw new AccesoDenegadoException(
                    "El rol " + user.getRol()
                            + " no tiene permisos para realizar esta acción"
            );
        }

        /*
         * Enviamos el archivo al servicio Python/FastAPI.
         */

        ResultadoTriaje resultado = aiClient.analizarDocumento(archivo);

        //documentos
        DocumentosEntity entity =
                mapper.toEntityFromAI(resultado,user);

        DocumentosEntity documentoSaved =
                documentosRepository.save(entity);


        //registrar paciente

        Optional<PacienteEntity> pacienteActivo =
                pacienteRepository.findByNombreAndEstado(
                        resultado.datosExtraidos().paciente().nombre(),
                        Estado.INTERNADO
                );

        PacienteEntity paciente;

        if (pacienteActivo.isPresent()) {

            // Ya existe un ingreso activo: reutilizarlo
            paciente = pacienteActivo.get();

        } else {

            // No tiene un ingreso activo:
            // puede ser un paciente nuevo o alguien que vuelve tras el alta.

            paciente = pacientesMapper.toDomainFromAI(resultado, user);
            paciente = pacienteRepository.save(paciente);
        }

        EstudiosEntity estudio =
                estudiosMapper.toDomainFromAI(resultado, user, paciente);

        estudiosRepository.save(estudio);

        return mapper.toResponse(documentoSaved);

    }


    public List<DocumentosResponse> findall() {

        UsuariosEntity user =
                currentUserService.getCurrentUserId();

        if (user.getRol() == Roles.NO_ASIGNADO) {

            throw new AccesoDenegadoException(
                    "El rol " + user.getRol()
                            + " no tiene permisos para realizar esta acción"
            );
        }

        List<DocumentosEntity> entity =
                documentosRepository.findAll();

        return entity
                .stream()
                .map(mapper::toResponse)
                .toList();
    }


    public DocumentosResponse findById(Long id) {

        UsuariosEntity user =
                currentUserService.getCurrentUserId();

        if (user.getRol() == Roles.NO_ASIGNADO) {

            throw new AccesoDenegadoException(
                    "El rol " + user.getRol()
                            + " no tiene permisos para realizar esta acción"
            );
        }

        DocumentosEntity entity =
                documentosRepository.findById(id)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "documento con el id no encontrado: "
                                                + id
                                )
                        );

        return mapper.toResponse(entity);
    }


    @Transactional
    public void deleteById(Long id) {

        UsuariosEntity user =
                currentUserService.getCurrentUserId();

        if (user.getRol() == Roles.ADMIN) {

            documentosRepository.deleteById(id);

        } else {

            throw new AccesoDenegadoException(
                    "El rol " + user.getRol()
                            + " no tiene permisos para realizar esta acción"
            );
        }
    }
}