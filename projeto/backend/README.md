# Backend — CEO-UFPE (Controle de Estoque)

API do sistema de controle de estoque do CEO-UFPE. Node + Express + Drizzle (PostgreSQL).

## Pré-requisitos

A máquina precisa de **3 coisas** (não é só Docker — só o banco roda em container; a API e as ferramentas rodam no host):

| Ferramenta | Para quê | Como conferir |
|------------|----------|---------------|
| **Docker Desktop** (ligado) | sobe o PostgreSQL via `compose.yaml` | `docker info` |
| **Node.js 20+** | roda `npm install`, migrations/seed (`tsx`) e a API | `node -v` |
| **Git** | clonar o repositório | `git --version` |

> No Windows, o Git Desktop/Git Bash também instala o `bash`, caso queira usar o `start.sh`.

## Subir tudo em UM comando

A partir desta pasta (`projeto/backend`):

```powershell
# Windows (PowerShell)
.\start.ps1
```
```bash
# Mac / Linux / Git Bash
bash start.sh
```

O script faz, em ordem: confere Docker/Node → cria `.env` a partir de `.env.example` → sobe o Postgres (porta **5433**) → espera o banco ficar pronto → `npm install` → aplica as migrations → popula o seed → sobe a API em `http://localhost:3000`.

**Flags úteis:**
- `.\start.ps1 -Reset` (ou `bash start.sh --reset`) — **apaga** o banco e recria do zero.
- `.\start.ps1 -NoDev` (ou `bash start.sh --no-dev`) — prepara tudo mas **não** sobe a API.

> Se o PowerShell bloquear o script: `Set-ExecutionPolicy -Scope Process Bypass` e rode de novo.

## Usuários de teste (vêm do seed)

Senha de **todos**: `ceoufpe2026`

| Perfil | E-mail |
|--------|--------|
| Gestor HO | `ana.costa@ufpe.br` |
| Almoxarife HO | `joao.silva@ufpe.br` |
| Solicitante CEO | `rafael.moura@ufpe.br` |
| Gestora CEO | `helena.lima@ufpe.br` |

## Comandos do dia a dia

```bash
npm run dev         # sobe a API (hot reload) em http://localhost:3000
npm test            # roda os testes (vitest)
npm run db:migrate  # aplica migrations (drizzle-kit)
npm run db:seed     # repopula dados de exemplo
npm run db:studio   # abre o Drizzle Studio (inspecionar o banco no navegador)
```

## Por que a porta 5433?

O `compose.yaml` publica o Postgres em **5433** de propósito — a 5432 do host costuma já estar ocupada por outro projeto. A `DATABASE_URL` no `.env` já aponta para `localhost:5433`. Se mudar a porta, mantenha as duas em sincronia.

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| `Docker daemon não está rodando` | Docker Desktop fechado | abra o Docker Desktop e rode de novo |
| `compose.yaml not found` | rodou fora de `projeto/backend` | `cd projeto/backend` antes |
| `DATABASE_URL não definida` | sem `.env` | o script cria; ou `cp .env.example .env` |
| porta 5433 ocupada | outro Postgres em 5433 | ajuste a porta no `compose.yaml` **e** no `.env` |
| banco "sujo" / erro de migration | estado antigo | `.\start.ps1 -Reset` |

## Arquitetura (resumo)

- `src/domain/*` — regras de negócio **puras** (FEFO, status do produto/pedido, validade). Testáveis isoladamente; **reuse, não reescreva**.
- `src/services/*` — orquestram banco + domínio em transações.
- `src/repositories/Pg*Repo.ts` — acesso ao Postgres (Drizzle).
- `src/controller/*` + `src/routes/routes.ts` — HTTP, com `autenticar` (JWT) e `exigir` (RBAC).
- `src/auth/*` — JWT, bcrypt, guards de permissão.
- `src/db/schema.ts` — schema (fonte das migrations em `drizzle/`).

Decisões e plano da entrega: ver `ADR-0006` e `docs/PO/07-roadmap-metricas/04-entrega-final-3dias.md` (+ contrato de API em `05-contrato-api.md`).
