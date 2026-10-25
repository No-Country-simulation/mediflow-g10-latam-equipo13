package G10.EQUIPO13.MediFlow.Documentos.Service;

import G10.EQUIPO13.MediFlow.AiClient.DTOs.*;
import G10.EQUIPO13.MediFlow.Documentos.Entity.DocumentosEntity;
import G10.EQUIPO13.MediFlow.Documentos.controller.AlertaResponse;
import G10.EQUIPO13.MediFlow.Documentos.controller.DocumentosResponse;
import G10.EQUIPO13.MediFlow.Documentos.controller.RevisionRequest;
import G10.EQUIPO13.MediFlow.Usuarios.Entity.UsuariosEntity;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

@Component
public class DocumentosDTOMapper {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    public DocumentosEntity toEntityFromAI(ResultadoTriaje resultado, UsuariosEntity usuariosEntity){
        Clasificacion clasificacion = resultado.clasificacion();
        DatosExtraidos datos = resultado.datosExtraidos();
        Paciente paciente = datos != null ? datos.paciente() : null;
        MedicoSolicitante medico = datos != null ? datos.medicoSolicitante() : null;
        DecisionEnrutamiento decision = resultado.decisionEnrutamiento();
        Notificacion notificacion = decision != null ? decision.notificacionGenerada() : null;
        AlmacenamientoOci oci = resultado.almacenamientoOci();

        boolean requiereAuditoria = decision != null && decision.requiereAuditoriaHumana() != null
                ? decision.requiereAuditoriaHumana()
                : clasificacion != null && Boolean.TRUE.equals(clasificacion.auditoria());
        String destino = decision != null && decision.destinoPrincipal() != null
                ? decision.destinoPrincipal()
                : clasificacion != null ? clasificacion.colaEnrutamiento() : null;
        LocalDateTime ahora = LocalDateTime.now();

        return DocumentosEntity.builder()
                .status(recortar(resultado.status(), 50))
                .tipo(recortar(clasificacion != null ? clasificacion.tipoDocumento() : null, 255))
                .contenido(resultado.contenido())
                .especialidad(recortar(clasificacion != null ? clasificacion.especialidad() : null, 255))
                .prioridad(recortar(clasificacion != null ? clasificacion.nivelPrioridad() : null, 50))
                .documentoId(recortar(resultado.documentoId(), 255))
                .score(clasificacion != null && clasificacion.scoreConfianzaClasificacion() != null
                        ? BigDecimal.valueOf(clasificacion.scoreConfianzaClasificacion())
                        : null)
                .requiereAuditoria(requiereAuditoria)
                .colaEnrutamiento(recortar(destino, 255))
                .destino(recortar(destino, 120))
                .justificacion(decision != null ? decision.justificacionEnrutamiento() : null)
                .notificacionCanal(recortar(notificacion != null ? notificacion.canal() : null, 120))
                .notificacionMensaje(notificacion != null ? notificacion.mensaje() : null)
                .nombreMedico(recortar(medico != null ? medico.nombre() : null, 255))
                .matriculaMedico(recortar(medico != null ? medico.matricula() : null, 100))
                .pacienteNombre(recortar(paciente != null ? paciente.nombre() : null, 255))
                .pacienteRut(recortar(paciente != null ? paciente.rut() : null, 50))
                .pacienteEdad(edad(paciente != null ? paciente.edad() : null))
                .estudioRealizado(recortar(datos != null ? datos.estudioRealizado() : null, 500))
                .diagnosticoPrincipal(recortar(datos != null ? datos.diagnosticoPrincipal() : null, 500))
                .cie10Sugerido(recortar(datos != null ? datos.cie10Sugerido() : null, 20))
                .medicamentos(datos != null && datos.medicamentos() != null ? escribir(datos.medicamentos()) : null)
                .validacion(resultado.validacion() != null ? escribir(resultado.validacion()) : null)
                .traza(resultado.traza() != null ? escribir(resultado.traza()) : null)
                .canalOrigen(recortar(resultado.canalOrigen(), 80))
                .nombreArchivo(recortar(resultado.nombreArchivo(), 255))
                .ociBucket(recortar(oci != null ? oci.bucket() : null, 100))
                .ociObjeto(recortar(oci != null ? oci.rutaObjeto() : null, 500))
                .ociOriginal(recortar(oci != null ? oci.rutaOriginal() : null, 500))
                .ociEstado(recortar(oci != null ? oci.statusBackup() : null, 40))
                .usuario(usuariosEntity)
                .fechaRegistro(ahora)
                .fechaActualizacion(ahora)
                .build();
    }

    public DocumentosResponse toResponse(DocumentosEntity e){

        String nombre = e.getUsuario() != null ? e.getUsuario().getNombre() : null;

        return new DocumentosResponse(
                e.getId(),
                e.getStatus(),
                e.getTipo(),
                e.getContenido(),
                e.getEspecialidad(),
                e.getPrioridad(),
                e.getDocumentoId(),
                utc(e.getFechaRegistro()),
                utc(e.getFechaActualizacion()),
                e.getScore(),
                e.getRequiereAuditoria(),
                e.getColaEnrutamiento(),
                e.getDestino() != null ? e.getDestino() : e.getColaEnrutamiento(),
                e.getJustificacion(),
                e.getNombreMedico(),
                e.getMatriculaMedico(),
                e.getPacienteNombre(),
                e.getPacienteRut(),
                e.getPacienteEdad(),
                e.getEstudioRealizado(),
                e.getDiagnosticoPrincipal(),
                e.getCie10Sugerido(),
                leer(e.getMedicamentos(), new TypeReference<List<Medicamento>>() {}, List.of()),
                e.getNotificacionCanal() != null || e.getNotificacionMensaje() != null
                        ? new DocumentosResponse.Notificacion(e.getNotificacionCanal(), e.getNotificacionMensaje())
                        : null,
                leer(e.getValidacion(), new TypeReference<Map<String, Object>>() {}, null),
                leer(e.getTraza(), new TypeReference<List<Map<String, Object>>>() {}, List.of()),
                new DocumentosResponse.Almacenamiento(e.getOciBucket(), e.getOciObjeto(), e.getOciOriginal(), e.getOciEstado()),
                e.getRevisionDecision() != null
                        ? new DocumentosResponse.Revision(e.getRevisionDecision(), e.getRevisionComentario(),
                                e.getRevisionRevisor(), utc(e.getRevisionFecha()))
                        : null,
                e.getCanalOrigen(),
                e.getNombreArchivo(),
                nombre
        );

    }

    public AlertaResponse toAlerta(DocumentosEntity e) {
        return new AlertaResponse(
                e.getId(),
                e.getDocumentoId(),
                e.getTipo(),
                e.getPacienteNombre(),
                e.getDestino() != null ? e.getDestino() : e.getColaEnrutamiento(),
                e.getNotificacionMensaje(),
                e.getRequiereAuditoria(),
                utc(e.getFechaRegistro())
        );
    }

    /** Aplica los datos que corrigió el auditor (solo los campos enviados). */
    public void aplicarCorreccion(DocumentosEntity e, RevisionRequest.DatosCorregidos d) {
        if (d == null) {
            return;
        }
        if (d.nombrePaciente() != null) e.setPacienteNombre(recortar(d.nombrePaciente(), 255));
        if (d.rutPaciente() != null) e.setPacienteRut(recortar(d.rutPaciente(), 50));
        if (d.edadPaciente() != null) e.setPacienteEdad(d.edadPaciente());
        if (d.nombreMedico() != null) e.setNombreMedico(recortar(d.nombreMedico(), 255));
        if (d.matricula() != null) e.setMatriculaMedico(recortar(d.matricula(), 100));
        if (d.estudioRealizado() != null) e.setEstudioRealizado(recortar(d.estudioRealizado(), 500));
        if (d.diagnosticoPrincipal() != null) e.setDiagnosticoPrincipal(recortar(d.diagnosticoPrincipal(), 500));
        if (d.cie10Sugerido() != null) e.setCie10Sugerido(recortar(d.cie10Sugerido(), 20));
        if (d.prioridad() != null) e.setPrioridad(d.prioridad());
    }

    // ------------------------------------------------------------------

    static String recortar(String valor, int maximo) {
        if (valor == null) {
            return null;
        }
        String limpio = valor.strip();
        if (limpio.isEmpty()) {
            return null;
        }
        return limpio.length() > maximo ? limpio.substring(0, maximo) : limpio;
    }

    /** La tabla acepta edades de 0 a 120; fuera de rango se guarda vacía en vez de fallar. */
    static Short edad(Integer edad) {
        return edad != null && edad >= 0 && edad <= 120 ? edad.shortValue() : null;
    }

    static OffsetDateTime utc(LocalDateTime fecha) {
        return fecha != null ? fecha.atOffset(ZoneOffset.UTC) : null;
    }

    private static String escribir(Object valor) {
        return JSON.writeValueAsString(valor);
    }

    private static <T> T leer(String json, TypeReference<T> tipo, T porDefecto) {
        if (json == null || json.isBlank()) {
            return porDefecto;
        }
        try {
            return JSON.readValue(json, tipo);
        } catch (RuntimeException e) {
            return porDefecto;
        }
    }

}
