INSERT INTO usuarios (name, email, password_hash, job_title, role, department, avatar) VALUES
(
    'Usuario Gestao (exemplo)',
    'gestao@ufpe.br',
    '$2a$10$PLACEHOLDER_HASH_TROCAR_EM_PRODUCAO_XXXXXXXXXXXXXXXXXXX',
    'Coordenacao Administrativa',
    'gestao',
    'HO - Almoxarifado Central',
    'GE'
),
(
    'Usuario Almoxarife (exemplo)',
    'almoxarife@ufpe.br',
    '$2a$10$PLACEHOLDER_HASH_TROCAR_EM_PRODUCAO_XXXXXXXXXXXXXXXXXXX',
    'Tecnico de Almoxarifado',
    'almoxarife',
    'HO - Almoxarifado Central',
    'AL'
),
(
    'Usuario Dentista (exemplo)',
    'dentista@ufpe.br',
    '$2a$10$PLACEHOLDER_HASH_TROCAR_EM_PRODUCAO_XXXXXXXXXXXXXXXXXXX',
    'Cirurgiao-Dentista',
    'dentista',
    'CEO - Centro de Especialidades Odontologicas',
    'DE'
)
ON CONFLICT (email) DO NOTHING;
