# Visão geral — arquitetura e fluxos (CEO-UFPE)

> Gerado em 2026-06-03. Reflete `feat/fundacao-backend` (PR #20, backend v2) + `feat/frontend-fundacao` (PR #21, front).
> Modelo de dados = **v2 Drizzle** (ADR-0004). As branches `develop` / `feature/database-schema` (modelo v1-v2 paralelo) estão **superseded** — não usar como base.

## 1. Arquitetura do código

Monólito em duas pastas (`projeto/backend`, `projeto/frontend`), camadas explícitas, banco PostgreSQL.

```mermaid
flowchart TB
  subgraph FE["projeto/frontend — React 19 + Vite + TS strict (ADR-0006)"]
    direction TB
    Pages["pages/<br/>Login · Dashboard · EstoqueCEO<br/>EstoqueDispensacao · Solicitacoes"]
    Comps["components/<br/>TabelaEstoque · NovoPedidoForm"]
    Ctx["context/AuthContext<br/>(JWT em localStorage, /eu)"]
    ApiFE["api/<br/>client (fetch tipado + Bearer)<br/>auth · estoque · lotes · pedidos · setores"]
    Pages --> Comps --> ApiFE
    Pages --> Ctx --> ApiFE
  end

  Proxy{{"Vite proxy /api → :3000 (dev)<br/>⚠ CORS pendente p/ prod"}}
  ApiFE -->|HTTP /api/*| Proxy

  subgraph BE["projeto/backend — Express + TS (ADR-0001/04/05)"]
    direction TB
    Routes["routes.ts<br/>(rotas REST)"]
    MW["middleware<br/>autenticar (JWT) · exigir (RBAC)"]
    Ctrl["controller/<br/>Auth · Produto · Lote · Pedido"]
    Svc["services/<br/>Estoque · Lote · Pedido · Item"]
    Dom["domain/ (PURO, testável)<br/>estoque (RN03-07) · pedido (RN09/16/19)"]
    Repo["repositories/ Pg*Repo<br/>(Drizzle)"]
    Routes --> MW --> Ctrl --> Svc --> Repo
    Svc --> Dom
  end

  Proxy -->|same-origin server-to-server| Routes

  DB[("PostgreSQL :5433<br/>setor · usuario · produto · lote<br/>pedido · item_do_pedido · movimentacao")]
  Repo --> DB

  Auth["auth/<br/>senha (hash) · jwt · rbac<br/>podeVerSetor / podeCriarPedido / podeProcessarPedidos"]
  MW -.usa.-> Auth
  Ctrl -.usa.-> Auth
```

**Princípios:** o `domain/` é puro (sem I/O) e concentra as regras de negócio (RN); `services/` orquestram repos + domínio em transações atômicas (estoque + auditoria nunca divergem); `controller/` só traduz HTTP; RBAC por perfil×setor. O front espelha os enums do backend em `types/domain.ts` (sync manual — futura melhoria: pacote compartilhado).

## 2. Fluxos dos usuários

Dois setores: **HO** (almoxarifado central, `almoxarifado`) e **CEO** (clínica, `destinatario`). Perfis: gestor, almoxarife, solicitante, dentista.

```mermaid
flowchart TD
  Start(["Usuário acessa o sistema"]) --> Login["Login (POST /login)<br/>recebe JWT + identidade"]
  Login --> Dash["Dashboard do seu setor<br/>resumo de estoque + pedidos"]

  Dash --> Papel{"Perfil / setor?"}

  %% Solicitante / gestor do CEO
  Papel -->|Solicitante/Gestor CEO| Sol["Solicitações"]
  Sol --> VerEstCEO["Vê Estoque do CEO<br/>(GET /setores/CEO/estoque)"]
  Sol --> NovoPed["Cria pedido multi-item<br/>origem=CEO, destino=HO<br/>(POST /pedidos · RN09/INV07)"]
  NovoPed --> Pendente["Pedido nasce 'pendente'"]

  %% Almoxarife / gestor do HO
  Papel -->|Almoxarife/Gestor HO| HO["Estoque da Dispensação (HO)"]
  HO --> VerLotes["Expande produto → lotes<br/>(GET /produtos/:id/lotes, FEFO)"]
  HO --> Fila["Vê pedidos pendentes"]
  Fila --> Expedir["Processa item-a-item<br/>(POST /pedidos/:id/itens/:item/expedir)"]

  Expedir --> FEFO["Baixa lotes FEFO no HO<br/>+ movimentação saída(HO)→entrada(CEO)<br/>(RN19/RN11, atômico)"]
  FEFO --> Status["Recalcula status do pedido<br/>integral / parcial / não atendido (RN10/16)"]
  Pendente -.aguarda.-> Fila
  Status --> Acomp["Solicitante acompanha<br/>status do pedido e dos itens"]
```

**Orientação do pedido (importante):** ORIGEM = setor de quem pede (CEO); DESTINO = HO (quem fornece). A expedição move o estoque fisicamente HO → CEO. (Bug corrigido na validação e2e — o front enviava invertido.)

## 3. Estado de integração (2026-06-03)

- **PR #20** (`feat/fundacao-backend` → main): backend v2 + EP02/03/04 + `GET /setores` + fix `seq_pedido`. Base oficial.
- **PR #21** (`feat/frontend-fundacao` → base no #20): front (4 telas), front-only. **Mergear #20 primeiro.**
- Base de integração decidida: **`main`**; `develop` aposentada.
