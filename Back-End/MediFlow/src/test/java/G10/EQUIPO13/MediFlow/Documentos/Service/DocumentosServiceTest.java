
package G10.EQUIPO13.MediFlow.Documentos.Service;

import G10.EQUIPO13.MediFlow.AiClient.AIClient;
import G10.EQUIPO13.MediFlow.AiClient.DTOs.ResultadoTriaje;
import G10.EQUIPO13.MediFlow.AiClient.DTOs.DatosExtraidos;
import G10.EQUIPO13.MediFlow.AiClient.DTOs.Clasificacion;
import G10.EQUIPO13.MediFlow.AiClient.DTOs.Paciente;
import G10.EQUIPO13.MediFlow.AiClient.DTOs.MedicoSolicitante;
import G10.EQUIPO13.MediFlow.Documentos.Entity.DocumentosEntity;
import G10.EQUIPO13.MediFlow.Documentos.Entity.DocumentosRepository;
import G10.EQUIPO13.MediFlow.Estudios.Entity.EstudiosEntity;
import G10.EQUIPO13.MediFlow.Estudios.Entity.EstudiosRepository;
import G10.EQUIPO13.MediFlow.Estudios.Service.EstudiosDTOMapper;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.AccesoDenegadoException;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.ReglaNegocioException;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
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

    private UsuariosEntity usuarioSinRol;

    @BeforeEach
    void setUp() {
        usuarioSinRol = new UsuariosEntity();
        usuarioSinRol.setRol(Roles.NO_ASIGNADO);
    }

    @Test
    void analizeFile_debeRechazarUsuarioSinRol() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuarioSinRol);

        assertThrows(
                AccesoDenegadoException.class,
                () -> documentosService.analizeFile(archivoPrueba())
        );

        verifyNoInteractions(aiClient);
        verifyNoInteractions(documentosRepository);
        verifyNoInteractions(pacienteRepository);
        verifyNoInteractions(estudiosRepository);
    }

    @Test
    void analizeFile_debeReutilizarPacienteInternadoExistente() {
        UsuariosEntity usuario = usuarioAutorizado();

        Paciente pacienteDTO = new Paciente(
                "Paciente de prueba", "TEST-001", (short) 30
        );

        MedicoSolicitante medicoDTO = new MedicoSolicitante(
                "Medico de prueba", "MAT-001"
        );

        DatosExtraidos datos = new DatosExtraidos(
                pacienteDTO,
                medicoDTO,
                "Estudio de prueba",
                "Diagnostico de prueba",
                "A00"
        );

        ResultadoTriaje resultado = new ResultadoTriaje(
                "procesado",
                "doc-test-001",
                "Contenido de prueba",
                clasificacionValida(),
                datos
        );

        PacienteEntity pacienteExistente = new PacienteEntity();
        pacienteExistente.setId(10L);
        pacienteExistente.setNombre("Paciente de prueba");
        pacienteExistente.setEstado(Estado.INTERNADO);

        DocumentosEntity documentoGuardado = new DocumentosEntity();
        documentoGuardado.setId(20L);

        EstudiosEntity estudio = new EstudiosEntity();
        estudio.setPaciente(pacienteExistente);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);
        when(aiClient.analizarDocumento(any()))
                .thenReturn(resultado);
        when(mapper.toEntityFromAI(resultado, usuario))
                .thenReturn(documentoGuardado);
        when(documentosRepository.save(documentoGuardado))
                .thenReturn(documentoGuardado);
        when(pacienteRepository.findByNombreAndEstado(
                "Paciente de prueba", Estado.INTERNADO
        )).thenReturn(Optional.of(pacienteExistente));
        when(estudiosMapper.toDomainFromAI(
                resultado, usuario, pacienteExistente
        )).thenReturn(estudio);
        when(mapper.toResponse(documentoGuardado))
                .thenReturn(documentoGuardado);

        DocumentosEntity resultadoServicio =
                documentosService.analizeFile(archivoPrueba());

        verify(pacienteRepository, never())
                .save(any(PacienteEntity.class));
        verify(estudiosMapper)
                .toDomainFromAI(resultado, usuario, pacienteExistente);
        verify(estudiosRepository).save(estudio);

        assertSame(documentoGuardado, resultadoServicio);
    }

    @Test
    void analizeFile_debeRechazarResultadoNulo() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuarioAutorizado());
        when(aiClient.analizarDocumento(any()))
                .thenReturn(null);

        assertThrows(
                ReglaNegocioException.class,
                () -> documentosService.analizeFile(archivoPrueba())
        );

        verificarQueNoSeGuardoNada();
    }

    @Test
    void analizeFile_debeRechazarDatosExtraidosNulos() {
        ResultadoTriaje resultado = new ResultadoTriaje(
                "procesado",
                "doc-test-002",
                "Contenido de prueba",
                clasificacionValida(),
                null
        );

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuarioAutorizado());
        when(aiClient.analizarDocumento(any()))
                .thenReturn(resultado);

        assertThrows(
                ReglaNegocioException.class,
                () -> documentosService.analizeFile(archivoPrueba())
        );

        verificarQueNoSeGuardoNada();
    }

    @Test
    void analizeFile_debeRechazarPacienteNulo() {
        DatosExtraidos datos = new DatosExtraidos(
                null,
                new MedicoSolicitante("Medico de prueba", "MAT-001"),
                "Estudio de prueba",
                "Diagnostico de prueba",
                "A00"
        );

        ResultadoTriaje resultado = new ResultadoTriaje(
                "procesado",
                "doc-test-003",
                "Contenido de prueba",
                clasificacionValida(),
                datos
        );

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuarioAutorizado());
        when(aiClient.analizarDocumento(any()))
                .thenReturn(resultado);

        assertThrows(
                ReglaNegocioException.class,
                () -> documentosService.analizeFile(archivoPrueba())
        );

        verificarQueNoSeGuardoNada();
    }

    @Test
    void analizeFile_debeRechazarNombreDePacienteVacio() {
        DatosExtraidos datos = new DatosExtraidos(
                new Paciente("", "TEST-004", (short) 30),
                new MedicoSolicitante("Medico de prueba", "MAT-001"),
                "Estudio de prueba",
                "Diagnostico de prueba",
                "A00"
        );

        ResultadoTriaje resultado = new ResultadoTriaje(
                "procesado",
                "doc-test-004",
                "Contenido de prueba",
                clasificacionValida(),
                datos
        );

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuarioAutorizado());
        when(aiClient.analizarDocumento(any()))
                .thenReturn(resultado);

        assertThrows(
                ReglaNegocioException.class,
                () -> documentosService.analizeFile(archivoPrueba())
        );

        verificarQueNoSeGuardoNada();
    }

    private UsuariosEntity usuarioAutorizado() {
        UsuariosEntity usuario = new UsuariosEntity();
        usuario.setId(1L);
        usuario.setRol(Roles.PERSONAL);
        return usuario;
    }

    private MockMultipartFile archivoPrueba() {
        return new MockMultipartFile(
                "archivo",
                "prueba.pdf",
                "application/pdf",
                "contenido ficticio".getBytes()
        );
    }

    private Clasificacion clasificacionValida() {
        return new Clasificacion(
                "Receta",
                "General",
                "Baja",
                0.95,
                false,
                "Rutina"
        );
    }

    private void verificarQueNoSeGuardoNada() {
        verifyNoInteractions(
                mapper,
                documentosRepository,
                pacienteRepository,
                pacientesMapper,
                estudiosMapper,
                estudiosRepository
        );
    }
}
