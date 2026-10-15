package G10.EQUIPO13.MediFlow.Documentos.Service;


import G10.EQUIPO13.MediFlow.AiClient.AIClient;
import G10.EQUIPO13.MediFlow.AiClient.DTOs.*;
import G10.EQUIPO13.MediFlow.Documentos.Entity.DocumentosRepository;
import G10.EQUIPO13.MediFlow.Documentos.controller.DocumentosResponse;
import G10.EQUIPO13.MediFlow.Estudios.Entity.EstudiosRepository;
import G10.EQUIPO13.MediFlow.Estudios.Service.EstudiosDTOMapper;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.AccesoDenegadoException;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.ResourceNotFoundException;
import G10.EQUIPO13.MediFlow.Documentos.Entity.DocumentosEntity;


import G10.EQUIPO13.MediFlow.Pacientes.Entity.Estado;
import G10.EQUIPO13.MediFlow.Pacientes.Entity.PacienteEntity;

import G10.EQUIPO13.MediFlow.Estudios.Entity.EstudiosEntity;
import G10.EQUIPO13.MediFlow.Pacientes.Entity.PacienteRepository;
import G10.EQUIPO13.MediFlow.Pacientes.Service.PacientesDTOMapper;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.Roles;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosEntity;


import G10.EQUIPO13.MediFlow.Usuarios.Service.CurrentUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentosServiceTest {

    @Mock
    private DocumentosRepository documentosRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private DocumentosDTOMapper mapper;

    @Mock
    private AIClient aiClient;

    @Mock
    private PacienteRepository pacienteRepository;

    @Mock
    private PacientesDTOMapper pacientesMapper;

    @Mock
    private EstudiosRepository estudiosRepository;

    @Mock
    private EstudiosDTOMapper estudiosMapper;

    @InjectMocks
    private DocumentosService documentosService;

    private UsuariosEntity usuario;
    private DocumentosEntity documento;
    private DocumentosResponse response;
    private PacienteEntity pacienteEntity;
    private EstudiosEntity estudio;
    private MultipartFile archivo;
    private ResultadoTriaje resultado;

    @BeforeEach
    void setUp() {
        usuario = new UsuariosEntity();
        usuario.setId(1L);
        usuario.setNombre("Juan");
        usuario.setRol(Roles.ADMIN);

        documento = new DocumentosEntity();
        documento.setId(1L);

        response = mock(DocumentosResponse.class);

        pacienteEntity = new PacienteEntity();
        pacienteEntity.setId(1L);
        pacienteEntity.setNombre("Pedro");

        estudio = new EstudiosEntity();
        estudio.setId(1L);
        estudio.setNombre("Hemograma");

        archivo = new MockMultipartFile(
                "archivo",
                "hemograma.pdf",
                "application/pdf",
                "contenido de prueba".getBytes()
        );

        resultado = new ResultadoTriaje(
                "procesado",
                "documento-123",
                "Contenido del documento",
                new Clasificacion(
                        "laboratorio",
                        "hematologia",
                        "normal",
                        0.95,
                        false,
                        "laboratorio"
                ),
                new DatosExtraidos(
                        new Paciente("Pedro", "12345678", (short) 30),
                        new MedicoSolicitante("Dr. García", "MAT-123"),
                        "Hemograma",
                        "Control de rutina",
                        "Z00.0"
                )
        );
    }

    // =========================================
    // ANALIZE FILE
    // =========================================

    @Test
    void analizeFile_siElUsuarioNoTieneRol_deberiaLanzarExcepcion() {
        usuario.setRol(Roles.NO_ASIGNADO);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertThrows(
                AccesoDenegadoException.class,
                () -> documentosService.analizeFile(archivo)
        );

        verify(currentUserService).getCurrentUserId();

        verifyNoInteractions(
                aiClient,
                documentosRepository,
                mapper,
                pacienteRepository,
                pacientesMapper,
                estudiosRepository,
                estudiosMapper
        );
    }

    @Test
    void analizeFile_siElPacienteEstaInternado_deberiaReutilizarlo() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(aiClient.analizarDocumento(archivo))
                .thenReturn(resultado);

        when(mapper.toEntityFromAI(resultado, usuario))
                .thenReturn(documento);

        when(documentosRepository.save(documento))
                .thenReturn(documento);

        when(pacienteRepository.findByNombreAndEstado(
                "Pedro",
                Estado.INTERNADO
        )).thenReturn(Optional.of(pacienteEntity));

        when(estudiosMapper.toDomainFromAI(
                resultado,
                usuario,
                pacienteEntity
        )).thenReturn(estudio);

        when(mapper.toResponse(documento))
                .thenReturn(response);

        DocumentosResponse actual =
                documentosService.analizeFile(archivo);

        assertSame(response, actual);

        verify(documentosRepository).save(documento);

        verify(pacienteRepository).findByNombreAndEstado(
                "Pedro",
                Estado.INTERNADO
        );

        verify(pacienteRepository, never()).save(any());

        verify(pacientesMapper, never())
                .toDomainFromAI(resultado, usuario);

        verify(estudiosRepository).save(estudio);

        verify(mapper).toResponse(documento);
    }

    @Test
    void analizeFile_siElPacienteNoEstaInternado_deberiaCrearlo() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(aiClient.analizarDocumento(archivo))
                .thenReturn(resultado);

        when(mapper.toEntityFromAI(resultado, usuario))
                .thenReturn(documento);

        when(documentosRepository.save(documento))
                .thenReturn(documento);

        when(pacienteRepository.findByNombreAndEstado(
                "Pedro",
                Estado.INTERNADO
        )).thenReturn(Optional.empty());

        when(pacientesMapper.toDomainFromAI(resultado, usuario))
                .thenReturn(pacienteEntity);

        when(pacienteRepository.save(pacienteEntity))
                .thenReturn(pacienteEntity);

        when(estudiosMapper.toDomainFromAI(
                resultado,
                usuario,
                pacienteEntity
        )).thenReturn(estudio);

        when(mapper.toResponse(documento))
                .thenReturn(response);

        DocumentosResponse actual =
                documentosService.analizeFile(archivo);

        assertSame(response, actual);

        verify(pacientesMapper)
                .toDomainFromAI(resultado, usuario);

        verify(pacienteRepository).save(pacienteEntity);

        verify(estudiosMapper).toDomainFromAI(
                resultado,
                usuario,
                pacienteEntity
        );

        verify(estudiosRepository).save(estudio);
    }

    @Test
    void analizeFile_siElMapperDevuelveEstudioNull_noDeberiaGuardarlo() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(aiClient.analizarDocumento(archivo))
                .thenReturn(resultado);

        when(mapper.toEntityFromAI(resultado, usuario))
                .thenReturn(documento);

        when(documentosRepository.save(documento))
                .thenReturn(documento);

        when(pacienteRepository.findByNombreAndEstado(
                "Pedro",
                Estado.INTERNADO
        )).thenReturn(Optional.of(pacienteEntity));

        when(estudiosMapper.toDomainFromAI(
                resultado,
                usuario,
                pacienteEntity
        )).thenReturn(null);

        when(mapper.toResponse(documento))
                .thenReturn(response);

        DocumentosResponse actual =
                documentosService.analizeFile(archivo);

        assertSame(response, actual);

        verify(estudiosMapper).toDomainFromAI(
                resultado,
                usuario,
                pacienteEntity
        );

        verify(estudiosRepository, never()).save(any());
    }

    @Test
    void analizeFile_siLaIAFalla_deberiaPropagarExcepcion() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(aiClient.analizarDocumento(archivo))
                .thenThrow(new RuntimeException("Error del servicio IA"));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> documentosService.analizeFile(archivo)
        );

        assertEquals(
                "Error del servicio IA",
                exception.getMessage()
        );

        verify(aiClient).analizarDocumento(archivo);

        verifyNoInteractions(
                documentosRepository,
                mapper,
                pacienteRepository,
                pacientesMapper,
                estudiosRepository,
                estudiosMapper
        );
    }

    // =========================================
    // FIND ALL
    // =========================================

    @Test
    void findall_deberiaRetornarTodosLosDocumentos() {
        DocumentosEntity otroDocumento = new DocumentosEntity();
        otroDocumento.setId(2L);

        DocumentosResponse otraResponse =
                mock(DocumentosResponse.class);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(documentosRepository.findAll())
                .thenReturn(List.of(documento, otroDocumento));

        when(mapper.toResponse(documento))
                .thenReturn(response);

        when(mapper.toResponse(otroDocumento))
                .thenReturn(otraResponse);

        List<DocumentosResponse> actual =
                documentosService.findall();

        assertEquals(2, actual.size());
        assertSame(response, actual.get(0));
        assertSame(otraResponse, actual.get(1));

        verify(documentosRepository).findAll();
        verify(mapper).toResponse(documento);
        verify(mapper).toResponse(otroDocumento);
    }

    @Test
    void findall_siElUsuarioNoTieneRol_deberiaLanzarExcepcion() {
        usuario.setRol(Roles.NO_ASIGNADO);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertThrows(
                AccesoDenegadoException.class,
                () -> documentosService.findall()
        );

        verifyNoInteractions(documentosRepository, mapper);
    }

    // =========================================
    // FIND BY ID
    // =========================================

    @Test
    void findById_siExiste_deberiaRetornarDocumento() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(documentosRepository.findById(1L))
                .thenReturn(Optional.of(documento));

        when(mapper.toResponse(documento))
                .thenReturn(response);

        DocumentosResponse actual =
                documentosService.findById(1L);

        assertSame(response, actual);

        verify(documentosRepository).findById(1L);
        verify(mapper).toResponse(documento);
    }

    @Test
    void findById_siNoExiste_deberiaLanzarExcepcion() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(documentosRepository.findById(99L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> documentosService.findById(99L)
        );

        verify(documentosRepository).findById(99L);
        verifyNoInteractions(mapper);
    }

    @Test
    void findById_siElUsuarioNoTieneRol_deberiaLanzarExcepcion() {
        usuario.setRol(Roles.NO_ASIGNADO);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertThrows(
                AccesoDenegadoException.class,
                () -> documentosService.findById(1L)
        );

        verifyNoInteractions(documentosRepository, mapper);
    }

    // =========================================
    // DELETE BY ID
    // =========================================

    @Test
    void deleteById_siElUsuarioEsAdmin_deberiaEliminarDocumento() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertDoesNotThrow(
                () -> documentosService.deleteById(1L)
        );

        verify(documentosRepository).deleteById(1L);
    }

    @Test
    void deleteById_siElUsuarioNoEsAdmin_deberiaLanzarExcepcion() {
        usuario.setRol(Roles.NO_ASIGNADO);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertThrows(
                AccesoDenegadoException.class,
                () -> documentosService.deleteById(1L)
        );

        verify(documentosRepository, never()).deleteById(anyLong());
    }
}
