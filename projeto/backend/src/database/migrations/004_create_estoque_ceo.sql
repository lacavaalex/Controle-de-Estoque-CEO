CREATE TABLE estoque_ceo (
    id              BIGSERIAL      PRIMARY KEY,
    item_id         BIGINT         NOT NULL
                    REFERENCES item(id) ON DELETE RESTRICT,
    nome            VARCHAR(150)   NOT NULL,
    categoria       categoria_item NOT NULL,
    quantidade      INTEGER        NOT NULL DEFAULT 0
                    CHECK (quantidade >= 0),
    unidade         unidade_medida NOT NULL,
    estoque_minimo  INTEGER        NOT NULL DEFAULT 0
                    CHECK (estoque_minimo >= 0),

    UNIQUE (item_id)
);
