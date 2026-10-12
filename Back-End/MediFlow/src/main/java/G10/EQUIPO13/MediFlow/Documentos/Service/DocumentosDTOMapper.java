package G10.EQUIPO13.MediFlow.Documentos.Service;

import G10.EQUIPO13.MediFlow.AiClient.DTOs.ResultadoTriaje;
import G10.EQUIPO13.MediFlow.Documentos.Entity.DocumentosEntity;
import G10.EQUIPO13.MediFlow.Documentos.controller.DocumentosResponse;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosEntity;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class DocumentosDTOMapper {

    public DocumentosEntity toEntityFromAI(ResultadoTriaje resultado, UsuariosEntity usuariosEntity){
        return DocumentosEntity.builder()
                .status(resultado.status())
                .tipo(resultado.clasificacion().tipoDocumento())
                .contenido(resultado.contenido())
                .especialidad(resultado.clasificacion().especialidad())
                .prioridad(resultado.clasificacion().nivelPrioridad())
                .documentoId(resultado.documentoId())
                .score(resultado.clasificacion().scoreConfianzaClasificacion() != null
                        ? BigDecimal.valueOf(
                        resultado.clasificacion().scoreConfianzaClasificacion()
                )
                        : null)
                .requiereAuditoria(
                        resultado.clasificacion().auditoria()
                )
                .colaEnrutamiento(
                        resultado.clasificacion().colaEnrutamiento()
                )
                .usuario(usuariosEntity)
                .fechaRegistro(LocalDateTime.now())
                .fechaActualizacion(LocalDateTime.now())
                .build();
    }

    public DocumentosResponse toResponse(DocumentosEntity documentosEntity){

        String nombre = documentosEntity.getUsuario().getNombre();

        return new DocumentosResponse(
                documentosEntity.getId(),
                documentosEntity.getStatus(),
                documentosEntity.getTipo(),
                documentosEntity.getContenido(),
                documentosEntity.getEspecialidad(),
                documentosEntity.getPrioridad(),
                documentosEntity.getDocumentoId(),
                documentosEntity.getFechaRegistro(),
                documentosEntity.getFechaActualizacion(),
                documentosEntity.getScore(),
                documentosEntity.getRequiereAuditoria(),
                documentosEntity.getColaEnrutamiento(),
                nombre
        );

    }

}
