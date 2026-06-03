# Nota de reconciliação — duas fundações de banco v2

**Data:** 03/06/2026
**Autor:** dsgrupocinco (PO) + fundação assistida
**Para:** o time (especialmente quem tocou `feature/database-schema` — Alex/Bruno)
**Assunto:** existem **duas** implementações v2 de banco em paralelo. Esta nota
explica a diferença, o que decidimos e por quê — sem desperdiçar o trabalho de ninguém.

---

## TL;DR

- Surgiram duas branches que implementam o banco v2 ao mesmo tempo:
  - `feature/database-schema` (time) — **SQL puro** + repositórios `Pg*` + entidades.
  - `feat/fundacao-backend` (esta fundação) — **Drizzle ORM** + schema v2 fiel + auth real (JWT/RBAC) + testes.
- **Decisão (PO):** seguir com `feat/fundacao-backend` como base, e **aproveitar o que a branch do time tem de bom** (migrations SQL legíveis, scripts `db:reset/up/down`).
- **Não houve vazamento.** Nenhum `.env`, dump de banco (`.dump/.sqlite/.db`) ou credencial real foi commitado em **nenhuma** branch remota — só scripts `.sql` (que é correto versionar) e `.env.example`. Os seeds usam **hash placeholder**, não senha real. Pode ficar tranquilo nesse ponto.

---

## Por que isso aconteceu

Estávamos em "vibe code" de fundação, em paralelo com o time que já vinha
adiantando o backend de acesso (ver comentários no Jira CEO-224 e CEO-227: Alex
blindou rotas com JWT, Bruno fez CRUD de usuário). Os dois esforços se cruzaram
no mesmo ponto (banco v2 + auth). É colisão de timing, não de competência.

---

## Comparação honesta

| Dimensão | `feature/database-schema` (time) | `feat/fundacao-backend` (fundação) |
|---|---|---|
| Ferramenta de dados | `pg` cru + migrations SQL `001..008` | Drizzle ORM + drizzle-kit (ver **ADR-0004**) |
| Migrations | SQL escrito à mão, ordenado e **bem legível** | SQL **gerado** a partir do schema TS (fonte única) |
| Modelo de domínio | **v1**: `Solicitacao`, `EstoqueCeo`, `role∈{gestao,almoxarife,dentista}`, `unidade` como texto no usuário | **v2 fiel**: `Pedido`+`ItemDoPedido`, `Setor` como entidade, sem `EstoqueCeo`, `perfil∈{gestor,almoxarife,solicitante,dentista}` |
| Auth | `senha_hash` + placeholder; sem fluxo de login/RBAC | bcrypt + JWT + RBAC perfil×setor **funcionando** (ver **ADR-0005**) |
| Testes | — | 65 testes (domínio RN03–RN20, RBAC, auth) verdes |
| Workflow DB | `db:migrate/seed/reset/up/down` (bom!) | `db:generate/migrate/seed` + `compose.yaml` (5433) |

### O ponto decisivo da alinhamento ao backlog
As entidades de `feature/database-schema` citam **"§2.1/§2.3/§2.4 do modelo
conceitual"** — que são seções do modelo **v1**. O documento autoritativo hoje é o
**v2** (`docs/PO/06-dominio-regras/03-modelo-conceitual.md`, "Revisão: v2"), cujo
**§6 (Mudanças v1 → v2)** explicitamente aposentou justamente o que aquela branch
ainda tem:
- Solicitação **virou** Pedido + ItemDoPedido;
- **EstoqueDispensacao/EstoqueCEO removidos** como entidades (estoque = soma de Lotes por Produto×Setor);
- **Setor virou entidade** (não enum/campo de texto);
- separação **Produto × Lote**.

Ou seja: alinhar a branch do time ao backlog exigiria refazer a camada de
entidades/repos de qualquer jeito. A branch da fundação já nasce nesse modelo.

> Crédito devido: as migrations SQL do time são limpas e ordenadas, e o
> `db:reset/up/down` é uma boa ideia. A transparência de SQL puro foi inclusive
> a alternativa que pesamos no ADR-0004 (Kysely/node-pg-migrate) antes de optar
> por Drizzle pela tipagem forte alinhada ao tsconfig strict.

---

## O que aproveitar da branch do time

1. Os comandos `db:reset` / `db:up` / `db:down` — portar para os scripts da fundação.
2. A clareza dos comentários SQL por tabela (bons como documentação de schema).
3. O conteúdo dos seeds (produtos/usuários de exemplo) onde for mais rico.

## Próximos passos sugeridos

1. Alinhar com Alex/Bruno (são os donos de CEO-224/226/227) antes de qualquer merge.
2. Abrir PR de `feat/fundacao-backend` → `main` com esta nota linkada.
3. Marcar `feature/database-schema` como **superseded** (não deletar; manter como referência da abordagem SQL pura).
4. Migrar o que o time já fez de auth (JWT em rotas) para o middleware da fundação — é continuação direta do que o Alex começou (o próprio comentário dele em CEO-224 diz "falta o escopo por setor", que é o que a fundação entrega).

---

## Segurança — verificação feita

Varri **todas** as branches remotas em busca de `.env`, `.dump`, `.sqlite`, `.db`,
`.sql.gz`, "backup": **nada** encontrado além de `.env.example` (correto). Os
seeds de usuário usam `$2a$10$PLACEHOLDER_HASH_...` — não é credencial real.
**Conclusão: não há segredo nem banco vazado no git.**
