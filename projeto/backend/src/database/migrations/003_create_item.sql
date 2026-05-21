CREATE TABLE item (
    id              BIGSERIAL      PRIMARY KEY,
    nome            VARCHAR(150)   NOT NULL,
    categoria       categoria_item NOT NULL,
    lote            VARCHAR(40)    NOT NULL,
    quantidade      INTEGER        NOT NULL DEFAULT 0
                    CHECK (quantidade >= 0),
    unidade         unidade_medida NOT NULL,
    estoque_minimo  INTEGER        NOT NULL DEFAULT 0
                    CHECK (estoque_minimo >= 0),
    estoque_maximo  INTEGER        NOT NULL DEFAULT 9999
                    CHECK (estoque_maximo >= estoque_minimo),
    validade        DATE           NOT NULL,
    localizacao     VARCHAR(80),
    fornecedor      VARCHAR(120),

    UNIQUE (nome, lote)
);
