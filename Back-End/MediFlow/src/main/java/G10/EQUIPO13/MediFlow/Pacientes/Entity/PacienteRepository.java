package G10.EQUIPO13.MediFlow.Pacientes.Entity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PacienteRepository extends JpaRepository<PacienteEntity, Long> {


    Optional<PacienteEntity> findById(Long id);

    Optional<PacienteEntity> findByNombre(String nombre);

    Optional<PacienteEntity> findByRutAndEstado(String rut, Estado estado);

    Optional<PacienteEntity> findByNombreAndEstado(String nombre, Estado estado);

    // Variantes que toleran registros duplicados (devuelven el primero en vez de fallar).
    Optional<PacienteEntity> findFirstByRutAndEstado(String rut, Estado estado);

    Optional<PacienteEntity> findFirstByNombreAndEstado(String nombre, Estado estado);


}
