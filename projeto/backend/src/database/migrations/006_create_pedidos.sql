CREATE TABLE IF NOT EXISTS pedidos (
    id               VARCHAR(10)   PRIMARY KEY,
    setor_origem_id  BIGINT        NOT NULL REFERENCES setores(id)  ON DELETE RESTRICT,
    setor_destino_id BIGINT        NOT NULL REFERENCES setores(id)  ON DELETE RESTRICT,
    solicitante_id   BIGINT        NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    justificativa    TEXT          NOT NULL,
    status           status_pedido NOT NULL DEFAULT 'pendente',
    data_criacao     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_pedido_setores_distintos CHECK (setor_origem_id <> setor_destino_id)
);

CREATE TABLE IF NOT EXISTS itens_pedido (
    id                 BIGSERIAL          PRIMARY KEY,
    pedido_id          VARCHAR(10)        NOT NULL REFERENCES pedidos(id)  ON DELETE RESTRICT,
    produto_id         BIGINT             NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
    qtd_solicitada     DECIMAL(10,2)      NOT NULL CHECK (qtd_solicitada > 0),
    unidade            unidade_medida     NOT NULL,
    status_item        status_item_pedido NOT NULL DEFAULT 'pendente',
    qtd_expedida       DECIMAL(10,2)               CHECK (qtd_expedida >= 0),
    lote_expedido_id   BIGINT                       REFERENCES lotes(id)    ON DELETE RESTRICT,
    motivo_divergencia VARCHAR(80),
    observacao_motivo  TEXT,
    processado_por_id  BIGINT                       REFERENCES usuarios(id) ON DELETE RESTRICT,
    data_processamento TIMESTAMPTZ
);
