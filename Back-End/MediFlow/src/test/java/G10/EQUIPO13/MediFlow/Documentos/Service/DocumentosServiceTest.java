package G10.EQUIPO13.MediFlow.Documentos.Service;


import G10.EQUIPO13.MediFlow.AiClient.AIClient;
import G10.EQUIPO13.MediFlow.AiClient.DTOs.*;
import G10.EQUIPO13.MediFlow.Configuracion.ConfiguracionService;
import G10.EQUIPO13.MediFlow.Documentos.Entity.DocumentosEntity;
import G10.EQUIPO13.MediFlow.Documentos.Entity.DocumentosRepository;
import G10.EQUIPO13.MediFlow.Documentos.controller.DocumentosRequest;
import G10.EQUIPO13.MediFlow.Documentos.controller.DocumentosResponse;
import G10.EQUIPO13.MediFlow.Documentos.controller.RevisionRequest;
import G10.EQUIPO13.MediFlow.Estudios.Entity.EstudiosEntity;
import G10.EQUIPO13.MediFlow.Estudios.Entity.EstudiosRepository;
import G10.EQUIPO13.MediFlow.Estudios.Service.EstudiosDTOMapper;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.AIClientException;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.AccesoDenegadoException;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.ConflictoException;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.ResourceNotFoundException;
import G10.EQUIPO13.MediFlow.Pacientes.Entity.Estado;
import G10.EQUIPO13.MediFlow.Pacientes.Entity.PacienteEntity;
import G10.EQUIPO13.MediFlow.Pacientes.Entity.PacienteRepository;
import G10.EQUIPO13.MediFlow.Pacientes.Service.PacientesDTOMapper;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.Roles;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosEntity;
import G10.EQUIPO13.MediFlow.Usuarios.Service.CurrentUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.*;

/**
 * El mapper es real (no un mock): así se prueba también que los datos de la IA lleguen a la entidad.
 * Datos 100 % sintéticos.
 */
@ExtendWith(MockitoExtension.class)
class DocumentosServiceTest {

    @Mock private DocumentosRepository documentosRepository;
    @Mock private CurrentUserService currentUserService;
    @Mock private AIClient aiClient;
    @Mock private PacienteRepository pacienteRepository;
    @Mock private PacientesDTOMapper pacientesMapper;
    @Mock private EstudiosRepository estudiosRepository;
    @Mock private EstudiosDTOMapper estudiosMapper;
    @Mock private ConfiguracionService configuracionService;

    private DocumentosService documentosService;
    private UsuariosEntity usuario;
    private MockMultipartFile archivo;

    @BeforeEach
    void setUp() {
        documentosService = new DocumentosService(documentosRepository, currentUserService, new DocumentosDTOMapper(),
                aiClient, pacienteRepository, pacientesMapper, estudiosRepository, estudiosMapper, configuracionService);

        usuario = new UsuariosEntity();
        usuario.setId(1L);
        usuario.setNombre("auditora");
        usuario.setRol(Roles.ADMIN);

        archivo = new MockMultipartFile("archivo", "receta.pdf", "application/pdf", "contenido sintético".getBytes());
    }

    private ResultadoTriaje resultado(String nombrePaciente, boolean auditoria, String prioridad) {
        return new ResultadoTriaje(
                auditoria ? "pendiente_revision_humana" : "procesado",
                "8f0c2b1e-0000-4000-8000-000000000001",
                "2026-10-24T03:00:00Z",
                "Consulta_Externa",
                "receta.pdf",
                "Receta sintética",
                new Clasificacion("Receta", "Medicina General", prioridad, auditoria ? 0.4 : 0.95, auditoria,
                        auditoria ? "Cola_Revision_Humana" : "Farmacia_Hospitalaria"),
                new DatosExtraidos(
                        new Paciente(nombrePaciente, "11.111.111-1", 41),
                        new MedicoSolicitante("Dr. Ficticio", "MP 1"),
                        "Hemograma",
                        "Control",
                        "Z00.0",
                        List.of(new Medicamento("Paracetamol", "500 mg", "cada 8 h", "oral", "5 días"))
                ),
                new DecisionEnrutamiento(auditoria ? "Cola_Revision_Humana" : "Farmacia_Hospitalaria", auditoria,
                        "Justificación sintética", null),
                Map.of("campos_faltantes", List.of()),
                new AlmacenamientoOci(auditoria ? "BktAuditoria-humana" : "BktProcesados",
                        "estructurados/2026/10/24/8f0c2b1e-0000-4000-8000-000000000001.json",
                        "2026/10/24/8f0c2b1e-0000-4000-8000-000000000001_receta.pdf", "exito"),
                List.of(Map.of("nodo", "extraer", "resultado", "Receta"))
        );
    }

    private DocumentosEntity guardadoCon(ArgumentCaptor<DocumentosEntity> captor) {
        verify(documentosRepository).save(captor.capture());
        return captor.getValue();
    }

    // =========================================
    // ANÁLISIS
    // =========================================

    @Test
    void analizeFile_siElUsuarioNoTieneRol_deberiaLanzarExcepcion() {
        usuario.setRol(Roles.NO_ASIGNADO);
        when(currentUserService.getCurrentUserId()).thenReturn(usuario);

        assertThrows(AccesoDenegadoException.class, () -> documentosService.analizeFile(archivo, null));

        verifyNoInteractions(aiClient, documentosRepository, pacienteRepository, estudiosRepository);
    }

    @Test
    void analizeFile_guardaTodosLosDatosExtraidosYLaDecision() {
        when(currentUserService.getCurrentUserId()).thenReturn(usuario);
        when(configuracionService.paraAgente()).thenReturn(Map.of("umbral", 0.6));
        when(aiClient.analizarDocumento(archivo, "Consulta_Externa", Map.of("umbral", 0.6)))
                .thenReturn(resultado("Paciente Ficticio", false, "Rutina"));
        when(documentosRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(pacienteRepository.findFirstByRutAndEstado("11.111.111-1", Estado.INTERNADO)).thenReturn(Optional.empty());
        when(pacienteRepository.findFirstByNombreAndEstado("Paciente Ficticio", Estado.INTERNADO)).thenReturn(Optional.empty());
        PacienteEntity paciente = new PacienteEntity();
        when(pacientesMapper.toDomainFromAI(any(), any())).thenReturn(paciente);
        when(pacienteRepository.save(paciente)).thenReturn(paciente);

        DocumentosResponse respuesta = documentosService.analizeFile(archivo, "Consulta_Externa");

        DocumentosEntity guardado = guardadoCon(ArgumentCaptor.forClass(DocumentosEntity.class));
        assertEquals("Dr. Ficticio", guardado.getNombreMedico());
        assertEquals("MP 1", guardado.getMatriculaMedico());
        assertEquals("Paciente Ficticio", guardado.getPacienteNombre());
        assertEquals((short) 41, guardado.getPacienteEdad());
        assertEquals("Farmacia_Hospitalaria", guardado.getDestino());
        assertEquals("2026/10/24/8f0c2b1e-0000-4000-8000-000000000001_receta.pdf", guardado.getOciOriginal());
        assertFalse(guardado.getRequiereAuditoria());

        assertEquals("Paracetamol", respuesta.medicamentos().get(0).nombre());
        assertEquals("extraer", respuesta.traza().get(0).get("nodo"));
        assertEquals("Farmacia_Hospitalaria", respuesta.colaEnrutamiento());
        verify(pacienteRepository).save(paciente);
    }

    @Test
    void analizeFile_siElPacienteEstaInternado_deberiaReutilizarlo() {
        when(currentUserService.getCurrentUserId()).thenReturn(usuario);
        when(aiClient.analizarDocumento(any(), any(), any())).thenReturn(resultado("Pedro", false, "Rutina"));
        when(documentosRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        PacienteEntity internado = new PacienteEntity();
        when(pacienteRepository.findFirstByRutAndEstado("11.111.111-1", Estado.INTERNADO)).thenReturn(Optional.of(internado));
        EstudiosEntity estudio = new EstudiosEntity();
        when(estudiosMapper.toDomainFromAI(any(), any(), any())).thenReturn(estudio);

        documentosService.analizeFile(archivo, null);

        verify(pacienteRepository, never()).save(any());
        verify(estudiosMapper).toDomainFromAI(any(), any(), any());
        verify(estudiosRepository).save(estudio);
    }

    @Test
    void analizeFile_siNoSeIdentificaAlPaciente_noCreaPacienteNiEstudio() {
        when(currentUserService.getCurrentUserId()).thenReturn(usuario);
        when(aiClient.analizarDocumento(any(), any(), any())).thenReturn(resultado(null, true, "Rutina"));
        when(documentosRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        documentosService.analizeFile(archivo, null);

        verifyNoInteractions(pacienteRepository, pacientesMapper, estudiosMapper, estudiosRepository);
    }

    @Test
    void analizeText_enviaElTextoAlAgente() {
        when(currentUserService.getCurrentUserId()).thenReturn(usuario);
        when(aiClient.analizarTexto(eq("Texto clínico sintético"), eq("Guardia"), any()))
                .thenReturn(resultado(null, false, "Urgente"));
        when(documentosRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DocumentosResponse respuesta = documentosService.analizeText(new DocumentosRequest("Texto clínico sintético", "Guardia"));

        assertEquals("Urgente", respuesta.prioridad());
    }

    // =========================================
    // CONSULTAS
    // =========================================

    @Test
    void findById_siNoExiste_deberiaLanzarExcepcion() {
        when(currentUserService.getCurrentUserId()).thenReturn(usuario);
        when(documentosRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> documentosService.findById(99L));
    }

    @Test
    void obtenerArchivo_sinOriginalEnOci_deberiaLanzarNoEncontrado() {
        when(currentUserService.getCurrentUserId()).thenReturn(usuario);
        when(documentosRepository.findById(1L)).thenReturn(Optional.of(new DocumentosEntity()));

        assertThrows(ResourceNotFoundException.class, () -> documentosService.obtenerArchivo(1L));
        verifyNoInteractions(aiClient);
    }

    // =========================================
    // REVISIÓN HUMANA
    // =========================================

    private DocumentosEntity pendiente() {
        DocumentosEntity doc = new DocumentosMapperAyuda().pendiente();
        when(documentosRepository.findById(5L)).thenReturn(Optional.of(doc));
        when(documentosRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        return doc;
    }

    @Test
    void revisar_personalNoPuedeRevisar() {
        usuario.setRol(Roles.PERSONAL);
        when(currentUserService.getCurrentUserId()).thenReturn(usuario);

        assertThrows(AccesoDenegadoException.class,
                () -> documentosService.revisar(5L, new RevisionRequest("aprobado", null, null, null)));
    }

    @Test
    void revisar_aprobado_saleDeLaColaDeRevisionHaciaSuDestino() {
        when(currentUserService.getCurrentUserId()).thenReturn(usuario);
        DocumentosEntity doc = pendiente();
        when(configuracionService.destinoPara("Receta")).thenReturn("Farmacia_Hospitalaria");
        when(aiClient.registrarRevision(anyMap())).thenReturn(Map.of("bucket", "BktProcesados", "status_backup", "exito"));

        DocumentosResponse respuesta = documentosService.revisar(5L, new RevisionRequest("aprobado", "Todo correcto", "otro", null));

        assertFalse(doc.getRequiereAuditoria());
        assertEquals("revisado", doc.getStatus());
        assertEquals("Farmacia_Hospitalaria", doc.getDestino());
        assertEquals("auditora", doc.getRevisionRevisor());
        assertEquals("BktProcesados", doc.getOciBucket());
        assertEquals("aprobado", respuesta.revision().decision());
    }

    @Test
    void revisar_corregido_aplicaLosDatosDelAuditor() {
        when(currentUserService.getCurrentUserId()).thenReturn(usuario);
        DocumentosEntity doc = pendiente();
        when(aiClient.registrarRevision(anyMap())).thenReturn(Map.of());
        var datos = new RevisionRequest.DatosCorregidos("Paciente Corregido", null, (short) 30, null, null,
                null, null, null, "Urgente");

        documentosService.revisar(5L, new RevisionRequest("corregido", null, null, datos));

        assertEquals("Paciente Corregido", doc.getPacienteNombre());
        assertEquals((short) 30, doc.getPacienteEdad());
        assertEquals("Cola_Emergencia_Medica", doc.getDestino());
    }

    @Test
    void revisar_siOciFalla_laRevisionSeGuardaIgual() {
        when(currentUserService.getCurrentUserId()).thenReturn(usuario);
        DocumentosEntity doc = pendiente();
        when(aiClient.registrarRevision(anyMap())).thenThrow(new AIClientException("OCI caído"));

        documentosService.revisar(5L, new RevisionRequest("rechazado", "Ilegible", null, null));

        assertEquals("rechazado", doc.getStatus());
        assertEquals("revision_pendiente_oci", doc.getOciEstado());
        verify(documentosRepository).save(doc);
    }

    @Test
    void revisar_documentoNoPendiente_deberiaLanzarConflicto() {
        when(currentUserService.getCurrentUserId()).thenReturn(usuario);
        DocumentosEntity doc = new DocumentosEntity();
        doc.setRequiereAuditoria(false);
        when(documentosRepository.findById(6L)).thenReturn(Optional.of(doc));

        assertThrows(ConflictoException.class,
                () -> documentosService.revisar(6L, new RevisionRequest("aprobado", null, null, null)));
    }

    @Test
    void deleteById_soloAdmin() {
        usuario.setRol(Roles.AUDITOR);
        when(currentUserService.getCurrentUserId()).thenReturn(usuario);

        assertThrows(AccesoDenegadoException.class, () -> documentosService.deleteById(1L));
        verify(documentosRepository, never()).delete(any());
    }

    /** Documento sintético pendiente de revisión, con su JSON en el bucket de auditoría. */
    private static class DocumentosMapperAyuda {
        DocumentosEntity pendiente() {
            DocumentosEntity doc = new DocumentosEntity();
            doc.setId(5L);
            doc.setTipo("Receta");
            doc.setPrioridad("Rutina");
            doc.setRequiereAuditoria(true);
            doc.setStatus("pendiente_revision_humana");
            doc.setDocumentoId("8f0c2b1e-0000-4000-8000-000000000001");
            doc.setOciBucket("BktAuditoria-humana");
            doc.setOciObjeto("estructurados/2026/10/24/8f0c2b1e-0000-4000-8000-000000000001.json");
            return doc;
        }
    }
}
