package G10.EQUIPO13.MediFlow.Documentos.Service;

import G10.EQUIPO13.MediFlow.AiClient.AIResponse;
import G10.EQUIPO13.MediFlow.Documentos.Entity.DocumentosEntity;
import G10.EQUIPO13.MediFlow.Documentos.controller.DocumentosResponse;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosEntity;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DocumentosDTOMapper {

    public DocumentosEntity toEntity(AIResponse aiResponse, UsuariosEntity usuariosEntity){


        DocumentosEntity response= new DocumentosEntity();

                response.setTipo(aiResponse.tipo());
                response.setContenido(aiResponse.contenido());
                response.setEspecialidad(aiResponse.especialidad());
                response.setDocumentoId(aiResponse.documentoId());
                response.setScore(aiResponse.score());
                response.setUsuario(usuariosEntity);
                response.setFechaRegistro(LocalDateTime.now());
                response.setFechaActualizacion(LocalDateTime.now());
                response.setPrioridad(aiResponse.prioridad());

        return response;

    }

    public DocumentosResponse toResponse(DocumentosEntity documentosEntity){

        String nombre = documentosEntity.getUsuario().getNombre();

        return new DocumentosResponse(
                documentosEntity.getId(),
                documentosEntity.getTipo(),
                documentosEntity.getContenido(),
                documentosEntity.getEspecialidad(),
                documentosEntity.getDocumentoId(),
                documentosEntity.getFechaRegistro(),
                documentosEntity.getFechaActualizacion(),
                documentosEntity.getScore(),
                nombre
        );

    }

}
