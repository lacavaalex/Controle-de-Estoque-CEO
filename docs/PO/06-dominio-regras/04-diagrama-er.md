# Diagrama Entidade-Relacionamento (E-R) — Schema físico v2

**Documento:** 04-diagrama-er
**Última atualização:** 02/06/2026
**Origem:** derivado de `03-modelo-conceitual.md` (v2) e implementado em
`projeto/backend/src/db/schema.ts` (Drizzle ORM — ver ADR-0004).
**Fecha:** SCRUM-10 (modelagem do banco + diagrama E-R).

> Este é o modelo **físico** (tabelas, colunas, FKs, enums) tal como está no
> Postgres. O modelo **conceitual** continua em `03-modelo-conceitual.md`.
> Invariantes INV01–INV09 e regras RN02/RN09/RN16/RN17 estão materializados como
> enums, FKs, UNIQUE e CHECK constraints (ver `schema.ts` e a migration em
> `projeto/backend/drizzle/`).

## Diagrama (mermaid)

```mermaid
erDiagram
    SETOR ||--o{ USUARIO : "vincula"
    SETOR ||--o{ LOTE : "abriga"
    SETOR ||--o{ PEDIDO : "origem/destino"
    SETOR ||--o{ MOVIMENTACAO : "origem/destino"

    USUARIO ||--o{ PEDIDO : "cria (solicitante)"
    USUARIO ||--o{ ITEM_DO_PEDIDO : "processa"
    USUARIO ||--o{ MOVIMENTACAO : "responsavel"

    PRODUTO ||--o{ LOTE : "tem (0..N)"
    PRODUTO ||--o{ ITEM_DO_PEDIDO : "refere-se"
    PRODUTO ||--o{ MOVIMENTACAO : "denormalizado"

    PEDIDO ||--o{ ITEM_DO_PEDIDO : "contém (1..N)"
    PEDIDO ||--o{ MOVIMENTACAO : "gera"

    LOTE ||--o{ ITEM_DO_PEDIDO : "expedido em"
    LOTE ||--o{ MOVIMENTACAO : "movimenta"

    SETOR {
        serial id PK
        text nome
        enum tipo "almoxarifado|destinatario"
        text email_institucional
    }

    USUARIO {
        serial id PK
        text nome
        text email UK "CHECK LIKE %@ufpe.br"
        text cargo
        enum perfil "gestor|almoxarife|solicitante|dentista"
        int  setor_id FK
        varchar avatar "2 chars"
        text senha_hash "bcrypt/argon2 (Etapa 3)"
        bool trocar_senha
        timestamptz criado_em
    }

    PRODUTO {
        serial id PK
        text nome
        enum categoria "RN02 (8 valores)"
        enum unidade
        int  estoque_minimo "CHECK >= 0"
        int  estoque_maximo "CHECK >= 0"
        text localizacao
        text fornecedor
    }

    LOTE {
        serial id PK
        int  produto_id FK
        int  setor_id FK
        text numero_lote
        date fabricacao
        date validade
        int  quantidade "CHECK >= 0 (INV05)"
        enum estado "ativo|vencido|segregado (RN17)"
        date data_segregacao "CHECK: not null se segregado"
        text observacao_segregacao
    }

    PEDIDO {
        text id PK "PED-NNN"
        int  setor_origem_id FK
        int  setor_destino_id FK
        int  solicitante_id FK
        timestamptz data_criacao
        text justificativa "CHECK length >= 10 (RN09)"
        enum status "derivado (RN10)"
    }

    ITEM_DO_PEDIDO {
        serial id PK
        text pedido_id FK "ON DELETE CASCADE"
        int  produto_id FK "XOR descricao_livre (INV07)"
        text descricao_livre "linha livre (RN18)"
        int  qtd_solicitada "CHECK >= 1 (RN09)"
        int  qtd_expedida "CHECK >= 0"
        int  lote_expedido_id FK
        enum unidade
        enum status_item "RN10"
        enum motivo_divergencia "RN16"
        text observacao_motivo
        int  item_pai_id "desdobramento (RF05.17)"
        int  processado_por_id FK
        timestamptz data_processamento
    }

    MOVIMENTACAO {
        text id PK "MOV-NNN"
        enum tipo "entrada|saida|ajuste|consumo|segregacao"
        int  lote_id FK "INV01"
        int  produto_id FK
        int  quantidade "pode ser negativa"
        int  setor_origem_id FK
        int  setor_destino_id FK
        int  responsavel_id FK
        timestamptz data
        text pedido_id FK
        text observacao
    }
```

## Invariantes refletidos no schema físico

| Invariante / Regra | Como está no banco |
|--------------------|--------------------|
| INV01 — toda Movimentação referencia um Lote | `movimentacao.lote_id` FK NOT NULL |
| INV04 — Lote referencia Produto e exatamente um Setor | `lote.produto_id` + `lote.setor_id` FKs NOT NULL |
| INV05 — quantidade do Lote sempre ≥ 0 | CHECK `lote_quantidade_nao_negativa` |
| INV06 — Usuário tem um perfil e um setor | `usuario.perfil` enum NOT NULL + `setor_id` FK NOT NULL |
| INV07 — ItemDoPedido tem produto_id XOR descricao_livre | CHECK `item_produto_xor_descricao` |
| RN02 — catálogo fechado de categorias | enum `categoria` (8 valores) |
| RN09 — justificativa ≥ 10 / qtd_solicitada ≥ 1 | CHECK `pedido_justificativa_minima` / `item_qtd_solicitada_minima` |
| RN17 — lote segregado tem data de segregação | CHECK `lote_segregado_tem_data` |
| RN01/RNF03 — e-mail institucional | CHECK `usuario_email_ufpe` (LIKE `%@ufpe.br`) + UNIQUE |

## Invariantes que NÃO são constraints (ficam em código)

Dependem de estado calculado em runtime e ficam nas funções de domínio
(Etapa 2) e nos services, não no schema:

- **INV02 / INV03** — completude de campos ao processar um item (lote_expedido,
  qtd_expedida, processado_por, motivo de divergência). Validado no service de
  processamento de pedido.
- **INV08** — lote vencido/segregado não pode ser `lote_expedido` (FEFO, RN20).
- **INV09** — expedição p/ CEO gera 2 movimentações + cria/atualiza lote-CEO (RN19).
- **RN03–RN07** — `qtd_total` e status agregado do produto (soma de lotes ativos).
- **RN10** — status derivado do pedido a partir dos itens.
```
