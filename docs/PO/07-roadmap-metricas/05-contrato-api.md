# Contrato de API — FE ↔ Backend

**Data:** 15/06/2026 · **Base:** `feat/fundacao-backend` → `main`
**Para que serve:** o front (Luiz) coda contra ISTO + um mock; o backend implementa ISTO. Mudou o contrato → avisa no grupo e atualiza aqui. É a fonte da verdade da integração.

Convenções:
- Base URL: `http://localhost:3000`. Corpo JSON.
- Auth: header `Authorization: Bearer <token>` em tudo, exceto `/login`.
- IDs textuais: pedido `PED-NNN`, movimentação `MOV-NNN`. Demais são inteiros.
- Erros: `4xx` com `{ "mensagem": "..." }` (negócio/permissão) ou `{ "error": "..." }` (interno). Status: 400 validação, 401 não autenticado, 403 sem permissão.
- Legenda: ✅ pronto na base · 🔨 a construir (pacote N).

---

## EP01 — Auth

### POST /login ✅
→ `{ "email": "x@ufpe.br", "senha": "..." }`
← 200 `{ "usuario": {...}, "token": "<jwt>" }` · 401 `{ "mensagem": "E-mail ou senha incorretos!" }`

### GET /eu ✅
← 200 `{ "usuario": { "id", "nome", "email", "perfil", "setorId", "cargo" } }`
(front usa para saber perfil/setor e montar a sidebar)

### POST /logout ✅ · POST /usuarios ✅ (provisionar — gestor only)
`/usuarios` → `{ "nome", "email", "cargo", "perfil", "setorId" }` ← 201 `{ "usuario", "senhaProvisoria" }`

---

## Setores

### GET /setores ✅
← 200 `{ "setores": [ { "id", "nome", "tipo": "almoxarifado|destinatario", "emailInstitucional" } ] }`
(front precisa para escolher origem/destino do pedido)

---

## EP02 — Catálogo / Estoque

### GET /setores/:setorId/estoque ✅
Query: `texto`, `categoria`, `status`, `somenteComEstoque=true`, `somenteSemEstoque=true`
← 200 `{ "estoque": [ { "produtoId", "nome", "categoria", "unidade", "qtdTotal", "estoqueMinimo", "estoqueMaximo", "status" } ] }`
`status` ∈ `Crítico | Baixo | Vencendo | Vencido | OK | Indisponível` (ver `rotuloStatus`).

### GET /setores/:setorId/catalogo ✅  (visão do solicitante, SEM lote)
← 200 `{ "catalogo": [ { "produtoId", "nome", "categoria", "unidade", "qtdTotal", "status" } ] }`

### GET /produtos/:id/lotes ✅  (não exibir a solicitante)
← 200 `{ "lotes": [ { "id", "numeroLote", "fabricacao", "validade", "quantidade", "estado", "estadoValidade": "vencido|vencendo|atencao|ok" } ] }`

### POST /produtos ✅ · PATCH /produtos/:id ✅ · DELETE /produtos/:id ✅
POST → `{ "nome", "categoria", "unidade", "estoqueMinimo", "estoqueMaximo", "localizacao?", "fornecedor?" }`

### POST /produtos/:id/lotes ✅  (entrada de fornecedor — HO)
→ `{ "numeroLote", "fabricacao", "validade", "quantidade", "setorId" }`

### PATCH /lotes/:loteId/quantidade ✅  (ajuste simples)
→ `{ "quantidade" }`

---

## EP03 — Estoque do CEO

(O estoque do CEO é lido via `GET /setores/:ceoSetorId/estoque` ✅ — mesmo endpoint do HO, outro setor.)

### POST /lotes/:id/consumo 🔨 (Pacote 1)
→ `{ "quantidade", "motivo?" }` ← 200 `{ "lote", "movimentacaoId" }` · 400 se qtd > saldo

### PATCH /lotes/:id/ajuste 🔨 (Pacote 1)
→ `{ "novoSaldo", "observacao" }` ← 200 `{ "lote", "movimentacaoId", "delta" }`

---

## EP04 — Pedidos

### POST /pedidos ✅
→
```json
{
  "setorOrigemId": 2,           // setor que SOLICITA (ex.: CEO)
  "setorDestinoId": 1,          // almoxarifado HO (atende)
  "solicitanteId": 7,
  "justificativa": "Reposição semanal CEO",   // >= 10 chars (RN09)
  "itens": [
    { "produtoId": 12, "qtdSolicitada": 4, "unidade": "unidade" },
    { "descricaoLivre": "Evidenciador de biofilme", "qtdSolicitada": 2, "unidade": "frasco" }
  ]
}
```
Regra XOR (INV07): cada item tem `produtoId` **ou** `descricaoLivre`, nunca os dois.
← 201 `{ "pedido": { "id": "PED-NNN", "status", "itens": [...] } }`

### GET /pedidos/:id ✅
← 200 `{ "pedido": { "id", "status", "setorOrigemId", "setorDestinoId", "solicitante", "justificativa", "dataCriacao", "itens": [ { "id", "produtoId|descricaoLivre", "qtdSolicitada", "qtdExpedida", "loteExpedidoId", "statusItem", "motivoDivergencia" } ] } }`

### GET /setores/:setorId/pedidos ✅  (+ 🔨 query `?status=` no Pacote 4)
← 200 `{ "pedidos": [ {...} ] }` — solicitante/gestor veem seu setor; almoxarife/gestor HO veem todos.
Para abas/contadores (Pacote 4): `GET /setores/:id/pedidos?status=pendente|em_processamento|...`

### POST /pedidos/:id/itens/:itemId/expedir ✅  (almoxarife/gestor HO)
→ `{}` (FEFO automático) — a base aloca por FEFO, baixa lote-HO, alimenta lote-CEO, deriva status.
← 200 `{ "item": {...}, "movimentacoes": ["MOV-001","MOV-002"], "statusPedido": "atendido_parcial" }`
`statusItem` resultante ∈ `atendido_integral | atendido_parcial | aguardando_reposicao`.

### (Should) e-mail ao criar pedido 🔨 (Pacote 5) — sem efeito no contrato HTTP; é efeito colateral do POST /pedidos.

---

## EP05 — Dashboard 🔨 (Pacote 2)

### GET /dashboard?setorId=:id 🔨
← 200 (campos variam por perfil; front pode pedir todos e exibir os do perfil):
```json
{
  "totalProdutos": 0,
  "lotesVencendo30": 0, "lotesVencendo60": 0,
  "produtosCriticos": 0,
  "pedidosPendentes": 0,
  "demandaRepresada": [ { "produtoId", "nome", "qtdSolicitadaTotal", "numPedidos", "setores": [] } ]
}
```

---

## EP07 — Lote / segregação 🔨 (Pacote 3)

### POST /lotes/:id/segregar 🔨
→ `{ "observacao" }` ← 200 `{ "lote": { "estado": "segregado", "dataSegregacao" }, "movimentacaoId" }`

### GET /setores/:id/lotes-segregados 🔨
← 200 `{ "lotes": [ {...} ] }`

---

## Enums (do schema — usar nos selects do front)

- `perfil`: gestor · almoxarife · solicitante · dentista(fase2)
- `categoria`: EPI · Anestésico · Material Restaurador · Instrumentais · Higienização · Material Cirúrgico · Equipamento · Outros
- `unidade`: caixa · tubo · seringa · kit · pacote · rolo · unidade · frasco · bastão · folha · par
- `estado_lote`: ativo · vencido · segregado
- `status_item`: pendente · aguardando_reposicao · atendido_integral · atendido_parcial · nao_atendido
- `status_pedido`: pendente · em_processamento · atendido_integral · atendido_parcial · nao_atendido · aguardando_reposicao
- `motivo_divergencia`: falta_estoque · racionalizacao_setor · lote_indisponivel · outros
- `tipo_movimentacao`: entrada · saida · ajuste · consumo · segregacao
