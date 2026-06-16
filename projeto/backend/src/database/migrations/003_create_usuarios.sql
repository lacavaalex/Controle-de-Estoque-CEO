CREATE TABLE IF NOT EXISTS usuarios (
    id         BIGSERIAL    PRIMARY KEY,
    nome       VARCHAR(150) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    cargo      VARCHAR(100) NOT NULL,
    role       role_usuario NOT NULL,
    unidade    VARCHAR(120) NOT NULL,
    avatar     CHAR(2)
);
