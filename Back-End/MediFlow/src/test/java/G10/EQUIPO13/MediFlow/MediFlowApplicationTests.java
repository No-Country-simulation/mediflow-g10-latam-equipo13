package G10.EQUIPO13.MediFlow;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;

/** Levanta el contexto completo: necesita una base MySQL real, así que solo corre si hay DB_URL. */
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "DB_URL", matches = ".+")
class MediFlowApplicationTests {

	@Test
	void contextLoads() {
	}

}
