# Requisitos Funcionais

**Documento:** 01-requisitos-funcionais
**Última atualização:** 07/05/2026
**Base:** `DS-prototype/requisitos.md` + protótipo navegável + sessões de discovery

---

## Convenções

- **ID:** `RFxx.yy` é estável; **não muda** entre versões deste documento.
- **Prioridade:** segue MoSCoW — `Must` (MVP), `Should` (importante, fase 1.x), `Could` (desejável, fase 2), `Wont` (fora do MVP).
- **Perfis:** `gestao`, `almoxarife`, `dentista`. "Todos" = os três.
- **Origem:** referência ao protótipo (arquivo em `DS-prototype/src/...`) que materializa o requisito.

---

## RF01 — Autenticação e Controle de Acesso

| ID | Descrição | Prioridade | Origem |
|----|-----------|-----------|--------|
| RF01.1 | O sistema **deve permitir login** por e-mail institucional (`@ufpe.br`) e senha. | Must | `pages/Login.jsx` |
| RF01.2 | O sistema **deve suportar três perfis** de acesso: **Gestão**, **Almoxarife** e **Dentista CEO**. | Must | `data/data.js` (USUARIOS) |
| RF01.3 | O sistema **deve restringir rotas e funcionalidades** de acordo com o perfil do usuário autenticado (RBAC). | Must | `router/ProtectedRoute.jsx`, `App.jsx` |
| RF01.4 | O sistema **deve manter a sessão** do usuário ativa enquanto o navegador estiver aberto (sessionStorage). | Must | `context/AuthContext.jsx` |
| RF01.5 | O sistema **deve permitir logout** a qualquer momento. | Must | `components/layout/Sidebar.jsx` |
| RF01.6 | O sistema **deve exibir mensagem de erro** clara em caso de credenciais inválidas. | Must | `pages/Login.jsx` |
| RF01.7 | O sistema **deve permitir recuperar senha** por e-mail institucional. | Wont (MVP) — Could (v1.1) | — |
| RF01.8 | O sistema **deve permitir cadastro de novos usuários** apenas por administrador. | Should (v1.1) | — |

## RF02 — Dashboard

| ID | Descrição | Prioridade | Origem |
|----|-----------|-----------|--------|
| RF02.1 | O sistema **deve exibir KPIs** no dashboard: total de itens, itens vencendo, estoque crítico, solicitações pendentes. | Must | `pages/Dashboard.jsx` |
| RF02.2 | O dashboard da **Gestão** deve exibir KPIs, gráfico de consumo mensal (Dispensação vs CEO), lista de itens próximos do vencimento, alertas de estoque crítico e log de movimentações. | Must | `pages/Dashboard.jsx → DashboardGestao` |
| RF02.3 | O dashboard do **Almoxarife** deve exibir KPIs, fila de solicitações pendentes com ações de aprovar/negar inline, e alertas de estoque/vencimento. | Must | `DashboardAlmoxarife` |
| RF02.4 | O dashboard do **Dentista** deve exibir saudação personalizada, KPIs do CEO, cards do estoque do CEO, suas solicitações recentes e botão "Nova Solicitação". | Must | `DashboardDentista` |
| RF02.5 | Os KPIs devem **refletir em tempo real** as alterações feitas no estoque e nas solicitações (sem reload). | Must | derivado de Context API |
| RF02.6 | O sistema **deve permitir customizar quais KPIs aparecem** no dashboard. | Wont (MVP) | — |

## RF03 — Gestão do Estoque da Dispensação

| ID | Descrição | Prioridade | Origem |
|----|-----------|-----------|--------|
| RF03.1 | O sistema **deve listar todos os itens** do estoque da Dispensação em tabela com: nome, lote, quantidade, unidade, mín/máx, localização, validade, status. | Must | `pages/EstoqueDispensacao.jsx` |
| RF03.2 | O **Almoxarife** e a **Gestão** devem poder **adicionar** novos itens ao estoque. | Must | `components/estoque/ItemModal.jsx` |
| RF03.3 | O **Almoxarife** e a **Gestão** devem poder **editar** itens existentes. | Must | `components/estoque/ItemModal.jsx` |
| RF03.4 | O **Almoxarife** e a **Gestão** devem poder **remover** itens, com modal de confirmação prévia. | Must | `pages/EstoqueDispensacao.jsx → ConfirmDelete` |
| RF03.5 | O sistema **deve permitir filtrar** itens por nome/lote, categoria e status. | Must | `pages/EstoqueDispensacao.jsx` |
| RF03.6 | O sistema **deve calcular automaticamente** o status de cada item (Normal, Baixo, Crítico, Vencendo, Atenção, Vencido, Excessivo) com base nas regras RN03–RN06. | Must | `data/data.js → getItemStatus` |
| RF03.7 | Linhas de itens **críticos**, **vencidos** ou **excessivos** devem ser destacadas visualmente. | Must | `pages/EstoqueDispensacao.jsx → ROW_HIGHLIGHT` |
| RF03.8 | O **Dentista CEO** **não deve ter acesso** à página de Estoque Dispensação. | Must | `App.jsx` (allowedRoles), `Sidebar.jsx` (filtra por role) |
| RF03.9 | O sistema **deve validar** os campos obrigatórios do cadastro: nome, categoria, lote, quantidade, unidade, validade. | Must | `ItemModal.jsx → validate()` |
| RF03.10 | O sistema **deve permitir importação em massa** de itens (CSV). | Could (v1.1) | — |
| RF03.11 | O sistema **deve permitir exportação** da tabela em CSV/Excel. | Could (v1.1) | — |

## RF04 — Estoque do CEO

| ID | Descrição | Prioridade | Origem |
|----|-----------|-----------|--------|
| RF04.1 | O sistema **deve listar os itens** disponíveis no estoque do CEO com quantidade, unidade, mínimo e status (Disponível, Baixo, Crítico, Indisponível). | Must | `pages/EstoqueCEO.jsx` |
| RF04.2 | **Todos os perfis** devem ter acesso de leitura ao estoque do CEO. | Must | `App.jsx` |
| RF04.3 | Para o perfil **Dentista**, a lista deve ser exibida em **cards** com botão "Solicitar Item" embutido. | Must | `EstoqueCEO.jsx → CardView` |
| RF04.4 | Para perfis **Gestão/Almoxarife**, a lista deve ser exibida em **tabela** somente leitura. | Must | `EstoqueCEO.jsx → TableView` |
| RF04.5 | O sistema **deve calcular automaticamente** o status do item no CEO conforme RN07. | Must | `data/data.js → getCEOItemStatus` |
| RF04.6 | O botão "Solicitar Item" **deve ficar desabilitado** quando o item está com status `Indisponível`. | Must | `EstoqueCEO.jsx → CardView` |
| RF04.7 | O sistema **deve exibir resumo no topo** com quantos itens estão críticos e quantos estão baixos. | Should | `EstoqueCEO.jsx` |

## RF05 — Solicitações

| ID | Descrição | Prioridade | Origem |
|----|-----------|-----------|--------|
| RF05.1 | O **Dentista** deve poder criar uma solicitação informando: item, quantidade e justificativa. | Must | `components/solicitacoes/NovaSolicitacaoModal.jsx` |
| RF05.2 | A justificativa deve ter **no mínimo 10 caracteres**. | Must | `NovaSolicitacaoModal.jsx` |
| RF05.3 | A quantidade deve ser **número inteiro ≥ 1**. | Must | `NovaSolicitacaoModal.jsx` |
| RF05.4 | O **Almoxarife** deve poder **aprovar** solicitações pendentes em um clique. | Must | `pages/Solicitacoes.jsx → ViewAlmoxarife` |
| RF05.5 | O **Almoxarife** deve poder **negar** solicitações pendentes informando observação opcional. | Must | `components/solicitacoes/NegarModal.jsx` |
| RF05.6 | O sistema **deve registrar** data, responsável e observação em cada ação de aprovação ou negação. | Must | `context/SolicitacoesContext.jsx` |
| RF05.7 | O sistema **deve permitir visualização por abas**: Pendentes, Aprovadas, Negadas, Todas. | Must | `pages/Solicitacoes.jsx` |
| RF05.8 | O **Dentista** deve visualizar **apenas as próprias solicitações**. | Must | `Solicitacoes.jsx → ViewDentista` |
| RF05.9 | O **Almoxarife** deve visualizar **todas** as solicitações de todas as personas. | Must | `Solicitacoes.jsx → ViewAlmoxarife` |
| RF05.10 | A **Gestão** deve visualizar todas as solicitações em **modo somente leitura** (auditoria). | Must | `Solicitacoes.jsx → ViewGestao` |
| RF05.11 | O sistema **deve gerar ID único** no formato `SOL-NNN` para cada solicitação. | Must | `SolicitacoesContext.jsx → criar` |
| RF05.12 | O sistema **não deve permitir** edição/cancelamento de solicitação após envio (no MVP). | Must | decisão de produto OUT10 |
| RF05.13 | O sistema **deve permitir aprovação parcial** (quantidade menor que solicitada). | Wont (MVP) | OUT11 |

## RF06 — Alertas e Monitoramento

| ID | Descrição | Prioridade | Origem |
|----|-----------|-----------|--------|
| RF06.1 | O sistema **deve sinalizar** quando um item estiver com quantidade abaixo do estoque mínimo (Crítico). | Must | RN03 |
| RF06.2 | O sistema **deve sinalizar** quando um item estiver vencendo em ≤ 30 dias, entre 31–60 dias, ou já vencido. | Must | RN05 |
| RF06.3 | O sistema **deve sinalizar** quando um item estiver com quantidade ≥ 95% do estoque máximo (Excessivo). | Must | RN04 |
| RF06.4 | O sistema **deve exibir log** das últimas movimentações (entrada, saída, ajuste). | Must | `components/dashboard/MovementLog.jsx` |
| RF06.5 | O sistema **deve enviar notificação por e-mail** ao almoxarife quando um item ficar crítico. | Could (v1.1) | — |
| RF06.6 | O sistema **deve enviar notificação por e-mail** ao dentista quando sua solicitação for resolvida. | Should (v1.1) | — |

## RF07 — Navegação e Layout

| ID | Descrição | Prioridade | Origem |
|----|-----------|-----------|--------|
| RF07.1 | O sistema **deve ter sidebar** com links para Dashboard, Estoque Dispensação, Estoque CEO e Solicitações. | Must | `components/layout/Sidebar.jsx` |
| RF07.2 | A rota **Estoque Dispensação** deve ser **oculta** para o perfil Dentista. | Must | `Sidebar.jsx` (NAV_ITEMS.roles) |
| RF07.3 | Tentativa de acesso a rota não autorizada **deve redirecionar** para o Dashboard. | Must | `router/ProtectedRoute.jsx` |
| RF07.4 | A sidebar deve exibir **avatar, nome e badge de perfil** do usuário logado, além do botão de logout. | Must | `Sidebar.jsx` |
| RF07.5 | O layout deve ser **responsivo** (desktop e tablet). Mobile pode ser limitado no MVP. | Must | `layouts/AppLayout.jsx` |

---

## Sumário por prioridade

| Prioridade | Total |
|-----------|-------|
| Must (MVP) | **48** |
| Should | 3 |
| Could | 5 |
| Wont (MVP) | 3 |

> A lista detalhada de stories que implementam cada requisito está em [05-backlog/02-user-stories.md](../05-backlog/02-user-stories.md).
