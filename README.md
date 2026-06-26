# Controle de Estoque — CEO / Hospital Odontológico UFPE

Sistema web para o controle do estoque de materiais consumíveis entre a
Unidade de Dispensação (almoxarifado **HO**) e o Centro de Especialidades
Odontológicas (**CEO**) do Hospital Odontológico da UFPE.

## Contexto

O hospital opera hoje com planilhas de Excel para registrar a saída de
materiais entre o almoxarifado central e os subdepartamentos clínicos. Isso
gera divergência entre estoque registrado e físico, falta de rastreabilidade
dos pedidos e perda de itens por vencimento sem alerta.

O CEO é o subdepartamento piloto desta primeira fase. A ideia é validar a
solução nele antes de expandir para os demais (Endodontia, Cirurgia,
Radiologia etc.).

## O que o sistema faz

- Catálogo e estoque por setor, com filtros (categoria, status, texto) e
  status calculado automaticamente: Crítico, Baixo, Vencendo, Vencido, OK,
  Indisponível.
- Fluxo de pedido multi-item: o **solicitante** cria o pedido, o **almoxarife**
  atende item a item por **FEFO** (vence primeiro, sai primeiro) e o estoque do
  CEO sobe automaticamente.
- Registro auditável de toda movimentação (entrada, saída, ajuste, consumo,
  segregação).
- Quatro perfis com permissões diferentes (**gestor, almoxarife, solicitante**
  e dentista — este último em fase futura), com RBAC por setor.

## Estrutura do repositório

```
Controle-de-Estoque-CEO/
├── docs/PO/             documentação de produto (requisitos, regras, modelo, contrato de API)
├── docs/diagramas/      diagramas de arquitetura e do ORM
├── projeto/backend/     API Node.js + Express + TypeScript + Drizzle/PostgreSQL
├── projeto/frontend/    SPA React 19 + Vite (telas: login, estoque, pedidos, dashboard)
└── DS-prototype/        protótipo navegável de UI (referência)
```

## Como rodar (backend + frontend)

Pré-requisitos: **Node.js 20+** e **Docker** (só o banco roda em container; a API
e o front rodam no host).

São **dois processos**, em dois terminais. Suba o backend primeiro — o frontend
fala com ele.

### 1) Backend + banco (um comando)

A partir de `projeto/backend/`:

```bash
# Mac / Linux / Git Bash
bash start.sh
```
```powershell
# Windows (PowerShell)
.\start.ps1
```

O script confere Docker/Node, cria o `.env`, sobe o Postgres (porta **5433**),
aplica as migrations, popula o seed e sobe a API em `http://localhost:3000`.
Detalhes e flags (`--reset`, `--no-dev`) em [`projeto/backend/README.md`](projeto/backend/README.md).

### 2) Frontend

Em outro terminal, a partir de `projeto/frontend/`:

```bash
npm install
npm run dev
```

A interface sobe em `http://localhost:5173`. Em desenvolvimento, o Vite faz
proxy de `/api` → `http://localhost:3000`, então **não há configuração extra de
CORS** nem `.env` no front para rodar localmente.

### Entrar no sistema

Use um usuário do seed (senha de **todos**: `ceoufpe2026`):

| Perfil | E-mail |
|--------|--------|
| Gestor HO | `ana.costa@ufpe.br` |
| Almoxarife HO | `joao.silva@ufpe.br` |
| Solicitante CEO | `rafael.moura@ufpe.br` |
| Gestora CEO | `helena.lima@ufpe.br` |

## Testes

```bash
cd projeto/backend  && npm test     # lógica de domínio (FEFO), serviços, auth/RBAC
cd projeto/frontend && npm test     # telas e cliente de API (vitest)
```

## Documentação

| Documento                  | Caminho                                                  |
| -------------------------- | -------------------------------------------------------- |
| Contexto e problema        | `docs/PO/01-discovery/01-contexto-e-problema.md`         |
| Requisitos funcionais      | `docs/PO/04-requisitos/01-requisitos-funcionais.md`      |
| Backlog (user stories)     | `docs/PO/05-backlog/02-user-stories.md`                  |
| Regras de negócio          | `docs/PO/06-dominio-regras/02-regras-de-negocio.md`      |
| Modelo conceitual          | `docs/PO/06-dominio-regras/03-modelo-conceitual.md`      |
| **Contrato de API (FE↔BE)**| `docs/PO/07-roadmap-metricas/05-contrato-api.md`         |
| Decisões de arquitetura    | `ADR-0001` … `ADR-0006` (raiz)                           |

## Demonstração em Vídeo
Para entender o funcionamento do sistema e o fluxo das funcionalidades integradas, assista ao vídeo de demonstração no YouTube:
[Demonstração do Controle de Estoque](https://www.youtube.com/watch?v=1OhQthoOFMI)

## Status

Projeto em desenvolvimento — disciplina de Desenvolvimento de Sistemas (UFPE),
piloto previsto para o CEO. Backend e frontend integrados sobre a base Drizzle/
PostgreSQL; fluxo de login → estoque → pedido → expedição validado ponta a ponta.
