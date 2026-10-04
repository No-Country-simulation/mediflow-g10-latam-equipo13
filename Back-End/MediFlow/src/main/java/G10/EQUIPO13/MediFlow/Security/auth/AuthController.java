package G10.EQUIPO13.MediFlow.Security.auth;

import G10.EQUIPO13.MediFlow.Security.config.CustomUserDetailsService;
import G10.EQUIPO13.MediFlow.Security.jwt.JWTService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@AllArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JWTService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest request) {

        // 1. Autenticar
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.name(), request.password())
        );

        // 2. Cargar el usuario y generar el token
        UserDetails userDetails = userDetailsService.loadUserByUsername(request.name());
        String token = jwtService.generateToken(userDetails);

        // 3. Devolver el token
        return ResponseEntity.ok(new AuthResponse(token));
    }


}
