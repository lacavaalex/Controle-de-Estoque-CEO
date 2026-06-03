# Plano — Sprint 2 (EP02: Catálogo e estoque do HO) — backend

**Data:** 03/06/2026
**Branch:** `feat/fundacao-backend` (continuação da fundação)
**Escopo deste plano:** backend apenas (sem front). Para o PO validar com o time
(Alex/Bruno) antes de codar.
**Sprint correspondente:** 172 (Catálogo EP02 + EP07-01), 05–07/06.

---

## Princípio
Reusar ao máximo a fundação já commitada (`e2c4a41`). A camada de domínio
(status agregado, qtd_total, FEFO, estado do lote) **já existe e está testada** —
o EP02 backend é principalmente **services finos + controllers + rotas** por cima,
seguindo o padrão de camadas existente.

---

## O que já está pronto (reuso direto)

| Peça | Onde | Serve para |
|---|---|---|
| `PgProdutoRepo` (criar/listar/buscar/atualizar/remover) | `repositories/PgProdutoRepo.ts` | US-EP02-01, 04, 06 |
| `PgLoteRepo` (criar/listarPorProdutoSetor/listarPorSetor/atualizar) | `repositories/PgLoteRepo.ts` | US-EP02-01, 02, 05, 06 |
| `EstoqueService.estoqueDoSetor` (qtd_total + status agregado) | `services/EstoqueService.ts` | **US-EP02-01** (catálogo agregado) |
| `EstoqueService.lotesParaExpedir` (FEFO) | idem | base de pedido (EP04) |
| Funções de domínio RN05/06/07/17/20 | `domain/estoque.ts` | status/estado dos lotes |
| RBAC `podeVerSetor`/`podeEditarEstoque` + middleware | `auth/` | proteger as rotas (RN12) |

> **US-EP02-01 (Must)** está ~90% pronta no backend: já existe o endpoint
> `GET /setores/:setorId/estoque` que devolve produto+qtd_total+status. Só falta
> ajustar o shape de resposta aos campos da story (Mín/Máx, etc.) se necessário.

---

## O que falta criar (as 4 Must)

### US-EP02-01 — Listar catálogo agregado (Must) — quase pronto
- Revisar o retorno de `estoqueDoSetor` para incluir `estoqueMinimo/estoqueMaximo`
  e `localizacao` na resposta (a story pede colunas Mín/Máx).
- Já protegido por `podeVerSetor`.

### US-EP02-04 — Cadastrar produto (Must)
- **Novo:** `ProdutoService.cadastrar(dados)` — valida categoria (RN02, enum já
  garante) e estoque min/max >= 0 (CHECK já garante); cria produto com 0 lotes.
- **Novo:** `ProdutoController` + `POST /produtos`.
- RBAC: só almoxarife/gestor HO (`podeEditarEstoque` no setor HO).

### US-EP02-05 — Cadastrar lote / entrada de estoque (Must) — **maior esforço**
- **Novo:** `LoteService.registrarEntrada(produtoId, setorId, dadosLote)`:
  - cria o lote (estado inicial calculado: se validade no passado → `vencido` +
    alerta; senão `ativo`) — usa `estadoValidadeLote` do domínio;
  - **gera Movimentação tipo `entrada`** (RN11/auditoria).
- **Novo (gap):** `IMovimentacaoRepository` + `PgMovimentacaoRepo` — **ainda não
  existem**. Precisam ser criados aqui (geração de ID `MOV-NNN`).
- **Decisão técnica:** envolver criação-do-lote + movimentação numa **transação**
  Drizzle (`db.transaction`) para consistência.
- **Novo:** `POST /produtos/:id/lotes`.

### US-EP02-07 — Visão de leitura do solicitante (Must)
- **Novo:** `GET /setores/:setorId/catalogo` (ou flag na rota de estoque) que
  devolve produto+qtd+status **sem** dados de lote (RN12: solicitante não vê lote).
- RBAC: `podeVerSetor` (solicitante vê o próprio setor).
- Reusa `estoqueDoSetor`, só omite o detalhe de lote no shape.

---

## Should (ficam para depois, se sobrar tempo / o time pedir)
- **US-EP02-02** ver lotes de um produto: `GET /produtos/:id/lotes` (filtra
  vencido/segregado). Repo já tem `listarPorProdutoSetor`.
- **US-EP02-03** filtrar catálogo: filtros (nome/categoria/status/com-sem estoque)
  — pode ser query params no endpoint de catálogo.
- **US-EP02-06** editar/remover produto e lote: `PATCH`/`DELETE`; editar qtd de
  lote **gera Movimentação `ajuste`** com o delta (RN); remover produto só se não
  tiver lote ativo (RN13).

---

## Gaps / decisões abertas (validar com o time)
1. **Geração de IDs `MOV-NNN`/`PED-NNN`:** o schema usa `text` PK. Definir
   estratégia (sequência dedicada vs contador). Sugiro uma sequência Postgres
   formatada (`'MOV-' || lpad(nextval(...)::text, 3, '0')`).
2. **Transação na entrada de lote** (lote + movimentação atômicos) — confirmar
   que adotamos `db.transaction` como padrão para operações multi-tabela.
3. **Sobreposição com a branch do time:** EP02 backend é território novo (eles
   estavam em auth/DB), então o risco de colisão é baixo — mas convém o time
   saber que estes endpoints estão vindo.

---

## Ordem de execução sugerida
1. `IMovimentacaoRepository` + `PgMovimentacaoRepo` (+ estratégia de ID).
2. `ProdutoService` + controller + `POST /produtos` (US-EP02-04).
3. `LoteService.registrarEntrada` (transação + movimentação) + `POST /produtos/:id/lotes` (US-EP02-05).
4. Ajustar `estoqueDoSetor` + rota de catálogo do solicitante (US-EP02-01, 02-07).
5. Testes unitários (services com repos in-memory, no molde de `EstoqueService.test.ts`) + smoke curl.
6. Atualizar Jira: CEO-229 (02-01), CEO-232 (02-04), CEO-233 (02-05), CEO-235 (02-07).

**Estimativa:** as 4 Must num passo coeso. Should num segundo passo.
