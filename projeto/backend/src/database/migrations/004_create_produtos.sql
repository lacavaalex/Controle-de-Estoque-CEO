CREATE TABLE IF NOT EXISTS produtos (
    id        BIGSERIAL         PRIMARY KEY,
    name      VARCHAR(150)      NOT NULL UNIQUE,
    category  categoria_produto  NOT NULL,
    unit      unidade_medida    NOT NULL,
    min_stock DECIMAL(10,2)     NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
    max_stock DECIMAL(10,2)     NOT NULL DEFAULT 0 CHECK (max_stock >= min_stock),
    active    BOOLEAN           NOT NULL DEFAULT TRUE
);
