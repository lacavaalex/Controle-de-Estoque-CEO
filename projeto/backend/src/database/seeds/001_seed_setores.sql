INSERT INTO setores (name) VALUES
    ('HO - Almoxarifado Central'),
    ('CEO - Centro de Especialidades Odontologicas')
ON CONFLICT (name) DO NOTHING;
