DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_usuario') THEN
    CREATE TYPE role_usuario AS ENUM ('gestao', 'almoxarife', 'dentista');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria_produto') THEN
    CREATE TYPE categoria_produto AS ENUM (
      'EPI',
      'Anestesico',
      'Material Restaurador',
      'Instrumentais',
      'Higienizacao',
      'Material Cirurgico',
      'Outros'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unidade_medida') THEN
    CREATE TYPE unidade_medida AS ENUM (
      'caixa', 'tubo', 'seringa', 'kit', 'pacote',
      'rolo', 'unidade', 'frasco', 'bastao', 'folha', 'par'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_lote') THEN
    CREATE TYPE estado_lote AS ENUM (
      'disponivel', 'reservado', 'vencido', 'segregado', 'descartado'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_pedido') THEN
    CREATE TYPE status_pedido AS ENUM (
      'pendente', 'em_separacao', 'expedido', 'cancelado'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_item_pedido') THEN
    CREATE TYPE status_item_pedido AS ENUM (
      'pendente', 'atendido', 'parcial', 'nao_atendido'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_movimentacao') THEN
    CREATE TYPE tipo_movimentacao AS ENUM (
      'entrada', 'saida', 'transferencia', 'ajuste', 'segregacao', 'descarte'
    );
  END IF;
END $$;
