CREATE TABLE IF NOT EXISTS usuarios (
    id            BIGSERIAL    PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    job_title     VARCHAR(100) NOT NULL,
    role          role_usuario NOT NULL,
    department    VARCHAR(120) NOT NULL,
    avatar        CHAR(2)
);
