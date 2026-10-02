package G10.EQUIPO13.MediFlow.Estudios.Controller;


import G10.EQUIPO13.MediFlow.Estudios.Entity.EstudiosEntity;
import G10.EQUIPO13.MediFlow.Estudios.Service.EstudioRequest;
import G10.EQUIPO13.MediFlow.Estudios.Service.EstudioResponse;
import G10.EQUIPO13.MediFlow.Estudios.Service.EstudioService;
import lombok.AllArgsConstructor;
import org.apache.catalina.connector.Response;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping("/api/estudios")
public class EstudiosController {

    private final EstudioService service;


    @PostMapping("/create")
    public ResponseEntity<EstudioResponse> create(@RequestBody EstudioRequest request){

        return ResponseEntity.ok(service.create(request));

    }

    @PostMapping("/update/{id}")
    public ResponseEntity<EstudioResponse> update(@RequestBody EstudioRequest request, @PathVariable Long id){

        return ResponseEntity.ok(service.update(request, id));
    }

    @GetMapping("/findall")
    public ResponseEntity<List<EstudioResponse>> findAll(){
        return ResponseEntity.ok(service.findall());
    }

    @GetMapping("/findbyid/{id}")
    public ResponseEntity<EstudioResponse> findById(@PathVariable Long id){

        return ResponseEntity.ok(service.FindById(id));
    }

    @GetMapping("/findallbymedicoid/{id}")
    public ResponseEntity<List<EstudioResponse>> findByIdMedico(@PathVariable Long id){

        return ResponseEntity.ok(service.findByIdMedico(id));

    }

    @GetMapping("/findallbynombremedico/{nombre}")
    public ResponseEntity<List<EstudioResponse>> findByNombreMedico(@PathVariable String nombre){

        return ResponseEntity.ok(service.findByNombreMedico(nombre));
    }


    @GetMapping("/findallbypacienteid/{id}")
    public ResponseEntity<List<EstudioResponse>> findByIdPaciente(@PathVariable Long id){
        return ResponseEntity.ok(service.findByIdPaciente(id));
    }

    @GetMapping("/findallbynombrepaciente/{nombre}")
    public ResponseEntity<List<EstudioResponse>> findByNombrePaciente(@PathVariable String nombre){

        return ResponseEntity.ok(service.findByNombrePaciente(nombre));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){

                service.Delete(id);

                return ResponseEntity.ok().build();
    }



}
