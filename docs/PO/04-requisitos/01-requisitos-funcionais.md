# Requisitos Funcionais

**Documento:** 01-requisitos-funcionais
**Última atualização:** 14/05/2026
**Revisão:** v2 — incorpora descobertas do fluxo real do almoxarifado (depoimento João Victor + planilhas reais + PDF de solicitação real do CEO).

---

## Convenções

- **ID:** `RFxx.yy` é estável; **não muda** entre versões deste documento (IDs descartados ficam listados no histórico).
- **Prioridade:** segue MoSCoW — `Must` (MVP), `Should` (importante, fase 1.x), `Could` (desejável, fase 2), `Wont` (fora do MVP).
- **Perfis:** `gestor` (setorial: HO ou CEO), `almoxarife` (HO), `solicitante` (setorial). Perfil `dentista` fica para fase 2.
- **Setores:** `HO` (Hospital Odontológico — almoxarifado central / Dispensação) e `CEO` (Centro de Especialidades Odontológicas) no MVP. Modelagem suporta CME, laboratórios em fase 2.
- **Origem:** referência ao protótipo (arquivo em `DS-prototype/src/...`) quando aplicável; nas adições desta revisão, marcadas como `(novo)`.

---

## RF01 — Autenticação e Controle de Acesso

| ID | Descrição | Prioridade | Origem |
|----|-----------|-----------|--------|
| RF01.1 | O sistema **deve permitir login** por e-mail institucional (`@ufpe.br`) e senha. | Must | `pages/Login.jsx` |
| RF01.2 | O sistema **deve suportar quatro perfis**: **Gestor**, **Almoxarife**, **Solicitante** e (fase 2) **Dentista**. | Must | (revisado) |
| RF01.3 | O sistema **deve restringir rotas e funcionalidades** por **perfil E setor** do usuário (RBAC setorial). | Must | `router/ProtectedRoute.jsx` |
| RF01.4 | O sistema **deve manter a sessão** ativa enquanto o navegador estiver aberto. | Must | `context/AuthContext.jsx` |
| RF01.5 | O sistema **deve permitir logout** a qualquer momento. | Must | `Sidebar.jsx` |
| RF01.6 | O sistema **deve exibir mensagem clara de erro** para credenciais inválidas. | Must | `Login.jsx` |
| RF01.7 | O sistema **deve permitir recuperar senha** por e-mail institucional. | Wont (MVP) — Could (v1.1) | — |
| RF01.8 | O sistema **deve permitir cadastro de novos usuários** apenas por administrador. | Should (v1.1) | — |
| RF01.9 | Cada usuário possui exatamente **um setor** vinculado; pedidos, estoques e dashboards são filtrados por esse setor (exceto `gestor` do HO, que vê todos os setores). | Must | (novo) |
| RF01.10 | O perfil `gestor` **herda** os poderes do `almoxarife` (no HO) e do `solicitante` (no próprio setor). | Must | (novo) |
| RF01.11 | O **cadastro de novos usuários é feito exclusivamente pelo gestor** dentro da aba "Usuários" do sistema autenticado. A tela de login **não exibe** botão público de "Cadastrar". | Must | (novo) |
| RF01.12 | Ao criar um usuário, o sistema **gera uma senha provisória** exibida ao gestor (com botão "Copiar") para entrega ao usuário. O usuário é **obrigado a trocar a senha** no primeiro login. RBAC do provisionamento: gestor HO pode criar qualquer perfil/setor; gestores setoriais (ex.: CEO) só criam `solicitante` do próprio setor. | Must | (novo) |
| RF01.13 | O sistema **deve permitir ao gestor listar, desativar e resetar senha** de usuários do seu escopo (HO = global; outros = setoriais). Remoção é proibida se houver histórico; usar desativação. | Must | (novo) |

## RF02 — Dashboard

| ID | Descrição | Prioridade | Origem |
|----|-----------|-----------|--------|
| RF02.1 | O sistema **deve exibir KPIs** no dashboard, parametrizados por perfil e setor. | Must | `Dashboard.jsx` |
| RF02.2 | O dashboard do **Gestor HO** deve incluir: KPIs consolidados, gráfico de consumo mensal por setor de destino, lista de itens próximos do vencimento, alertas de estoque crítico, log de movimentações e **demanda represada (top N)**. | Must | `Dashboard.jsx`, `GraficoConsumoMensal.jsx`, `TabelaMovimentacoes.jsx` |
| RF02.3 | O dashboard do **Almoxarife** deve incluir: KPIs operacionais, fila de pedidos pendentes, alertas de vencimento e estoque crítico, e alertas de **reposição para demanda represada**. | Must | `Dashboard.jsx`, `TabelaMovimentacoes.jsx` |
| RF02.4 | O dashboard do **Solicitante** deve incluir: saudação, KPIs do seu setor (estoque local — se houver), seus pedidos recentes e botão proeminente "Novo Pedido". | Must | (revisado) |
| RF02.5 | O dashboard do **Gestor CEO** deve incluir: KPIs do CEO (estoque local, pedidos enviados pendentes/aguardando reposição), gráfico de consumo, lista de itens críticos no estoque CEO. | Must | (novo) |
| RF02.6 | Os KPIs devem **refletir em tempo real** alterações no estoque e nos pedidos (sem reload). | Must | derivado de Context API |
| RF02.7 | O sistema **deve permitir customizar KPIs**. | Wont (MVP) | — |

## RF03 — Catálogo e Estoque do Almoxarifado (HO)

| ID | Descrição | Prioridade | Origem |
|----|-----------|-----------|--------|
| RF03.1 | O sistema **deve listar produtos do catálogo** em tabela agregada: nome, categoria, qtd total (soma de lotes ativos), unidade, mín/máx, localização, status. | Must | (revisado) |
| RF03.1b | O sistema **deve permitir expandir um produto** para ver cada lote ativo (lote, fabricação, validade, qtd, status do lote). | Must | (novo) |
| RF03.2 | O **Almoxarife** e o **Gestor HO** devem poder **cadastrar produto** no catálogo (nome, categoria, unidade, estoque mínimo/máximo, localização). | Must | `ItemModal.jsx` |
| RF03.2b | O **Almoxarife** e o **Gestor HO** devem poder **cadastrar lote** vinculado a um produto (lote, fabricação, validade, qtd). | Must | (novo) |
| RF03.3 | Edição de produto e de lote, com validações. | Must | `ItemModal.jsx` |
| RF03.4 | Remoção de produto (sem lotes ativos) e de lote, com modal de confirmação. | Must | (revisado) |
| RF03.5 | Filtros: nome/lote, categoria, status, "só com estoque", "só sem estoque". | Must | (revisado) |
| RF03.6 | Status do produto (agregado) e do lote são **calculados automaticamente** conforme RN03–RN07. | Must | `data/data.js → getItemStatus` |
| RF03.7 | Linhas de produtos/lotes em estados críticos devem ser **destacadas visualmente**. | Must | `EstoqueDispensacao.jsx → ROW_HIGHLIGHT` |
| RF03.8 | `Solicitante` e `Dentista` **não devem ter escrita** no catálogo/estoque do HO. | Must | (revisado) |
| RF03.9 | Validação de campos obrigatórios: nome, categoria, unidade (produto); lote, fabricação, validade, qtd (lote). | Must | `ItemModal.jsx → validate()` |
| RF03.10 | O **Solicitante** tem leitura do catálogo agregado, **sem ver lotes**. | Must | (novo) |
| RF03.11 | Importação em massa de produtos/lotes (CSV). | Could (v1.1) | — |
| RF03.12 | Exportação do catálogo e movimentações em CSV/Excel. | Could (v1.1) | — |

## RF04 — Estoque do CEO

| ID | Descrição | Prioridade | Origem |
|----|-----------|-----------|--------|
| RF04.1 | O sistema **deve criar/atualizar automaticamente** lotes-CEO quando uma expedição com `destino=CEO` é registrada. | Must | (novo) |
| RF04.2 | **Gestor CEO**, **Solicitante CEO** (leitura) e **Gestor HO** (auditoria) têm acesso ao estoque do CEO. | Must | (revisado) |
| RF04.3 | A listagem do estoque do CEO exibe produto, categoria, qtd, mínimo, unidade e status — em **tabela**. (Visão em cards do dentista fica em fase 2.) | Must | (revisado) |
| RF04.4 | Status do estoque do CEO calculado por RN03–RN06 (mesmas regras do HO). | Must | (revisado) |
| RF04.5 | O sistema **deve preservar o lote** no CEO (mesma rastreabilidade do HO). | Must | (novo) |
| RF04.6 | O **Gestor CEO** pode **registrar consumo** (subtrair qtd), informando motivo opcional. Gera Movimentação de tipo `consumo`. | Must | (novo) |
| RF04.7 | O **Gestor CEO** pode fazer **ajuste de inventário** (nova qtd com observação obrigatória). Gera Movimentação tipo `ajuste`. | Must | (novo) |
| RF04.8 | O **Gestor CEO** pode editar dados básicos do estoque local (localização interna, mínimo do setor). | Should | (novo) |
| RF04.9 | Resumo no topo (itens críticos / baixos no CEO). | Should | (revisado) |

## RF05 — Pedidos

| ID | Descrição | Prioridade | Origem |
|----|-----------|-----------|--------|
| RF05.1 | O **Solicitante** deve criar um **pedido com cabeçalho** (setor de origem, data, justificativa geral) **+ N itens**. | Must | (revisado) |
| RF05.2 | A justificativa geral do pedido deve ter **no mínimo 10 caracteres**. | Must | (mantida) |
| RF05.3 | A quantidade em cada item deve ser **número inteiro ≥ 1**. | Must | (mantida) |
| RF05.4 | O **Almoxarife/Gestor HO** processa cada item do pedido como `atendido_integral`, `atendido_parcial` ou `nao_atendido`. | Must | (revisado) |
| RF05.5 | Em divergência (qtd_expedida ≠ qtd_solicitada), o sistema **exige motivo enumerado**: `falta_estoque`, `racionalizacao_setor`, `lote_indisponivel`, `outros`. Se `outros`, abre texto livre **opcional**. | Must | (novo) |
| RF05.6 | O sistema **registra** data, responsável (almoxarife/gestor), lote_expedido, qtd_expedida e motivo a cada decisão. | Must | (revisado) |
| RF05.7 | Visualização por abas: Pendentes, Em Processamento, Concluídos, Aguardando Reposição, Todos. | Must | (revisado) |
| RF05.8 | **Solicitante** vê apenas pedidos do **próprio setor**. | Must | (revisado) |
| RF05.9 | **Almoxarife** vê todos os pedidos. | Must | (mantida) |
| RF05.10 | **Gestor HO** vê todos os pedidos (auditoria + operação). **Gestor CEO** vê pedidos do CEO. | Must | (revisado) |
| RF05.11 | ID do pedido no formato `PED-NNN` (gerado pelo sistema). | Must | (revisado) |
| RF05.12 | Pedido **não pode ser editado nem cancelado** após envio (MVP). | Must | (mantida) |
| RF05.13 | **Aprovação parcial é permitida** (qtd_expedida < qtd_solicitada, > 0). | **Must** | (promovida de Wont) |
| RF05.14 | Pedido pode ter **múltiplos itens do catálogo** em uma única operação. | Must | (novo) |
| RF05.15 | Solicitante pode adicionar **linha livre** (texto livre, fora do catálogo). Linha livre não gera movimentação de estoque automática. Almoxarife pode "promovê-la" a produto do catálogo. | Must | (novo) |
| RF05.16 | Solicitante **pode pedir item indisponível** (qtd_disponivel = 0). O item entra como `aguardando_reposicao`. Sistema exibe alerta antes da confirmação. | Must | (novo) |
| RF05.17 | Almoxarife pode **desdobrar** um item do pedido em sub-entregas de **lotes diferentes** (caso "1 unidade do lote A + 1 do lote B"). | Must | (novo) |
| RF05.18 | Status do pedido é **derivado** dos status dos itens: `pendente`, `em_processamento`, `atendido_integral`, `atendido_parcial`, `nao_atendido`, `aguardando_reposicao`. | Must | (novo) |
| RF05.19 | Ao escolher lote para expedição, sistema **sugere FEFO** (lote mais próximo do vencimento primeiro); lotes vencidos e segregados **não aparecem na seleção**. | Must | (novo) |

## RF06 — Alertas e Monitoramento

| ID | Descrição | Prioridade | Origem |
|----|-----------|-----------|--------|
| RF06.1 | Sinalizar produto com qtd total ≤ estoque mínimo (Crítico) e ≤ 1,5× mínimo (Baixo). | Must | RN03 |
| RF06.2 | Sinalizar **lotes** vencendo em ≤ 30 dias, 31–60 dias, ou vencidos. | Must | RN05 |
| RF06.3 | Sinalizar produto com qtd total ≥ 95% do estoque máximo (Excessivo). | Must | RN04 |
| RF06.4 | Log das últimas movimentações (entrada, saída, ajuste, consumo, segregação), com filtro por tipo. | Must | `MovementLog.jsx` |
| RF06.5 | Notificação por e-mail ao almoxarife quando item ficar crítico. | Could (v1.1) | — |
| RF06.6 | Notificação por e-mail ao solicitante quando seu pedido for processado. | Should (v1.1) | — |
| RF06.6b | Notificação por e-mail ao **almoxarifado** quando um novo pedido é criado (ponte de migração do e-mail). | Must | (novo) |
| RF06.7 | Listar "demanda represada" (top N produtos com itens em `aguardando_reposicao`). | Must | (novo) |
| RF06.8 | Permitir **segregação manual** de lote vencido (1 clique) e exibir lista de "Lotes segregados". | Must | (novo) |
| RF06.9 | Alertar o almoxarife quando um **lote novo** é cadastrado de um produto que tem pedidos em `aguardando_reposicao`. | Must | (novo) |

## RF07 — Navegação e Layout

| ID | Descrição | Prioridade | Origem |
|----|-----------|-----------|--------|
| RF07.1 | Sidebar com links para Dashboard, Estoque HO, Estoque CEO, Pedidos, Lotes (segregados). | Must | (revisado) |
| RF07.2 | Itens da sidebar visíveis variam por perfil **e setor**. | Must | (revisado) |
| RF07.3 | Tentativa de acesso a rota não autorizada redireciona para Dashboard. | Must | (mantida) |
| RF07.4 | Sidebar exibe avatar, nome, **perfil + setor** e botão de logout. | Must | (revisado) |
| RF07.5 | Layout responsivo (desktop e tablet). Mobile pode ser limitado. | Must | (mantida) |

---

## Histórico de mudanças (v1 → v2)

**Renomeações de perfil:**
- `dentista` (cria solicitação) → **adiado para fase 2**.
- `gestao` (leitura global) → `gestor` (setorial, super-user do próprio setor; gestor HO vê todos os setores).
- Novo perfil: `solicitante` (cria pedidos pelo setor).

**Requisitos descartados ou promovidos:**
- RF05.13 (aprovação parcial): **Wont → Must** (caso comum na planilha real).
- RF03.8 (dentista não vê dispensação) → **reescrito** como restrição de escrita para solicitantes.
- RF04.3 (cards do dentista) e RF04.6 (botão desabilitado em indisponíveis) → **descartados** (cards = fase 2; bloqueio invertido).
- OUT07 (notificação por e-mail): parcialmente revertido — **RF06.6b entra no MVP** como ponte de migração.
- OUT10 (aprovação parcial): **revertido**.

**Requisitos novos (não existiam em v1):**
- RF01.9, RF01.10 (escopo setorial e herança de poderes do gestor).
- RF02.5 (dashboard do Gestor CEO).
- RF03.1b (visão por lote), RF03.2b (cadastro de lote), RF03.10 (visão sem lote para solicitante).
- RF04.1, RF04.5–RF04.8 (estoque do CEO com entrada automática, lote preservado, consumo, ajuste).
- RF05.5 (motivo enumerado), RF05.14–RF05.19 (multi-item, linha livre, indisponível permitido, desdobrar lote, FEFO, status derivado).
- RF06.6b (notificação e-mail ao almoxarifado), RF06.7 (demanda represada), RF06.8 (segregação), RF06.9 (alerta de reposição).

---

## Sumário por prioridade (v2)

| Prioridade | Total (aprox.) |
|-----------|----------------|
| Must (MVP) | **~60** |
| Should | 4 |
| Could | 5 |
| Wont (MVP) | 2 |

> A contagem exata varia se sub-IDs como RF03.1b forem somados como itens separados. O importante: stories que implementam cada requisito estão em [05-backlog/02-user-stories.md](../05-backlog/02-user-stories.md), e o backlog do MVP cresceu de **26 → 35 stories** com escopo de **45 dias** — exigirá priorização agressiva em [`07-roadmap-metricas/01-roadmap.md`].
