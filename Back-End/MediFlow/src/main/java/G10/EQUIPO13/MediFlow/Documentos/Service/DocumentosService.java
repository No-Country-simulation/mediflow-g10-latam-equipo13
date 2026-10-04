package G10.EQUIPO13.MediFlow.Documentos.Service;


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


import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;

@AllArgsConstructor
@Service
public class DocumentosService {

    private final DocumentosRepository documentosRepository;

    private final CurrentUserService currentUserService;

    private final DocumentosDTOMapper mapper;

    private final GeminiAnalyzer gemini;

    private final PacienteRepository pacienteRepository;

    private final PacientesDTOMapper pacientesMapper;


    @Transactional
    public DocumentosResponse analizeText(DocumentosRequest documentosRequest){

        UsuariosEntity user = currentUserService.getCurrentUserId();

        if (user.getRol() == Roles.NO_ASIGNADO){

            throw new AccesoDenegadoException(
                    "El rol " + user.getRol() + " no tiene permisos para realizar esta acción"
            );

        }


        AIResponse aiResponse= gemini.analyzeText(documentosRequest.content());

        DocumentosEntity entity = mapper.toEntity(aiResponse,user);

        DocumentosEntity documentoSaved = documentosRepository.save(entity);

        // Pacientes

        PacienteEntity paciente = pacientesMapper.toDomainFromAI(aiResponse,user);

        PacienteEntity pacienteSaved = pacienteRepository.save(paciente);

        return mapper.toResponse(documentoSaved);

    }

    @Transactional
    public DocumentosResponse analizeFile(MultipartFile archivo){

        // TODO: llamar a Python cuando el cliente esté listo

        // try {
        //     byte[] contenido = archivo.getBytes();
        //     ResultadoPython resultado = pythonClient.analizar(contenido);
        //     return new DocumentosResponse(...);
        // } catch (IOException e) {
        //     throw new UncheckedIOException("Error al procesar el archivo", e);
        // }

        throw new UnsupportedOperationException("analizeFile aún no implementado");



    }


    public List<DocumentosResponse> findall() {

        UsuariosEntity user = currentUserService.getCurrentUserId();

        if (user.getRol() == Roles.NO_ASIGNADO){

            throw new AccesoDenegadoException(
                    "El rol " + user.getRol() + " no tiene permisos para realizar esta acción"
            );

        }

        List<DocumentosEntity> entity = documentosRepository.findAll();

        return  entity
                .stream()
                .map(mapper::toResponse)
                .toList();

    }

    public DocumentosResponse findById(Long id) {

        UsuariosEntity user = currentUserService.getCurrentUserId();

        if (user.getRol() == Roles.NO_ASIGNADO){

            throw new AccesoDenegadoException(
                    "El rol " + user.getRol() + " no tiene permisos para realizar esta acción"
            );

        }

        DocumentosEntity entity = documentosRepository.findById(id)
                .orElseThrow(()-> new ResourceNotFoundException("documento con el id no encontrado: "+ id ) );

        return mapper.toResponse(entity);

    }


    @Transactional
    public void deleteById(Long id) {

        UsuariosEntity user = currentUserService.getCurrentUserId();

        if (user.getRol() == Roles.ADMIN){

            documentosRepository.deleteById(id);

        }
        else {

            throw new AccesoDenegadoException(
                    "El rol " + user.getRol() + " no tiene permisos para realizar esta acción"
            );

        }


    }
}
