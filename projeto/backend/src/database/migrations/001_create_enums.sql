CREATE TYPE role_usuario AS ENUM ('gestao', 'almoxarife', 'dentista');

CREATE TYPE categoria_item AS ENUM (
    'EPI',
    'Anestésico',
    'Material Restaurador',
    'Instrumentais',
    'Higienização',
    'Material Cirúrgico',
    'Outros'
);

CREATE TYPE unidade_medida AS ENUM (
    'caixa',
    'tubo',
    'seringa',
    'kit',
    'pacote',
    'rolo',
    'unidade',
    'frasco',
    'bastão',
    'folha',
    'par'
);

CREATE TYPE status_solicitacao AS ENUM ('pendente', 'aprovada', 'negada');

CREATE TYPE tipo_movimentacao AS ENUM ('entrada', 'saida', 'ajuste');

CREATE TYPE local_estoque AS ENUM ('Dispensação', 'CEO');
