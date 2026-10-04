package G10.EQUIPO13.MediFlow.Usuarios.Controller;

import G10.EQUIPO13.MediFlow.Usuarios.Entity.Roles;
import G10.EQUIPO13.MediFlow.Usuarios.Service.UsuariosService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/user")
@Validated
public class UsuariosController {

    private final UsuariosService service;

    @PostMapping("/register")
    public ResponseEntity<UsuarioResponse> register(@RequestBody @Valid UsuarioRegister reg){

        return service.register(reg);

    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/rol/{rol}")
    public ResponseEntity<UsuarioResponse> changeRole(
            @PathVariable @Min(1) Long id,
            @PathVariable Roles rol) {

        return service.roleChange(id, rol);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/findallbyrol/{rol}")
    public ResponseEntity<List<UsuarioResponse>> findbyrol(@PathVariable("rol") Roles rol){

        return ResponseEntity.ok(service.findAllByRol(rol));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/findAll")
    public ResponseEntity<List<UsuarioResponse>> findAll(){

        return ResponseEntity.ok(service.listAll());

    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/findbyId/{id}")
    public ResponseEntity<UsuarioResponse> findById(@PathVariable @Min(1) Long id){
        return ResponseEntity.ok(service.findById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/findbyname/{name}")
    public ResponseEntity<UsuarioResponse> findByName(@PathVariable @NotBlank String name){
        return ResponseEntity.ok(service.findByName(name));
    }


    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @Min(1) Long id){

        service.deleteById(id);

        return ResponseEntity.ok().build();
    }




}
