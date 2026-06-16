--lotes: busca FEFO (produto + validade), por setor e por estado
CREATE INDEX IF NOT EXISTS idx_lotes_produto_validade ON lotes (produto_id, validade ASC);
CREATE INDEX IF NOT EXISTS idx_lotes_setor            ON lotes (setor_id);
CREATE INDEX IF NOT EXISTS idx_lotes_estado           ON lotes (estado);

--pedidos: filtro por status, por setor destino e por solicitante
CREATE INDEX IF NOT EXISTS idx_pedidos_status      ON pedidos (status);
CREATE INDEX IF NOT EXISTS idx_pedidos_destino     ON pedidos (setor_destino_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_solicitante ON pedidos (solicitante_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_criacao     ON pedidos (data_criacao DESC);

--itens_pedido: lookup por pedido e por produto
CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido  ON itens_pedido (pedido_id);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_produto ON itens_pedido (produto_id);

--movimentacoes: auditoria por lote, produto, data e pedido
CREATE INDEX IF NOT EXISTS idx_mov_lote    ON movimentacoes (lote_id);
CREATE INDEX IF NOT EXISTS idx_mov_produto ON movimentacoes (produto_id);
CREATE INDEX IF NOT EXISTS idx_mov_data    ON movimentacoes (data DESC);
CREATE INDEX IF NOT EXISTS idx_mov_pedido  ON movimentacoes (pedido_id);
