CREATE TABLE estudios (
    id BIGINT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(255),
    diagnistico_principal VARCHAR(255),
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cie10_sugerido VARCHAR(255),

    medico_id BIGINT,
    paciente_id BIGINT,

    PRIMARY KEY (id),

    CONSTRAINT fk_estudios_medico
        FOREIGN KEY (medico_id)
        REFERENCES usuarios(id),

    CONSTRAINT fk_estudios_paciente
        FOREIGN KEY (paciente_id)
        REFERENCES pacientes(id)
);