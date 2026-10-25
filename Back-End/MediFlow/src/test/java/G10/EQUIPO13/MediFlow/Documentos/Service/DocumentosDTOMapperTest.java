package G10.EQUIPO13.MediFlow.Documentos.Service;

import G10.EQUIPO13.MediFlow.Documentos.Entity.DocumentosEntity;
import G10.EQUIPO13.MediFlow.Documentos.controller.DocumentosResponse;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class DocumentosDTOMapperTest {

    @Test
    void recortarLimpiaYRespetaElLargoDeLaColumna() {
        assertNull(DocumentosDTOMapper.recortar("   ", 10));
        assertEquals("abc", DocumentosDTOMapper.recortar("  abc  ", 10));
        assertEquals("abcde", DocumentosDTOMapper.recortar("abcdefgh", 5));
    }

    @Test
    void edadFueraDeRangoQuedaVacia() {
        assertEquals((short) 52, DocumentosDTOMapper.edad(52));
        assertNull(DocumentosDTOMapper.edad(150));
        assertNull(DocumentosDTOMapper.edad(-1));
        assertNull(DocumentosDTOMapper.edad(null));
    }

    @Test
    void lasFechasSalenEnUtcYLosJsonInvalidosNoRompenLaRespuesta() {
        DocumentosEntity entity = new DocumentosEntity();
        entity.setFechaRegistro(LocalDateTime.of(2026, 10, 24, 3, 52, 23));
        entity.setMedicamentos("no es json");
        entity.setColaEnrutamiento("Farmacia_Hospitalaria");

        DocumentosResponse respuesta = new DocumentosDTOMapper().toResponse(entity);

        assertEquals("2026-10-24T03:52:23Z", respuesta.fechaRegistro().toString());
        assertTrue(respuesta.medicamentos().isEmpty());
        assertEquals("Farmacia_Hospitalaria", respuesta.destino());
        assertNull(respuesta.revision());
    }
}
