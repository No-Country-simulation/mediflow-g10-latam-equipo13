package G10.EQUIPO13.MediFlow.Usuarios.Service;

import G10.EQUIPO13.MediFlow.Usuarios.Entity.Roles;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosEntity;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Crea el primer administrador al arrancar, si se definen MEDIFLOW_ADMIN_USER y MEDIFLOW_ADMIN_PASSWORD.
 * Evita tener que asignar el rol ADMIN por SQL en una instalación nueva. Si el usuario ya existe, no lo toca.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdministradorInicial implements ApplicationRunner {

    private final UsuariosRepository repository;
    private final PasswordEncoder passwordEncoder;

    @Value("${mediflow.admin.usuario:}")
    private String usuario;

    @Value("${mediflow.admin.password:}")
    private String password;

    @Override
    public void run(ApplicationArguments args) {
        if (usuario == null || usuario.isBlank() || password == null || password.isBlank()) {
            return;
        }
        if (password.length() < 8) {
            log.warn("MEDIFLOW_ADMIN_PASSWORD debe tener al menos 8 caracteres: no se creó el administrador inicial");
            return;
        }
        if (repository.findByNombre(usuario.strip()).isPresent()) {
            return;
        }
        UsuariosEntity admin = new UsuariosEntity();
        admin.setNombre(usuario.strip());
        admin.setPassword(passwordEncoder.encode(password));
        admin.setRol(Roles.ADMIN);
        admin.setActivo(true);
        repository.save(admin);
        log.info("Administrador inicial creado: {}", admin.getNombre());
    }
}
