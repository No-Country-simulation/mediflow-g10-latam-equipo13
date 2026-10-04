package G10.EQUIPO13.MediFlow.Security.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank @Size(min = 2, max = 100) String name,
        @NotBlank @Size(min = 8, max = 72) String password
) {
}
