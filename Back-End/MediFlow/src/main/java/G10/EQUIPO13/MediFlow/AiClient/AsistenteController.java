package G10.EQUIPO13.MediFlow.AiClient;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/asistente")
public class AsistenteController {

    private static final Set<String> ROLES_CON_GUIA = Set.of("ADMIN", "AUDITOR", "PERSONAL");

    private final AIClient aiClient;

    /**
     * Asistente virtual para cualquier usuario con sesión. Responde dudas sobre el uso de MediFlow;
     * el rol con que se adapta la respuesta sale de la sesión, no de lo que envíe el navegador.
     */
    @PostMapping
    public ResponseEntity<Map<String, String>> preguntar(
            @RequestBody @Valid AsistenteRequest solicitud,
            Authentication autenticacion) {
        List<Map<String, String>> historial = solicitud.historial() == null ? List.of()
                : solicitud.historial().stream()
                        .map(m -> Map.of("rol", m.rol(), "texto", m.texto() == null ? "" : m.texto()))
                        .toList();
        String respuesta = aiClient.preguntarAsistente(solicitud.pregunta().strip(), rolDe(autenticacion), historial);
        return ResponseEntity.ok(Map.of("respuesta", respuesta));
    }

    /** ADMIN, AUDITOR o PERSONAL según la sesión; null para cualquier otro caso. */
    static String rolDe(Authentication autenticacion) {
        if (autenticacion == null) {
            return null;
        }
        return autenticacion.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(a -> a.startsWith("ROLE_") ? a.substring(5) : a)
                .filter(ROLES_CON_GUIA::contains)
                .findFirst()
                .orElse(null);
    }
}
