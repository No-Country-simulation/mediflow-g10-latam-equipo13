package G10.EQUIPO13.MediFlow.Estudios.Service;


import G10.EQUIPO13.MediFlow.Estudios.Entity.EstudiosEntity;
import G10.EQUIPO13.MediFlow.Estudios.Entity.EstudiosRepository;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.AccesoDenegadoException;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.ResourceNotFoundException;
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

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EstudioServiceTest {

    @Mock
    private EstudiosRepository repository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private PacienteRepository pacienteRepository;

    @Mock
    private EstudiosDTOMapper mapper;

    @InjectMocks
    private EstudioService estudioService;

    private UsuariosEntity usuario;
    private PacienteEntity paciente;
    private EstudiosEntity estudio;
    private EstudioRequest request;
    private EstudioResponse response;

    @BeforeEach
    void setUp() {
        usuario = new UsuariosEntity();
        usuario.setId(1L);
        usuario.setNombre("Juan");
        usuario.setRol(Roles.ADMIN);

        paciente = new PacienteEntity();
        paciente.setId(1L);
        paciente.setNombre("Pedro");

        estudio = new EstudiosEntity();
        estudio.setId(1L);
        estudio.setNombre("Hemograma");

        request = new EstudioRequest(
                "Hemograma",
                "Control de rutina",
                1L,
                1L
        );
        response = mock(EstudioResponse.class);
    }

    // 1. CREATE

    @Test
    void create_deberiaCrearEstudioCorrectamente() {


        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(pacienteRepository.findById(1L))
                .thenReturn(Optional.of(paciente));

        when(mapper.toDomain(request, usuario, paciente))
                .thenReturn(estudio);

        when(repository.save(estudio))
                .thenReturn(estudio);

        when(mapper.toResponse(estudio))
                .thenReturn(response);

        EstudioResponse resultado =
                estudioService.create(request);

        assertSame(response, resultado);

        verify(currentUserService).getCurrentUserId();
        verify(pacienteRepository).findById(1L);
        verify(mapper).toDomain(request, usuario, paciente);
        verify(repository).save(estudio);
        verify(mapper).toResponse(estudio);
    }

    @Test
    void create_siElRolEsNoAsignado_deberiaDenegarAcceso() {
        usuario.setRol(Roles.NO_ASIGNADO);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertThrows(
                AccesoDenegadoException.class,
                () -> estudioService.create(request)
        );

        verifyNoInteractions(pacienteRepository);
        verifyNoInteractions(repository);
        verifyNoInteractions(mapper);
    }

    @Test
    void create_siElPacienteNoExiste_deberiaLanzarExcepcion() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(pacienteRepository.findById(1L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> estudioService.create(request)
        );

        verify(pacienteRepository).findById(1L);
        verifyNoInteractions(repository);
        verifyNoInteractions(mapper);
    }

    @Test
    void create_siElRolEsNulo_deberiaDenegarAcceso() {
        usuario.setRol(null);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertThrows(
                AccesoDenegadoException.class,
                () -> estudioService.create(request)
        );

        verifyNoInteractions(pacienteRepository);
        verifyNoInteractions(repository);
        verifyNoInteractions(mapper);
    }

    // 2. UPDATE

    @Test
    void update_deberiaActualizarEstudioCorrectamente() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(repository.findById(1L))
                .thenReturn(Optional.of(estudio));

        when(repository.save(estudio))
                .thenReturn(estudio);

        when(mapper.toResponse(estudio))
                .thenReturn(response);

        EstudioResponse resultado =
                estudioService.update(request, 1L);

        assertSame(response, resultado);

        verify(repository).findById(1L);
        verify(repository).save(estudio);
        verify(mapper).toResponse(estudio);
    }

    @Test
    void update_siElRolEsAuditor_deberiaDenegarAcceso() {
        usuario.setRol(Roles.AUDITOR);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertThrows(
                AccesoDenegadoException.class,
                () -> estudioService.update(request, 1L)
        );

        verifyNoInteractions(repository);
        verifyNoInteractions(mapper);
    }

    @Test
    void update_siElRolEsNoAsignado_deberiaDenegarAcceso() {
        usuario.setRol(Roles.NO_ASIGNADO);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertThrows(
                AccesoDenegadoException.class,
                () -> estudioService.update(request, 1L)
        );

        verifyNoInteractions(repository);
        verifyNoInteractions(mapper);
    }

    @Test
    void update_siElEstudioNoExiste_deberiaLanzarExcepcion() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(repository.findById(99L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> estudioService.update(request, 99L)
        );

        verify(repository).findById(99L);
        verify(repository, never()).save(any());
        verifyNoInteractions(mapper);
    }

    @Test
    void update_siElRolEsNulo_deberiaDenegarAcceso() {
        usuario.setRol(null);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertThrows(
                AccesoDenegadoException.class,
                () -> estudioService.update(request, 1L)
        );

        verifyNoInteractions(repository);
        verifyNoInteractions(mapper);
    }

    // 3. FIND ALL

    @Test
    void findall_deberiaDevolverTodosLosEstudios() {
        EstudiosEntity segundoEstudio = new EstudiosEntity();
        segundoEstudio.setId(2L);

        EstudioResponse segundaResponse =
                mock(EstudioResponse.class);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(repository.findAll())
                .thenReturn(List.of(estudio, segundoEstudio));

        when(mapper.toResponse(estudio))
                .thenReturn(response);

        when(mapper.toResponse(segundoEstudio))
                .thenReturn(segundaResponse);

        List<EstudioResponse> resultado =
                estudioService.findall();

        assertEquals(2, resultado.size());
        assertSame(response, resultado.get(0));
        assertSame(segundaResponse, resultado.get(1));

        verify(repository).findAll();
        verify(mapper).toResponse(estudio);
        verify(mapper).toResponse(segundoEstudio);
    }

    @Test
    void findall_siNoHayEstudios_deberiaDevolverListaVacia() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(repository.findAll())
                .thenReturn(List.of());

        List<EstudioResponse> resultado =
                estudioService.findall();

        assertNotNull(resultado);
        assertTrue(resultado.isEmpty());

        verify(repository).findAll();
        verifyNoInteractions(mapper);
    }

    @Test
    void findall_siElRolEsNoAsignado_deberiaDenegarAcceso() {
        usuario.setRol(Roles.NO_ASIGNADO);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertThrows(
                AccesoDenegadoException.class,
                () -> estudioService.findall()
        );

        verifyNoInteractions(repository);
        verifyNoInteractions(mapper);
    }

    // 4. FIND BY ID

    @Test
    void findById_siExiste_deberiaDevolverElEstudio() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(repository.findById(1L))
                .thenReturn(Optional.of(estudio));

        when(mapper.toResponse(estudio))
                .thenReturn(response);

        EstudioResponse resultado =
                estudioService.FindById(1L);

        assertSame(response, resultado);

        verify(repository).findById(1L);
        verify(mapper).toResponse(estudio);
    }

    @Test
    void findById_siNoExiste_deberiaLanzarExcepcion() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(repository.findById(99L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> estudioService.FindById(99L)
        );

        verify(repository).findById(99L);
        verifyNoInteractions(mapper);
    }

    @Test
    void findById_siElRolEsNoAsignado_deberiaDenegarAcceso() {
        usuario.setRol(Roles.NO_ASIGNADO);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertThrows(
                AccesoDenegadoException.class,
                () -> estudioService.FindById(1L)
        );

        verifyNoInteractions(repository);
        verifyNoInteractions(mapper);
    }

    // 5. FIND BY ID MEDICO

    @Test
    void findByIdMedico_deberiaDevolverEstudiosDelMedico() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(repository.findAllByMedicoId(1L))
                .thenReturn(List.of(estudio));

        when(mapper.toResponse(estudio))
                .thenReturn(response);

        List<EstudioResponse> resultado =
                estudioService.findByIdMedico(1L);

        assertEquals(1, resultado.size());
        assertSame(response, resultado.get(0));

        verify(repository).findAllByMedicoId(1L);
        verify(mapper).toResponse(estudio);
    }

    @Test
    void findByIdMedico_siNoHayResultados_deberiaDevolverListaVacia() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(repository.findAllByMedicoId(99L))
                .thenReturn(List.of());

        List<EstudioResponse> resultado =
                estudioService.findByIdMedico(99L);

        assertTrue(resultado.isEmpty());

        verify(repository).findAllByMedicoId(99L);
        verifyNoInteractions(mapper);
    }

    // 6. FIND BY NOMBRE MEDICO

    @Test
    void findByNombreMedico_deberiaDevolverEstudios() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(repository.findAllByMedicoNombre("Juan"))
                .thenReturn(List.of(estudio));

        when(mapper.toResponse(estudio))
                .thenReturn(response);

        List<EstudioResponse> resultado =
                estudioService.findByNombreMedico("Juan");

        assertEquals(1, resultado.size());
        assertSame(response, resultado.get(0));

        verify(repository).findAllByMedicoNombre("Juan");
        verify(mapper).toResponse(estudio);
    }

    @Test
    void findByNombreMedico_siNoHayResultados_deberiaDevolverListaVacia() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(repository.findAllByMedicoNombre("Desconocido"))
                .thenReturn(List.of());

        List<EstudioResponse> resultado =
                estudioService.findByNombreMedico("Desconocido");

        assertTrue(resultado.isEmpty());

        verify(repository).findAllByMedicoNombre("Desconocido");
        verifyNoInteractions(mapper);
    }

    // 7. FIND BY ID PACIENTE

    @Test
    void findByIdPaciente_deberiaDevolverEstudiosDelPaciente() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(repository.findAllByPacienteId(1L))
                .thenReturn(List.of(estudio));

        when(mapper.toResponse(estudio))
                .thenReturn(response);

        List<EstudioResponse> resultado =
                estudioService.findByIdPaciente(1L);

        assertEquals(1, resultado.size());
        assertSame(response, resultado.get(0));

        verify(repository).findAllByPacienteId(1L);
        verify(mapper).toResponse(estudio);
    }

    @Test
    void findByIdPaciente_siNoHayResultados_deberiaDevolverListaVacia() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(repository.findAllByPacienteId(99L))
                .thenReturn(List.of());

        List<EstudioResponse> resultado =
                estudioService.findByIdPaciente(99L);

        assertTrue(resultado.isEmpty());

        verify(repository).findAllByPacienteId(99L);
        verifyNoInteractions(mapper);
    }

    // 8. FIND BY NOMBRE PACIENTE

    @Test
    void findByNombrePaciente_deberiaDevolverEstudios() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(repository.findAllByPacienteNombre("Pedro"))
                .thenReturn(List.of(estudio));

        when(mapper.toResponse(estudio))
                .thenReturn(response);

        List<EstudioResponse> resultado =
                estudioService.findByNombrePaciente("Pedro");

        assertEquals(1, resultado.size());
        assertSame(response, resultado.get(0));

        verify(repository).findAllByPacienteNombre("Pedro");
        verify(mapper).toResponse(estudio);
    }

    @Test
    void findByNombrePaciente_siNoHayResultados_deberiaDevolverListaVacia() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        when(repository.findAllByPacienteNombre("Desconocido"))
                .thenReturn(List.of());

        List<EstudioResponse> resultado =
                estudioService.findByNombrePaciente("Desconocido");

        assertTrue(resultado.isEmpty());

        verify(repository).findAllByPacienteNombre("Desconocido");
        verifyNoInteractions(mapper);
    }

    // 9. DELETE

    @Test
    void delete_siEsAdmin_deberiaEliminarElEstudio() {
        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertDoesNotThrow(
                () -> estudioService.Delete(1L)
        );

        verify(currentUserService).getCurrentUserId();
        verify(repository).deleteById(1L);
        verifyNoInteractions(mapper);
    }

    @Test
    void delete_siNoEsAdmin_deberiaDenegarAcceso() {
        usuario.setRol(Roles.AUDITOR);

        when(currentUserService.getCurrentUserId())
                .thenReturn(usuario);

        assertThrows(
                AccesoDenegadoException.class,
                () -> estudioService.Delete(1L)
        );

        verify(repository, never()).deleteById(anyLong());
        verifyNoInteractions(mapper);
    }
}
