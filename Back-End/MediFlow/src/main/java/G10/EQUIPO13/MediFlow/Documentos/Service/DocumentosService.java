package G10.EQUIPO13.MediFlow.Documentos.Service;

import G10.EQUIPO13.MediFlow.AiClient.AIClient;
import G10.EQUIPO13.MediFlow.AiClient.DTOs.ArchivoOriginal;
import G10.EQUIPO13.MediFlow.AiClient.DTOs.Paciente;
import G10.EQUIPO13.MediFlow.AiClient.DTOs.ResultadoTriaje;
import G10.EQUIPO13.MediFlow.Configuracion.ConfiguracionService;
import G10.EQUIPO13.MediFlow.Documentos.Entity.DocumentosEntity;
import G10.EQUIPO13.MediFlow.Documentos.Entity.DocumentosRepository;
import G10.EQUIPO13.MediFlow.Documentos.controller.AlertaResponse;
import G10.EQUIPO13.MediFlow.Documentos.controller.DocumentosRequest;
import G10.EQUIPO13.MediFlow.Documentos.controller.DocumentosResponse;
import G10.EQUIPO13.MediFlow.Documentos.controller.RevisionRequest;
import G10.EQUIPO13.MediFlow.Estudios.Entity.EstudiosEntity;
import G10.EQUIPO13.MediFlow.Estudios.Entity.EstudiosRepository;
import G10.EQUIPO13.MediFlow.Estudios.Service.EstudiosDTOMapper;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.AIClientException;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.AccesoDenegadoException;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.ConflictoException;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.ReglaNegocioException;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.ResourceNotFoundException;
import G10.EQUIPO13.MediFlow.Pacientes.Entity.Estado;
import G10.EQUIPO13.MediFlow.Pacientes.Entity.PacienteEntity;
import G10.EQUIPO13.MediFlow.Pacientes.Entity.PacienteRepository;
import G10.EQUIPO13.MediFlow.Pacientes.Service.PacientesDTOMapper;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.Roles;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosEntity;
import G10.EQUIPO13.MediFlow.Usuarios.Service.CurrentUserService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@AllArgsConstructor
@Service
public class DocumentosService {

    static final String DESTINO_URGENCIA = "Cola_Emergencia_Medica";
    static final String DESTINO_RECHAZADO = "Documento_Rechazado";

    private final DocumentosRepository documentosRepository;

    private final CurrentUserService currentUserService;

    private final DocumentosDTOMapper mapper;

    private final AIClient aiClient;

    private final PacienteRepository pacienteRepository;

    private final PacientesDTOMapper pacientesMapper;

    private final EstudiosRepository estudiosRepository;

    private final EstudiosDTOMapper estudiosMapper;

    private final ConfiguracionService configuracionService;

    /** Analiza un archivo (PDF, imagen o texto) con el agente y guarda el resultado. */
    @Transactional
    public DocumentosResponse analizeFile(MultipartFile archivo, String canalOrigen) {
        UsuariosEntity user = usuarioConRol();
        if (archivo == null || archivo.isEmpty()) {
            throw new ReglaNegocioException("El archivo está vacío");
        }
        ResultadoTriaje resultado = aiClient.analizarDocumento(archivo, canalOrigen, configuracionService.paraAgente());
        return guardarResultado(resultado, user);
    }

    /** Analiza texto pegado en la interfaz. */
    @Transactional
    public DocumentosResponse analizeText(DocumentosRequest request) {
        UsuariosEntity user = usuarioConRol();
        ResultadoTriaje resultado = aiClient.analizarTexto(request.texto(), request.canalOrigen(), configuracionService.paraAgente());
        return guardarResultado(resultado, user);
    }

    public List<DocumentosResponse> findall() {
        usuarioConRol();
        return documentosRepository.findAllByOrderByFechaRegistroDesc()
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    public DocumentosResponse findById(Long id) {
        usuarioConRol();
        return mapper.toResponse(buscar(id));
    }

    /**
     * Revisión humana (Human-in-the-Loop): aprobar, corregir o rechazar un documento derivado a auditoría.
     * Al aprobar o corregir, el documento sale de la cola de revisión hacia su destino definitivo.
     */
    @Transactional
    public DocumentosResponse revisar(Long id, RevisionRequest request) {
        UsuariosEntity user = currentUserService.getCurrentUserId();
        if (user.getRol() != Roles.ADMIN && user.getRol() != Roles.AUDITOR) {
            throw new AccesoDenegadoException("Solo administradores y auditores pueden revisar documentos");
        }
        DocumentosEntity documento = buscar(id);
        if (!Boolean.TRUE.equals(documento.getRequiereAuditoria())) {
            throw new ConflictoException("Este documento no está pendiente de revisión humana");
        }

        String decision = request.decision();
        if ("corregido".equals(decision)) {
            mapper.aplicarCorreccion(documento, request.datosCorregidos());
        }
        LocalDateTime ahora = LocalDateTime.now();
        documento.setRevisionDecision(decision);
        documento.setRevisionComentario(DocumentosDTOMapper.recortar(request.comentario(), 2000));
        documento.setRevisionRevisor(user.getNombre());
        documento.setRevisionFecha(ahora);
        documento.setFechaActualizacion(ahora);
        documento.setRequiereAuditoria(false);

        String destino;
        if ("rechazado".equals(decision)) {
            documento.setStatus("rechazado");
            destino = DESTINO_RECHAZADO;
        } else {
            documento.setStatus("revisado");
            destino = "Urgente".equalsIgnoreCase(documento.getPrioridad())
                    ? DESTINO_URGENCIA
                    : configuracionService.destinoPara(documento.getTipo());
        }
        documento.setDestino(destino);
        documento.setColaEnrutamiento(destino);
        documento.setJustificacion(justificacionRevision(documento.getJustificacion(), decision, user.getNombre(), destino));

        moverEnOci(documento, request);
        return mapper.toResponse(documentosRepository.save(documento));
    }

    /** Archivo original guardado en OCI (para el visor de la interfaz). */
    public ArchivoOriginal obtenerArchivo(Long id) {
        usuarioConRol();
        DocumentosEntity documento = buscar(id);
        if (documento.getOciOriginal() == null) {
            throw new ResourceNotFoundException("Este documento no tiene un archivo original guardado en OCI");
        }
        return aiClient.descargarOriginal(documento.getOciOriginal());
    }

    /** Casos urgentes desde una fecha (por defecto, las últimas 24 h), para las alertas en tiempo real. */
    public List<AlertaResponse> alertas(OffsetDateTime desde) {
        usuarioConRol();
        LocalDateTime limite = desde != null
                ? desde.withOffsetSameInstant(ZoneOffset.UTC).toLocalDateTime()
                : LocalDateTime.now().minusHours(24);
        return documentosRepository
                .findTop20ByPrioridadAndFechaRegistroAfterOrderByFechaRegistroDesc("Urgente", limite)
                .stream()
                .map(mapper::toAlerta)
                .toList();
    }

    @Transactional
    public void deleteById(Long id) {
        UsuariosEntity user = currentUserService.getCurrentUserId();
        if (user.getRol() != Roles.ADMIN) {
            throw new AccesoDenegadoException(
                    "El rol " + user.getRol() + " no tiene permisos para realizar esta acción"
            );
        }
        documentosRepository.delete(buscar(id));
    }

    // ------------------------------------------------------------------

    private DocumentosResponse guardarResultado(ResultadoTriaje resultado, UsuariosEntity user) {
        DocumentosEntity documentoSaved = documentosRepository.save(mapper.toEntityFromAI(resultado, user));
        registrarPacienteYEstudio(resultado, user);
        return mapper.toResponse(documentoSaved);
    }

    /**
     * Registra el paciente y el estudio solo si la IA identificó al paciente.
     * Un documento ilegible no debe crear un paciente "sin nombre" compartido por todos.
     */
    private void registrarPacienteYEstudio(ResultadoTriaje resultado, UsuariosEntity user) {
        Paciente datosPaciente = resultado.datosExtraidos() != null ? resultado.datosExtraidos().paciente() : null;
        String nombre = datosPaciente != null ? DocumentosDTOMapper.recortar(datosPaciente.nombre(), 255) : null;
        if (nombre == null) {
            return;
        }
        Optional<PacienteEntity> pacienteActivo = Optional.empty();
        String rut = DocumentosDTOMapper.recortar(datosPaciente.rut(), 255);
        if (rut != null) {
            pacienteActivo = pacienteRepository.findFirstByRutAndEstado(rut, Estado.INTERNADO);
        }
        if (pacienteActivo.isEmpty()) {
            pacienteActivo = pacienteRepository.findFirstByNombreAndEstado(nombre, Estado.INTERNADO);
        }
        PacienteEntity paciente = pacienteActivo.orElseGet(
                () -> pacienteRepository.save(pacientesMapper.toDomainFromAI(resultado, user)));

        EstudiosEntity estudio = estudiosMapper.toDomainFromAI(resultado, user, paciente);
        if (estudio != null) {
            estudiosRepository.save(estudio);
        }
    }

    /** Mueve el JSON en OCI (auditoría -> procesados). Si OCI falla, la revisión queda guardada igual. */
    private void moverEnOci(DocumentosEntity documento, RevisionRequest request) {
        if (documento.getOciObjeto() == null || !"BktAuditoria-humana".equals(documento.getOciBucket())) {
            return;
        }
        Map<String, Object> solicitud = new HashMap<>();
        solicitud.put("documento_id", documento.getDocumentoId());
        solicitud.put("ruta_objeto", documento.getOciObjeto());
        solicitud.put("decision", request.decision());
        solicitud.put("revisor", documento.getRevisionRevisor());
        solicitud.put("comentario", request.comentario());
        if (request.datosCorregidos() != null) {
            solicitud.put("datos_corregidos", request.datosCorregidos());
        }
        try {
            Map<String, Object> oci = aiClient.registrarRevision(solicitud);
            if (oci.get("bucket") instanceof String bucket) {
                documento.setOciBucket(bucket);
            }
            if (oci.get("ruta_objeto") instanceof String ruta) {
                documento.setOciObjeto(ruta);
            }
            if (oci.get("status_backup") instanceof String estado) {
                documento.setOciEstado(estado);
            }
        } catch (AIClientException e) {
            log.warn("La revisión del documento {} se guardó, pero no se pudo actualizar OCI: {}", documento.getId(), e.getMessage());
            documento.setOciEstado("revision_pendiente_oci");
        }
    }

    private static String justificacionRevision(String anterior, String decision, String revisor, String destino) {
        String nota = switch (decision) {
            case "aprobado" -> "Aprobado en revisión humana por " + revisor + "; enrutado a " + destino + ".";
            case "corregido" -> "Corregido en revisión humana por " + revisor + "; enrutado a " + destino + ".";
            default -> "Rechazado en revisión humana por " + revisor + ".";
        };
        return anterior == null || anterior.isBlank() ? nota : anterior + " " + nota;
    }

    private DocumentosEntity buscar(Long id) {
        return documentosRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el documento con id " + id));
    }

    private UsuariosEntity usuarioConRol() {
        UsuariosEntity user = currentUserService.getCurrentUserId();
        if (user.getRol() == null || user.getRol() == Roles.NO_ASIGNADO) {
            throw new AccesoDenegadoException(
                    "El rol " + user.getRol() + " no tiene permisos para realizar esta acción"
            );
        }
        return user;
    }
}
