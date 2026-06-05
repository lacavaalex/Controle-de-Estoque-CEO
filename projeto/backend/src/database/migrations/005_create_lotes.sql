CREATE TABLE IF NOT EXISTS lotes (
    id               BIGSERIAL     PRIMARY KEY,
    product_id       BIGINT        NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
    sector_id        BIGINT        NOT NULL REFERENCES setores(id)  ON DELETE RESTRICT,
    lot_number       VARCHAR(60)   NOT NULL,
    manufactured_at  DATE,
    expires_at       DATE          NOT NULL,
    quantity         DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    status           estado_lote   NOT NULL DEFAULT 'disponivel',
    segregated_at    TIMESTAMPTZ,
    segregation_note TEXT,
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_lote_produto_setor_numero UNIQUE (product_id, sector_id, lot_number)
);

CREATE OR REPLACE FUNCTION fn_lotes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lotes_updated_at ON lotes;
CREATE TRIGGER trg_lotes_updated_at
    BEFORE UPDATE ON lotes
    FOR EACH ROW EXECUTE FUNCTION fn_lotes_updated_at();
