package G10.EQUIPO13.MediFlow.Documentos.Service;

import G10.EQUIPO13.MediFlow.AiClient.AIClient;
import G10.EQUIPO13.MediFlow.AiClient.AIResponse;
import G10.EQUIPO13.MediFlow.AiClient.Temporal.GeminiAnalyzer;
import G10.EQUIPO13.MediFlow.Documentos.Entity.DocumentosEntity;
import G10.EQUIPO13.MediFlow.Documentos.Entity.DocumentosRepository;
import G10.EQUIPO13.MediFlow.Documentos.controller.DocumentosRequest;
import G10.EQUIPO13.MediFlow.Documentos.controller.DocumentosResponse;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.AccesoDenegadoException;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.ResourceNotFoundException;
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

@AllArgsConstructor
@Service
public class DocumentosService {

    private final DocumentosRepository documentosRepository;

    private final CurrentUserService currentUserService;

    private final DocumentosDTOMapper mapper;

    private final GeminiAnalyzer gemini;

    private final AIClient aiClient;

    private final PacienteRepository pacienteRepository;

    private final PacientesDTOMapper pacientesMapper;


    @Transactional
    public DocumentosResponse analizeText(DocumentosRequest documentosRequest) {

        UsuariosEntity user = currentUserService.getCurrentUserId();

        if (user.getRol() == Roles.NO_ASIGNADO) {

            throw new AccesoDenegadoException(
                    "El rol " + user.getRol()
                            + " no tiene permisos para realizar esta acción"
            );
        }

        AIResponse aiResponse = gemini.analyzeText(
                documentosRequest.content()
        );

        DocumentosEntity entity =
                mapper.toEntity(aiResponse, user);

        DocumentosEntity documentoSaved =
                documentosRepository.save(entity);

        PacienteEntity paciente =
                pacientesMapper.toDomainFromAI(aiResponse, user);

        pacienteRepository.save(paciente);

        return mapper.toResponse(documentoSaved);
    }


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
        AIResponse aiResponse =
                aiClient.analizarDocumento(archivo);

        /*
         * Convertimos la respuesta de IA
         * en la entidad de documentos.
         */
        DocumentosEntity entity =
                mapper.toEntity(aiResponse, user);

        DocumentosEntity documentoSaved =
                documentosRepository.save(entity);

        /*
         * Guardamos también los datos del paciente
         * extraídos por la IA.
         */
        PacienteEntity paciente =
                pacientesMapper.toDomainFromAI(aiResponse, user);

        pacienteRepository.save(paciente);

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