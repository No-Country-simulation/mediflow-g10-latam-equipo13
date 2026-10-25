package G10.EQUIPO13.MediFlow.Configuracion;

import G10.EQUIPO13.MediFlow.GlobalException.Exceptions.AccesoDenegadoException;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.Roles;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosEntity;
import G10.EQUIPO13.MediFlow.Usuarios.Service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ConfiguracionService {

    private static final JsonMapper JSON = JsonMapper.builder().build();
    private static final Set<String> TIPOS = Set.of(
            "Receta", "Informe de Estudio por Imágenes", "Orden de Procedimiento", "Epicrisis", "Certificado Médico");
    private static final String DESTINO_POR_DEFECTO = "Historia_Clinica_Electronica";

    private final ConfiguracionTriajeRepository repository;
    private final CurrentUserService currentUserService;

    public ConfiguracionTriaje obtener() {
        UsuariosEntity usuario = currentUserService.getCurrentUserId();
        if (usuario.getRol() == null || usuario.getRol() == Roles.NO_ASIGNADO) {
            throw new AccesoDenegadoException("El rol " + usuario.getRol() + " no tiene permisos para realizar esta acción");
        }
        return aDto(cargar());
    }

    @Transactional
    public ConfiguracionTriaje actualizar(ConfiguracionTriaje nueva) {
        UsuariosEntity usuario = currentUserService.getCurrentUserId();
        if (usuario.getRol() != Roles.ADMIN) {
            throw new AccesoDenegadoException("Solo un administrador puede cambiar las reglas de triaje");
        }
        ConfiguracionTriajeEntity entity = cargar();
        entity.setUmbral(BigDecimal.valueOf(nueva.umbralConfianza()).setScale(3, RoundingMode.HALF_UP));
        entity.setTerminosUrgencia(JSON.writeValueAsString(
                nueva.palabrasUrgencia().stream().map(String::strip).filter(t -> !t.isEmpty()).distinct().toList()));
        entity.setDestinos(JSON.writeValueAsString(nueva.destinos()));
        entity.setActualizadoPor(usuario.getNombre());
        return aDto(repository.saveAndFlush(entity));
    }

    /**
     * Reglas en el formato que espera el agente (FastAPI): umbral, términos y destino por tipo.
     * Si algo falla devuelve null y el agente usa sus reglas por defecto.
     */
    public Map<String, Object> paraAgente() {
        try {
            ConfiguracionTriaje config = aDto(cargar());
            Map<String, Object> reglas = new LinkedHashMap<>();
            reglas.put("umbral", config.umbralConfianza());
            if (!config.palabrasUrgencia().isEmpty()) {
                reglas.put("terminos_urgencia", config.palabrasUrgencia());
            }
            reglas.put("destinos", destinosPorTipo(config));
            return reglas;
        } catch (RuntimeException e) {
            return null;
        }
    }

    /** Destino estándar de un tipo de documento (se usa cuando un auditor aprueba un documento). */
    public String destinoPara(String tipo) {
        try {
            return destinosPorTipo(aDto(cargar())).getOrDefault(tipo, DESTINO_POR_DEFECTO);
        } catch (RuntimeException e) {
            return DESTINO_POR_DEFECTO;
        }
    }

    // ------------------------------------------------------------------

    private static Map<String, String> destinosPorTipo(ConfiguracionTriaje config) {
        Map<String, String> destinos = new LinkedHashMap<>();
        for (ConfiguracionTriaje.Destino d : config.destinos()) {
            if (!Boolean.FALSE.equals(d.activo()) && TIPOS.contains(d.tipoDocumento())) {
                destinos.putIfAbsent(d.tipoDocumento(), d.nombre());
            }
        }
        return destinos;
    }

    private ConfiguracionTriajeEntity cargar() {
        return repository.findById(ConfiguracionTriajeEntity.ID_UNICO).orElseGet(() -> {
            ConfiguracionTriajeEntity nueva = new ConfiguracionTriajeEntity();
            nueva.setId(ConfiguracionTriajeEntity.ID_UNICO);
            nueva.setUmbral(new BigDecimal("0.600"));
            return nueva;
        });
    }

    private static ConfiguracionTriaje aDto(ConfiguracionTriajeEntity e) {
        List<String> terminos = leer(e.getTerminosUrgencia(), new TypeReference<List<String>>() {});
        List<ConfiguracionTriaje.Destino> destinos = leer(e.getDestinos(), new TypeReference<List<ConfiguracionTriaje.Destino>>() {});
        return new ConfiguracionTriaje(
                e.getUmbral() != null ? e.getUmbral().doubleValue() : 0.6,
                terminos != null ? terminos : List.of(),
                destinos != null ? destinos : List.of(),
                e.getActualizadoPor(),
                e.getFechaActualizacion() != null ? e.getFechaActualizacion().atOffset(ZoneOffset.UTC) : null
        );
    }

    private static <T> T leer(String json, TypeReference<T> tipo) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return JSON.readValue(json, tipo);
        } catch (RuntimeException e) {
            return null;
        }
    }
}
