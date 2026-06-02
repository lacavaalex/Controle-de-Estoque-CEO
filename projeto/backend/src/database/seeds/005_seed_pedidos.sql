--Pedido expedido (histórico completo)
INSERT INTO pedidos
    (id, setor_origem_id, setor_destino_id, solicitante_id, justificativa, status, data_criacao)
VALUES
(
    'PED-001',
    1, 2,
    3,
    'Reposição mensal de insumos odontológicos para atendimento do CEO.',
    'expedido',
    NOW() - INTERVAL '3 days'
);

--Pedido pendente (aguardando análise)
INSERT INTO pedidos
    (id, setor_origem_id, setor_destino_id, solicitante_id, justificativa, status, data_criacao)
VALUES
(
    'PED-002',
    1, 2,
    3,
    'Reposição urgente de anestésico para cirurgias agendadas na semana.',
    'pendente',
    NOW() - INTERVAL '1 hour'
);

--Pedido em separação
INSERT INTO pedidos
    (id, setor_origem_id, setor_destino_id, solicitante_id, justificativa, status, data_criacao)
VALUES
(
    'PED-003',
    1, 2,
    3,
    'Materiais de higienização para o mês de junho.',
    'em_separacao',
    NOW() - INTERVAL '6 hours'
);
