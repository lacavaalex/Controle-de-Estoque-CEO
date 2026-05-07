# Documentação do Produto — CEO Estoque UFPE

**Produto:** Sistema de Controle de Estoque do Hospital Odontológico da UFPE
**Subdepartamento piloto:** Centro de Especialidades Odontológicas (CEO)
**Versão da documentação:** 1.0
**Data:** 07/05/2026
**Product Owner:** Equipe DS — UFPE

---

## Sobre esta documentação

Este conjunto de artefatos é a **fonte de verdade do Product Owner** para o projeto. Ele cobre desde a descoberta do problema até o backlog refinado, passando por personas, requisitos, regras de negócio e métricas de sucesso.

A documentação foi construída a partir de:

- Contexto de campo levantado junto ao Hospital Odontológico da UFPE e ao CEO.
- Protótipo funcional em React (`DS-prototype/`) que materializa a hipótese de solução.
- Arquivo `DS-prototype/requisitos.md`, que originalmente listou os requisitos brutos.

Os documentos são vivos: a cada ciclo de refinamento, o PO os atualiza e versiona junto ao código.

---

## Índice

### 01 — Discovery
Entendimento do problema, contexto institucional, stakeholders e diagnóstico da operação atual.

- [01-discovery/01-contexto-e-problema.md](01-discovery/01-contexto-e-problema.md) — Contexto, dor, oportunidade e premissas
- [01-discovery/02-stakeholders.md](01-discovery/02-stakeholders.md) — Mapa de stakeholders e matriz de poder/interesse
- [01-discovery/03-jornada-atual-as-is.md](01-discovery/03-jornada-atual-as-is.md) — Como o estoque é controlado hoje (As-Is)

### 02 — Visão do Produto e Escopo
O que vamos construir, para quem, por quê e até onde vai o MVP.

- [02-visao-escopo/01-visao-do-produto.md](02-visao-escopo/01-visao-do-produto.md) — Product Vision Board
- [02-visao-escopo/02-escopo-mvp.md](02-visao-escopo/02-escopo-mvp.md) — Escopo do MVP, in/out, premissas e restrições

### 03 — Personas e Jornadas
Quem usa o produto, com quais objetivos e dores, e como a jornada se transforma.

- [03-personas-jornadas/01-personas.md](03-personas-jornadas/01-personas.md) — Gestão, Almoxarife e Dentista CEO
- [03-personas-jornadas/02-jornadas-to-be.md](03-personas-jornadas/02-jornadas-to-be.md) — Jornadas do estado futuro (To-Be)

### 04 — Requisitos
Requisitos funcionais e não funcionais do produto, refinados a partir do protótipo.

- [04-requisitos/01-requisitos-funcionais.md](04-requisitos/01-requisitos-funcionais.md) — RF01 a RF07
- [04-requisitos/02-requisitos-nao-funcionais.md](04-requisitos/02-requisitos-nao-funcionais.md) — RNF de usabilidade, desempenho, segurança e portabilidade

### 05 — Backlog
Épicos, user stories priorizadas e critérios de aceite em formato Gherkin.

- [05-backlog/01-epicos.md](05-backlog/01-epicos.md) — Mapa de épicos e dependências
- [05-backlog/02-user-stories.md](05-backlog/02-user-stories.md) — Backlog completo com critérios de aceite

### 06 — Domínio, Regras de Negócio e Glossário
Linguagem ubíqua, modelo conceitual e regras de negócio do domínio.

- [06-dominio-regras/01-glossario.md](06-dominio-regras/01-glossario.md) — Glossário do domínio
- [06-dominio-regras/02-regras-de-negocio.md](06-dominio-regras/02-regras-de-negocio.md) — RN01 a RN10
- [06-dominio-regras/03-modelo-conceitual.md](06-dominio-regras/03-modelo-conceitual.md) — Entidades, atributos e relacionamentos

### 07 — Roadmap, Métricas e Riscos
Plano de releases, métricas de sucesso (KPIs), riscos e plano de mitigação.

- [07-roadmap-metricas/01-roadmap.md](07-roadmap-metricas/01-roadmap.md) — Releases planejadas
- [07-roadmap-metricas/02-metricas-de-sucesso.md](07-roadmap-metricas/02-metricas-de-sucesso.md) — KPIs de produto e operação
- [07-roadmap-metricas/03-riscos.md](07-roadmap-metricas/03-riscos.md) — Riscos e mitigações

---

## Convenções

- **IDs estáveis:** Requisitos, regras e stories possuem IDs que **não mudam** mesmo se a ordem de leitura mudar (RF01.1, RN03, US-12 etc.). Use os IDs em PRs, commits e tickets.
- **Linguagem ubíqua:** Os termos de domínio (Dispensação, CEO, Solicitação, Movimentação, Lote, etc.) seguem o glossário em `06-dominio-regras/01-glossario.md`. Não use sinônimos no código.
- **Datas:** Todas as datas são absolutas (ex.: `2026-05-07`). A demo do protótipo trabalha com `TODAY = 2026-04-14` para deixar os status de vencimento estáveis.
- **Identidade visual:** Bordô institucional `#990000` da UFPE como cor primária. Esta convenção é parte da especificação (ver RNF01.1).
