INSERT INTO usuarios (nome, email, senha_hash, cargo, role, unidade, avatar) VALUES
(
    'Usuário Gestão (exemplo)',
    'gestao@ufpe.br',
    '$2a$10$PLACEHOLDER_HASH_TROCAR_EM_PRODUCAO_XXXXXXXXXXXXXXXXXXX',
    'Coordenação Administrativa',
    'gestao',
    'HO — Almoxarifado Central',
    'GE'
),
(
    'Usuário Almoxarife (exemplo)',
    'almoxarife@ufpe.br',
    '$2a$10$PLACEHOLDER_HASH_TROCAR_EM_PRODUCAO_XXXXXXXXXXXXXXXXXXX',
    'Técnico de Almoxarifado',
    'almoxarife',
    'HO — Almoxarifado Central',
    'AL'
),
(
    'Usuário Dentista (exemplo)',
    'dentista@ufpe.br',
    '$2a$10$PLACEHOLDER_HASH_TROCAR_EM_PRODUCAO_XXXXXXXXXXXXXXXXXXX',
    'Cirurgiã-Dentista',
    'dentista',
    'CEO — Centro de Especialidades Odontológicas',
    'DE'
)
ON CONFLICT (email) DO NOTHING;
