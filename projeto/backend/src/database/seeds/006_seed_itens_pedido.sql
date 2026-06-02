SET client_encoding = 'UTF8';

--PED-001 (expedido)
INSERT INTO itens_pedido
    (pedido_id, produto_id, qtd_solicitada, unidade, status_item,
     qtd_expedida, lote_expedido_id, processado_por_id, data_processamento)
VALUES (
    'PED-001',
    (SELECT id FROM produtos WHERE nome = 'Luva de Procedimento M'),
    3, 'caixa', 'atendido', 3,
    (SELECT id FROM lotes WHERE numero_lote = 'LTLUVA-M-2024-A'),
    2, NOW() - INTERVAL '2 days 20 hours'
);

INSERT INTO itens_pedido
    (pedido_id, produto_id, qtd_solicitada, unidade, status_item,
     qtd_expedida, lote_expedido_id,
     motivo_divergencia, observacao_motivo,
     processado_por_id, data_processamento)
VALUES (
    'PED-001',
    (SELECT id FROM produtos WHERE nome = 'Resina Composta A2'),
    10, 'seringa', 'parcial', 8,
    (SELECT id FROM lotes WHERE numero_lote = 'LTRES-A2-2025-A'),
    'estoque_insuficiente',
    'Apenas 8 seringas disponiveis no lote LTRES-A2-2025-A. Restante atendido na proxima reposicao.',
    2, NOW() - INTERVAL '2 days 19 hours'
);

INSERT INTO itens_pedido
    (pedido_id, produto_id, qtd_solicitada, unidade, status_item,
     qtd_expedida, motivo_divergencia, observacao_motivo,
     processado_por_id, data_processamento)
VALUES (
    'PED-001',
    (SELECT id FROM produtos WHERE nome = 'Adesivo Dentinario'),
    5, 'frasco', 'nao_atendido', 0,
    'lote_em_analise',
    'Lote LTADES-2023-A retido para analise de qualidade. Aguardar liberacao.',
    2, NOW() - INTERVAL '2 days 18 hours'
);

--PED-002 (pendente)
INSERT INTO itens_pedido (pedido_id, produto_id, qtd_solicitada, unidade, status_item) VALUES
    ('PED-002', (SELECT id FROM produtos WHERE nome = 'Prilocaina c/ Vasoconstritor'), 2, 'caixa',   'pendente'),
    ('PED-002', (SELECT id FROM produtos WHERE nome = 'Lidocaina 2%'),                 1, 'caixa',   'pendente'),
    ('PED-002', (SELECT id FROM produtos WHERE nome = 'Articaina 4%'),                 1, 'caixa',   'pendente');

--PED-003 (em separacao)
INSERT INTO itens_pedido (pedido_id, produto_id, qtd_solicitada, unidade, status_item) VALUES
    ('PED-003', (SELECT id FROM produtos WHERE nome = 'Alcool 70%'),      3, 'frasco', 'pendente'),
    ('PED-003', (SELECT id FROM produtos WHERE nome = 'Clorexidina 0,12%'), 2, 'frasco', 'pendente');
