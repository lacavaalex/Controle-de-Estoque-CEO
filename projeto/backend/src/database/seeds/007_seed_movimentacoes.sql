SET client_encoding = 'UTF8';

INSERT INTO movimentacoes
    (id, tipo, lote_id, produto_id, quantidade,
     setor_origem_id, setor_destino_id, responsavel_id,
     pedido_id, observacao, data)
VALUES
(
    'MOV-001', 'entrada',
    (SELECT id FROM lotes WHERE numero_lote = 'LTLUVA-M-2024-A'),
    (SELECT id FROM produtos WHERE nome = 'Luva de Procedimento M'),
    50, NULL, 1, 2, NULL,
    'Recebimento inicial - NF 4821/2024.',
    NOW() - INTERVAL '20 days'
),
(
    'MOV-002', 'entrada',
    (SELECT id FROM lotes WHERE numero_lote = 'LTLUVA-M-2025-B'),
    (SELECT id FROM produtos WHERE nome = 'Luva de Procedimento M'),
    120, NULL, 1, 2, NULL,
    'Recebimento - NF 1203/2025.',
    NOW() - INTERVAL '10 days'
),
(
    'MOV-003', 'saida',
    (SELECT id FROM lotes WHERE numero_lote = 'LTLUVA-M-2024-A'),
    (SELECT id FROM produtos WHERE nome = 'Luva de Procedimento M'),
    -3, 1, 2, 2, 'PED-001',
    'Dispensacao referente ao PED-001 - item 1 (Luva M).',
    NOW() - INTERVAL '2 days 20 hours'
),
(
    'MOV-004', 'saida',
    (SELECT id FROM lotes WHERE numero_lote = 'LTRES-A2-2025-A'),
    (SELECT id FROM produtos WHERE nome = 'Resina Composta A2'),
    -8, 1, 2, 2, 'PED-001',
    'Atendimento parcial - PED-001 item 2 (Resina A2). Solicitado: 10, expedido: 8.',
    NOW() - INTERVAL '2 days 19 hours'
),
(
    'MOV-005', 'segregacao',
    (SELECT id FROM lotes WHERE numero_lote = 'LTPRIL-2024-Z'),
    (SELECT id FROM produtos WHERE nome = 'Prilocaina c/ Vasoconstritor'),
    -4, 1, NULL, 2, NULL,
    'Lote LTPRIL-2024-Z segregado por embalagem danificada na conferencia de recebimento.',
    NOW() - INTERVAL '5 days'
),
(
    'MOV-006', 'ajuste',
    (SELECT id FROM lotes WHERE numero_lote = 'LTALC70-2025-A'),
    (SELECT id FROM produtos WHERE nome = 'Alcool 70%'),
    -2, 1, NULL, 1, NULL,
    'Ajuste de inventario: divergencia de -2 frascos encontrada na contagem fisica mensal.',
    NOW() - INTERVAL '8 days'
);
