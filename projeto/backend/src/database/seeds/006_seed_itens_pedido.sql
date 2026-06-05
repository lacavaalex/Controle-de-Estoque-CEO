SET client_encoding = 'UTF8';

--PED-001 (expedido)
INSERT INTO itens_pedido
    (pedido_id, product_id, requested_qty, unit, status_item,
     dispatched_qty, dispatched_lot_id, processed_by_id, processed_at)
VALUES (
    'PED-001',
    (SELECT id FROM produtos WHERE name = 'Luva de Procedimento M'),
    3, 'caixa', 'atendido', 3,
    (SELECT id FROM lotes WHERE lot_number = 'LTLUVA-M-2024-A'),
    2, NOW() - INTERVAL '2 days 20 hours'
);

INSERT INTO itens_pedido
    (pedido_id, product_id, requested_qty, unit, status_item,
     dispatched_qty, dispatched_lot_id,
     divergence_reason, divergence_note,
     processed_by_id, processed_at)
VALUES (
    'PED-001',
    (SELECT id FROM produtos WHERE name = 'Resina Composta A2'),
    10, 'seringa', 'parcial', 8,
    (SELECT id FROM lotes WHERE lot_number = 'LTRES-A2-2025-A'),
    'estoque_insuficiente',
    'Apenas 8 seringas disponiveis no lote LTRES-A2-2025-A. Restante atendido na proxima reposicao.',
    2, NOW() - INTERVAL '2 days 19 hours'
);

INSERT INTO itens_pedido
    (pedido_id, product_id, requested_qty, unit, status_item,
     dispatched_qty, divergence_reason, divergence_note,
     processed_by_id, processed_at)
VALUES (
    'PED-001',
    (SELECT id FROM produtos WHERE name = 'Adesivo Dentinario'),
    5, 'frasco', 'nao_atendido', 0,
    'lote_em_analise',
    'Lote LTADES-2023-A retido para analise de qualidade. Aguardar liberacao.',
    2, NOW() - INTERVAL '2 days 18 hours'
);

--PED-002 (pendente)
INSERT INTO itens_pedido (pedido_id, product_id, requested_qty, unit, status_item) VALUES
    ('PED-002', (SELECT id FROM produtos WHERE name = 'Prilocaina c/ Vasoconstritor'), 2, 'caixa',   'pendente'),
    ('PED-002', (SELECT id FROM produtos WHERE name = 'Lidocaina 2%'),                 1, 'caixa',   'pendente'),
    ('PED-002', (SELECT id FROM produtos WHERE name = 'Articaina 4%'),                 1, 'caixa',   'pendente');

--PED-003 (em separacao)
INSERT INTO itens_pedido (pedido_id, product_id, requested_qty, unit, status_item) VALUES
    ('PED-003', (SELECT id FROM produtos WHERE name = 'Alcool 70%'),        3, 'frasco', 'pendente'),
    ('PED-003', (SELECT id FROM produtos WHERE name = 'Clorexidina 0,12%'), 2, 'frasco', 'pendente');
