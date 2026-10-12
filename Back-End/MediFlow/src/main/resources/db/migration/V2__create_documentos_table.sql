CREATE TABLE documentos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    status VARCHAR(50),
    tipo VARCHAR(255),
    contenido LONGTEXT,
    especialidad VARCHAR(255),
    prioridad VARCHAR(50),
    documento_id VARCHAR(255),
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    score DECIMAL(10, 8),
    requiere_auditoria BOOLEAN,
    cola_enrutamiento VARCHAR(255),
    usuario_id BIGINT NOT NULL,

    PRIMARY KEY (id),

    CONSTRAINT fk_documentos_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);