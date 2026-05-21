CREATE TABLE solicitacao (
    id                    VARCHAR(10)        PRIMARY KEY
                          CHECK (id ~ '^SOL-[0-9]{3,}$'),

    item_id               BIGINT             NOT NULL
                          REFERENCES item(id) ON DELETE RESTRICT,

    item_nome             VARCHAR(150)       NOT NULL,

    solicitante           VARCHAR(150)       NOT NULL,

    cargo                 VARCHAR(100)       NOT NULL,

    data_solicitacao      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

    quantidade_solicitada INTEGER            NOT NULL
                          CHECK (quantidade_solicitada >= 1),

    unidade               unidade_medida     NOT NULL,

    justificativa         TEXT               NOT NULL
                          CHECK (LENGTH(TRIM(justificativa)) >= 10),

    status                status_solicitacao NOT NULL DEFAULT 'pendente',

    data_conclusao        TIMESTAMPTZ,
    responsavel           VARCHAR(150),
    observacao            TEXT,

    CHECK (
        (status = 'pendente'
            AND data_conclusao IS NULL AND responsavel IS NULL)
        OR
        (status IN ('aprovada', 'negada')
            AND data_conclusao IS NOT NULL AND responsavel IS NOT NULL)
    )
);
