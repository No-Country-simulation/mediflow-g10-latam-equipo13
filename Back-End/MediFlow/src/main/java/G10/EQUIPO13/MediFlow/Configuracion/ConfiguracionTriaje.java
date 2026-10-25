package G10.EQUIPO13.MediFlow.Configuracion;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Configuración de triaje con la misma forma que usa el frontend (pantalla Configuración).
 * Se usa para leer y para guardar.
 */
public record ConfiguracionTriaje(
        @NotNull(message = "El umbral es obligatorio")
        @DecimalMin(value = "0.0", message = "El umbral mínimo es 0")
        @DecimalMax(value = "1.0", message = "El umbral máximo es 1")
        Double umbralConfianza,

        @NotNull(message = "La lista de términos de urgencia es obligatoria")
        @Size(max = 200, message = "Máximo 200 términos de urgencia")
        List<@NotBlank @Size(max = 80) String> palabrasUrgencia,

        @NotNull(message = "La lista de destinos es obligatoria")
        @Size(max = 50, message = "Máximo 50 destinos")
        List<@Valid Destino> destinos,

        String actualizadoPor,
        OffsetDateTime fechaActualizacion
) {

    /** tipoDocumento es una de las 5 categorías, o "*" para urgencias y revisión humana. */
    public record Destino(
            @NotBlank @Size(max = 60) String id,
            @NotBlank(message = "Cada destino necesita un nombre") @Size(max = 120) String nombre,
            @NotBlank @Size(max = 80) String tipoDocumento,
            Boolean activo
    ) {
    }
}
