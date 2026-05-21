CREATE TABLE movimentacao (
    id              VARCHAR(10)       PRIMARY KEY
                    CHECK (id ~ '^MOV-[0-9]{3,}$'),

    tipo            tipo_movimentacao NOT NULL,

    item_id         BIGINT            NOT NULL
                    REFERENCES item(id) ON DELETE RESTRICT,

    item_nome       VARCHAR(150)      NOT NULL,

    quantidade      INTEGER           NOT NULL,

    unidade         unidade_medida    NOT NULL,

    origem          VARCHAR(120)      NOT NULL,

    destino         local_estoque     NOT NULL,

    responsavel     VARCHAR(150)      NOT NULL,

    data            TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

    solicitacao_id  VARCHAR(10)
                    REFERENCES solicitacao(id) ON DELETE SET NULL
);
