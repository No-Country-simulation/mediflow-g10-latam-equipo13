package G10.EQUIPO13.MediFlow.Pacientes.Entity;


import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "pacientes")
public class PacienteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    private String diagnostico;

    @Column(columnDefinition = "TINYINT UNSIGNED")
    private Short edad;

    private String rut;

    private LocalDateTime fechaRegistro;

    private LocalDateTime fechaActualizacion;

    @Enumerated(EnumType.STRING)
    private Estado estado;

    @ManyToOne(fetch = FetchType.LAZY)
    private UsuariosEntity usuario;

}
