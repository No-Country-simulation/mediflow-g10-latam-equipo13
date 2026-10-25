-- Datos extraídos por la IA, decisión del agente, ubicación en OCI y revisión humana.
ALTER TABLE documentos
    ADD COLUMN matricula_medico      VARCHAR(100) NULL,
    ADD COLUMN paciente_nombre       VARCHAR(255) NULL,
    ADD COLUMN paciente_rut          VARCHAR(50)  NULL,
    ADD COLUMN paciente_edad         SMALLINT     NULL,
    ADD COLUMN estudio_realizado     VARCHAR(500) NULL,
    ADD COLUMN diagnostico_principal VARCHAR(500) NULL,
    ADD COLUMN cie10_sugerido        VARCHAR(20)  NULL,
    ADD COLUMN medicamentos          TEXT         NULL,
    ADD COLUMN destino               VARCHAR(120) NULL,
    ADD COLUMN justificacion         TEXT         NULL,
    ADD COLUMN notificacion_canal    VARCHAR(120) NULL,
    ADD COLUMN notificacion_mensaje  TEXT         NULL,
    ADD COLUMN validacion            LONGTEXT     NULL,
    ADD COLUMN traza                 LONGTEXT     NULL,
    ADD COLUMN canal_origen          VARCHAR(80)  NULL,
    ADD COLUMN nombre_archivo        VARCHAR(255) NULL,
    ADD COLUMN oci_bucket            VARCHAR(100) NULL,
    ADD COLUMN oci_objeto            VARCHAR(500) NULL,
    ADD COLUMN oci_original          VARCHAR(500) NULL,
    ADD COLUMN oci_estado            VARCHAR(40)  NULL,
    ADD COLUMN revision_decision     VARCHAR(20)  NULL,
    ADD COLUMN revision_comentario   TEXT         NULL,
    ADD COLUMN revision_revisor      VARCHAR(255) NULL,
    ADD COLUMN revision_fecha        DATETIME     NULL;

CREATE INDEX idx_documentos_fecha ON documentos (fecha_registro);
CREATE INDEX idx_documentos_prioridad_fecha ON documentos (prioridad, fecha_registro);

-- Reglas de triaje editables desde la interfaz (una sola fila).
CREATE TABLE configuracion_triaje (
    id                  BIGINT       NOT NULL,
    umbral              DECIMAL(4,3) NOT NULL DEFAULT 0.600,
    terminos_urgencia   TEXT         NULL,
    destinos            TEXT         NULL,
    actualizado_por     VARCHAR(255) NULL,
    fecha_actualizacion DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

INSERT INTO configuracion_triaje (id, umbral, terminos_urgencia, destinos) VALUES (
    1,
    0.600,
    '["tromboembolismo","embolia pulmonar","tep","infarto","iam","síndrome coronario","acv","accidente cerebrovascular","ictus","sepsis","shock","hemorragia","paro cardiorrespiratorio","neumotórax","disección aórtica","abdomen agudo","crisis hipertensiva","anafilaxia","status epiléptico","disnea súbita","urgente","emergencia","stat"]',
    '[{"id":"urgencias","nombre":"Cola_Emergencia_Medica","tipoDocumento":"*","activo":true},{"id":"farmacia","nombre":"Farmacia_Hospitalaria","tipoDocumento":"Receta","activo":true},{"id":"imagenes","nombre":"Historia_Clinica_Electronica","tipoDocumento":"Informe de Estudio por Imágenes","activo":true},{"id":"autorizaciones","nombre":"Auditoria_Autorizaciones","tipoDocumento":"Orden de Procedimiento","activo":true},{"id":"epicrisis","nombre":"Historia_Clinica_Electronica","tipoDocumento":"Epicrisis","activo":true},{"id":"certificados","nombre":"Historia_Clinica_Electronica","tipoDocumento":"Certificado Médico","activo":true},{"id":"revision","nombre":"Cola_Revision_Humana","tipoDocumento":"*","activo":true}]'
);
