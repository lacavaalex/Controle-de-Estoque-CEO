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
    { "produtoId": 1, "nome": "Luvas M", "qtdSolicitadaTotal": 30, "numPedidos": 4 }
  ]
}
```

### `GET /dashboard/movimentacoes?setorId=&limite=&tipo=` — CEO-252
Log de movimentações do setor, mais recentes primeiro.
- `limite` (opcional): 1..100, default 10. Não-numérico cai no default.
- `tipo` (opcional): um dos `TipoMovimentacao`. Ausente = todos.

**Resposta 200:** array de
```json
{
  "id": "MOV-001", "tipo": "saida", "produtoNome": "Luvas M",
  "quantidade": -10, "setorOrigemNome": "HO", "setorDestinoNome": "CEO",
  "data": "2026-05-05T12:00:00.000Z"
}
```
> `quantidade` de `saida` é **negativa** (convenção de movimentação do domínio).

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

## Seções a documentar (stubs)

As rotas abaixo existem no backend (`projeto/backend/src/routes/routes.ts`) e são
consumidas pelo frontend, mas ainda precisam ter request/response detalhados aqui.
Este documento foi (re)criado em 27/06 — antes existia apenas como referência nos
comentários do código, sem arquivo. Preencher incrementalmente:

- **§EP01 — Auth/identidade:** `POST /login`, `POST /logout`, `GET /eu`,
  `POST /usuarios`, `PATCH /eu/senha`.
- **§Setores:** `GET /setores`.
- **§EP02 — Catálogo/estoque (HO):** produtos, lotes, entrada, consumo, ajuste,
  segregação.
- **§EP03/EP04 — Pedidos e expedição:** `GET/POST /pedidos`, `GET /pedidos/:id`,
  expedição item a item (FEFO).
- **§EP08 — Agente/triagem:** `POST /rascunhos` (auth de serviço), triagem.
