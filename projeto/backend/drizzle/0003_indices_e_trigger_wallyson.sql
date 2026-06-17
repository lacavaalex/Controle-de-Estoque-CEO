-- =============================================================================
-- 0003 — Índices de performance + trigger updated_at em lote
--
-- AUTORIA: porta o trabalho de schema/índices do Wallyson (ExeWall/wrs4),
--   originalmente nas migrations SQL puras 005_create_lotes.sql e
--   008_create_indexes.sql (Jira CEO-121 "Criar script SQL para todas as
--   tabelas" e CEO-180 "Criar Postgres"). A base v2 (Drizzle) reexpressou o
--   modelo dele; estes índices secundários e o trigger NÃO tinham sido
--   migrados. Este arquivo fecha essa lacuna.
--
-- Nomes traduzidos do schema em inglês (lotes/product_id) para o schema v2
-- em snake_case PT-BR (lote/produto_id). Idempotente (IF NOT EXISTS / OR REPLACE).
--
-- COMO APLICAR: depois de `npm run db:migrate`, rode este arquivo uma vez:
--   psql "$DATABASE_URL" -f drizzle/0003_indices_e_trigger_wallyson.sql
-- (ou cole no Drizzle Studio / cliente SQL). É seguro rodar mais de uma vez.
-- =============================================================================

-- ─── lote: coluna updated_at + trigger de atualização automática ─────────────
-- A base v2 não tinha updated_at em lote; o trigger do Wallyson precisa dela.
ALTER TABLE lote ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION fn_lote_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lote_updated_at ON lote;
CREATE TRIGGER trg_lote_updated_at
    BEFORE UPDATE ON lote
    FOR EACH ROW EXECUTE FUNCTION fn_lote_updated_at();

-- ─── lote: busca FEFO (produto + validade), por setor e por estado ───────────
-- (o índice ÚNICO produto+setor+numero já existe na base; estes são de leitura)
CREATE INDEX IF NOT EXISTS idx_lote_produto_validade ON lote (produto_id, validade ASC);
CREATE INDEX IF NOT EXISTS idx_lote_setor            ON lote (setor_id);
CREATE INDEX IF NOT EXISTS idx_lote_estado           ON lote (estado);

-- ─── pedido: filtro por status, por setor destino e por solicitante ──────────
CREATE INDEX IF NOT EXISTS idx_pedido_status      ON pedido (status);
CREATE INDEX IF NOT EXISTS idx_pedido_destino     ON pedido (setor_destino_id);
CREATE INDEX IF NOT EXISTS idx_pedido_origem      ON pedido (setor_origem_id);
CREATE INDEX IF NOT EXISTS idx_pedido_solicitante ON pedido (solicitante_id);
CREATE INDEX IF NOT EXISTS idx_pedido_criacao     ON pedido (data_criacao DESC);

-- ─── item_do_pedido: lookup por pedido e por produto ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_item_pedido  ON item_do_pedido (pedido_id);
CREATE INDEX IF NOT EXISTS idx_item_produto ON item_do_pedido (produto_id);

-- ─── movimentacao: auditoria por lote, produto, data e pedido ────────────────
-- (coluna de data na base v2 chama-se "data", não "occurred_at")
CREATE INDEX IF NOT EXISTS idx_mov_lote    ON movimentacao (lote_id);
CREATE INDEX IF NOT EXISTS idx_mov_produto ON movimentacao (produto_id);
CREATE INDEX IF NOT EXISTS idx_mov_data    ON movimentacao (data DESC);
CREATE INDEX IF NOT EXISTS idx_mov_pedido  ON movimentacao (pedido_id);
