# Escopo do MVP

**Documento:** 02-escopo-mvp
**Última atualização:** 14/05/2026
**Status:** Em revisão (v2) — incorpora descobertas do fluxo real do almoxarifado (depoimento João Victor + planilhas reais + PDF de solicitação real do CEO).
**Prazo:** **45 dias** de desenvolvimento.

---

## 1. Objetivo do MVP

Validar, em **45 dias de desenvolvimento + piloto subsequente**, que o sistema é capaz de:

1. Substituir o **e-mail** como fonte de verdade do pedido de material entre setores (a começar pelo CEO) e a Dispensação (HO), com registro auditável de cada item, lote, quem solicitou e quem retirou.
2. Substituir as **planilhas Excel manuais** que o almoxarifado central usa hoje para controlar entrada, saída, validade e segregação de materiais.
3. **Modelar a realidade multi-setor** (HO, CEO, e — em fase 2 — CME, laboratórios), com foco operacional no CEO e arquitetura modular.
4. Reduzir perdas por vencimento via alertas automáticos por lote e segregação rastreável.
5. Transformar **demanda represada** (pedidos não atendidos por falta de orçamento/reposição) em **dado mensurável** para a Gestão usar como argumento para compras.

## 2. In-scope (faz parte do MVP)

### 2.1 Autenticação e perfis
- Login por e-mail institucional `@ufpe.br` e senha.
- Três perfis no MVP: **Gestor** (setorial), **Almoxarife** (HO) e **Solicitante** (setorial). Perfil **Dentista adiado para fase 2**.
- Cada usuário vinculado a um **setor** (HO ou CEO no MVP).
- Hierarquia de poderes: `gestor` ⊃ `almoxarife` (no HO) ⊃ `solicitante` (no próprio setor).
- Sessão ativa enquanto o navegador estiver aberto.
- RBAC por **perfil × setor**.
- **Cadastro de usuários pelo gestor (versão enxuta)**: gestor cria a conta diretamente, sistema gera **senha provisória** entregue ao gestor; usuário **troca a senha no primeiro login**. Tela de login **não tem** botão público de "Cadastrar". RBAC: gestor HO cria qualquer perfil/setor; gestor CEO cria apenas solicitantes do CEO.
- Aba de **gerenciamento de usuários** para o gestor (listar, criar, desativar, resetar senha; remoção bloqueada se houver histórico).

### 2.2 Dashboards adaptativos por perfil e setor
- **Gestor HO**: KPIs consolidados de todos os setores, gráfico de consumo mensal por setor de destino, demanda represada (top N), itens próximos do vencimento, estoque crítico, log de movimentações.
- **Gestor CEO**: KPIs restritos ao CEO (estoque local, pedidos enviados, aguardando reposição), consumo do CEO, itens críticos.
- **Almoxarife (HO)**: fila de pedidos pendentes, alertas de vencimento (≤30d), produtos críticos, alerta de **reposição para demanda represada**.
- **Solicitante**: saudação, pedidos recentes, botão "Novo Pedido", KPIs do próprio setor.

### 2.3 Catálogo e estoque do HO (almoxarifado central)
- **Catálogo de Produtos** (entidade separada): nome, categoria, unidade, estoque mín/máx, localização.
- **Lotes do Produto** (1 produto : N lotes): número do lote, fabricação, validade, qtd, estado (`ativo` / `vencido` / `segregado`).
- Listagem agregada (qtd total = soma dos lotes ativos) com expansão para ver lotes.
- CRUD de produto e de lote.
- Produto pode existir sem lotes (catálogo preservado mesmo com estoque zerado — caso "Não Tem" da planilha).
- Filtros: nome/lote, categoria, status, "só com estoque", "só sem estoque".
- Status calculado por RN03–RN07.
- Categoria especial `Equipamento` (fotopolimerizador, raio X) fora da lógica de estoque mínimo.

### 2.4 Estoque do CEO
- **Alimentado automaticamente** pelas expedições do HO com `setor_destino=CEO` (cria/atualiza lote-CEO).
- Lote é **preservado** (mesma rastreabilidade do HO).
- **Gestor CEO** pode: registrar consumo (uso clínico, abate qtd) e ajuste de inventário (recontagem com observação).
- Toda mexida do gestor gera Movimentação rastreável.
- Solicitante CEO tem leitura.
- Gestor HO vê o estoque do CEO para auditoria.

### 2.5 Pedidos (multi-item, multi-setor)
- Pedido = **cabeçalho** (setor de origem, solicitante, data, justificativa) + **N itens** (espelhando o e-mail real).
- Solicitante seleciona itens do **catálogo** + pode adicionar **linhas livres** (texto livre fora do catálogo).
- **Item indisponível pode ser pedido** (vira `aguardando_reposicao`).
- Almoxarife/Gestor HO processa **item-a-item**: integral, parcial, em falta.
- **Aprovação parcial é permitida** (qtd_expedida < qtd_solicitada).
- Em divergência, **motivo enumerado obrigatório**: `falta_estoque`, `racionalizacao_setor`, `lote_indisponivel`, `outros` (com texto opcional).
- Sugestão **FEFO** ao escolher lote (lote vencido/segregado bloqueado).
- Item pode ser **desdobrado** em sub-entregas de lotes diferentes.
- Estados derivados: `pendente` · `em_processamento` · `atendido_integral` · `atendido_parcial` · `nao_atendido` · `aguardando_reposicao`.
- Pedido **não pode ser editado** após envio (correção = novo pedido).
- Visualização por abas (Pendentes, Em Processamento, Concluídos, Aguardando Reposição, Todos).
- **Notificação por e-mail ao almoxarifado** ao criar pedido (ponte de migração — não é fonte de verdade).
- Visibilidade: solicitante vê pedidos do próprio setor; gestor CEO vê pedidos do CEO; almoxarife/gestor HO veem todos.

### 2.6 Alertas e monitoramento
- Produto com `qtd_total ≤ estoque_minimo` → **Crítico**.
- Produto com `qtd_total ≤ estoque_minimo × 1,5` → **Baixo**.
- **Lote** vencendo em ≤ 30 dias → **Vencendo**; entre 31–60 dias → **Atenção**; vencido → **Vencido**.
- Produto com `qtd_total ≥ estoque_maximo × 0,95` → **Excessivo** (só HO).
- **Demanda represada**: lista de produtos com pedidos em `aguardando_reposicao` (gestor HO + almoxarife).
- **Alerta de reposição**: quando lote novo é cadastrado de produto represado, almoxarife é notificado para atender a fila.
- Log de movimentações filtrável (entrada, saída, ajuste, consumo, segregação).

### 2.7 Ciclo de vida do lote
- Lote tem estados `ativo → vencido → segregado` (estado `descartado` fica para fase 2).
- Lote vencido **não é expedível**.
- Almoxarife pode **segregar** lote em 1 clique (gera Movimentação tipo `segregação`).
- Lote segregado sai da visão de estoque ativo, vai para "Lotes segregados".

### 2.8 Identidade visual e responsividade
- Identidade UFPE (bordô `#990000`).
- Layout responsivo desktop e tablet.

## 3. Out-of-scope (NÃO faz parte do MVP)

| ID | Item | Decisão | Justificativa |
|----|------|---------|---------------|
| OUT01 | Integração com fornecedores externos | Excluído | Mantém complexidade controlada. |
| OUT02 | Recuperação de senha por e-mail | Excluído do MVP | Reset feito por administrador. |
| OUT03 | Cadastro **público / self-service** de usuários | Excluído | Substituído por **cadastro via convite gerado pelo gestor** (entra no MVP). Tela de login não tem botão de "Cadastrar". |
| OUT04 | Estoque local para outros setores (CME, laboratórios) | Excluído | Modelagem comporta; ativação fica para fase 2. |
| OUT05 | Aplicativo mobile nativo | Excluído | Web responsivo cobre o caso. |
| OUT06 | Leitura de código de barras / QR | Excluído | Útil no futuro, exige hardware. |
| OUT07 | ~~Notificações por e-mail~~ | **Parcialmente revertido** | Notificação ao almoxarifado **entra no MVP** como ponte de migração; demais notificações ficam para fase 2. |
| OUT08 | Integração com SIGAA / outros sistemas UFPE | Excluído | Fora do escopo do MVP. |
| OUT09 | Edição/cancelamento de pedido após envio | Excluído | Mantém o fluxo simples; pedido errado = novo pedido. |
| OUT10 | ~~Aprovação parcial~~ | **Revertido — entra no MVP** | Caso comum na planilha real (Luva P 4/3, Álcool 99% 4L/2L). |
| OUT11 | Versionamento de produtos | Excluído | Auditoria via movimentações cobre o essencial. |
| OUT12 | Painel de fornecedores e ordens de compra | Excluído | Fora do escopo institucional do produto. |
| OUT13 | Multi-tenant / multi-instituição | Excluído | Produto é UFPE-específico no MVP. |
| OUT14 | Perfil **Dentista** (criação individual de pedido + cards visuais) | **Adiado para fase 2** | Coordenação consolida via `solicitante`; reduz fricção de adoção e escopo. |
| OUT15 | Descarte oficial de lote segregado (data, autorização) | Adiado para fase 2 | Ato burocrático trimestral. Segregação resolve o operacional. |
| OUT16 | Ingestão automática de e-mail → pedido | Adiado para fase 2 | Caro para 45 dias. Notificação ao almoxarifado é a ponte. |
| OUT17 | Catálogo recomendado/restrito por setor | Adiado para fase 2 | Catálogo único no MVP; refinamento sai quase de graça depois. |
| OUT18 | Aprovação parcial automática (FEFO automático) | Adiado para fase 2 | MVP tem sugestão FEFO manual. |
| OUT19 | Importação histórica de saídas (jan-mai 2026) | **Decisão adiada** | A decisão de carga inicial fica para depois. |

## 4. Premissas para o MVP

- **A1.** Usuários cadastrados manualmente por administrador.
- **A2.** Carga inicial de produtos/lotes a partir das planilhas reais (estratégia ainda a definir — script híbrido + revisão humana é uma hipótese).
- **A3.** Em divergência físico × sistema, prevalece o físico, com **ajuste manual** registrado.
- **A4.** Datas de validade vêm do fornecedor; o sistema armazena e monitora.
- **A5.** No MVP, o **CEO consome via pedido** ao almoxarifado HO. Outros setores destinatários (CME, laboratórios) **não entram operacionalmente** no MVP, embora a modelagem suporte.
- **A6.** A **migração do e-mail** será dura: a partir do go-live, e-mail deixa de ser fonte de verdade. Notificação automática preserva o hábito.
- **A7.** Há **2 pessoas no almoxarifado** (turno manhã e tarde); ambas serão cadastradas como `almoxarife` ou `gestor HO`.

## 5. Restrições

- **RT01.** Prazo de 45 dias para desenvolvimento + entrega.
- **RT02.** Hospedagem gratuita ou em servidor da universidade.
- **RT03.** Identidade UFPE obrigatória.
- **RT04.** Sem dados clínicos sensíveis (LGPD em escopo administrativo).
- **RT05.** Escopo do backlog cresceu ~35% em relação à v1 — **priorização agressiva é obrigatória** para caber em 45 dias.

## 6. Critérios de aceite do MVP (Definition of Done do produto)

O MVP é considerado pronto para piloto quando, simultaneamente:

- [ ] Todos os RFs marcados como **Must** em [04-requisitos/01-requisitos-funcionais.md](../04-requisitos/01-requisitos-funcionais.md) estão implementados e testados.
- [ ] Todos os RNFs com prioridade **Must** estão atendidos.
- [ ] Os perfis (Gestor HO, Gestor CEO, Almoxarife, Solicitante) conseguem realizar suas jornadas sem fricção bloqueante.
- [ ] Massa de dados realista carregada (catálogo do almoxarifado a partir das planilhas reais, ≥ 5 pedidos de exemplo cobrindo todos os status).
- [ ] Sessão de treinamento de 1h com almoxarife (João Victor), gestor HO (Dra. Silvia), gestor CEO (Dra. Renata) e ao menos 1 solicitante do CEO (Ingrid ou Zilma).
- [ ] Cartilha de uso por perfil (1 página por perfil) entregue.
- [ ] **Plano de migração do e-mail** comunicado à coordenação do CEO com data de corte.

## 7. Critérios de saída do piloto (vai para fase 2?)

Após **90 dias** de operação em produção:

| Métrica | Meta | Próximo passo se atingir | Próximo passo se NÃO atingir |
|--------|------|--------------------------|-------------------------------|
| % pedidos registrados no sistema (vs. e-mail residual) | ≥ 80% | Expandir para CME + laboratórios | Investigar fricção UX, reforço de comunicação |
| Tempo médio de resposta a pedido | ≤ 24h úteis | Expandir | Reforçar processo do almoxarife, revisar SLA |
| Redução de descarte por vencimento (lotes segregados / mês) | ≥ 50% | Expandir | Auditar uso de alertas, treinar reposição |
| Demanda represada visível para Gestão | Dado disponível e usado em ≥ 1 reunião de compras | Expandir (UX de relatórios) | Revisar dashboard de demanda represada |
| NPS interno (almoxarife + gestores + solicitantes) | ≥ +30 | Expandir | Rodada qualitativa e nova iteração |

## 8. Mudanças desta revisão (v1 → v2)

- **OUT10 revertido**: aprovação parcial entra no MVP.
- **OUT07 parcialmente revertido**: notificação ao almoxarifado entra como ponte de migração.
- **OUT14 novo**: perfil Dentista adiado para fase 2.
- **OUT15–OUT18 novos**: descarte oficial, ingestão de e-mail, catálogo por setor, FEFO automático adiados.
- **OUT19 novo**: carga inicial de histórico adiada (decisão pendente).
- **Premissa A6, A7 novas**: refletem a realidade do almoxarifado (2 turnos, 1 pessoa por turno).
- **Restrição RT01 atualizada**: 45 dias (era prazo letivo aberto antes).
- **Premissa A5 reescrita**: multi-setor desde o MVP, foco operacional no CEO.

> A nova contagem de stories do MVP é **35** (v1 = 26). Para caber em 45 dias, [`07-roadmap-metricas/01-roadmap.md`] precisará priorizar e possivelmente mover algumas stories para v1.1.
