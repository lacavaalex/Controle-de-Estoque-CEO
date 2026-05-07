# Modelo Conceitual do Domínio

**Documento:** 03-modelo-conceitual
**Última atualização:** 07/05/2026

---

Este documento descreve as **entidades de domínio** do sistema, seus atributos e relacionamentos. É um modelo **conceitual**: voltado a alinhamento com stakeholders. A modelagem física (banco de dados, índices, etc.) será derivada deste documento na fase de design técnico.

---

## 1. Diagrama de entidades (textual)

```
┌──────────────────┐       cria        ┌──────────────────────┐      gera       ┌────────────────────┐
│     Usuário      │──────────────────▶│     Solicitação      │────────────────▶│   Movimentação     │
│                  │ 1            *    │                      │ 1            * │   (saída)          │
│ - id             │                   │ - id (SOL-NNN)       │                 │                    │
│ - nome           │                   │ - status             │                 │                    │
│ - email          │                   │ - dataSolicitacao    │                 │                    │
│ - cargo          │                   │ - quantidade         │                 │                    │
│ - role           │                   │ - justificativa      │                 │                    │
│ - unidade        │   resolve (apr/   │ - dataConclusao      │                 │                    │
│                  │    neg) 1     *   │ - responsavel (FK)   │                 │                    │
│                  │◀──────────────────│ - observacao         │                 │                    │
└──────────────────┘                   └──────────┬───────────┘                 └─────────┬──────────┘
                                                  │ refere-se                              │ refere-se
                                                  │ *      1                              │ *      1
                                                  ▼                                        ▼
                                       ┌────────────────────────────────────────────────────────────┐
                                       │                            Item                            │
                                       │                                                            │
                                       │ - id                                                       │
                                       │ - nome                                                     │
                                       │ - categoria (RN02)                                         │
                                       │ - lote                                                     │
                                       │ - unidade                                                  │
                                       │ - estoqueMinimo, estoqueMaximo                             │
                                       │ - validade                                                 │
                                       │ - localizacao, fornecedor                                  │
                                       └─────────────┬─────────────────────────┬──────────────────┬─┘
                                                     │                          │                  │
                                                     │ tem                      │ tem              │ aparece em
                                                     │ 1     1                  │ 1   1            │ *     *
                                                     ▼                          ▼                  ▼
                                       ┌──────────────────────┐    ┌──────────────────────┐  ┌────────────────────┐
                                       │ Estoque Dispensação  │    │   Estoque CEO        │  │   Movimentação     │
                                       │  (quantidade,        │    │  (quantidade,        │  │   (entrada/ajuste) │
                                       │   localizacao)       │    │   estoqueMinimo)     │  │                    │
                                       └──────────────────────┘    └──────────────────────┘  └────────────────────┘
```

> No protótipo, "Estoque Dispensação" e "Item" estão fundidos em uma estrutura única (`ITEMS` em `data/data.js`). A separação conceitual fica explícita aqui para suportar a **expansão** prevista (vários subdepartamentos) na fase 2.

## 2. Entidades

### 2.1 Usuário
Representa uma pessoa que acessa o sistema.

| Atributo | Tipo | Obrigatório | Observações |
|----------|------|-------------|-------------|
| `id` | inteiro | sim | Identificador único interno |
| `nome` | string | sim | Nome completo |
| `email` | string (e-mail) | sim | Único, domínio `@ufpe.br` |
| `cargo` | string | sim | Texto livre informativo |
| `role` | enum | sim | `gestao` · `almoxarife` · `dentista` |
| `unidade` | string | sim | Subdepartamento ou unidade lotada (ex.: "CEO — Endodontia") |
| `avatar` | string (2 letras) | não | Iniciais para UI |

### 2.2 Item
Material consumível cadastrado no sistema.

| Atributo | Tipo | Obrigatório | Observações |
|----------|------|-------------|-------------|
| `id` | inteiro | sim | Identificador único |
| `nome` | string | sim | Ex.: "Resina Composta A2" |
| `categoria` | enum (RN02) | sim | Conjunto fechado |
| `lote` | string | sim | Ex.: `LT-2025-010` |
| `quantidade` | inteiro ≥ 0 | sim | Saldo atual da Dispensação |
| `unidade` | enum | sim | caixa, tubo, seringa, kit, pacote, rolo, unidade, frasco, bastão, folha, par |
| `estoqueMinimo` | inteiro ≥ 0 | não | Default 0 |
| `estoqueMaximo` | inteiro ≥ 0 | não | Default 9999 |
| `validade` | data ISO | sim | `YYYY-MM-DD` |
| `localizacao` | string | não | Ex.: "Prateleira A-1" |
| `fornecedor` | string | não | Ex.: "DistribMed Ltda" |

**Status (calculado em runtime, não persistido):** Normal · Baixo · Crítico · Vencendo · Atenção · Vencido · Excessivo (RN03–RN06).

### 2.3 EstoqueCEO (item no CEO)
Saldo do item no subdepartamento CEO. Fisicamente é um item separado do estoque central.

| Atributo | Tipo | Obrigatório | Observações |
|----------|------|-------------|-------------|
| `id` | inteiro | sim | ID interno |
| `itemId` | inteiro | sim | FK para `Item.id` |
| `nome` | string | sim | Denormalizado para UI |
| `categoria` | enum | sim | Denormalizado |
| `quantidade` | inteiro ≥ 0 | sim | Saldo no CEO |
| `unidade` | enum | sim | Denormalizado |
| `estoqueMinimo` | inteiro ≥ 0 | sim | Mínimo próprio do CEO |

**Status (calculado):** Disponível · Baixo · Crítico · Indisponível (RN07).

### 2.4 Solicitação
Pedido formal de material por um dentista do CEO ao Almoxarife.

| Atributo | Tipo | Obrigatório | Observações |
|----------|------|-------------|-------------|
| `id` | string | sim | Formato `SOL-NNN` |
| `itemId` | inteiro | sim | FK para `Item.id` |
| `itemNome` | string | sim | Denormalizado |
| `solicitante` | string | sim | Nome do usuário que criou (FK por nome — alterar para userId em produção) |
| `cargo` | string | sim | Cargo do solicitante (denormalizado) |
| `dataSolicitacao` | data ISO | sim | Data da criação |
| `quantidadeSolicitada` | inteiro ≥ 1 | sim | RN09 |
| `unidade` | enum | sim | Mesma unidade do item |
| `justificativa` | string ≥ 10 caracteres | sim | RN09 |
| `status` | enum | sim | `pendente` · `aprovada` · `negada` |
| `dataConclusao` | data ISO ou null | depende | Não nula em aprovada/negada |
| `responsavel` | string ou null | depende | Nome do almoxarife — RN11 |
| `observacao` | string ou null | não | Especialmente relevante em negações |

### 2.5 Movimentação
Registro auditável de toda alteração física do estoque.

| Atributo | Tipo | Obrigatório | Observações |
|----------|------|-------------|-------------|
| `id` | string | sim | Formato `MOV-NNN` |
| `tipo` | enum | sim | `entrada` · `saida` · `ajuste` |
| `itemId` | inteiro | sim | FK para `Item` |
| `itemNome` | string | sim | Denormalizado |
| `quantidade` | inteiro | sim | Pode ser negativo em ajustes |
| `unidade` | enum | sim | Mesma do item |
| `origem` | string | sim | "Fornecedor (...)", "Dispensação", "CEO" |
| `destino` | string | sim | "Dispensação", "CEO" |
| `responsavel` | string | sim | Nome do operador |
| `data` | data ISO | sim | Data da movimentação |
| `solicitacaoId` | string ou null | não | Vincula movimentação à solicitação que a originou |

## 3. Relacionamentos principais

| Relação | Cardinalidade | Observação |
|---------|---------------|------------|
| Usuário **cria** Solicitação | 1 : * | Apenas usuários `dentista` criam |
| Almoxarife **resolve** Solicitação | 1 : * | Aprova ou nega; mantém RN12 |
| Solicitação **refere-se a** Item | * : 1 | Item do estoque CEO |
| Solicitação **gera** Movimentação (saída) | 1 : 1 | Quando aprovada |
| Item **tem** EstoqueCEO | 1 : 0..1 | Nem todo item está no CEO |
| Item **aparece em** Movimentação | 1 : * | Histórico completo |

## 4. Invariantes (sempre verdadeiros)

- **INV01.** Toda **Movimentação** referencia um **Item** existente.
- **INV02.** Uma **Solicitação aprovada** sempre tem `responsavel` e `dataConclusao` preenchidos.
- **INV03.** Uma **Solicitação negada** sempre tem `responsavel` e `dataConclusao` preenchidos; `observacao` pode ser string vazia.
- **INV04.** `EstoqueCEO.itemId` referencia um **Item** existente.
- **INV05.** `quantidade` de qualquer estoque é **sempre ≥ 0**.
- **INV06.** Um **Usuário** tem exatamente um **role**.

## 5. Notas de evolução (fase 2+)

- Suportar **múltiplos subdepartamentos** (não apenas CEO): introduzir entidade `Subdepartamento` e tornar `EstoqueLocal` polimórfico (Dispensação, CEO, Endodontia, …).
- Trocar referência por `solicitante` (nome) por `solicitanteId` (FK ao Usuário).
- Permitir **catálogo de categorias dinâmico** (CRUD por administrador).
- Persistir **status calculado** com snapshot diário para análises históricas.
