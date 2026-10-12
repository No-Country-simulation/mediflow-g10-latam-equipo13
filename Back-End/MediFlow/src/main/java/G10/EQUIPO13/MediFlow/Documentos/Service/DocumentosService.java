
package G10.EQUIPO13.MediFlow.Documentos.Service;

import G10.EQUIPO13.MediFlow.AiClient.AIClient;
import G10.EQUIPO13.MediFlow.AiClient.DTOs.ResultadoTriaje;
import G10.EQUIPO13.MediFlow.Documentos.Entity.DocumentosEntity;
import G10.EQUIPO13.MediFlow.Documentos.Entity.DocumentosRepository;
import G10.EQUIPO13.MediFlow.Estudios.Entity.EstudiosEntity;
import G10.EQUIPO13.MediFlow.Estudios.Entity.EstudiosRepository;
import G10.EQUIPO13.MediFlow.Estudios.Service.EstudiosDTOMapper;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.AccesoDenegadoException;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.ReglaNegocioException;
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
    public DocumentosEntity analizeFile(MultipartFile archivo) {

        UsuariosEntity user = currentUserService.getCurrentUserId();

        if (user.getRol() == Roles.NO_ASIGNADO) {
            throw new AccesoDenegadoException(
                    "El rol " + user.getRol()
                            + " no tiene permisos para realizar esta acción"
            );
        }

        // Enviar el archivo al servicio Python/FastAPI.
        ResultadoTriaje resultado = aiClient.analizarDocumento(archivo);

        // Validar la respuesta de FastAPI antes de guardar entidades.
        if (resultado == null) {
            throw new ReglaNegocioException(
                    "El servicio de análisis no devolvió un resultado"
            );
        }

        if (resultado.clasificacion() == null) {
            throw new ReglaNegocioException(
                    "El resultado no contiene la clasificación del documento"
            );
        }

        if (resultado.datosExtraidos() == null) {
            throw new ReglaNegocioException(
                    "El resultado no contiene los datos extraídos"
            );
        }

        if (resultado.datosExtraidos().paciente() == null) {
            throw new ReglaNegocioException(
                    "No se encontraron datos del paciente en el documento"
            );
        }

        String nombrePaciente =
                resultado.datosExtraidos().paciente().nombre();

        if (nombrePaciente == null || nombrePaciente.isBlank()) {
            throw new ReglaNegocioException(
                    "No se pudo identificar el nombre del paciente"
            );
        }

        // Construir y guardar el documento.
        DocumentosEntity entity = mapper.toEntityFromAI(resultado, user);
        DocumentosEntity documentoSaved = documentosRepository.save(entity);

        // Buscar un paciente que ya esté internado.
        Optional<PacienteEntity> pacienteActivo =
                pacienteRepository.findByNombreAndEstado(
                        nombrePaciente,
                        Estado.INTERNADO
                );

        PacienteEntity paciente;

        if (pacienteActivo.isPresent()) {
            // Reutilizar el paciente internado existente.
            paciente = pacienteActivo.get();
        } else {
            // Crear un paciente si no existe uno internado.
            paciente = pacientesMapper.toDomainFromAI(resultado, user);
            paciente = pacienteRepository.save(paciente);
        }

        // Crear y guardar el estudio asociado al paciente.
        // El nombre del estudio puede ser null si la IA no lo identificó.
        EstudiosEntity estudio =
                estudiosMapper.toDomainFromAI(resultado, user, paciente);

        estudiosRepository.save(estudio);

        // Devolver la entidad completa del documento.
        return mapper.toResponse(documentoSaved);
    }

    public List<DocumentosEntity> findall() {

        UsuariosEntity user = currentUserService.getCurrentUserId();

        if (user.getRol() == Roles.NO_ASIGNADO) {
            throw new AccesoDenegadoException(
                    "El rol " + user.getRol()
                            + " no tiene permisos para realizar esta acción"
            );
        }

        List<DocumentosEntity> entity = documentosRepository.findAll();

        return entity.stream()
                .map(mapper::toResponse)
                .toList();
    }

    public DocumentosEntity findById(Long id) {

        UsuariosEntity user = currentUserService.getCurrentUserId();

        if (user.getRol() == Roles.NO_ASIGNADO) {
            throw new AccesoDenegadoException(
                    "El rol " + user.getRol()
                            + " no tiene permisos para realizar esta acción"
            );
        }

        DocumentosEntity entity = documentosRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Documento no encontrado con id: " + id
                ));

        return mapper.toResponse(entity);
    }

    @Transactional
    public void deleteById(Long id) {

        UsuariosEntity user = currentUserService.getCurrentUserId();

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
