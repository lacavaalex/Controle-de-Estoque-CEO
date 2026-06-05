SET client_encoding = 'UTF8';

INSERT INTO lotes (product_id, sector_id, lot_number, manufactured_at, expires_at, quantity, status) VALUES
((SELECT id FROM produtos WHERE name = 'Luva de Procedimento M'), 1, 'LTLUVA-M-2024-A', '2024-01-10', '2026-07-31',  50, 'disponivel'),
((SELECT id FROM produtos WHERE name = 'Luva de Procedimento M'), 1, 'LTLUVA-M-2025-B', '2025-03-01', '2027-03-31', 120, 'disponivel'),
((SELECT id FROM produtos WHERE name = 'Luva de Procedimento P'), 1, 'LTLUVA-P-2025-A', '2025-02-01', '2027-02-28', 105, 'disponivel'),
((SELECT id FROM produtos WHERE name = 'Luva de Procedimento G'), 1, 'LTLUVA-G-2024-A', '2024-11-01', '2026-12-15',  45, 'disponivel'),
((SELECT id FROM produtos WHERE name = 'Mascara Cirurgica Tripla'), 1, 'LTMASK-2023-X',  '2023-06-01', '2026-06-20',  20, 'disponivel'),
((SELECT id FROM produtos WHERE name = 'Mascara Cirurgica Tripla'), 1, 'LTMASK-2025-Y',  '2025-01-15', '2027-01-15', 150, 'disponivel'),
((SELECT id FROM produtos WHERE name = 'Avental Cirurgico'),       1, 'LTAVEN-2025-A',  '2025-04-01', '2027-11-03',  40, 'disponivel'),
((SELECT id FROM produtos WHERE name = 'Prilocaina c/ Vasoconstritor'), 1, 'LTPRIL-2025-A', '2025-02-10', '2027-05-31', 25, 'disponivel'),
((SELECT id FROM produtos WHERE name = 'Prilocaina c/ Vasoconstritor'), 1, 'LTPRIL-2024-Z', '2024-01-05', '2025-12-31',  4, 'segregado'),
((SELECT id FROM produtos WHERE name = 'Lidocaina 2%'),            1, 'LTLIDO-2025-A',  '2025-01-20', '2027-08-12',   7, 'disponivel'),
((SELECT id FROM produtos WHERE name = 'Resina Composta A2'),      1, 'LTRES-A2-2025-A','2025-04-01', '2027-06-30',  48, 'disponivel'),
((SELECT id FROM produtos WHERE name = 'Resina Composta A2'),      2, 'LTRES-A2-2024-B','2024-11-20', '2026-11-20',   4, 'disponivel'),
((SELECT id FROM produtos WHERE name = 'Adesivo Dentinario'),      1, 'LTADES-2023-A',  '2023-05-01', '2026-06-22',  15, 'disponivel'),
((SELECT id FROM produtos WHERE name = 'Gaze Esteril'),            1, 'LTGAZE-2025-A',  '2025-01-01', '2026-07-22',  40, 'disponivel'),
((SELECT id FROM produtos WHERE name = 'Fio de Sutura Nylon 4-0'), 1, 'LTNYL-2022-A',   '2022-01-01', '2025-05-25',  18, 'vencido'),
((SELECT id FROM produtos WHERE name = 'Alcool 70%'),              1, 'LTALC70-2025-A', '2025-01-20', '2027-08-14',  18, 'disponivel'),
((SELECT id FROM produtos WHERE name = 'Alcool 99,5%'),            1, 'LTALC99-2025-A', '2025-02-08', '2027-04-08',  15, 'disponivel'),
((SELECT id FROM produtos WHERE name = 'Gesso Tipo III'),          1, 'LTGES-2025-A',   '2025-01-10', '2028-04-15',  35, 'disponivel'),
((SELECT id FROM produtos WHERE name = 'Alginato Tipo II'),        1, 'LTALI-2024-A',   '2024-11-08', '2027-12-08',  20, 'disponivel');

UPDATE lotes
SET segregated_at    = NOW() - INTERVAL '5 days',
    segregation_note = 'Embalagem danificada detectada na conferencia de recebimento.'
WHERE lot_number = 'LTPRIL-2024-Z';
