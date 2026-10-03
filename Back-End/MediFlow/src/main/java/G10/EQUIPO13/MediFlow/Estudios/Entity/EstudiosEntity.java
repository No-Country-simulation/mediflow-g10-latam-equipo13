package G10.EQUIPO13.MediFlow.Estudios.Entity;


import G10.EQUIPO13.MediFlow.Pacientes.Entity.PacienteEntity;
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
@Table(name = "estudios")
public class EstudiosEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    @Column(name = "diagnostico_principal")
    private String diagnosticoPrincipal;

    private LocalDateTime fecha;

    @Column(name = "cie10_sugerido")
    private String cie10Sugerido;

    @ManyToOne(fetch = FetchType.LAZY)
    private UsuariosEntity medico;

    @ManyToOne(fetch = FetchType.LAZY)
    private PacienteEntity paciente;



}
