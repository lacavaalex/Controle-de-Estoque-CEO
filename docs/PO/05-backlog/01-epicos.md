# Mapa de Épicos

**Documento:** 01-epicos
**Última atualização:** 14/05/2026
**Revisão:** v2 — incorpora descobertas do diálogo com o almoxarife João Victor, análise das planilhas reais (`Materiais Odontológicos - HO`, `Saída de Materiais - 2026`) e do PDF de solicitação real do CEO (14/11/2025).

---

## 0. Mudanças desta revisão (resumo executivo)

| Mudança | Impacto |
|---------|---------|
| Pedido passa a ser **cabeçalho + N itens** (espelha o e-mail real do CEO). | EP04 reescrito; novo modelo conceitual. |
| **Aprovação parcial entra no MVP** (qtd_expedida ≠ qtd_solicitada é caso comum na planilha real). | RF05.13 promovido a Must. |
| Novo perfil **`solicitante`** (substitui criação por `dentista`). Coordenação do setor cria o pedido. | EP01 e EP04 reescritos. |
| Novo perfil setorial **`gestor`** (HO e CEO). Gestor é super-user do próprio setor; gestor HO vê tudo. | EP01, EP05 reescritos. |
| Perfil **`dentista` adiado para fase 2** (não cria pedido, não é leitor relevante no MVP). | EP04, EP03, EP05 reescritos. |
| **Produto × Lote** modelado (1:N). Solicitante vê produto agregado; almoxarife/gestor vê lotes. | Modelo conceitual mudou; novo épico EP07 (Lotes). |
| **Estoque do CEO existe**, mas é alimentado **automaticamente** pelas expedições do HO. Gestor do CEO edita/ajusta. | EP03 redesenhado (saiu de "leitura" para "estoque alimentado"). |
| **Solicitar item indisponível é permitido** (vira `aguardando_reposicao`). Sistema alerta almoxarife quando chega reposição. | RN08 invertida; nova story de "demanda represada". |
| **Multi-setor desde o MVP** (CEO, HO, CME, laboratórios — destinos), com foco operacional no CEO. | EP04 e modelo conceitual. |
| **Linha livre** no pedido (escape do catálogo, para casos como "evidenciador de biofilme" do PDF). | EP04. |
| **Sistema substitui o e-mail** como fonte de verdade; notificação por e-mail ao almoxarife como ponte de migração. | EP04; OUT07 parcialmente revertido. |
| **Ciclo de vida do lote**: `ativo → vencido → segregado` (descartado fica para fase 2). Reflete a sala de biossegurança. | Novo épico EP07. |
| **Carga inicial dos dados** ainda em aberto (decisão adiada). | — |

---

## 1. Épicos do MVP

| ID | Épico | Objetivo | RFs principais | Perfis |
|----|-------|---------|----------------|--------|
| EP01 | **Acesso e identidade** | Permitir login e segregação por perfil (gestor HO, gestor CEO, almoxarife, solicitante). | RF01, RF07 | Todos |
| EP02 | **Catálogo e estoque do almoxarifado (HO)** | CRUD de produtos do catálogo; gestão de lotes (entrada, edição, status); visão agregada e por lote. | RF03 | Almoxarife, Gestor |
| EP03 | **Estoque do CEO** | Estoque local alimentado automaticamente pelas expedições do HO; gestor do CEO ajusta consumo e recontagens. | RF04 | Gestor CEO, Solicitante CEO (leitura), Gestor HO |
| EP04 | **Pedidos (multi-item, multi-setor)** | Fluxo digital de pedido entre setor solicitante (CEO etc.) e a Dispensação (HO). Substitui e-mail como fonte de verdade. | RF05 | Todos |
| EP05 | **Alertas e dashboards setoriais** | KPIs e listas críticas por perfil; demanda represada; consumo por setor. | RF02, RF06 | Todos |
| EP06 | **Identidade visual e responsividade** | Aderência à marca UFPE e uso em desktop/tablet. | RNF01 | Todos |
| EP07 | **Ciclo de vida do lote (validade, segregação)** | Monitorar validade por lote; segregar vencidos (sala de biossegurança); bloquear expedição de vencidos. | RF06.2, RF06.7 (novo) | Almoxarife, Gestor HO |

## 2. Mapa de dependências

```
                  ┌────────────────────────┐
                  │ EP01 — Acesso e        │
                  │  identidade            │
                  └─────────┬──────────────┘
                            │
        ┌───────────────────┼──────────────────────────────┐
        ▼                   ▼                              ▼
┌────────────────────┐ ┌──────────────────┐    ┌─────────────────────┐
│ EP02 — Catálogo +  │ │ EP07 — Ciclo de  │    │ EP06 — Identidade   │
│ Estoque HO         │ │  vida do lote    │    │  visual             │
└────────┬───────────┘ └─────────┬────────┘    └─────────────────────┘
         │                       │
         │   ┌───────────────────┘
         │   │
         ▼   ▼
┌──────────────────────┐
│ EP04 — Pedidos       │◀────┐
└──────────┬───────────┘     │ "expedição abastece CEO"
           │                 │
           ▼                 │
┌──────────────────────┐     │
│ EP03 — Estoque CEO   │─────┘
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ EP05 — Dashboards    │
└──────────────────────┘
```

- **EP01** é pré-requisito para todos.
- **EP02** (catálogo + estoque HO) e **EP07** (lote/validade) habilitam **EP04** (pedidos só fazem sentido com catálogo e lote).
- **EP04** alimenta **EP03** (expedição aprovada vira entrada automática no CEO).
- **EP03** depende de EP04 para receber estoque (não há cadastro manual de "estoque do CEO" no MVP).
- **EP05** consome dados de todos os outros.
- **EP06** atravessa todos (não é desenvolvido sequencialmente).

## 3. Critérios de aceite por épico

### EP01 — Acesso e identidade
- [ ] Login funciona para 4 perfis (`gestor`, `almoxarife`, `solicitante`, e — fase 2 — `dentista`).
- [ ] Sessão persiste enquanto o navegador estiver aberto.
- [ ] Sidebar exibe apenas rotas permitidas para o perfil **e o setor** do usuário.
- [ ] Tentativa de URL não autorizada redireciona para Dashboard.
- [ ] Gestor do HO vê dados de todos os setores; gestor do CEO vê só CEO.
- [ ] `Gestor` engloba poderes de `almoxarife` (no HO) e de `solicitante` (no próprio setor).
- [ ] **Cadastro de novos usuários só via convite gerado pelo gestor**; tela de login não tem botão público de "Cadastrar".
- [ ] Gestor tem aba "Usuários" para convidar, listar, desativar usuários do seu escopo.

### EP02 — Catálogo e estoque do almoxarifado (HO)
- [ ] Catálogo de produtos é entidade separada de lote (1 produto : N lotes).
- [ ] Tabela de estoque exibe produtos com quantidade agregada (soma dos lotes ativos) e badge de status.
- [ ] Visão expandida por produto mostra cada lote (lote, validade, fabricação, qtd, status).
- [ ] CRUD de produto: nome, categoria, unidade, estoque mínimo/máximo, localização.
- [ ] CRUD de lote: lote, fabricação, validade, qtd, produto associado.
- [ ] Produto sem lotes ativos aparece com `quantidade_total = 0` e status `Indisponível` (caso "Não Tem" da planilha).
- [ ] Filtros: nome/lote, categoria, status, "só com estoque", "só sem estoque".
- [ ] Solicitante vê catálogo agregado **sem lote**.

### EP03 — Estoque do CEO
- [ ] Entrada automática no estoque do CEO quando pedido com `destino=CEO` é expedido (cria lotes-CEO refletindo o que saiu).
- [ ] Gestor do CEO consegue: registrar consumo (subtrair qtd, motivo opcional) e ajuste de inventário (recontagem com nova qtd).
- [ ] Toda mexida do gestor gera `Movimentação` rastreável (`ajuste`, `consumo`).
- [ ] Lote é preservado no CEO (mesma rastreabilidade da Dispensação).
- [ ] Solicitante do CEO tem leitura do estoque CEO; gestor do HO também (auditoria).
- [ ] Estoque CEO usa as mesmas regras de status (Crítico/Baixo/Vencendo/Vencido).

### EP04 — Pedidos
- [ ] Pedido tem **cabeçalho** (setor, solicitante, data, observação geral) + **N itens** (produto, qtd_solicitada, qtd_expedida, lote_expedido, status_item, motivo_divergencia).
- [ ] Solicitante seleciona itens do **catálogo** + pode adicionar **linhas livres** (item fora do catálogo, descrição em texto).
- [ ] Item indisponível **pode** ser pedido — vira status `aguardando_reposicao` no item do pedido.
- [ ] Almoxarife processa **item-a-item**: integral / parcial / em falta, escolhe lote (FEFO sugerido), informa motivo da divergência se houver.
- [ ] Status do pedido é **derivado**: `pendente`, `em_processamento`, `atendido_integral`, `atendido_parcial`, `nao_atendido`, `aguardando_reposicao`.
- [ ] Visualização por abas: Pendentes, Em processamento, Concluídos, Aguardando reposição, Todos.
- [ ] Cada criação de pedido dispara **notificação por e-mail** ao almoxarife (ponte de migração).
- [ ] Linhas livres NÃO geram movimentação de estoque automática.

### EP05 — Alertas e dashboards
- [ ] KPIs por perfil renderizando corretamente.
- [ ] Gráfico de consumo mensal por setor de destino (gestor HO).
- [ ] Listas de "vencendo" e "estoque crítico" (gestor HO, almoxarife).
- [ ] **Demanda represada** (top itens com pedidos `aguardando_reposicao`) — gestor HO.
- [ ] Log de movimentações filtrável por tipo (entrada, saída, ajuste, consumo, segregação).
- [ ] Gestor CEO vê dashboard restrito ao CEO.

### EP06 — Identidade visual e responsividade
- [ ] Cor primária `#990000` consistente.
- [ ] Layout funcional em desktop (≥ 1280px) e tablet (≥ 768px).
- [ ] Componentes UI reutilizáveis em uso.

### EP07 — Ciclo de vida do lote
- [ ] Lote tem estados: `ativo`, `vencido` (calculado pela data), `segregado` (ação manual).
- [ ] Lote vencido **não pode ser expedido** (bloqueio na escolha de lote no pedido).
- [ ] Almoxarife consegue **segregar** lote vencido em 1 clique (gera `Movimentação` de tipo `segregação`).
- [ ] Lote segregado é filtrado da visão de expedição, mas visível em "Lotes segregados".
- [ ] Alerta no dashboard do almoxarife quando chega novo lote de produto com pedidos `aguardando_reposicao` represados.
- [ ] Estados visuais: Vencendo (≤ 30d), Atenção (31–60d), Vencido, Segregado.

## 4. Stories adiadas para fase 2 (registradas para roadmap)

| Story (rascunho) | Motivo |
|------------------|--------|
| Dentista cria pedido individual a partir do card do estoque CEO. | Reduz escopo do MVP; coordenação consolida via solicitante. |
| Dentista vê apenas pedidos vinculados a si. | Perfil `dentista` é fase 2. |
| Descarte oficial de lote segregado (data, autorização, observação). | Ato burocrático trimestral, fora do ciclo operacional diário. |
| Catálogo recomendado por setor (baseado em histórico). | Carga inicial usa catálogo único; refinamento sai quase de graça depois. |
| Ingestão automática de e-mail → pedido. | Caro para 45 dias; notificação por e-mail é a ponte de migração. |
| Múltiplos lotes em uma única linha do pedido sem "desdobrar". | UI mais rica; modelagem do MVP já suporta via desdobramento. |
| Aprovação parcial com sugestão automática de FEFO. | UX avançada; sugestão simples cabe no MVP. |
| Estoque local para outros setores (CME, laboratórios). | `EstoqueLocal` polimórfico em fase 2 (modularidade preservada). |

## 5. Mudanças no resumo do backlog (high level)

A contagem detalhada de stories é mantida em [02-user-stories.md](02-user-stories.md). Mudança estrutural prevista:

| Épico | Stories MVP (antes) | Stories MVP (agora) | Comentário |
|-------|---------------------|---------------------|------------|
| EP01 | 4 | 7 | +3 (escopo setorial + cadastro por convite + aba de usuários) |
| EP02 | 6 | 7 | +1 (separação produto × lote) |
| EP03 | 3 | 4 | +1 (entrada auto + ajustes do gestor CEO) |
| EP04 | 6 | 8 | +2 (multi-item, parcial, linha livre, indisponível-permitido) |
| EP05 | 5 | 6 | +1 (demanda represada) |
| EP06 | 2 | 2 | — |
| EP07 | 0 | 3 | novo épico (segregação, validade por lote, alerta de reposição) |
| **Total** | **26** | **37** | — |

> Aumento de ~35% no backlog do MVP. **Prazo de 45 dias** exige priorização agressiva — vide [`07-roadmap-metricas/01-roadmap.md`] para sequenciamento e [`02-escopo-mvp.md`] para confirmar o que entra/sai.
