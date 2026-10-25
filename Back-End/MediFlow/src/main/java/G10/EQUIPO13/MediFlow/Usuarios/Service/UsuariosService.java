package G10.EQUIPO13.MediFlow.Usuarios.Service;

import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.ConflictoException;
import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.ResourceNotFoundException;
import G10.EQUIPO13.MediFlow.Usuarios.Controller.UsuarioRegister;
import G10.EQUIPO13.MediFlow.Usuarios.Controller.UsuarioResponse;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.Roles;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosEntity;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@AllArgsConstructor
@Service
public class UsuariosService {

    private final UsuariosRepository repository;
    private final UsuarioMapperDTO mapper;
    private final PasswordEncoder passwordEncoder;


    /** Las cuentas nuevas quedan como NO_ASIGNADO hasta que un administrador les dé un rol. */
    @Transactional
    public ResponseEntity<UsuarioResponse> register(UsuarioRegister reg) {
        // Nombres duplicados rompen el login (findByNombre devolvería dos filas).
        String nombre = reg.name() != null ? reg.name().strip() : null;
        if (nombre != null && repository.findByNombre(nombre).isPresent()) {
            throw new ConflictoException("Ya existe un usuario con el nombre " + nombre);
        }
        UsuariosEntity entity = mapper.ToEntityRegister(reg);
        if (nombre != null) {
            entity.setNombre(nombre);
        }
        entity.setPassword(passwordEncoder.encode(entity.getPassword()));
        UsuariosEntity response = repository.save(entity);
        return ResponseEntity.ok(mapper.ToDTO(response));
    }

    public List<UsuarioResponse> listAll(){
        return repository.findAll()
                .stream()
                .map(mapper::ToDTO)
                .toList();
    }

    public UsuarioResponse findById(Long id){
       return mapper.ToDTO(buscar(id));
    }

    public UsuarioResponse findByName(String name){
        UsuariosEntity entity = repository.findByNombre(name)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el usuario " + name));
        return mapper.ToDTO(entity);
    }

    public List<UsuarioResponse> findAllByRol(Roles rol){
        List<UsuariosEntity> entities= repository.findAllByRol(rol);
        return entities
                .stream()
                .map(mapper::ToDTO)
                .toList();
    }

    /** Si el usuario tiene documentos asociados, la base lo impide y se responde 409. */
    @Transactional
    public void  deleteById(Long id){repository.delete(buscar(id));}

    @Transactional
    public ResponseEntity<UsuarioResponse> roleChange(Long id, Roles rol) {
        UsuariosEntity entity = buscar(id);
        entity.setRol(rol);
        UsuariosEntity response = repository.save(entity);
        return ResponseEntity.ok(mapper.ToDTO(response));
    }

    private UsuariosEntity buscar(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el usuario con id " + id));
    }
}
