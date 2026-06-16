CREATE TABLE IF NOT EXISTS lotes (
    id                    BIGSERIAL     PRIMARY KEY,
    produto_id            BIGINT        NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
    setor_id              BIGINT        NOT NULL REFERENCES setores(id)  ON DELETE RESTRICT,
    numero_lote           VARCHAR(60)   NOT NULL,
    fabricacao            DATE,
    validade              DATE          NOT NULL,
    quantidade            DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
    estado                estado_lote   NOT NULL DEFAULT 'disponivel',
    data_segregacao       TIMESTAMPTZ,
    observacao_segregacao TEXT,
    atualizado_em         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_lote_produto_setor_numero UNIQUE (produto_id, setor_id, numero_lote)
);

CREATE OR REPLACE FUNCTION fn_lotes_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lotes_atualizado_em ON lotes;
CREATE TRIGGER trg_lotes_atualizado_em
    BEFORE UPDATE ON lotes
    FOR EACH ROW EXECUTE FUNCTION fn_lotes_atualizado_em();
