CREATE TABLE IF NOT EXISTS produtos (
    id             BIGSERIAL         PRIMARY KEY,
    nome           VARCHAR(150)      NOT NULL UNIQUE,
    categoria      categoria_produto  NOT NULL,
    unidade        unidade_medida    NOT NULL,
    estoque_minimo DECIMAL(10,2)     NOT NULL DEFAULT 0 CHECK (estoque_minimo >= 0),
    estoque_maximo DECIMAL(10,2)     NOT NULL DEFAULT 0 CHECK (estoque_maximo >= estoque_minimo),
    ativo          BOOLEAN           NOT NULL DEFAULT TRUE
);
