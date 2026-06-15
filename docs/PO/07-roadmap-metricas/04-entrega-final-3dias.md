# Entrega Final — Plano de 3 dias

**Data:** 15/06/2026 · **PO:** Luiz Taiguara
**Meta única:** um fluxo ponta-a-ponta demonstrável —
`login → solicitante cria pedido multi-item → almoxarife processa item-a-item (FEFO) → estoque do CEO é alimentado automaticamente → dashboard reflete`.
**Profundidade > largura.** O que não serve a esse fluxo é cortável.

---

## 0. Decisão de base (ler ADR-0006 antes do kickoff)

- Base única do backend = **`feat/fundacao-backend`** → vai para **`main`** via PR.
- Fundação A (`develop`, `feature/Lote-Entity`, `feature/db-*`, `bugfix-item-service`) **abandonada** para a entrega.
- **Regra nova: `main` só via Pull Request.** Ninguém commita direto.
- Quem faz a troca de base: **Luiz**, terça de manhã (16/06), como PR revisado. **Prazo final: quinta 18/06 às 23:59.**

---

## 1. O que JÁ ESTÁ PRONTO (na base `feat/fundacao-backend`)

Não refazer. Está codado **e testado** (~960 linhas de teste):

- **Auth (EP01):** login JWT, bcrypt, `/logout`, `/eu`, provisionar usuário (gestor-only), RBAC (`podeVerSetor`, `podeProcessarPedidos`, `podeEditarEstoque`, `podeCriarPedido`, `podeProvisionarUsuario`).
- **Catálogo/Estoque HO (EP02):** `EstoqueService.estoqueDoSetor` (qtd agregada + status), `catalogoParaSolicitante` (sem lote, RN12), filtros, `ProdutoService.cadastrar/editar/remover`, `LoteService.registrarEntrada/ajustarQuantidade`.
- **Pedidos (EP04):** `PedidoService.criar` (RN09, XOR linha livre), `expedir` item-a-item com **FEFO**, **dupla movimentação saída@HO + entrada@CEO**, **cria/atualiza lote-CEO** (RN19), **status derivado** (RN10), desdobramento em lotes (RF05.17).
- **Estoque CEO (EP03):** alimentação automática na expedição (a parte difícil) — pronta.
- **Validade de lote (EP07 parcial):** `estadoValidadeLote` (vencido/vencendo/atenção/ok), FEFO ignora vencido/segregado.
- **Infra:** `compose.yaml` (Postgres 16, porta **5433**), migrations Drizzle, seed idempotente com dados realistas, fail-fast de JWT no boot.

Rotas já expostas: `/login` `/logout` `/eu` `/usuarios` `/setores` `/setores/:id/estoque` `/setores/:id/catalogo` `/produtos` (POST/PATCH/DELETE) `/produtos/:id/lotes` (GET/POST) `/lotes/:id/quantidade` `/pedidos` (POST) `/pedidos/:id` `/setores/:id/pedidos` `/pedidos/:id/itens/:itemId/expedir`.

---

## 2. Como rodar e testar LOCAL (na base nova)

Pré-requisitos: Node 20+, Docker Desktop.

```bash
# 1. estar na base certa (após o PR de terça, será a própria main)
git checkout main            # antes do PR: git checkout feat/fundacao-backend
cd projeto/backend

# 2. variáveis de ambiente
cp .env.example .env         # já aponta para localhost:5433; ajuste JWT_SECRET

# 3. subir o Postgres (Compose V2, sem hífen)
docker compose up -d         # sobe ceo-estoque-db em 5433

# 4. dependências
npm install

# 5. aplicar schema + dados de exemplo
npm run db:migrate           # aplica drizzle/*.sql
npm run db:seed              # popula setores, usuários, produtos, lotes, pedidos

# 6. subir a API
npm run dev                  # http://localhost:3000

# 7. testes (a rede de segurança que protege o trabalho de todos)
npm test                     # vitest
```

Smoke test do fluxo (depois do `dev`), com `curl` ou Insomnia/Postman:

```bash
# login (usuários vêm do seed; ver src/db/seed.ts para credenciais)
curl -X POST localhost:3000/login -H "Content-Type: application/json" \
  -d '{"email":"<almoxarife@ufpe.br>","senha":"<seed>"}'
# guarde o token; use em Authorization: Bearer <token> nas demais

# ver estoque do HO, criar pedido, expedir item, ver estoque do CEO subir
```

> **Importante para o front (Luiz):** dá pra desenvolver as telas **sem** o backend, contra o `mock` + o contrato em `docs/PO/07-roadmap-metricas/05-contrato-api.md`. Troca-se o mock pela API real quando os PRs entrarem.

Se algo não subir: ler `compose.yaml` (porta 5433 é de propósito — a 5432 já é usada por outro projeto) e o `.env` (DATABASE_URL precisa bater com a porta).

---

## 3. O que FALTA (os 5 pacotes de backend)

Cada pacote é uma fatia vertical (domínio → service → controller → rota → teste), de baixo conflito. **Sem dono fixo aqui** — a equipe escolhe na reunião. Tudo entra por PR em `main`.

### Pacote 1 — Estoque do CEO: consumo + ajuste (EP03-03 / EP03-04)
- **Objetivo:** o gestor do CEO abate consumo clínico e corrige saldo por recontagem.
- **Construir:**
  - `EstoqueService` (ou novo `ConsumoService`): `registrarConsumo(loteId|produtoId, qtd, responsavelId, motivo?)` e `ajustarInventario(loteId, novoSaldo, responsavelId, observacao)` — transacional, gera `Movimentacao` tipo `consumo` / `ajuste` (delta).
  - Regra: consumo > saldo → erro com mensagem "Faça ajuste de inventário…" (US-EP03-03).
  - Rotas: `POST /lotes/:id/consumo`, `PATCH /lotes/:id/ajuste` (RBAC: gestor do setor; reusar `podeEditarEstoque`).
  - Testes do service (saldo desce; movimentação criada; consumo>saldo barra).
- **Onde:** espelhar `LoteService.ajustarQuantidade` (já existe) — mesma transação, tipos novos de movimentação.
- **Aceite:** US-EP03-03, US-EP03-04 (Gherkin em 02-user-stories.md).

### Pacote 2 — Dashboards / KPIs (EP05-01 / EP05-04 + demanda represada EP05-06)
- **Objetivo:** endpoints de agregação que o front consome no dashboard por perfil.
- **Construir:**
  - `DashboardService` + `GET /dashboard?setorId=` retornando por perfil: total de produtos, lotes vencendo (≤30/≤60d), produtos críticos (qtd ≤ mínimo), pedidos pendentes, **demanda represada** (top itens `aguardando_reposicao`).
  - `GET /setores/:id/pedidos?status=` (fila pendente do almoxarife — EP05-04) e contadores por aba.
  - Reusar `domain/estoque.ts` (`statusProduto`, `estadoValidadeLote`) — **não recalcular à mão**.
  - Testes de agregação com dados do seed.
- **Onde:** novo service de leitura; sem escrita, baixo risco de conflito.
- **Aceite:** US-EP05-01, US-EP05-04, US-EP05-06.

### Pacote 3 — Ciclo de vida do lote: segregação (EP07-01 / EP07-02)
- **Objetivo:** estados de validade expostos + ação de segregar lote vencido.
- **Construir:**
  - `LoteService.segregar(loteId, responsavelId, observacao)` → estado `segregado` + `data_segregacao` + `Movimentacao` tipo `segregacao` (transacional).
  - `POST /lotes/:id/segregar` (RBAC: almoxarife/gestor HO).
  - `GET /setores/:id/lotes-segregados` (visão separada).
  - Garantir que estoque/expedição **filtram** segregado (FEFO já ignora — confirmar via teste).
  - Estados visuais já existem em `estadoValidadeLote` — expor no payload de lotes.
  - Testes (segregar muda estado + gera movimentação; segregado some da expedição).
- **Onde:** `LoteService` (entrada/ajuste já lá), `domain/estoque.ts` (estados já lá).
- **Aceite:** US-EP07-01, US-EP07-02.

### Pacote 4 — Pedidos: robustez + teste de integração (EP04-06 / EP04-08)
- **Objetivo:** fechar as pontas do fluxo de pedidos e provar o caminho feliz ponta-a-ponta.
- **Construir:**
  - **Teste de integração HTTP** (o que mais falta): `POST /pedidos` → `POST /pedidos/:id/itens/:itemId/expedir` → `GET /setores/:ceo/estoque` (saldo do CEO subiu). Roda contra o Postgres de teste.
  - Abas + contadores por status (US-EP04-06) e visibilidade por setor (US-EP04-08) — endpoints/`query` que o front usa.
  - Casos de borda: expedir item já processado, expedir linha livre (deve barrar), pedido com item indisponível (`aguardando_reposicao`).
- **Onde:** `PgPedidoRepo.test.ts` e `PedidoService.test.ts` já existem — estender; novo arquivo de teste de integração.
- **Aceite:** US-EP04-06, US-EP04-08 (+ reforça US-EP03-01, US-EP04-04).

### Pacote 5 — Catálogo: CRUD/QA + seed + e-mail (EP02 / EP04-07)
- **Objetivo:** polir o catálogo, garantir dados de demo bons e a ponte de e-mail.
- **Construir:**
  - Revisar `ProdutoService.cadastrar/editar/remover` e rotas de lote (já existem) — cobrir validações faltantes (categoria/unidade inválida, remover produto com lote ativo = RN13) com teste.
  - **Seed de demonstração**: garantir que `db:seed` tem um roteiro de demo coeso (um pedido pendente pronto pra expedir na frente do cliente, lotes vencendo, item "Não Tem").
  - **Notificação por e-mail** ao criar pedido (US-EP04-07, *Should* — cortável): função `enviarEmailNovoPedido` chamada em `PedidoService.criar`; usar lib simples (nodemailer) ou stub logando o e-mail se faltar tempo.
  - "Converter linha livre em produto" (US-EP04-02, parte do almoxarife) se sobrar tempo.
- **Onde:** `ProdutoService`, `src/db/seed.ts`, novo `services/EmailService` (ou stub).
- **Aceite:** US-EP02-04/06, US-EP04-07. E-mail é o primeiro a cair se o prazo apertar.

---

## 4. Track do PO (Luiz) — frontend + integração

- **Terça AM (16/06):** abrir e mergear o PR `feat/fundacao-backend → main`; publicar o contrato de API (`05-contrato-api.md`); conduzir o kickoff de 2h.
- **Terça PM → quinta:** vibe-codar as telas contra o contrato + mock, trocando pelo backend conforme os PRs entram:
  - Login + troca de senha (EP01) · Catálogo/Estoque (EP02) · Novo Pedido multi-item + linha livre (EP04-01/02) · Processamento item-a-item do almoxarife (EP04-04) · Estoque CEO + consumo (EP03) · Dashboard por perfil (EP05) · Lotes/segregação (EP07).
- **Identidade UFPE (EP06):** cor primária `#990000`, desktop-first.

---

## 5. Cronograma

| Quando | Quem | O quê |
|--------|------|-------|
| **Seg 15/06** (hoje) | Todos | Reunião: alinhar a decisão da base + alocar os pacotes |
| **Ter 16/06** AM | Luiz | PR fundação → `main` (revisado) |
| Ter 16/06 (~2h) | **Todos** | Kickoff: subir local, percorrer o caminho feliz juntos |
| Ter 16/06 → Qua 17/06 | 5 devs | Pacotes 1–5 (PRs pequenos em `main`) |
| Ter 16/06 PM → Qui | Luiz | Frontend contra contrato + mock |
| Ter 16/06 PM | Todos | Primeira integração FE↔API real |
| Qua 17/06 | Todos | Fechar pontas, teste de integração verde, ensaio |
| **Qui 18/06 até 23:59** | Todos | Últimos ajustes e **ENTREGA do projeto** |

**Cortáveis sob pressão (nesta ordem):** e-mail (P5) → segregação avançada/lotes-segregados UI (P3) → gráfico de consumo mensal (fora do escopo, sem histórico) → ajuste de inventário (P1, *Could*).

---

## 6. Riscos da reta final

- **Conflito de contrato FE↔BE:** mitigado pelo `05-contrato-api.md` travado na terça (início dos trabalhos).
- **Curva do Drizzle:** mitigada pelo kickoff e pela camada `domain/*` pura.
- **Quebrar `main`:** mitigado pela regra de PR + `npm test` antes de mergear.
- **Vinicius/level desconhecido:** dar a ele o pacote mais fechado e bem especificado (P1 ou P3), com um revisor de plantão.
