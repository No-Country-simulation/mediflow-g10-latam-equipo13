package G10.EQUIPO13.MediFlow.AiClient;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

@Component
public class TestAIClient implements CommandLineRunner {
    


//    private final AIClient aiClient;
//
//    public TestAIClient(AIClient aiClient) {
//        this.aiClient = aiClient;
//    }
//
    @Override
    public void run(String... args) throws Exception {
//        Path ruta = Path.of("C:/Users/Usuario/Downloads/Orden_de_Procedimiento_Laboratorio_102820976.pdf");
//        byte[] bytes = Files.readAllBytes(ruta);
//        String nombre = ruta.getFileName().toString();
//
//        MultipartFile archivo = new MultipartFile() {
//            @Override public String getName() { return "archivo"; }
//            @Override public String getOriginalFilename() { return nombre; }
//            @Override public String getContentType() { return "application/pdf"; }
//            @Override public boolean isEmpty() { return bytes.length == 0; }
//            @Override public long getSize() { return bytes.length; }
//            @Override public byte[] getBytes() { return bytes; }
//            @Override public InputStream getInputStream() {
//                return new ByteArrayInputStream(bytes);
//            }
//            @Override public void transferTo(File dest) throws IOException {
//                Files.write(dest.toPath(), bytes);
//            }
//        };
//
//        System.out.println(">>> Llamando a /analizar...");
//        AIResponse respuesta = aiClient.analizarDocumento(archivo);
//        System.out.println(">>> AIResponse:");
//        System.out.println(respuesta);
    }
}
