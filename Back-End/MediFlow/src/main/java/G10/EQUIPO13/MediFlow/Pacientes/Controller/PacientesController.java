package G10.EQUIPO13.MediFlow.Pacientes.Controller;

import G10.EQUIPO13.MediFlow.Pacientes.Service.PacienteService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/pacientes")
@Validated
public class PacientesController {

    private final PacienteService service;


    @PreAuthorize("hasAnyRole('ADMIN', 'PERSONAL' )")
    @PostMapping("/create")
    public ResponseEntity<PacienteResponse> create(@RequestBody @Valid PacienteRequest pacienteRequest){

        return ResponseEntity.ok(service.create(pacienteRequest));

    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PERSONAL' )")
    @PostMapping("/update/{id}")
    public ResponseEntity<PacienteResponse> update(@RequestBody @Valid PacienteRequest pacienteRequest, @PathVariable @Min(1) Long id){

        return ResponseEntity.ok(service.update(pacienteRequest, id));


    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PERSONAL', 'AUDITOR')")
    @GetMapping("/findall")
    ResponseEntity<List<PacienteResponse>> findAll(){

        return ResponseEntity.ok(service.findAll());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PERSONAL' , 'AUDITOR' )")
    @GetMapping("/findbyid/{id}")
    ResponseEntity<PacienteResponse> findById(@PathVariable @Min(1) Long id){

        return ResponseEntity.ok(service.findById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable @Min(1) Long id){

        service.deleteById(id);

        return ResponseEntity.noContent().build();
    }


}
