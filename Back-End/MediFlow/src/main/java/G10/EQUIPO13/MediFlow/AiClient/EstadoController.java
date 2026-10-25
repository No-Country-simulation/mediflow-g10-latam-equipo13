package G10.EQUIPO13.MediFlow.AiClient;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/estado")
public class EstadoController {

    private final AIClient aiClient;

    /** Estado del agente visto desde el servidor (cualquier usuario con sesión): el navegador no alcanza el motor de IA en producción. */
    @GetMapping
    public ResponseEntity<Map<String, Boolean>> estado() {
        return ResponseEntity.ok(Map.of("api", true, "motorIa", aiClient.motorDisponible()));
    }
}
