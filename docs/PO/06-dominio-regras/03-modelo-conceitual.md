# Modelo Conceitual do Domínio

**Documento:** 03-modelo-conceitual
**Última atualização:** 14/05/2026
**Revisão:** v2 — separação Produto × Lote, multi-setor, pedido cabeçalho+itens, ciclo de vida do lote.

---

Este documento descreve as **entidades de domínio** do sistema, seus atributos e relacionamentos. Modelagem física (banco, índices) será derivada na fase de design técnico.

---

## 1. Diagrama de entidades (textual)

```
┌──────────────┐  cria  ┌────────────────────┐  contém  ┌──────────────────────────┐
│   Usuário    │───────▶│      Pedido        │─────────▶│    ItemDoPedido          │
│              │ 1   *  │                    │ 1     *  │                          │
│ - id         │        │ - id (PED-NNN)     │          │ - id                     │
│ - nome       │        │ - status (derivado)│          │ - produto_id (FK, nulo   │
│ - email      │        │ - data_criacao     │          │     em linha livre)      │
│ - perfil     │        │ - setor_origem (FK)│          │ - descricao_livre        │
│ - setor (FK) │        │ - solicitante_id   │          │ - qtd_solicitada         │
│              │   resol│ - justificativa    │          │ - qtd_expedida           │
│              │ve  1 * │                    │          │ - lote_expedido_id (FK)  │
│              │◀───────│                    │          │ - status_item            │
└──────┬───────┘        └────────────────────┘          │ - motivo_divergencia     │
       │ pertence                                       │ - observacao_motivo      │
       │ a                                              └──────────────┬───────────┘
       ▼                                                               │
┌──────────────┐                                                       │ refere-se
│    Setor     │                                                       │ * 1
│              │                                                       ▼
│ - id         │                                          ┌──────────────────────┐
│ - nome (HO,  │                                          │       Produto        │
│   CEO,…)     │                                          │                      │
│ - tipo       │                                          │ - id                 │
│   (almoxari- │                                          │ - nome               │
│   fado / des-│                                          │ - categoria (RN02)   │
│   tinatário) │                                          │ - unidade            │
└──────────────┘                                          │ - estoque_minimo     │
                                                          │ - estoque_maximo     │
                                                          │ - localizacao        │
                                                          │ - fornecedor         │
                                                          └─────────┬────────────┘
                                                                    │ tem
                                                                    │ 1     *
                                                                    ▼
                                                          ┌──────────────────────┐
                                                          │        Lote          │
                                                          │                      │
                                                          │ - id                 │
                                                          │ - produto_id (FK)    │
                                                          │ - setor_id (FK)      │ ◀── lote vive em um setor
                                                          │ - numero_lote        │
                                                          │ - fabricacao         │
                                                          │ - validade           │
                                                          │ - quantidade         │
                                                          │ - estado (ativo /    │
                                                          │   vencido /          │
                                                          │   segregado)         │
                                                          └──────────────────────┘
                                                                    │
                                                                    │ origem/destino de
                                                                    │ * 1
                                                                    ▼
                                                          ┌──────────────────────┐
                                                          │    Movimentação      │
                                                          │                      │
                                                          │ - id                 │
                                                          │ - tipo (entrada /    │
                                                          │   saida / ajuste /   │
                                                          │   consumo /          │
                                                          │   segregacao)        │
                                                          │ - lote_id (FK)       │
                                                          │ - quantidade (±)     │
                                                          │ - setor_origem       │
                                                          │ - setor_destino      │
                                                          │ - responsavel_id     │
                                                          │ - data               │
                                                          │ - pedido_id (FK,     │
                                                          │   nulo se ajuste/    │
                                                          │   consumo)           │
                                                          │ - observacao         │
                                                          └──────────────────────┘
```

> Mudanças estruturais em relação à v1:
> - **Solicitação** virou **Pedido** (cabeçalho) + **ItemDoPedido** (linhas).
> - **Item** foi separado em **Produto** (catálogo) + **Lote** (instâncias físicas com validade).
> - **Setor** virou entidade própria (não enum). Permite multi-setor desde o MVP e expansão sem mexer no schema.
> - **EstoqueDispensacao** e **EstoqueCEO** **desapareceram como entidades separadas**. Estoque agora é a soma de lotes por (Produto, Setor).
> - **Movimentação** ganhou tipos `consumo` (uso interno do setor destinatário) e `segregação` (movido para sala de biossegurança).

---

## 2. Entidades

### 2.1 Setor

| Atributo | Tipo | Obrigatório | Observações |
|----------|------|-------------|-------------|
| `id` | inteiro | sim | |
| `nome` | string | sim | "HO", "CEO", "CME", "Laboratório X" |
| `tipo` | enum | sim | `almoxarifado` (HO) · `destinatario` (CEO, CME, laboratórios) |
| `email_institucional` | string | não | Para notificações por e-mail |

> No MVP, 2 setores cadastrados: HO (almoxarifado) e CEO (destinatário). Modelagem suporta adição de setores em fase 2 sem mudança de schema.

### 2.2 Usuário

| Atributo | Tipo | Obrigatório | Observações |
|----------|------|-------------|-------------|
| `id` | inteiro | sim | |
| `nome` | string | sim | |
| `email` | string (`@ufpe.br`) | sim | Único |
| `cargo` | string | sim | Texto livre informativo |
| `perfil` | enum | sim | `gestor` · `almoxarife` · `solicitante` · (fase 2) `dentista` |
| `setor_id` | FK → Setor | sim | Setor de vinculação |
| `avatar` | string (2 letras) | não | Iniciais para UI |

### 2.3 Produto (catálogo)

| Atributo | Tipo | Obrigatório | Observações |
|----------|------|-------------|-------------|
| `id` | inteiro | sim | |
| `nome` | string | sim | Ex.: "Ácido Fosfórico 37%" |
| `categoria` | enum (RN02) | sim | Inclui categoria `Equipamento` (não tem estoque mínimo aplicável). |
| `unidade` | enum | sim | caixa, tubo, seringa, kit, pacote, rolo, unidade, frasco, bastão, folha, par |
| `estoque_minimo` | inteiro ≥ 0 | não | Default 0; não aplicável a `Equipamento` |
| `estoque_maximo` | inteiro ≥ 0 | não | Default 9999; não aplicável a `Equipamento` |
| `localizacao` | string | não | Texto livre |
| `fornecedor` | string | não | |

**qtd_total** (calculado em runtime, por setor): soma de `quantidade` dos Lotes com `estado=ativo` daquele Produto naquele Setor.

**Status (calculado, RN03–RN06):** Indisponível · Vencido · Vencendo · Atenção · Crítico · Baixo · Excessivo · Normal.

### 2.4 Lote

| Atributo | Tipo | Obrigatório | Observações |
|----------|------|-------------|-------------|
| `id` | inteiro | sim | |
| `produto_id` | FK → Produto | sim | |
| `setor_id` | FK → Setor | sim | Onde o lote fisicamente está (HO ou CEO) |
| `numero_lote` | string | sim | Ex.: "458/24" |
| `fabricacao` | data ISO | não | Pode ser "-" em itens antigos |
| `validade` | data ISO | sim | |
| `quantidade` | inteiro ≥ 0 | sim | Saldo do lote |
| `estado` | enum | sim | `ativo` · `vencido` · `segregado` (RN17) |
| `data_segregacao` | data ISO | depende | Não nula em `segregado` |
| `observacao_segregacao` | string | não | Ex.: "Carga inicial — material já estava na sala de biossegurança em 06/2025" |

### 2.5 Pedido

| Atributo | Tipo | Obrigatório | Observações |
|----------|------|-------------|-------------|
| `id` | string | sim | `PED-NNN` |
| `setor_origem_id` | FK → Setor | sim | Setor que solicita (ex.: CEO) |
| `setor_destino_id` | FK → Setor | sim | Sempre o almoxarifado (HO) no MVP |
| `solicitante_id` | FK → Usuário | sim | Quem criou |
| `data_criacao` | data ISO | sim | |
| `justificativa` | string ≥ 10 caracteres | sim | RN09 |
| `status` | enum (derivado) | sim | Calculado dos itens (RN10) |

### 2.6 ItemDoPedido

| Atributo | Tipo | Obrigatório | Observações |
|----------|------|-------------|-------------|
| `id` | inteiro | sim | |
| `pedido_id` | FK → Pedido | sim | |
| `produto_id` | FK → Produto | depende | Nulo em linha livre |
| `descricao_livre` | string | depende | Preenchido em linha livre (RN18) |
| `qtd_solicitada` | inteiro ≥ 1 | sim | |
| `qtd_expedida` | inteiro ≥ 0 | depende | Preenchido ao processar |
| `lote_expedido_id` | FK → Lote | não | Preenchido se expedido (não preenchido para linha livre ou item não atendido) |
| `unidade` | enum | sim | Mesma do produto |
| `status_item` | enum | sim | `pendente` · `aguardando_reposicao` · `atendido_integral` · `atendido_parcial` · `nao_atendido` |
| `motivo_divergencia` | enum | depende | `falta_estoque` · `racionalizacao_setor` · `lote_indisponivel` · `outros` (RN16). Obrigatório se `qtd_expedida ≠ qtd_solicitada`. |
| `observacao_motivo` | string | não | Texto livre opcional quando `motivo_divergencia=outros` |
| `processado_por_id` | FK → Usuário | depende | Não nulo após processamento |
| `data_processamento` | data ISO | depende | |

> Quando um item é desdobrado em múltiplos lotes (RN sobre desdobrar / RF05.17), o item original vira "pai" e gera N **sub-itens** (mesma entidade, com `item_pai_id` apontando para o original). Modelagem alternativa: tabela `ExpedicaoDeItem` 1:N. Decisão técnica fica para a fase de design.

### 2.7 Movimentação

| Atributo | Tipo | Obrigatório | Observações |
|----------|------|-------------|-------------|
| `id` | string | sim | `MOV-NNN` |
| `tipo` | enum | sim | `entrada` · `saida` · `ajuste` · `consumo` · `segregacao` |
| `lote_id` | FK → Lote | sim | |
| `produto_id` | FK → Produto | sim | Denormalizado |
| `quantidade` | inteiro | sim | Pode ser negativa em ajustes/consumo |
| `setor_origem_id` | FK → Setor | sim | |
| `setor_destino_id` | FK → Setor | depende | Nulo em `ajuste`, `consumo`, `segregacao` |
| `responsavel_id` | FK → Usuário | sim | |
| `data` | data ISO | sim | |
| `pedido_id` | FK → Pedido | depende | Não nulo em saida/entrada via pedido |
| `observacao` | string | não | |

**Convenções de tipo:**
- `entrada` — cadastro de lote novo (recebimento de fornecedor) **ou** entrada-CEO automática via expedição (RN19).
- `saida` — expedição de item do pedido para outro setor.
- `ajuste` — recontagem manual (delta entre qtd antiga e nova).
- `consumo` — uso clínico interno do setor (RF04.6).
- `segregacao` — movido para "Lotes segregados" (RN17).

---

## 3. Relacionamentos principais

| Relação | Cardinalidade | Observação |
|---------|---------------|------------|
| Setor **tem** Usuários | 1 : * | Cada usuário pertence a um setor. |
| Usuário **cria** Pedido | 1 : * | Apenas `solicitante` e `gestor` criam. |
| Pedido **tem** ItemDoPedido | 1 : * (≥ 1) | RN09. |
| ItemDoPedido **refere-se a** Produto | * : 1 (ou nulo em linha livre) | RN18. |
| ItemDoPedido **expedido** referencia Lote | * : 1 (após processamento) | Nulo se `nao_atendido` ou linha livre. |
| Produto **tem** Lotes | 1 : * | Inclusive 0 lotes (caso "Não Tem"). |
| Lote **pertence a** Setor | * : 1 | Lote vive em um setor (HO ou CEO). |
| ItemDoPedido **resolvido por** Usuário (almoxarife/gestor HO) | * : 1 | RN11. |
| Lote **aparece em** Movimentação | 1 : * | Histórico completo. |

---

## 4. Invariantes (sempre verdadeiros)

- **INV01.** Toda **Movimentação** referencia um **Lote** existente.
- **INV02.** Toda **ItemDoPedido** com `status_item ∈ {atendido_integral, atendido_parcial}` tem `lote_expedido_id`, `qtd_expedida`, `processado_por_id`, `data_processamento` preenchidos.
- **INV03.** Toda **ItemDoPedido** com `qtd_expedida ≠ qtd_solicitada` (e processado) tem `motivo_divergencia` preenchido.
- **INV04.** Todo **Lote** referencia um **Produto** existente e está vinculado a exatamente um **Setor**.
- **INV05.** `quantidade` de qualquer Lote é **sempre ≥ 0**.
- **INV06.** Um **Usuário** tem exatamente um **perfil** e um **setor**.
- **INV07.** Toda **ItemDoPedido** tem **exatamente um** entre `produto_id` (item de catálogo) ou `descricao_livre` (linha livre); nunca os dois, nunca nenhum.
- **INV08.** **Lote vencido ou segregado** não pode ser selecionado como `lote_expedido_id` em uma nova expedição.
- **INV09.** Sempre que um item de pedido com `setor_destino=CEO` é marcado como atendido, **gera-se 2 movimentações** (saída no HO + entrada no CEO) **e** o lote-CEO correspondente é criado/atualizado (RN19).

---

## 5. Notas de evolução (fase 2+)

- **Múltiplos setores destinatários**: o modelo já comporta (Setor é entidade, Lote tem `setor_id`). Basta cadastrar CME, laboratórios e habilitar telas/dashboards para eles.
- **Perfil `dentista`**: leitura individual de pedidos do próprio dentista (campo `dentista_demandante` em ItemDoPedido — já previsto na pergunta 2 do grilling).
- **Estado `descartado`** do Lote: registrar data de descarte oficial, autorização.
- **Catálogo recomendado por setor**: derivar do histórico de pedidos.
- **Ingestão automática de e-mail → pedido**: monitorar caixa institucional e gerar rascunho.
- **Aprovação parcial com sugestão FEFO automática**: hoje a sugestão é manual; pode evoluir para escolha automática se almoxarife não interagir.
- **Persistência de status calculado** com snapshot diário para análises históricas.

---

## 6. Mudanças desta revisão (v1 → v2)

| Mudança | Motivo |
|--------|--------|
| Separação **Produto × Lote** | Realidade da planilha — mesmo produto em N lotes simultâneos com validades distintas. |
| **Pedido + ItemDoPedido** (em vez de Solicitação por item) | PDF real: 1 e-mail = 1 pedido com N itens. |
| **Setor** como entidade | Multi-setor desde o MVP; modularidade prevista para fase 2. |
| **EstoqueDispensacao** e **EstoqueCEO** removidos como entidades | Estoque = soma de Lotes por (Produto, Setor). Simplifica o modelo. |
| Novos tipos de **Movimentação**: `consumo`, `segregacao` | Refletem práticas reais do almoxarifado e do CEO. |
| **Estado do Lote** (`ativo / vencido / segregado`) | Reflete a sala de biossegurança (planilha "Materiais Vencidos"). |
| **Linha livre** modelada (`produto_id` nulo + `descricao_livre`) | Caso "evidenciador de biofilme" do PDF — item fora do catálogo. |
| **Motivo enumerado** de divergência | Transforma "racionalização" em dado mensurável para a Gestão. |
