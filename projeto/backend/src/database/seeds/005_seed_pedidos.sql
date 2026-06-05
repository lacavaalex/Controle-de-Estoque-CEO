--Pedido expedido (historico completo)
INSERT INTO pedidos
    (id, origin_sector_id, destination_sector_id, requester_id, justification, status, created_at)
VALUES
(
    'PED-001',
    1, 2,
    3,
    'Reposicao mensal de insumos odontologicos para atendimento do CEO.',
    'expedido',
    NOW() - INTERVAL '3 days'
);

--Pedido pendente (aguardando analise)
INSERT INTO pedidos
    (id, origin_sector_id, destination_sector_id, requester_id, justification, status, created_at)
VALUES
(
    'PED-002',
    1, 2,
    3,
    'Reposicao urgente de anestesico para cirurgias agendadas na semana.',
    'pendente',
    NOW() - INTERVAL '1 hour'
);

--Pedido em separacao
INSERT INTO pedidos
    (id, origin_sector_id, destination_sector_id, requester_id, justification, status, created_at)
VALUES
(
    'PED-003',
    1, 2,
    3,
    'Materiais de higienizacao para o mes de junho.',
    'em_separacao',
    NOW() - INTERVAL '6 hours'
);
