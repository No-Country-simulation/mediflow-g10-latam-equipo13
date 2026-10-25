package G10.EQUIPO13.MediFlow.Security.auth;

import G10.EQUIPO13.MediFlow.Security.config.CustomUserDetailsService;
import G10.EQUIPO13.MediFlow.Security.jwt.JWTService;
import G10.EQUIPO13.MediFlow.Usuarios.Controller.UsuarioResponse;
import G10.EQUIPO13.MediFlow.Usuarios.Service.CurrentUserService;
import G10.EQUIPO13.MediFlow.Usuarios.Service.UsuarioMapperDTO;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@AllArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JWTService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final CurrentUserService currentUserService;
    private final UsuarioMapperDTO usuarioMapper;

    /** Credenciales incorrectas responden 401 (ver GlobalExceptionHandler). */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest request) {

        // 1. Autenticar
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.name(), request.password())
        );

        // 2. Cargar el usuario y generar el token
        UserDetails userDetails = userDetailsService.loadUserByUsername(request.name());
        String token = jwtService.generateToken(userDetails);

        // 3. Devolver el token y el usuario
        return ResponseEntity.ok(new AuthResponse(token, usuarioMapper.ToDTO(userDetailsService.buscar(request.name()))));
    }

    /** Usuario de la sesión actual, con su rol vigente (sirve para refrescar el rol sin volver a iniciar sesión). */
    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> me() {
        return ResponseEntity.ok(usuarioMapper.ToDTO(currentUserService.getCurrentUserId()));
    }
}
