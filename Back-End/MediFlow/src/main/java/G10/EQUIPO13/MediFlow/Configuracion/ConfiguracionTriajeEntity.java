package G10.EQUIPO13.MediFlow.Configuracion;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Reglas de triaje editables (una sola fila, id = 1). Términos y destinos se guardan en JSON. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "configuracion_triaje")
public class ConfiguracionTriajeEntity {

    public static final long ID_UNICO = 1L;

    @Id
    private Long id;

    @Column(precision = 4, scale = 3, nullable = false)
    private BigDecimal umbral;

    @Column(name = "terminos_urgencia", columnDefinition = "TEXT")
    private String terminosUrgencia;

    @Column(columnDefinition = "TEXT")
    private String destinos;

    @Column(name = "actualizado_por")
    private String actualizadoPor;

    @Column(name = "fecha_actualizacion", insertable = false, updatable = false)
    private LocalDateTime fechaActualizacion;
}
