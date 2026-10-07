package G10.EQUIPO13.MediFlow.AiClient;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class AIResponseMapper {

    public AIResponse toAIResponse(ResultadoTriaje r, String contenidoExtraido) {

        if (r == null) {
            return new AIResponse(
                    null,
                    contenidoExtraido,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null
            );
        }

        Clasificacion cla = r.clasificacion();
        DatosExtraidos dat = r.datosExtraidos();

        Paciente pac = dat != null
                ? dat.paciente()
                : null;

        MedicoSolicitante med = dat != null
                ? dat.medicoSolicitante()
                : null;

        return new AIResponse(
                cla != null
                        ? cla.tipoDocumento()
                        : null,

                contenidoExtraido,

                cla != null
                        ? cla.especialidad()
                        : null,

                r.documentoId(),

                cla != null && cla.scoreConfianzaClasificacion() != null
                        ? BigDecimal.valueOf(
                                cla.scoreConfianzaClasificacion()
                        )
                        : null,

                pac != null
                        ? pac.nombre()
                        : null,

                dat != null
                        ? dat.diagnosticoPrincipal()
                        : null,

                pac != null
                        ? pac.edad()
                        : null,

                pac != null
                        ? pac.rut()
                        : null,

                dat != null
                        ? dat.estudioRealizado()
                        : null,

                dat != null
                        ? dat.diagnosticoPrincipal()
                        : null,

                dat != null
                        ? dat.cie10Sugerido()
                        : null,

                med != null
                        ? med.nombre()
                        : null,

                med != null
                        ? med.matricula()
                        : null,

                cla != null
                        ? cla.nivelPrioridad()
                        : null
        );
    }
}