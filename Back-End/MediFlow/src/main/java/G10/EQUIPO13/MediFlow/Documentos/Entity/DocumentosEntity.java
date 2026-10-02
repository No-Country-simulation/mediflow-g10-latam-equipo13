package G10.EQUIPO13.MediFlow.Documentos.Entity;

import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "documentos")
public class DocumentosEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tipo;

    private String contenido;

    private String especialidad;

    private String prioridad;

    @Column(name = "documento_id", length = 255)
    private String documentoId;

    private LocalDateTime fechaRegistro;

    private LocalDateTime fechaActualizacion;

    private BigDecimal score;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private UsuariosEntity usuario;

}
