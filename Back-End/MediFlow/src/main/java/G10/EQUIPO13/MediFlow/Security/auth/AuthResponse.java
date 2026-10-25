package G10.EQUIPO13.MediFlow.Security.auth;

import G10.EQUIPO13.MediFlow.Usuarios.Controller.UsuarioResponse;

/** Token JWT y datos del usuario (el frontend ya no necesita decodificar el token para saber su rol). */
public record AuthResponse(
        String token,
        UsuarioResponse usuario
) {
}
