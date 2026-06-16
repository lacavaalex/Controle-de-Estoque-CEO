# Banco de Dados — CEO Estoque UFPE

> Documentação técnica da camada de persistência PostgreSQL.
> Fonte de verdade: `docs/PO/06-dominio-regras/03-modelo-conceitual.md`

---

## 1. Por que PostgreSQL?

| Decisão | Justificativa rastreada |
|---------|------------------------|
| `TIMESTAMPTZ` nativo | **RNF07.1** (auditoria com timezone correto) + **K1 KPI** (mediana de horas entre `data_solicitacao` e `data_conclusao`) |
| ENUM types nativos | **RN01, RN02, RN10** — catálogos fechados sem tabela extra; sem string livre inválida |
| `gen_random_uuid()` disponível | PostgreSQL 16 — sem extensão adicional |
| UTF-8 encoding | Suporta `bastão` e demais acentos na `unidade_medida` |
| Tier gratuito disponível | **RT02** (sem orçamento) — Supabase e Neon oferecem plano free |
| Driver `pg` sem ORM | **RNF06.1** — Repository isola o banco; fácil substituição de provider |

---

## 2. Mapa: tabelas → modelo conceitual

| Tabela | Seção do modelo conceitual |
|--------|---------------------------|
| `usuario` | §2.1 |
| `item` | §2.2 |
| `estoque_ceo` | §2.3 |
| `solicitacao` | §2.4 |
| `movimentacao` | §2.5 |

---

## 3. Mapa: sintomas S1–S6 → solução no banco

| Sintoma | Causa | Como o schema ataca |
|---------|-------|---------------------|
| **S1** — Itens vencendo sem alerta | Sem registro de validade | Campo `item.validade DATE NOT NULL` + `idx_item_validade`; `PgItemRepo.findVencendo(dias)` |
| **S2** — Solicitações sem rastreabilidade | Pedidos verbais/papel | Tabela `solicitacao` com ID `SOL-NNN`, `solicitante`, `data_solicitacao` e `justificativa` |
| **S3** — Divergência qtd registrada vs. física | Sem movimentação auditável | Tabela `movimentacao` com `tipo`, `responsavel` e `data` obrigatórios; ajuste manual registrado |
| **S4** — Sem visibilidade histórica | Dados não persistidos | `movimentacao` + timestamps `TIMESTAMPTZ` permitem agregações por período (K1, OP4) |
| **S5** — Confusão Dispensação vs. CEO | Sem separação de estoques | Tabelas `item` (Dispensação) e `estoque_ceo` (CEO) separadas, FK `estoque_ceo.item_id → item.id` |
| **S6** — Aprovação sem registro formal | Sem constraint de ciclo de vida | CHECK composto em `solicitacao`: `status IN ('aprovada','negada') AND data_conclusao IS NOT NULL AND responsavel IS NOT NULL` — fisicamente impossível resolver sem registrar |

---

## 4. Mapa RN01–RN15 → onde está enforçada

| Regra | Descrição resumida | Enforçada em |
|-------|--------------------|-------------|
| **RN01** | Usuário tem exatamente 1 role | `usuario.role role_usuario NOT NULL` (ENUM — migration 001/002) |
| **RN02** | Categorias fechadas | `item.categoria categoria_item NOT NULL` (ENUM — migration 001/003) |
| **RN03** | Crítico: qtd ≤ mínimo | `statusCalculator.ts` + `PgItemRepo.findCriticos()` |
| **RN04** | Excessivo: qtd ≥ máx × 0.95 | `statusCalculator.ts` |
| **RN05** | Estados de validade | `statusCalculator.ts` + `idx_item_validade` + `PgItemRepo.findVencendo()` |
| **RN06** | Precedência de status | `calcularStatusItemDispensacao()` — ordem exata dos `if`s |
| **RN07** | Status no CEO | `calcularStatusEstoqueCeo()` |
| **RN08** | Botão "Solicitar" desabilitado se Indisponível | Aplicação (frontend) com base em `calcularStatusEstoqueCeo()` |
| **RN09** | Validação na criação da solicitação | `CHECK (quantidade_solicitada >= 1)` + `CHECK (LENGTH(TRIM(justificativa)) >= 10)` — migration 005 |
| **RN10** | Ciclo de vida da solicitação | `status status_solicitacao NOT NULL DEFAULT 'pendente'` + `PgSolicitacaoRepo.aprovar/negar()` com `WHERE status = 'pendente'` |
| **RN11** | Registro de responsável e data | CHECK composto em `solicitacao` (migration 005) — INV02/INV03 |
| **RN12** | Dentista vê só as próprias | `PgSolicitacaoRepo.findAll({ solicitante })` + `idx_solicitacao_solicitante` |
| **RN13** | Confirmação em remoção | Aplicação (controller/service) — modal antes de chamar `PgItemRepo.delete()` |
| **RN14** | Sessão no navegador | Aplicação (frontend — sessionStorage) |
| **RN15** | Identidade visual UFPE | Aplicação (frontend — cor `#990000`) |

---

## 5. Como rodar do zero (PowerShell)

### Opção A — Docker local (sem conta em nuvem)

```powershell
cd projeto\backend

# 1. Instalar dependências (pg, @types/pg já inclusos)
npm install

# 2. Subir PostgreSQL 16 em container Docker
npm run db:up
# Aguarda o healthcheck: pg_isready -U ceo_user -d ceo_estoque

# 3. Criar tabelas e ENUMs (idempotente)
npm run db:migrate

# 4. Popular com dados de desenvolvimento
npm run db:seed

# 5. Iniciar servidor em modo dev
npm run dev
```

> **Resetar tudo (dev only):** `npm run db:reset` — trunca tabelas e re-executa o seed.

Para derrubar o Postgres: `npm run db:down`

---

## 6. Alternativa cloud (sem Docker)

### Neon (recomendado — Serverless Postgres)

1. Acesse [neon.tech](https://neon.tech) → **Sign up free**
2. Crie um projeto: **New Project** → nome `ceo-estoque` → região mais próxima (ex.: `us-east-1` ou `eu-central-1`)
3. Na aba **Connection Details**, copie a **Connection string** (formato `postgresql://user:pass@host/db?sslmode=require`)
4. Cole no `projeto/backend/.env`:
   ```
   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
   NODE_ENV=development
   ```
5. Execute apenas:
   ```powershell
   cd projeto\backend
   npm install
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

### Supabase

1. Acesse [supabase.com](https://supabase.com) → **New project**
2. Em **Settings → Database**, copie a **Connection string (URI)** — selecione modo **Transaction pooler** para apps serverless ou **Session pooler** para Node.js de longa duração
3. Cole em `.env` como `DATABASE_URL=...`
4. Siga os passos 5 do Neon acima

> **Nota:** ambos os serviços têm tier gratuito suficiente para o piloto (**RT02** — sem orçamento).

---

## 7. Como inspecionar o banco

### VS Code (recomendado)

- **Extensão "PostgreSQL"** (Microsoft) — `ms-ossdata.vscode-postgresql`
- **SQLTools** + driver **SQLTools PostgreSQL** — permite executar queries inline

### Standalone

- **pgAdmin 4** — interface web completa, ideal para explorar schema visualmente
- **DBeaver** — multiplataforma, suporte a todas as versões do PG

String de conexão para ferramentas externas (local):
```
Host: localhost  Port: 5432
Database: ceo_estoque  User: ceo_user  Password: ceo_pass
```

---

## 8. Como visualizar o diagrama

1. Abra [dbdiagram.io/d](https://dbdiagram.io/d)
2. Apague o conteúdo inicial do editor
3. Cole o conteúdo de [`02-der-dbml.dbml`](./02-der-dbml.dbml)
4. O diagrama renderiza automaticamente à direita
5. Clique em **Export → PNG** (ou PDF) para baixar

Para usar no Draw.io:
1. Abra `01-der-mermaid.md`
2. No Draw.io: **Insert → Advanced → Mermaid** → cole o bloco `erDiagram`

---

## 9. Trade-offs assumidos

| Decisão | Justificativa | Referência |
|---------|---------------|-----------|
| `solicitante` como `VARCHAR` (não FK para `usuario.id`) | §2.4 explicitamente deixa como string para MVP; FK será introduzida em fase 2 | §5 do modelo conceitual |
| Campos denormalizados (`item_nome`, `cargo` em `solicitacao`; `nome`, `categoria`, `unidade` em `estoque_ceo` e `movimentacao`) | Preserva contexto histórico mesmo se o item for editado; evita JOINs nas listagens mais frequentes | §2.3, §2.4, §2.5 |
| `subdepartamento` não existe como tabela | CEO é piloto único no MVP; generalização para múltiplos subdepartamentos é fase 2 | §5 do modelo conceitual |
| Status calculado em runtime, não persistido | Evita inconsistência entre dados e status; todo campo calculável não deve ser armazenado | §2.2 "Status calculado em runtime" |
| `local_estoque` como ENUM (não tabela) | Apenas dois destinos no MVP; ENUM é mais simples e sem overhead de JOIN | §2.5, §5 |

---

## 10. Plano de migração para Fase 2

1. **Introduzir `subdepartamento`** — nova tabela `subdepartamento(id, nome)` → migrar `estoque_ceo` para `estoque_local(item_id, subdepartamento_id, quantidade, estoque_minimo)` → converter `local_estoque` ENUM para FK
2. **Trocar `solicitacao.solicitante`** (TEXT) por `solicitante_id BIGINT REFERENCES usuario(id)` — migration `ALTER TABLE solicitacao ADD COLUMN solicitante_id BIGINT REFERENCES usuario(id)` + backfill por e-mail + drop da coluna antiga
3. **Generalizar `estoque_ceo`** em `estoque_local(item_id, subdepartamento_id, quantidade, estoque_minimo)` com `UNIQUE(item_id, subdepartamento_id)`, permitindo múltiplos subdepartamentos com saldos independentes

---

## 11. Cobertura das User Stories Must

Análise de todas as 26 User Stories `Must` do backlog (`docs/PO/05-backlog/02-user-stories.md`):

| Story | Descrição | Status |
|-------|-----------|--------|
| US-EP01-01 | Login institucional | ✅ `usuario.email CHECK @ufpe.br` + `usuario.senha_hash` |
| US-EP01-02 | Logout | ✅ Aplicação (sessionStorage) — sem impacto no schema |
| US-EP01-03 | Restrição de rotas por perfil | ✅ `usuario.role role_usuario NOT NULL` (RN01) |
| US-EP01-04 | Sessão persistente no navegador | ✅ Aplicação (sessionStorage) — sem impacto no schema |
| US-EP02-01 | Listar itens da Dispensação | ✅ Tabela `item` com todos os campos + `PgItemRepo.findAll()` |
| US-EP02-02 | Filtrar itens | ✅ `PgItemRepo.findAll(filters)` — nome ILIKE, lote ILIKE, categoria ENUM |
| US-EP02-03 | Cadastrar novo item | ✅ `PgItemRepo.create()` — CHECKs de validação no schema |
| US-EP02-04 | Editar item | ✅ `PgItemRepo.update()` |
| US-EP02-05 | Remover item com confirmação | ✅ `PgItemRepo.delete()` — confirmação na camada de controller |
| US-EP02-06 | Dentista não vê Estoque Dispensação | ✅ `usuario.role` + RBAC na aplicação |
| US-EP03-01 | Visão em cards (dentista) | ✅ Tabela `estoque_ceo` + `calcularStatusEstoqueCeo()` |
| US-EP03-02 | Visão em tabela (gestão/almoxarife) | ✅ `PgEstoqueCeoRepo.findAll()` |
| US-EP03-03 | Botão "Solicitar" desabilitado em indisponíveis | ✅ `calcularStatusEstoqueCeo()` → status `Indisponível` |
| US-EP04-01 | Dentista cria solicitação | ✅ `PgSolicitacaoRepo.create()` + CHECKs RN09 no schema |
| US-EP04-02 | Almoxarife aprova solicitação | ✅ `PgSolicitacaoRepo.aprovar()` — CHECK composto INV02 no schema |
| US-EP04-03 | Almoxarife nega solicitação | ✅ `PgSolicitacaoRepo.negar()` — CHECK composto INV03 no schema |
| US-EP04-04 | Dentista vê só as próprias | ✅ `PgSolicitacaoRepo.findAll({ solicitante })` + `idx_solicitacao_solicitante` |
| US-EP04-05 | Visão por abas | ✅ `PgSolicitacaoRepo.findAll({ status })` + `idx_solicitacao_status_data` |
| US-EP04-06 | Gestão tem visão de auditoria | ✅ `PgSolicitacaoRepo.findAll()` sem filtro — somente leitura na camada de controller |
| US-EP05-01 | KPIs do dashboard | ⚠️ **Lacuna:** nenhuma query de agregação criada ainda — `COUNT(*)` por status/estado precisa de método dedicado no Service (não no Repository) |
| US-EP05-02 | Gráfico de consumo mensal | ⚠️ **Lacuna:** requer query de agregação `GROUP BY DATE_TRUNC('month', data)` em `movimentacao` — não implementada no MVP atual |
| US-EP05-03 | Listas de vencendo e crítico | ✅ `PgItemRepo.findVencendo(30)` + `PgItemRepo.findCriticos()` |
| US-EP05-04 | Fila de pendentes para almoxarife | ✅ `PgSolicitacaoRepo.findAll({ status: 'pendente' })` |
| US-EP05-05 | Log de movimentações | ✅ `PgMovimentacaoRepo.findRecent(10)` + `idx_movimentacao_data` |
| US-EP06-01 | Identidade UFPE aplicada | ✅ Aplicação (frontend) — sem impacto no schema |
| US-EP06-02 | Layout responsivo | ✅ Aplicação (frontend) — sem impacto no schema |

### Lacunas identificadas (⚠️)

| Story | Lacuna | Proposta para PO |
|-------|--------|-----------------|
| US-EP05-01 | Queries de KPI agregado não implementadas | Criar `DashboardService` com métodos `getKpis()` retornando `{ totalItens, itensCriticos, itensVencendo, solicitacoesPendentes }` via queries COUNT |
| US-EP05-02 | Gráfico de consumo mensal Dispensação × CEO | Criar `PgMovimentacaoRepo.getConsumoMensal(meses)` com `GROUP BY DATE_TRUNC('month', data), destino` — dados suficientes no schema atual |
