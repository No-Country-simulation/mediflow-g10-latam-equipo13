package G10.EQUIPO13.MediFlow.Pacientes.Entity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PacienteRepository extends JpaRepository<PacienteEntity, Long> {


    Optional<PacienteEntity> findById(Long id);

    Optional<PacienteEntity> findByNombre(String nombre);



}
