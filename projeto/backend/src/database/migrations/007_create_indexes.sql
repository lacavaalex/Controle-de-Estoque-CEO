CREATE INDEX idx_item_validade          ON item(validade);
CREATE INDEX idx_item_nome              ON item(nome);
CREATE INDEX idx_item_lote              ON item(lote);
CREATE INDEX idx_solicitacao_status_data ON solicitacao(status, data_solicitacao DESC);
CREATE INDEX idx_solicitacao_solicitante ON solicitacao(solicitante);
CREATE INDEX idx_movimentacao_data      ON movimentacao(data DESC);
CREATE INDEX idx_estoque_ceo_item       ON estoque_ceo(item_id);
