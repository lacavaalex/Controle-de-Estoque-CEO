INSERT INTO movimentacao
    (id, tipo, item_id, item_nome, quantidade, unidade,
     origem, destino, responsavel, data, solicitacao_id)
VALUES

('MOV-001', 'entrada',
    1, 'Luva de Procedimento P',
    50, 'caixa',
    'DistribMed Ltda', 'Dispensação',
    'Usuário Almoxarife (exemplo)',
    NOW() - INTERVAL '20 days',
    NULL),

('MOV-002', 'entrada',
    17, 'Gaze Estéril',
    100, 'pacote',
    'Cremer S.A.', 'Dispensação',
    'Usuário Almoxarife (exemplo)',
    NOW() - INTERVAL '18 days',
    NULL),

('MOV-003', 'saida',
    1, 'Luva de Procedimento P',
    2, 'caixa',
    'Dispensação', 'CEO',
    'Usuário Almoxarife (exemplo)',
    NOW() - INTERVAL '3 days 22 hours',
    'SOL-004'),

('MOV-004', 'saida',
    17, 'Gaze Estéril',
    3, 'pacote',
    'Dispensação', 'CEO',
    'Usuário Almoxarife (exemplo)',
    NOW() - INTERVAL '7 days 21 hours',
    'SOL-005'),

('MOV-005', 'saida',
    23, 'Álcool 70%',
    2, 'frasco',
    'Dispensação', 'CEO',
    'Usuário Almoxarife (exemplo)',
    NOW() - INTERVAL '11 days 20 hours',
    'SOL-006'),

('MOV-006', 'ajuste',
    8, 'Prilocaína c/ Vasoconstritor',
    -1, 'caixa',
    'Dispensação', 'Dispensação',
    'Usuário Almoxarife (exemplo)',
    NOW() - INTERVAL '10 days',
    NULL);
