package G10.EQUIPO13.MediFlow.Documentos.controller;

import G10.EQUIPO13.MediFlow.AiClient.DTOs.ArchivoOriginal;
import G10.EQUIPO13.MediFlow.Documentos.Service.DocumentosService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/documentos")
@Validated
public class DocumentosController {

    private final DocumentosService documentosService;

    /** Procesa un archivo (PDF, imagen o texto) con el agente de triaje y lo guarda. */
    @PreAuthorize("hasAnyRole('ADMIN', 'PERSONAL', 'AUDITOR')")
    @PostMapping(
            value = "/analyze/file",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public DocumentosResponse analyzeFile(
            @RequestPart("archivo") MultipartFile archivo,
            @RequestParam(value = "canalOrigen", required = false) @Size(max = 80) String canalOrigen) {
        return documentosService.analizeFile(archivo, canalOrigen);
    }

    /** Procesa texto clínico pegado en la interfaz. */
    @PreAuthorize("hasAnyRole('ADMIN', 'PERSONAL', 'AUDITOR')")
    @PostMapping(value = "/analyze/text", consumes = MediaType.APPLICATION_JSON_VALUE)
    public DocumentosResponse analyzeText(@RequestBody @Valid DocumentosRequest request) {
        return documentosService.analizeText(request);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PERSONAL', 'AUDITOR')")
    @GetMapping("/findall")
    public ResponseEntity<List<DocumentosResponse>> findAll() {
        return ResponseEntity.ok(
                documentosService.findall()
        );
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'PERSONAL', 'AUDITOR')")
    @GetMapping("/findbyid/{id}")
    public ResponseEntity<DocumentosResponse> findById(
            @PathVariable @Min(1) Long id) {
        return ResponseEntity.ok(
                documentosService.findById(id)
        );
    }

    /** Revisión humana: aprobar, corregir o rechazar un documento de baja confianza. */
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR')")
    @PatchMapping("/{id}/revision")
    public ResponseEntity<DocumentosResponse> revisar(
            @PathVariable @Min(1) Long id,
            @RequestBody @Valid RevisionRequest request) {
        return ResponseEntity.ok(documentosService.revisar(id, request));
    }

    /** Archivo original (guardado en OCI) para verlo junto a los datos extraídos. */
    @PreAuthorize("hasAnyRole('ADMIN', 'PERSONAL', 'AUDITOR')")
    @GetMapping("/{id}/archivo")
    public ResponseEntity<byte[]> archivo(@PathVariable @Min(1) Long id) {
        ArchivoOriginal archivo = documentosService.obtenerArchivo(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(archivo.contentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePrivate())
                .body(archivo.contenido());
    }

    /** Casos urgentes recientes (alertas en tiempo real de la interfaz). */
    @PreAuthorize("hasAnyRole('ADMIN', 'PERSONAL', 'AUDITOR')")
    @GetMapping("/alertas")
    public ResponseEntity<List<AlertaResponse>> alertas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime desde) {
        return ResponseEntity.ok(documentosService.alertas(desde));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(
            @PathVariable @Min(1) Long id) {
        documentosService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
