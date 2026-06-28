# Contrato de API

**Documento:** 05-contrato-api
**Última atualização:** 27/06/2026

---

Contrato HTTP entre o frontend (SPA React) e o backend (Express). É a fonte de
verdade citada nos arquivos de `projeto/frontend/src/api/*` (ex.: `// dashboard.js
— EP05 Dashboard (contrato §EP05)`).

## Convenções gerais

- **Base:** `/api` (proxy do Vite → `:3000` em dev; `VITE_API_BASE` em prod).
- **Auth:** header `Authorization: Bearer <token>` em tudo, exceto `POST /login`.
- **Erros:** `4xx` retorna `{ "mensagem": "..." }` (negócio/permissão) ou
  `{ "error": "..." }` (interno/`5xx`). O cliente extrai `mensagem || error`.
- **RBAC por setor (RN12):** rotas escopadas aceitam `?setorId=`. O gestor HO vê
  todos os setores; demais perfis só o próprio (`podeVerSetor`). Sem permissão →
  `403`.
- **Datas:** ISO 8601 em UTC (`...Z`).

---

## §Enums

Valores canônicos (fonte do `constants.js`):

- **Perfil:** `gestor`, `almoxarife`, `solicitante`, `dentista`.
- **TipoMovimentacao:** `entrada`, `saida`, `ajuste`, `consumo`, `segregacao`.
- **StatusEstoque:** `critico`, `baixo`, `vencendo`, `vencido`, `ok`, `indisponivel`.

---

## §EP05 — Dashboard, alertas e log

### `GET /dashboard?setorId=`
KPIs consolidados do setor (RN12). **Resposta 200:**
```json
{
  "totalProdutos": 0, "produtosCriticos": 0,
  "lotesVencendo30": 0, "lotesVencendo60": 0,
  "pedidosPendentes": 0,
  "demandaRepresada": [
    { "produtoId": 1, "nome": "Luvas M", "qtdSolicitadaTotal": 30, "numPedidos": 4,
      "setoresEnvolvidos": ["CEO"] }
  ]
}
```
> `demandaRepresada` vem ordenada por `qtdSolicitadaTotal` desc e limitada ao
> **top 10** (CEO-253). `setoresEnvolvidos` lista os setores de origem (distintos,
> ordenados) dos pedidos que represaram o item.

### `GET /dashboard/movimentacoes?setorId=&limite=&tipo=&dataInicio=&dataFim=` — CEO-252
Log de movimentações do setor, mais recentes primeiro.
- `limite` (opcional): 1..100, default 10. Não-numérico cai no default.
- `tipo` (opcional): um dos `TipoMovimentacao`. Ausente = todos.
- `dataInicio` / `dataFim` (opcionais, CEO-280): `YYYY-MM-DD`, intervalo
  **inclusivo** (`dataFim` conta até o fim do dia). Formato inválido é ignorado.

**Resposta 200:** array de
```json
{
  "id": "MOV-001", "tipo": "saida", "produtoNome": "Luvas M",
  "quantidade": -10, "setorOrigemNome": "HO", "setorDestinoNome": "CEO",
  "data": "2026-05-05T12:00:00.000Z", "retiradoPor": "Dr. Rafael Henrique Moura"
}
```
> `quantidade` de `saida` é **negativa** (convenção de movimentação do domínio).
> `retiradoPor` (CEO-267) é quem retirou fisicamente — preenchido só nas saídas
> de expedição; `null` nas demais movimentações.

### `GET /dashboard/consumo-mensal?setorId=&meses=` — CEO-249/253
Consumo mensal por setor de destino, somando as **saídas** do setor fornecedor
(`setorId`, ex.: HO). `meses` (opcional): 1..24, default 6.

**Resposta 200:**
```json
{
  "meses": ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"],
  "setores": [
    { "setorId": 2, "nome": "CEO", "valores": [0, 0, 0, 0, 10, 0] },
    { "setorId": null, "nome": "CME", "valores": [0, 0, 0, 0, 0, 0] }
  ]
}
```
> `valores[i]` é o consumo (módulo da quantidade de saída) no mês `meses[i]`.
> Setor não cadastrado aparece com `setorId: null` e série zerada.

---

## §EP01 — Auth e identidade

### `POST /login`
Único endpoint sem `Authorization`. **Request:** `{ "email": "...", "senha": "..." }`.
**Resposta 200:** `{ "token": "<jwt>", "usuario": { "id", "nome", "email", "perfil", "setorId", "cargo" } }`.
Credenciais inválidas → `401 { "mensagem": "..." }`.

### `POST /logout`
JWT é stateless; o cliente descarta o token. **Resposta 200:** `{ "mensagem": "..." }`.

### `GET /eu`
Identidade do token. **Resposta 200:** `{ "identidade": { "usuarioId", "perfil", "setorId", "setorTipo", ... } }`.
Sem/`token` inválido → `401`.

### `POST /usuarios` — provisionar (gestor)
Cria usuário com senha provisória. **Resposta 201:** `{ "mensagem": "...", "usuario": {...} }`.

### `GET /usuarios` — listar (gestor)
**Resposta 200:** `{ "usuarios": [...] }`.

### `PATCH /usuarios/:id/desativar` · `PATCH /usuarios/:id/resetar-senha` (gestor)
Ações de gestão de acesso. **Resposta 200:** `{ "mensagem": "..." }` (reset retorna a senha provisória).

### `PATCH /eu/senha`
Troca a própria senha. **Request:** `{ "senhaAtual", "novaSenha" }`. **Resposta 200:** `{ "mensagem": "..." }`.

---

## §Setores

### `GET /setores`
Lista setores (HO/CEO/Dispensação...). Qualquer usuário logado. **Resposta 200:**
`{ "setores": [ { "id", "nome", "tipo", "emailInstitucional" } ] }`.

### `GET /setores/:setorId/segregados` (gestor/almoxarife)
Lotes segregados do setor (RN17). **Resposta 200:** `{ ... }` com os lotes.

---

## §EP02 — Catálogo e estoque (HO)

### `GET /setores/:setorId/estoque` — catálogo agregado (RN12)
Filtros via query: `texto`, `categoria`, `status` (`StatusEstoque`),
`somenteComEstoque=true`, `somenteSemEstoque=true`. **Resposta 200:** `{ "estoque": [...] }`.

### `GET /setores/:setorId/alertas` — CEO-250
Listas "vencendo/crítico" do setor. **Resposta 200:** `{ "alertas": {...} }`.

### `GET /setores/:setorId/catalogo`
Catálogo do solicitante (agregado, **sem lote** — RN12). **Resposta 200:** `{ "catalogo": [...] }`.

### `POST /produtos` · `PATCH /produtos/:id` · `DELETE /produtos/:id` (almoxarife/gestor HO)
CRUD de produto do catálogo. Recebimento de fornecedor é exclusivo do HO.

### `GET /produtos/:id/lotes?setorId=`
Lotes de um produto (não exibidos a solicitante — RN12).

### `POST /produtos/:id/lotes` — entrada de lote (almoxarife/gestor HO)
**Request:** `{ "setorId", "numeroLote", "validade", "quantidade", "fabricacao?", "qtdDanificada?", "obsDanificada?" }`.

### `POST /lotes/:loteId/consumo` — CEO-238 (gestor/almoxarife)
Abatimento de saldo por consumo clínico. **Request:** `{ "quantidade", "observacao?" }`.

### `PATCH /lotes/:loteId/ajuste` — CEO-239 (gestor/almoxarife)
Ajuste absoluto de inventário (recontagem). **Request:** `{ "quantidade", "observacao?" }`.

### `POST /lotes/:loteId/segregar` — CEO-EP07 (gestor/almoxarife)
Segrega lote por vencimento/descarte (RN17). **Request:** `{ "observacao?" }`.

---

## §EP03/EP04 — Pedidos e expedição

### `POST /pedidos` — criar (solicitante/gestor da origem — RN09/RN12)
Origem e solicitante derivam da identidade (não confiar no corpo).
**Request:** `{ "setorDestinoId", "justificativa" (≥10 chars), "itens": [ { "produtoId" XOR "descricaoLivre", "qtdSolicitada", "unidade" } ] }`.
**Resposta 201:** `{ "pedido": {...} }`.

### `GET /pedidos` — listagem geral (CEO-247)
Escopada pelo perfil: HO vê todos; demais só o próprio setor. **Resposta 200:** `{ "pedidos": [...] }`.

### `GET /pedidos/pendentes` — fila do almoxarife (CEO-251, RN11)
Pedidos com trabalho por fazer, FIFO. **Resposta 200:** `{ "pedidos": [...] }`.

### `GET /pedidos/:id`
Detalhe com itens. RN12: HO ou quem participa (origem/destino). **Resposta 200:** `{ "pedido": {...} }`.

### `GET /setores/:setorId/pedidos`
Pedidos do setor (origem ou destino — RN12). **Resposta 200:** `{ "pedidos": [...] }`.

### `POST /pedidos/:id/itens/:itemId/expedir` — EP03 (almoxarife/gestor HO — RN11/RN19)
Expede um item por FEFO (baixa lote do HO + entrada-CEO automática).
**Request:** `{ "retiradoPor": "<nome de quem retira>" }` (obrigatório — CEO-267).
**Resposta 200:** `{ "item": {...}, "movimentacoes": ["MOV-004", "MOV-005"], "statusPedido": "..." }`.
Sem `retiradoPor` → `400`.

---

## §EP08 — Agente de email e triagem (ADR-0004)

### `POST /rascunhos` — admissão por email (auth de SERVIÇO)
Bearer `AGENTE_TOKEN` (não JWT — é um worker). Idempotente (`ON CONFLICT` por
`messageId`). Não aplica RN10 (rascunho ≠ pedido).

### `GET /rascunhos` — fila de triagem (CEO-276, RN11)
Quem processa pedidos vê a fila. **Resposta 200:** `{ "rascunhos": [...] }`.

### `POST /rascunhos/:id/aprovar` · `POST /rascunhos/:id/descartar` (RN11)
Aprovar promove o rascunho a pedido (em transação; status derivado — RN10);
descartar não cria pedido.
