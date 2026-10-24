package G10.EQUIPO13.MediFlow.Documentos.Entity;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface DocumentosRepository extends JpaRepository<DocumentosEntity, Long> {

    /** Historial completo, del más reciente al más antiguo (con el usuario en la misma consulta). */
    @EntityGraph(attributePaths = "usuario")
    List<DocumentosEntity> findAllByOrderByFechaRegistroDesc();

    /** Documentos urgentes recientes, para las alertas en tiempo real. */
    List<DocumentosEntity> findTop20ByPrioridadAndFechaRegistroAfterOrderByFechaRegistroDesc(String prioridad, LocalDateTime desde);
}
