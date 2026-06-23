# Plano de Implementação — CEO-248 · US-EP05-01 — KPIs por perfil

> Épico: EP05 — Alertas e Dashboards · Prioridade: Must · Estimativa: 5 SP · RFs: RF02.1, RF02.5
> Objetivo: ver KPIs no topo do dashboard para entender o estado em segundos.

## Descoberta-chave

O **frontend do dashboard já está pronto e já chama o backend**. Em
`projeto/frontend/src/pages/Dashboard.jsx` + `src/api/dashboard.js`, ele faz
`GET /api/dashboard?setorId=…` e hoje recebe 404 — caindo num aviso honesto
("ainda está sendo entregue no backend"). O Vite faz `rewrite` de `/api` → ``
(`vite.config.js`), então a rota real no backend é **`GET /dashboard`**.

Ou seja: **o trabalho é quase 100% backend.** Basta criar o endpoint
`/dashboard` devolvendo exatamente o JSON que o front já consome.

Contrato já fixado pelo front (e pelo teste `Dashboard.test.jsx`):

```json
{
  "totalProdutos": 120,
  "produtosCriticos": 5,
  "lotesVencendo30": 3,
  "lotesVencendo60": 7,
  "pedidosPendentes": 2,
  "demandaRepresada": [
    { "produtoId": 9, "nome": "Luva", "qtdSolicitadaTotal": 40, "numPedidos": 3 }
  ]
}
```

## Como cada KPI se calcula (tudo já tem peça pronta)

Setores no seed: **HO = id 1** (`almoxarifado`), **CEO = id 2** (`destinatario`).

| Campo | Fonte / regra | Peça reutilizável |
|---|---|---|
| `totalProdutos` | nº de produtos do catálogo | `produtoRepo.listar().length` |
| `produtosCriticos` | produtos com `status === "critico"` no setor | `EstoqueService.estoqueDoSetor(setorId)` + filtro |
| `lotesVencendo30` | lotes `ativo` do setor com `0 < dias ≤ 30` | `loteRepo.listarPorSetor` + `estadoValidadeLote()` (`"vencendo"`) |
| `lotesVencendo60` | lotes `ativo` do setor com `0 < dias ≤ 60` | idem (`"vencendo"` ou `"atencao"`) |
| `pedidosPendentes` | pedidos do setor com `status === "pendente"` | `pedidoRepo.listarPorSetor(setorId)` + filtro |
| `demandaRepresada` | itens `statusItem === "aguardando_reposicao"`, agrupados por produto | `pedidoRepo.listarPorSetor` + agrupamento |

Tudo já existe: `domain/estoque.ts` (`estadoValidadeLote`, `statusProduto`),
`EstoqueService`, `loteRepo.listarPorSetor`, `pedidoRepo.listarPorSetor`,
`produtoRepo.listar`. **Sem SQL novo e sem mexer no schema.**

## Arquivos a criar/modificar

Arquitetura em camadas (rota → controller → service → repos), com injeção em
`di/container.ts`. Seguir o padrão de `Produto`/`Pedido`.

**Criar:**
1. `projeto/backend/src/services/DashboardService.ts` — lógica de agregação.
2. `projeto/backend/src/controller/DashboardController.ts` — adapta HTTP ↔ service (espelha `ProdutoController`).
3. *(opcional, recomendado)* `projeto/backend/src/services/DashboardService.test.ts` — Vitest.

**Modificar:**
4. `projeto/backend/src/di/container.ts` — instanciar e exportar `dashboardController` (reaproveitando `produtoRepo`, `loteRepo`, `pedidoRepo`, `estoqueService`).
5. `projeto/backend/src/routes/routes.ts` — registrar `GET /dashboard`.

**Nada no frontend** (já pronto). O caminho de 404 some sozinho quando a rota existir.

## Métodos a escrever

**`DashboardService`** (recebe `produtoRepo`, `loteRepo`, `pedidoRepo`, `estoqueService`):

```ts
class DashboardService {
  // Único método público. setorId = setor do usuário autenticado.
  async kpis(setorId: number, hoje = new Date()): Promise<DashboardKpis> { ... }
}
```

Helpers privados puros (simples e testáveis):
- `contarLotesVencendo(lotes, hoje, limiteDias)` → usa `diasParaVencer`/`estadoValidadeLote`, só lotes `ativo`.
- `produtosCriticos(setorId)` → `estoqueService.estoqueDoSetor(setorId)` e conta `status === "critico"`.
- `demandaRepresada(setorId)` → `pedidoRepo.listarPorSetor`, varre itens `aguardando_reposicao`, agrupa por `produtoId` (soma `qtdSolicitada`, conta pedidos distintos), resolve `nome` via `produtoRepo`.

**`DashboardController`**:

```ts
async kpis(req, res) {
  const setorId = Number(req.query.setorId ?? req.identidade.setorId);
  const data = await this.dashboardService.kpis(setorId);
  return res.status(200).json(data);
}
```

**Rota** (mesmo guard RBAC do estoque — RN12):

```ts
router.get(
  "/dashboard",
  auth,
  exigir((id, req) => podeVerSetor(id, Number(req.query.setorId ?? id.setorId))),
  (req, res) => dashboardController.kpis(req, res),
);
```

## Sequência de ações

1. Subir o ambiente (`projeto/backend && bash start.sh`; front em outro terminal com `npm run dev`) e abrir o Dashboard logado como gestor — confirmar o aviso de 404 (o "antes").
2. Criar `DashboardService.ts` com `kpis()` e os 3 helpers, reusando repos/domain.
3. Criar `DashboardController.ts` (espelhando `ProdutoController`).
4. Ligar no `container.ts`: `const dashboardService = new DashboardService(produtoRepo, loteRepo, pedidoRepo, estoqueService);` + controller + export.
5. Registrar a rota em `routes.ts` (importar `dashboardController`; `podeVerSetor` já está importado).
6. Testar manualmente: recarregar o Dashboard (KPIs reais aparecem). Logar como gestor CEO (`helena.lima@ufpe.br`) e gestor HO (`ana.costa@ufpe.br`) para ver números por setor.
7. *(recomendado)* Escrever `DashboardService.test.ts` com repos fakes (in-memory): crítico, vencendo ≤30/≤60 e agrupamento de demanda represada.

## Decisão de escopo (manter simples)

O Gherkin do CEO-248 pede **conjuntos de KPI diferentes por perfil** (HO: 5 KPIs;
CEO: 4 com rótulos próprios; almoxarife: ≤30d). Mas o `Dashboard.jsx` atual mostra
um conjunto fixo de 4 KPIs + demanda represada para todos, já escopado por `setorId`.

**Abordagem mínima recomendada:** implementar o endpoint devolvendo o shape que o
front já lê, escopado pelo setor do usuário (gestor CEO vê CEO; gestor HO vê HO).
Isso satisfaz o essencial da story + escopo por setor/perfil via RBAC.

**Incrementos posteriores:**
- Diferenciação fina de rótulos por perfil (3 layouts) — exigiria mexer no JSX/contrato e adicionar campos como `itensEstoqueCeo`, `aguardandoReposicao`.
- Cenário "KPI atualiza sem reload" — puramente frontend (re-`fetch` após expedir); não bloqueia esta entrega.
