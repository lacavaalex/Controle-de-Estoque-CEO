CREATE TABLE IF NOT EXISTS movimentacoes (
    id               VARCHAR(10)       PRIMARY KEY,
    tipo             tipo_movimentacao NOT NULL,
    lote_id          BIGINT            NOT NULL REFERENCES lotes(id)    ON DELETE RESTRICT,
    produto_id       BIGINT            NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
    quantidade       DECIMAL(10,2)     NOT NULL CHECK (quantidade <> 0),
    setor_origem_id  BIGINT                     REFERENCES setores(id)  ON DELETE RESTRICT,
    setor_destino_id BIGINT                     REFERENCES setores(id)  ON DELETE RESTRICT,
    responsavel_id   BIGINT            NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    pedido_id        VARCHAR(10)                REFERENCES pedidos(id)  ON DELETE RESTRICT,
    observacao       TEXT,
    data             TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);
