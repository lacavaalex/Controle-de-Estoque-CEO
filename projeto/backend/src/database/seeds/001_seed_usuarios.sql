INSERT INTO usuario (nome, email, senha_hash, cargo, role, unidade, avatar) VALUES
(
    'Usuário Gestão (exemplo)',
    'gestao@ufpe.br',
    '$2a$10$PLACEHOLDER_HASH_TROCAR_EM_PRODUCAO_XXXXXXXXXXXXXXXXXXX',
    'Coordenação Administrativa',
    'gestao',
    'Diretoria CEO',
    'GE'
),
(
    'Usuário Almoxarife (exemplo)',
    'almoxarife@ufpe.br',
    '$2a$10$PLACEHOLDER_HASH_TROCAR_EM_PRODUCAO_XXXXXXXXXXXXXXXXXXX',
    'Almoxarife',
    'almoxarife',
    'Unidade de Dispensação',
    'AL'
),
(
    'Usuário Dentista (exemplo)',
    'dentista@ufpe.br',
    '$2a$10$PLACEHOLDER_HASH_TROCAR_EM_PRODUCAO_XXXXXXXXXXXXXXXXXXX',
    'Dentista do CEO',
    'dentista',
    'CEO',
    'DE'
);
