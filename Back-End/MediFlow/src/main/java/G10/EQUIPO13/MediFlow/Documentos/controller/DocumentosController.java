package G10.EQUIPO13.MediFlow.Documentos.controller;

import G10.EQUIPO13.MediFlow.Documentos.Service.DocumentosService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/documentos")
@Validated
public class DocumentosController {

    private final DocumentosService documentosService;


    @PreAuthorize("hasAnyRole('ADMIN', 'PERSONAL', 'AUDITOR')")
    @PostMapping("/analyze/text")
    public DocumentosResponse analyzeText(
            @RequestBody @Valid DocumentosRequest documentosRequest) {

        return documentosService.analizeText(documentosRequest);
    }


    @PreAuthorize("hasAnyRole('ADMIN', 'PERSONAL', 'AUDITOR')")
    @PostMapping(
            value = "/analyze/file",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public DocumentosResponse analyzeFile(
            @RequestPart("archivo") MultipartFile archivo) {

        return documentosService.analizeFile(archivo);
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


    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(
            @PathVariable @Min(1) Long id) {

        documentosService.deleteById(id);

        return ResponseEntity.ok().build();
    }
}