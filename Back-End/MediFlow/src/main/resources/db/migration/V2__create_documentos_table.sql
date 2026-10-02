CREATE TABLE documentos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tipo VARCHAR(50) NOT NULL,
    contenido TEXT,
    documento_id VARCHAR(255) UNIQUE,
    especialidad VARCHAR(100),
    prioridad VARCHAR(50) NOT NULL DEFAULT 'MEDIA',
    fecha_registro      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    score DECIMAL(5,4),
    usuario_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_documentos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
);