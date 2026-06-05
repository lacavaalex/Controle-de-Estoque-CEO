CREATE TABLE IF NOT EXISTS movimentacoes (
    id                    VARCHAR(10)       PRIMARY KEY,
    type                  tipo_movimentacao NOT NULL,
    lote_id               BIGINT            NOT NULL REFERENCES lotes(id)    ON DELETE RESTRICT,
    product_id            BIGINT            NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
    quantity              DECIMAL(10,2)     NOT NULL CHECK (quantity <> 0),
    origin_sector_id      BIGINT                     REFERENCES setores(id)  ON DELETE RESTRICT,
    destination_sector_id BIGINT                     REFERENCES setores(id)  ON DELETE RESTRICT,
    responsible_id        BIGINT            NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    pedido_id             VARCHAR(10)                REFERENCES pedidos(id)  ON DELETE RESTRICT,
    note                  TEXT,
    occurred_at           TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);
