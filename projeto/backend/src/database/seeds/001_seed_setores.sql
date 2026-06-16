INSERT INTO setores (nome) VALUES
    ('HO — Almoxarifado Central'),
    ('CEO — Centro de Especialidades Odontológicas')
ON CONFLICT (nome) DO NOTHING;
