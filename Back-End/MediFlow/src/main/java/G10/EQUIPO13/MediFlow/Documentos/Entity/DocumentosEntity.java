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

    private String status;

    private String tipo;

    @Column(columnDefinition = "LONGTEXT")
    private String contenido;

    private String especialidad;

    private String prioridad;

    @Column(name = "documento_id", length = 255)
    private String documentoId;

    private LocalDateTime fechaRegistro;

    private LocalDateTime fechaActualizacion;

    private BigDecimal score;

    private Boolean requiereAuditoria;

    private String colaEnrutamiento;

    // --- Datos extraídos ---

    private String nombreMedico;

    @Column(name = "matricula_medico", length = 100)
    private String matriculaMedico;

    @Column(name = "paciente_nombre")
    private String pacienteNombre;

    @Column(name = "paciente_rut", length = 50)
    private String pacienteRut;

    @Column(name = "paciente_edad")
    private Short pacienteEdad;

    @Column(name = "estudio_realizado", length = 500)
    private String estudioRealizado;

    @Column(name = "diagnostico_principal", length = 500)
    private String diagnosticoPrincipal;

    @Column(name = "cie10_sugerido", length = 20)
    private String cie10Sugerido;

    /** Lista de medicamentos en JSON. */
    @Column(columnDefinition = "TEXT")
    private String medicamentos;

    // --- Decisión del agente ---

    @Column(length = 120)
    private String destino;

    @Column(columnDefinition = "TEXT")
    private String justificacion;

    @Column(name = "notificacion_canal", length = 120)
    private String notificacionCanal;

    @Column(name = "notificacion_mensaje", columnDefinition = "TEXT")
    private String notificacionMensaje;

    /** Faltantes, inconsistencias, ambigüedades y detalle de la confianza (JSON). */
    @Column(columnDefinition = "LONGTEXT")
    private String validacion;

    /** Pasos del grafo de decisión (JSON). */
    @Column(columnDefinition = "LONGTEXT")
    private String traza;

    @Column(name = "canal_origen", length = 80)
    private String canalOrigen;

    @Column(name = "nombre_archivo")
    private String nombreArchivo;

    // --- OCI Object Storage ---

    @Column(name = "oci_bucket", length = 100)
    private String ociBucket;

    @Column(name = "oci_objeto", length = 500)
    private String ociObjeto;

    @Column(name = "oci_original", length = 500)
    private String ociOriginal;

    @Column(name = "oci_estado", length = 40)
    private String ociEstado;

    // --- Revisión humana ---

    @Column(name = "revision_decision", length = 20)
    private String revisionDecision;

    @Column(name = "revision_comentario", columnDefinition = "TEXT")
    private String revisionComentario;

    @Column(name = "revision_revisor")
    private String revisionRevisor;

    @Column(name = "revision_fecha")
    private LocalDateTime revisionFecha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private UsuariosEntity usuario;

}
