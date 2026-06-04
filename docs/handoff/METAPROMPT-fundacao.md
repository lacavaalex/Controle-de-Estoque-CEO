# Metaprompt — Execução da Fundação (CEO-UFPE backend)

> Cole o bloco abaixo numa nova janela do Claude Code, no diretório
> `/mnt/c/Users/maseo/controle-de-estoque-CEO`, com **Opus** e **/effort xhigh**.
> Ele assume a memória persistente já escrita nesta sessão (overview, arquitetura,
> modelo v2, jira-roadmap, baseline-gotchas, working-style).

---

Você é o Claude Code trabalhando no projeto **CEO-UFPE** (controle de estoque do Centro de
Especialidades Odontológicas da UFPE). Leia primeiro o `MEMORY.md` e as memórias
linkadas — elas têm o contexto completo do dia 02/06/2026. Resumo do mandato do dono
(dsgrupocinco, PO): estamos em modo "vibe code" para construir uma **base fundamentada**
que o time vai retomar depois. **Fundação primeiro**, mesmo que fure a ordem das sprints,
**desde que** eu (a) mantenha a arquitetura coerente com o que já existe e (b) **atualize
as tarefas no Jira (board 37, projeto CEO) justificando** por que foram cumpridas antes.

## Regras inegociáveis (siga o que já existe)
- Linguagem do projeto é **PT-BR**: identificadores de domínio, comentários, mensagens de
  erro e commits em português. Commits em **Conventional Commits** (RNF04.4).
- Backend em `projeto/backend`: arquitetura em camadas já estabelecida —
  `entities → interfaces (I*Repo / I*Service) → services → repositories → controller →
  routes → di/container → server`. **Mantenha esse padrão.** DI manual no `container.ts`.
- ESM/TypeScript: `"type":"module"`, imports com extensão **`.js`** mesmo em fontes `.ts`
  (nodenext), `import type` para tipos. tsconfig strict + `noUncheckedIndexedAccess` +
  `exactOptionalPropertyTypes` — não afrouxe.
- Testes com **vitest**, colocados como `*.test.ts`, usando repositórios in-memory que
  implementam as interfaces (veja `services/ItemService.test.ts` como molde).
- Trabalhe numa branch a partir de `main` (ex.: `feat/fundacao-backend` ou por etapa).
  **Não** committe/pushe sem o dono pedir; quando pedir, siga Conventional Commits e
  termine a mensagem com a linha Co-Authored-By padrão.

## Fonte da verdade do domínio
- Modelo conceitual v2: `docs/PO/06-dominio-regras/03-modelo-conceitual.md`
- Regras de negócio RN01–RN20: `docs/PO/06-dominio-regras/02-regras-de-negocio.md`
- User stories (Gherkin): `docs/PO/05-backlog/02-user-stories.md`
- NFRs (segurança/auditoria): `docs/PO/04-requisitos/02-requisitos-nao-funcionais.md`
- Dados realistas para seed: `DS-prototype/src/data/data.js`

## Escopo da FUNDAÇÃO (faça nesta ordem, validando ao fim de cada etapa)

### Etapa 0 — Higiene do baseline (deixar verde e limpo)
- `rm -rf projeto/backend/node_modules` já foi feito e reinstalado nesta sessão; confirme
  que `npx vitest run` roda.
- Crie `.gitignore` no `projeto/backend` cobrindo `node_modules/`, `dist/`, `.env`.
  **Remova `dist/` do versionamento** (`git rm -r --cached dist`).
- Configure o vitest com `include: ['src/**/*.test.ts']` (hoje ele pega o teste compilado
  em `dist/` e dá 1 falha falsa "Item já existente"). Depois disso, suite deve ficar 100%
  verde.
- Corrija os 2 bugs do `ItemService`: (1) assinatura de `createItem` na
  `IItemService` não bate com a impl (`createItem(id, newName)` vs `createItem(newName,
  category)`); (2) o check de duplicidade em `changeItemName` usa `.some(item => {item.name
  === name})` — callback com corpo de bloco que nunca retorna, então o check é morto.
  Adicione/ajuste testes cobrindo os dois.
- Crie `projeto/backend/.env.example` documentando as variáveis (RNF06.3) — porta, e as
  de conexão do Postgres da Etapa 1.

### Etapa 1 — PostgreSQL (ADR-0001) — cumpre SCRUM-9 e SCRUM-10
- Adote Postgres como persistência. Local via **Docker Compose**.
  Carregue config por `dotenv` (ADR-0003), nunca hardcode credenciais.
- **Ambiente Docker já verificado (02/06/2026, nesta máquina):** Docker Desktop 4.74.0
  rodando, integração WSL ligada no distro `Ubuntu`, `docker` nativo em `/usr/bin/docker`
  (Engine 29.4.3, linux/amd64), e **Compose V2** — use a sintaxe **`docker compose`** (sem
  hífen), versão v5.1.4. O arquivo é `compose.yaml`/`docker-compose.yml` (não existe ainda
  no repo — você cria nesta etapa).
- **⚠️ Porta 5432 já está ocupada** por outro container do dono, `duque-postgres`
  (`postgres:16-alpine`, healthy, bind `0.0.0.0:5432`), de outro projeto. **Não** use 5432.
  Publique o Postgres do CEO-UFPE em **`5433:5432`** (5433/5434/5435 estavam livres) e
  alinhe a connection string, ex.:
  `DATABASE_URL=postgresql://ceo:ceo@localhost:5433/ceo_estoque`. Documente isso no
  `.env.example` e no ADR.
- Modele o **schema v2 completo** (não o stub `Item`): `setor`, `usuario`, `produto`,
  `lote`, `pedido`, `item_pedido`, `movimentacao`, com FKs, enums e os invariantes
  INV01–INV09 do modelo conceitual onde fizerem sentido como constraints. Escolha a
  ferramenta de migration que melhor casar com o stack TS atual (ex.: node-pg-migrate, ou
  Drizzle/Kysely se preferir tipagem) — **decida e documente num ADR-0004** ("ORM/Query
  builder e migrations"), seguindo o formato dos ADR-0001..0003 existentes.
- Gere um **diagrama E-R** (textual/mermaid em `docs/` serve) — isso fecha SCRUM-10.
- **Seed** com dados realistas derivados de `DS-prototype/src/data/data.js` (produtos,
  lotes com validade, 2 setores HO/CEO, usuários dos 3 perfis, alguns pedidos cobrindo os
  status). Itens com validade já vencida/segregada para exercitar RN05/RN17.

### Etapa 2 — Entidades + repositórios v2
- Substitua o `Item` stub pelas entidades v2 (`Setor`, `Usuario`, `Produto`, `Lote`,
  `Pedido`, `ItemDoPedido`, `Movimentacao`) em `entities/`, com interfaces de repositório
  correspondentes em `interfaces/repository-interfaces/`.
- Implemente repositórios **`Pg*`** atrás dessas interfaces (o ponto de troca que os
  `Json*` já anteciparam). Mantenha os `Json*`/in-memory para teste se ajudar, mas a
  persistência real passa a ser Postgres.
- Encapsule cálculos de runtime do domínio (qtd_total por produto+setor, status agregado
  por RN03–RN07, estado do lote por validade RN05/RN17, FEFO RN20) em funções de domínio
  testáveis. Espelhe a lógica de `getItemStatus`/`getCEOItemStatus` do protótipo, mas no
  modelo v2 (lote-aware). Cubra com testes unitários.

### Etapa 3 — Auth real (núcleo do EP01) — puxada para frente
- Hash de senha com **bcrypt ou argon2** (RNF03.3) — pare de salvar senha em texto puro
  como no `UsersDB.json` atual.
- Middleware de sessão/token que **verifica em toda rota** o token + o **perfil × setor**
  do usuário (RNF03.7, RN01, RN12). Decida sessão server-side vs JWT e **registre num ADR**.
  Login institucional `@ufpe.br`, logout que invalida sessão (RNF03.6).
- Mantenha o `register` como **criação por gestor** (US-EP01-06): sem cadastro público;
  RBAC do provisionamento (gestor HO cria qualquer perfil/setor; gestor CEO só solicitante
  CEO). Senha provisória + flag de troca no primeiro login pode ficar como TODO marcado se
  faltar tempo, mas deixe o hash e o RBAC prontos.
- Registro auditável (RNF07.1): toda mutação relevante gera `Movimentacao`/log com
  usuário+data+ação onde o domínio pedir.

## Atualização do Jira (obrigatória ao concluir cada etapa)
Use o MCP `jira` no projeto **CEO** / board **37**. Para cada story que a fundação cumprir
ou adiantar (ex.: SCRUM-9/SCRUM-10 do setup de DB+ER; partes de EP01 = CEO-222.., EP02
estado-de-lote = CEO-213/US-EP07-01), faça a transição de status apropriada e **adicione um
comentário** explicando: "Cumprida na fase de fundação (fora da ordem de sprint) porque é
pré-requisito transversal — ver branch X / ADR-000N." Não invente stories; use o mapa em
`.jira-sync/created.json`. Se algo não tiver story correspondente, registre só no comentário
da story mais próxima ou pergunte ao dono.

## Definition of Done da fundação
- `npx vitest run` 100% verde, sem o teste-fantasma do `dist/`.
- Postgres sobe via docker-compose, migrations aplicam, seed popula o modelo v2.
- ADR(s) novos escritos no formato existente; E-R diagram em `docs/`.
- Auth com hash + middleware de RBAC perfil×setor cobrindo as rotas.
- `.env.example` completo; `dist/` e `node_modules/` fora do git.
- Jira atualizado com justificativas.
- Um resumo final para o dono: o que mudou, quais decisões (ADRs), e o ponto exato de
  retomada para o time + qual a próxima sprint natural a partir daqui.

Trabalhe de forma incremental e pare para confirmar com o dono em qualquer decisão
irreversível ou ambígua (escolha de ORM, JWT vs sessão, estratégia de migration). Comece
lendo a memória e a Etapa 0.
