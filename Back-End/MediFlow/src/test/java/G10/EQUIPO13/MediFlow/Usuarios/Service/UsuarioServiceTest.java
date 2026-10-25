package G10.EQUIPO13.MediFlow.Usuarios.Service;


import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.ConflictoException;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.ResourceNotFoundException;
import G10.EQUIPO13.MediFlow.Usuarios.Controller.UsuarioRegister;
import G10.EQUIPO13.MediFlow.Usuarios.Controller.UsuarioResponse;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.Roles;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosEntity;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuariosServiceTest {

    @Mock
    private UsuariosRepository repository;

    @Mock
    private UsuarioMapperDTO mapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UsuariosService service;

    private UsuariosEntity usuario;
    private UsuarioResponse usuarioResponse;

    @BeforeEach
    void setUp() {
        usuario = new UsuariosEntity();
        usuario.setId(1L);
        usuario.setNombre("Juan");
        usuario.setPassword("123456");
        usuario.setRol(Roles.PERSONAL);

        // Evitamos depender del constructor del DTO.
        usuarioResponse = mock(UsuarioResponse.class);
    }

    // 1. REGISTRAR USUARIO

    @Test
    void register_deberiaRegistrarUsuarioYCodificarPassword() {
        UsuarioRegister registro = mock(UsuarioRegister.class);

        when(mapper.ToEntityRegister(registro))
                .thenReturn(usuario);

        when(passwordEncoder.encode("123456"))
                .thenReturn("password-encriptada");

        when(repository.save(usuario))
                .thenReturn(usuario);

        when(mapper.ToDTO(usuario))
                .thenReturn(usuarioResponse);

        ResponseEntity<UsuarioResponse> resultado =
                service.register(registro);

        assertEquals(HttpStatus.OK, resultado.getStatusCode());
        assertSame(usuarioResponse, resultado.getBody());

        assertEquals("password-encriptada", usuario.getPassword());

        verify(mapper).ToEntityRegister(registro);
        verify(passwordEncoder).encode("123456");
        verify(repository).save(usuario);
        verify(mapper).ToDTO(usuario);
    }

    // 2. LISTAR TODOS LOS USUARIOS

    @Test
    void listAll_deberiaDevolverTodosLosUsuarios() {
        UsuariosEntity segundoUsuario = new UsuariosEntity();
        segundoUsuario.setId(2L);
        segundoUsuario.setNombre("Maria");
        segundoUsuario.setPassword("otra-password");
        segundoUsuario.setRol(Roles.ADMIN);

        UsuarioResponse segundaRespuesta =
                mock(UsuarioResponse.class);

        when(repository.findAll())
                .thenReturn(List.of(usuario, segundoUsuario));

        when(mapper.ToDTO(usuario))
                .thenReturn(usuarioResponse);

        when(mapper.ToDTO(segundoUsuario))
                .thenReturn(segundaRespuesta);

        List<UsuarioResponse> resultado = service.listAll();

        assertEquals(2, resultado.size());
        assertSame(usuarioResponse, resultado.get(0));
        assertSame(segundaRespuesta, resultado.get(1));

        verify(repository).findAll();
        verify(mapper).ToDTO(usuario);
        verify(mapper).ToDTO(segundoUsuario);
    }

    @Test
    void listAll_siNoHayUsuarios_deberiaDevolverListaVacia() {
        when(repository.findAll()).thenReturn(List.of());

        List<UsuarioResponse> resultado = service.listAll();

        assertNotNull(resultado);
        assertTrue(resultado.isEmpty());

        verify(repository).findAll();
        verifyNoInteractions(mapper);
    }

    // 3. BUSCAR POR ID

    @Test
    void findById_siExiste_deberiaDevolverElUsuario() {
        when(repository.findById(1L))
                .thenReturn(Optional.of(usuario));

        when(mapper.ToDTO(usuario))
                .thenReturn(usuarioResponse);

        UsuarioResponse resultado = service.findById(1L);

        assertSame(usuarioResponse, resultado);

        verify(repository).findById(1L);
        verify(mapper).ToDTO(usuario);
    }

    // 4. BUSCAR POR NOMBRE

    @Test
    void findByName_siExiste_deberiaDevolverElUsuario() {
        when(repository.findByNombre("Juan"))
                .thenReturn(Optional.of(usuario));

        when(mapper.ToDTO(usuario))
                .thenReturn(usuarioResponse);

        UsuarioResponse resultado = service.findByName("Juan");

        assertSame(usuarioResponse, resultado);

        verify(repository).findByNombre("Juan");
        verify(mapper).ToDTO(usuario);
    }

    // 5. BUSCAR TODOS POR ROL

    @Test
    void findAllByRol_deberiaDevolverUsuariosDelRolSolicitado() {
        when(repository.findAllByRol(Roles.PERSONAL))
                .thenReturn(List.of(usuario));

        when(mapper.ToDTO(usuario))
                .thenReturn(usuarioResponse);

        List<UsuarioResponse> resultado =
                service.findAllByRol(Roles.PERSONAL);

        assertEquals(1, resultado.size());
        assertSame(usuarioResponse, resultado.get(0));

        verify(repository).findAllByRol(Roles.PERSONAL);
        verify(mapper).ToDTO(usuario);
    }

    @Test
    void findAllByRol_siNoHayCoincidencias_deberiaDevolverListaVacia() {
        when(repository.findAllByRol(Roles.ADMIN))
                .thenReturn(List.of());

        List<UsuarioResponse> resultado =
                service.findAllByRol(Roles.ADMIN);

        assertNotNull(resultado);
        assertTrue(resultado.isEmpty());

        verify(repository).findAllByRol(Roles.ADMIN);
        verifyNoInteractions(mapper);
    }

    // 6. ELIMINAR POR ID

    @Test
    void deleteById_deberiaSolicitarLaEliminacion() {
        when(repository.findById(1L))
                .thenReturn(Optional.of(usuario));

        assertDoesNotThrow(() -> service.deleteById(1L));

        verify(repository).delete(usuario);
    }

    @Test
    void deleteById_siNoExiste_deberiaLanzarNoEncontrado() {
        when(repository.findById(99L))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.deleteById(99L));

        verify(repository, never()).delete(any());
    }

    @Test
    void roleChange_siNoExiste_deberiaLanzarNoEncontrado() {
        when(repository.findById(99L))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.roleChange(99L, Roles.ADMIN));
    }

    @Test
    void register_siElNombreYaExiste_deberiaLanzarConflicto() {
        when(repository.findByNombre("Juan"))
                .thenReturn(Optional.of(usuario));

        assertThrows(ConflictoException.class,
                () -> service.register(new UsuarioRegister("Juan", "clave-segura")));

        verify(repository, never()).save(any());
    }

    // 7. CAMBIAR ROL

    @Test
    void roleChange_deberiaActualizarElRolYDevolverElUsuario() {
        when(repository.findById(1L))
                .thenReturn(Optional.of(usuario));

        when(repository.save(usuario))
                .thenReturn(usuario);

        when(mapper.ToDTO(usuario))
                .thenReturn(usuarioResponse);

        ResponseEntity<UsuarioResponse> resultado =
                service.roleChange(1L, Roles.ADMIN);

        assertEquals(HttpStatus.OK, resultado.getStatusCode());
        assertSame(usuarioResponse, resultado.getBody());
        assertEquals(Roles.ADMIN, usuario.getRol());

        verify(repository).findById(1L);
        verify(repository).save(usuario);
        verify(mapper).ToDTO(usuario);
    }
}
