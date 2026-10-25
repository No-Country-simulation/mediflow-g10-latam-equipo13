package G10.EQUIPO13.MediFlow.Configuracion;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/configuracion")
public class ConfiguracionController {

    private final ConfiguracionService service;

    /** Reglas de triaje vigentes (cualquier rol asignado). */
    @PreAuthorize("hasAnyRole('ADMIN', 'PERSONAL', 'AUDITOR')")
    @GetMapping
    public ResponseEntity<ConfiguracionTriaje> obtener() {
        return ResponseEntity.ok(service.obtener());
    }

    /** Cambia umbral, términos de urgencia y destinos. El agente los aplica desde el siguiente documento. */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping
    public ResponseEntity<ConfiguracionTriaje> actualizar(@RequestBody @Valid ConfiguracionTriaje configuracion) {
        return ResponseEntity.ok(service.actualizar(configuracion));
    }
}
