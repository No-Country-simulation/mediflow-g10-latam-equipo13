package G10.EQUIPO13.MediFlow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class MediFlowApplication {

	public static void main(String[] args) {
		// Todas las fechas se guardan y se envían en UTC, corra donde corra el servidor.
		TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
		SpringApplication.run(MediFlowApplication.class, args);
	}

}
