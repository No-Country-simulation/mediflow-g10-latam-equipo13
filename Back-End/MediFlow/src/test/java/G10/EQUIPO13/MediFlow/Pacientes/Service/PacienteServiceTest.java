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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PacienteServiceTest {

    @Mock
    private PacienteRepository pacienteRepository;

    @Mock
    private PacientesDTOMapper mapper;

    @Mock
    private CurrentUserService currentUserService;

    @InjectMocks
    private PacienteService pacienteService;

    private UsuariosEntity usuario;
    private PacienteEntity paciente;
    private PacienteRequest request;
    private PacienteResponse response;

    @BeforeEach
    void setUp() {
        usuario = new UsuariosEntity();
        usuario.setId(1L);
        usuario.setNombre("Juan");
        usuario.setRol(Roles.ADMIN);

        paciente = new PacienteEntity();
        paciente.setId(1L);
        paciente.setNombre("Pedro");
        paciente.setFechaRegistro(LocalDateTime.now());

        request = mock(PacienteRequest.class);
        response = mock(PacienteResponse.class);
    }

    // 1. CREATE

    @Test
    void create_deberiaCrearPacienteCorrectamente() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(mapper.toDomainFromDTO(request, usuario))
                .thenReturn(paciente);

        when(pacienteRepository.save(paciente))
                .thenReturn(paciente);

        when(mapper.toResponse(paciente))
                .thenReturn(response);

        PacienteResponse resultado =
                pacienteService.create(request);

        assertSame(response, resultado);
        assertNotNull(paciente.getFechaRegistro());

        verify(currentUserService).getCurrentUserId();
        verify(mapper).toDomainFromDTO(request, usuario);
        verify(pacienteRepository).save(paciente);
        verify(mapper).toResponse(paciente);
    }

    @Test
    void create_siElUsuarioEsAuditor_deberiaLanzarAccesoDenegado() {
        usuario.setRol(Roles.AUDITOR);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        AccesoDenegadoException exception =
                assertThrows(
                        AccesoDenegadoException.class,
                        () -> pacienteService.create(request)
                );

        assertTrue(exception.getMessage().contains("AUDITOR"));

        verify(currentUserService).getCurrentUserId();
        verifyNoInteractions(mapper);
        verifyNoInteractions(pacienteRepository);
    }

    @Test
    void create_siElUsuarioNoEstaAsignado_deberiaDenegarAcceso() {
        usuario.setRol(Roles.NO_ASIGNADO);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertThrows(
                AccesoDenegadoException.class,
                () -> pacienteService.create(request)
        );

        verifyNoInteractions(mapper);
        verifyNoInteractions(pacienteRepository);
    }

    // 2. UPDATE

    @Test
    void update_deberiaActualizarPacienteCorrectamente() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(pacienteRepository.findById(1L))
                .thenReturn(Optional.of(paciente));

        when(pacienteRepository.save(paciente))
                .thenReturn(paciente);

        when(mapper.toResponse(paciente))
                .thenReturn(response);

        PacienteResponse resultado =
                pacienteService.update(request, 1L);

        assertSame(response, resultado);
        assertNotNull(paciente.getFechaActualizacion());

        verify(currentUserService).getCurrentUserId();
        verify(pacienteRepository).findById(1L);
        verify(pacienteRepository).save(paciente);
        verify(mapper).toResponse(paciente);
    }

    @Test
    void update_siElPacienteNoExiste_deberiaLanzarExcepcion() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(pacienteRepository.findById(99L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> pacienteService.update(request, 99L)
        );

        verify(pacienteRepository).findById(99L);
        verify(pacienteRepository, never()).save(any());
        verifyNoInteractions(mapper);
    }

    @Test
    void update_siElUsuarioEsAuditor_deberiaDenegarAcceso() {
        usuario.setRol(Roles.AUDITOR);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertThrows(
                AccesoDenegadoException.class,
                () -> pacienteService.update(request, 1L)
        );

        verifyNoInteractions(mapper);
        verifyNoInteractions(pacienteRepository);
    }

    @Test
    void update_siElUsuarioNoEstaAsignado_deberiaDenegarAcceso() {
        usuario.setRol(Roles.NO_ASIGNADO);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertThrows(
                AccesoDenegadoException.class,
                () -> pacienteService.update(request, 1L)
        );

        verifyNoInteractions(mapper);
        verifyNoInteractions(pacienteRepository);
    }

    // 3. FIND ALL

    @Test
    void findAll_deberiaDevolverTodosLosPacientes() {
        PacienteEntity segundoPaciente = new PacienteEntity();
        segundoPaciente.setId(2L);

        PacienteResponse segundaResponse =
                mock(PacienteResponse.class);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(pacienteRepository.findAll())
                .thenReturn(List.of(paciente, segundoPaciente));

        when(mapper.toResponse(paciente))
                .thenReturn(response);

        when(mapper.toResponse(segundoPaciente))
                .thenReturn(segundaResponse);

        List<PacienteResponse> resultado =
                pacienteService.findAll();

        assertEquals(2, resultado.size());
        assertSame(response, resultado.get(0));
        assertSame(segundaResponse, resultado.get(1));

        verify(pacienteRepository).findAll();
        verify(mapper).toResponse(paciente);
        verify(mapper).toResponse(segundoPaciente);
    }

    @Test
    void findAll_siNoHayPacientes_deberiaDevolverListaVacia() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(pacienteRepository.findAll())
                .thenReturn(List.of());

        List<PacienteResponse> resultado =
                pacienteService.findAll();

        assertNotNull(resultado);
        assertTrue(resultado.isEmpty());

        verify(pacienteRepository).findAll();
        verifyNoInteractions(mapper);
    }

    @Test
    void findAll_siElUsuarioNoEstaAsignado_deberiaDenegarAcceso() {
        usuario.setRol(Roles.NO_ASIGNADO);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertThrows(
                AccesoDenegadoException.class,
                () -> pacienteService.findAll()
        );

        verifyNoInteractions(mapper);
        verifyNoInteractions(pacienteRepository);
    }

    // 4. FIND BY ID

    @Test
    void findById_siExiste_deberiaDevolverElPaciente() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(pacienteRepository.findById(1L))
                .thenReturn(Optional.of(paciente));

        when(mapper.toResponse(paciente))
                .thenReturn(response);

        PacienteResponse resultado =
                pacienteService.findById(1L);

        assertSame(response, resultado);

        verify(pacienteRepository).findById(1L);
        verify(mapper).toResponse(paciente);
    }

    @Test
    void findById_siNoExiste_deberiaLanzarExcepcion() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(pacienteRepository.findById(99L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> pacienteService.findById(99L)
        );

        verify(pacienteRepository).findById(99L);
        verifyNoInteractions(mapper);
    }

    @Test
    void findById_siElUsuarioNoEstaAsignado_deberiaDenegarAcceso() {
        usuario.setRol(Roles.NO_ASIGNADO);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertThrows(
                AccesoDenegadoException.class,
                () -> pacienteService.findById(1L)
        );

        verifyNoInteractions(mapper);
        verifyNoInteractions(pacienteRepository);
    }

    // 5. DELETE BY ID

    @Test
    void deleteById_siEsAdmin_deberiaEliminarElPaciente() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertDoesNotThrow(
                () -> pacienteService.deleteById(1L)
        );

        verify(currentUserService).getCurrentUserId();
        verify(pacienteRepository).deleteById(1L);
        verifyNoInteractions(mapper);
    }

    @Test
    void deleteById_siNoEsAdmin_deberiaDenegarAcceso() {
        usuario.setRol(Roles.PERSONAL);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertThrows(
                AccesoDenegadoException.class,
                () -> pacienteService.deleteById(1L)
        );

        verify(currentUserService).getCurrentUserId();
        verify(pacienteRepository, never()).deleteById(anyLong());
        verifyNoInteractions(mapper);
    }
}
