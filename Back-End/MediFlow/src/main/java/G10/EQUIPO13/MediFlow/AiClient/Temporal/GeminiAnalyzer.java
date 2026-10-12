package G10.EQUIPO13.MediFlow.AiClient.Temporal;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Component;

@Component
public class GeminiAnalyzer {

    private final ChatClient chatClient;

    public GeminiAnalyzer(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public AIResponse analyzeText(String text) {

        return chatClient
                .prompt("""
                        Tendras que analizar el texto enviado y responder con los siguientes parametros:
                        String tipo = tipo de documento en este caso texto.
                        String contenido = transcripcion de lo que dice el texto.
                        String especialidad = a que especialidad medica corresponde ejemplo: cariologia, pediatria, etc.
                        String documentoId = inventa un documentoid.
                        BigDecimal score = el score de filedidad que le das a tu clasificacion siendo 1 perfecto 0.01 el peor.
                        
                        Paciente: tendras que extraer del paciente los siguientes datos:
                        String nombrePaciente = nombre del paciente al que se atendio si no existe colocar alguna cualidad reconocible.
                        String Diagnostico = diagnostico del paciente.
                        String edad = edad del paciente.
                        String rut = rut del paciente si no se encuentra colocar 00000000.
                        Estado estado = este enum puede ser: emergencias(si se encuentra en observacion sin alta), internacion(si fue derivado a internacion) , alta: (si fue dado de alta) colocar tal cual en minusculas.
                        """)
                .user(text)
                .call()
                .entity(AIResponse.class);
    }
}
