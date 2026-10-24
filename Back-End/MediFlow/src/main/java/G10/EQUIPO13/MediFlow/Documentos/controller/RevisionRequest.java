package G10.EQUIPO13.MediFlow.Documentos.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Decisión del auditor sobre un documento derivado a revisión humana. */
public record RevisionRequest(
        @NotBlank(message = "La decisión es obligatoria")
        @Pattern(regexp = "aprobado|corregido|rechazado", message = "La decisión debe ser aprobado, corregido o rechazado")
        String decision,

        @Size(max = 2000, message = "El comentario no puede superar los 2000 caracteres")
        String comentario,

        /** Se ignora: el revisor es siempre el usuario autenticado. */
        String revisor,

        @Valid
        DatosCorregidos datosCorregidos
) {

    public record DatosCorregidos(
            @Size(max = 255) String nombrePaciente,
            @Size(max = 50) String rutPaciente,
            @Min(0) @Max(120) Short edadPaciente,
            @Size(max = 255) String nombreMedico,
            @Size(max = 100) String matricula,
            @Size(max = 500) String estudioRealizado,
            @Size(max = 500) String diagnosticoPrincipal,
            @Size(max = 20) String cie10Sugerido,
            @Pattern(regexp = "Rutina|Urgente", message = "La prioridad debe ser Rutina o Urgente") String prioridad
    ) {
    }
}
