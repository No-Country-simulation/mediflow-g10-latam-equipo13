package G10.EQUIPO13.MediFlow.Estudios.Entity;

import G10.EQUIPO13.MediFlow.Pacientes.Entity.PacienteEntity;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EstudiosRepository extends JpaRepository<EstudiosEntity,Long> {

    Optional<EstudiosEntity> findById(Long id);

    List<EstudiosEntity> findByPaciente(PacienteEntity paciente);

    List<EstudiosEntity> findAllByMedicoId(Long medicoId);

    List<EstudiosEntity> findAllByMedicoNombre(String nombre);

    List<EstudiosEntity> findAllByPacienteId(Long pacienteId);

    List<EstudiosEntity> findAllByPacienteNombre(String nombre);



}
