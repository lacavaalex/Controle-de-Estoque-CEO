# Como rodar e testar o sistema

Guia prático para a equipe (e para quem vai operar a demonstração) subir o
sistema localmente, fazer login, exercitar os fluxos principais e rodar a suíte
de testes automatizados.

!!! info "Pré-requisitos"
    - **Docker Desktop** ligado (sobe o PostgreSQL em container).
    - **Node 20+** (recomendado: a mesma versão usada no CI).
    - Estar na raiz do repositório.

---

## 1. Subir tudo com um comando

```bash
bash start-all.sh
```

Esse script faz, em ordem: sobe o **Postgres** (Docker), aplica as **migrations**,
popula o **seed** (dados realistas de demonstração), sobe a **API** em
`http://localhost:3000` e o **frontend** em `http://localhost:5173`.

| Variação | O que faz |
|----------|-----------|
| `bash start-all.sh` | Sobe tudo (reaproveita o banco existente). |
| `bash start-all.sh --reset` | **Recria o banco do zero** (apaga dados) e sobe tudo. Use se algo ficou inconsistente. |

Quando terminar, acesse **`http://localhost:5173`** e você cai na tela de login.

!!! warning "Encerrar"
    `Ctrl+C` no terminal encerra a API e o frontend. O **container do Postgres
    continua rodando**; para pará-lo: `cd projeto/backend && docker compose down`.

??? note "Subir manualmente (sem o start-all)"
    ```bash
    # 1) banco + migrations + seed (não sobe a API):
    cd projeto/backend && bash start.sh --no-dev
    # 2) API:
    cd projeto/backend && npm run dev      # :3000
    # 3) frontend (noutro terminal):
    cd projeto/frontend && npm run dev     # :5173
    ```

---

## 2. Contas de teste (seed)

Todos os usuários do seed usam a senha **`ceoufpe2026`** (apenas em ambiente
local de desenvolvimento).

| Perfil | E-mail | Setor | O que enxerga |
|--------|--------|-------|----------------|
| **Gestor HO** | `ana.costa@ufpe.br` | HO | Tudo — super-usuário global. |
| **Almoxarife** | `joao.silva@ufpe.br` | HO | Processa pedidos, lotes, validade. |
| **Solicitante CEO** | `rafael.moura@ufpe.br` | CEO | Cria pedidos do CEO. |
| **Gestor CEO** | `helena.lima@ufpe.br` | CEO | Estoque e dashboard do CEO. |

---

## 3. Fluxos para exercitar

Roteiro sugerido para validar o sistema de ponta a ponta (e base da demonstração).

### Fluxo A — Pedido ponta a ponta (o principal)

1. Entre como **Solicitante CEO** (`rafael.moura@ufpe.br`).
2. **Novo Pedido** → adicione alguns itens (ex.: Gaze, Luva P) com quantidades, e
   uma justificativa. Inclua um item **indisponível** para ver a *demanda
   represada*, e uma **linha livre** (item fora do catálogo).
3. Envie. O pedido nasce **pendente**.
4. Saia e entre como **Almoxarife** (`joao.silva@ufpe.br`).
5. Abra o pedido e **processe item a item**: escolha o lote (note a sugestão
   **FEFO** — validade mais próxima primeiro), expedição integral ou parcial.
6. Observe que o **status do pedido é derivado** dos itens (integral / parcial /
   aguardando reposição) e que a expedição gera **saída no HO + entrada
   automática no estoque do CEO**.

### Fluxo B — Lotes e validade (segregação)

1. Como **Almoxarife** ou **Gestor HO**, abra **Estoque HO**.
2. Cadastre um **lote novo** de um produto (entrada de estoque).
3. Veja os estados de validade (Vencendo ≤30d, Atenção, Vencido) — o seed já traz
   um lote **vencido** e um **segregado** de propósito.
4. **Segregue** um lote vencido em um clique e confira que ele sai da visão de
   estoque ativo (vai para "Lotes segregados") e **não pode ser expedido**.

### Fluxo C — Triagem do agente (EP08)

1. Como **Almoxarife**, abra a tela de **Triagem**.
2. Os rascunhos vindos do agente de e-mail aparecem aqui para **aprovar / editar /
   descartar**. Aprovar um rascunho o promove a **pedido oficial**.

!!! note "Demonstração do agente sem a caixa de e-mail provisionada"
    A ingestão automática por e-mail depende de uma caixa institucional ainda não
    provisionada (ver [ADR-0004](../adr/ADR-0004.md) e o runbook do CEO-273). Para
    demonstrar a triagem mesmo assim, um rascunho pode ser criado pela API de
    serviço (`POST /rascunhos`) e então revisado na tela de Triagem.

---

## 4. Rodar os testes automatizados

A garantia de qualidade do projeto são **190 testes automatizados** — mais fortes
e repetíveis que testes manuais, e executados também no [CI](ci.md) a cada push.

=== "Backend (137 testes)"

    Os testes do backend tocam o banco de verdade, então precisam de um Postgres
    e da variável `DATABASE_URL`. Com o `start-all.sh` rodando, o banco já está de
    pé:

    ```bash
    cd projeto/backend
    npm test          # Vitest (modo watch)
    npm test -- --run # execução única (como no CI)
    ```

    Cobrem: regras de domínio (status derivado do pedido, FEFO), RBAC, serviços de
    estoque/pedido/lote/rascunho e dashboards.

=== "Frontend (53 testes)"

    Rodam em jsdom, sem banco:

    ```bash
    cd projeto/frontend
    npm test          # Vitest (vitest run)
    ```

    Cobrem componentes, telas (Pedidos, Estoque, Triagem, Dashboard) e o cliente
    de API.

=== "Type-check"

    ```bash
    cd projeto/backend && npx tsc --noEmit
    ```

---

## 5. Problemas comuns

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| `DATABASE_URL não definida` | `.env` ausente no backend | Copie `projeto/backend/.env.example` para `.env`. |
| API responde mas toda chamada `/api` falha | Banco caiu / porta ocupada | `bash start-all.sh --reset`. |
| Porta 5432 em uso | Outro Postgres no host | O compose usa **5433** de propósito; confira a `DATABASE_URL`. |
| Testes de backend falham com erro de conexão | Postgres não está de pé | Suba o banco antes (`start.sh --no-dev`). |
