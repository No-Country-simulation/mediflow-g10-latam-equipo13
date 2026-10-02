package G10.EQUIPO13.MediFlow.AiClient;


import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class AIResponseMapper {

    public AIResponse toAIResponse(ResultadoTriaje r, String contenidoExtraido) {
        if (r == null) {
            return new AIResponse(
                    null, contenidoExtraido , null, null, null,
                    null, null, null, null,
                    null, null,
                    null, null,null
            );
        }

        var cla = r.clasificacion();
        var dat = r.datosExtraidos();
        Paciente pac = dat != null ? dat.paciente() : null;
        MedicoSolicitante med = dat != null ? dat.medicoSolicitante() : null;

       return new AIResponse(
               r.clasificacion().tipoDocumento(),
               null,
               r.clasificacion().especialidad(),
               r.documentoId(),
               BigDecimal.valueOf(r.clasificacion().scoreConfianzaClasificacion()),
               r.datosExtraidos().paciente().nombre(),
               r.datosExtraidos().diagnosticoPrincipal(),
               r.datosExtraidos().paciente().edad(),
               r.datosExtraidos().paciente().rut(),
               r.datosExtraidos().estudioRealizado(),
               r.datosExtraidos().diagnosticoPrincipal(),
               r.datosExtraidos().cie10Sugerido(),
               r.datosExtraidos().medicoSolicitante().nombre(),
               r.datosExtraidos().medicoSolicitante().matricula()


       );
    }
}
