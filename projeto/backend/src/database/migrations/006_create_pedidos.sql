CREATE TABLE IF NOT EXISTS pedidos (
    id                    VARCHAR(10)   PRIMARY KEY,
    origin_sector_id      BIGINT        NOT NULL REFERENCES setores(id)  ON DELETE RESTRICT,
    destination_sector_id BIGINT        NOT NULL REFERENCES setores(id)  ON DELETE RESTRICT,
    requester_id          BIGINT        NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    justification         TEXT          NOT NULL,
    status                status_pedido NOT NULL DEFAULT 'pendente',
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_pedido_setores_distintos CHECK (origin_sector_id <> destination_sector_id)
);

CREATE TABLE IF NOT EXISTS itens_pedido (
    id                  BIGSERIAL          PRIMARY KEY,
    pedido_id           VARCHAR(10)        NOT NULL REFERENCES pedidos(id)  ON DELETE RESTRICT,
    product_id          BIGINT             NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
    requested_qty       DECIMAL(10,2)      NOT NULL CHECK (requested_qty > 0),
    unit                unidade_medida     NOT NULL,
    status_item         status_item_pedido NOT NULL DEFAULT 'pendente',
    dispatched_qty      DECIMAL(10,2)               CHECK (dispatched_qty >= 0),
    dispatched_lot_id   BIGINT                       REFERENCES lotes(id)    ON DELETE RESTRICT,
    divergence_reason   VARCHAR(80),
    divergence_note     TEXT,
    processed_by_id     BIGINT                       REFERENCES usuarios(id) ON DELETE RESTRICT,
    processed_at        TIMESTAMPTZ
);
