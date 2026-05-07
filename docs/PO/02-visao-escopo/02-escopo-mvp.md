# Escopo do MVP

**Documento:** 02-escopo-mvp
**Última atualização:** 07/05/2026
**Status:** Aprovado pela coordenação do CEO e da Dispensação

---

## 1. Objetivo do MVP

Validar, em **90 dias de uso real no CEO**, que o sistema é capaz de:

1. Substituir os canais informais de solicitação de material (verbal, bilhete, WhatsApp) por um fluxo digital com registro auditável. (necessário fazer uma visita ao ambiente de trabalho para validar algumas hipoteses)
2. Reduzir perdas por vencimento por meio de alertas automáticos.
3. Servir como base operacional confiável para que a Gestão tome decisões de reposição apoiadas em dados.

## 2. In-scope (faz parte do MVP)

### 2.1 Autenticação e perfis
- Login por e-mail institucional `@ufpe.br` e senha.
- Três perfis: **Gestão**, **Almoxarife**, **Dentista CEO**.
- Sessão ativa enquanto o navegador estiver aberto.
- Controle de acesso a rotas e funcionalidades por perfil (RBAC).

### 2.2 Dashboard adaptativo por perfil
- Dashboard **Gestão**: KPIs do hospital, gráfico de consumo mensal Dispensação vs. CEO, lista de itens próximos do vencimento, alertas de estoque crítico, log das últimas movimentações.
- Dashboard **Almoxarife**: KPIs operacionais, **fila de solicitações pendentes** com aprovação/negação inline, alertas de vencimento e estoque crítico.
- Dashboard **Dentista CEO**: cards do estoque do CEO com status visual, lista das próprias solicitações recentes, botão proeminente de "Nova Solicitação".

### 2.3 Estoque da Dispensação
- Listagem em tabela com nome, lote, quantidade, unidade, mín/máx, localização, validade e status.
- Filtros por nome/lote, categoria e status.
- Cadastro, edição e remoção (com confirmação) de itens — restrito a Almoxarife e Gestão.
- Status calculado automaticamente (Normal, Baixo, Crítico, Vencendo, Vencido, Excessivo).
- Destaque visual de linhas em estado de atenção.

### 2.4 Estoque do CEO
- Listagem dos itens disponíveis no CEO com status (Disponível, Baixo, Crítico, Indisponível).
- Visão em **cards** para o dentista (com botão "Solicitar Item") e em **tabela** para Gestão e Almoxarife.
- Acesso de leitura para todos os perfis.

### 2.5 Solicitações
- Dentista cria solicitação informando item, quantidade e justificativa (≥ 10 caracteres).
- Almoxarife aprova ou nega, com observação obrigatória opcional na negação.
- Estados: pendente → aprovada / negada (sem voltar atrás no MVP).
- Registro de responsável e data de conclusão a cada decisão.
- Visualização por abas: Pendentes, Aprovadas, Negadas, Todas.
- Dentista vê apenas as **próprias** solicitações.

### 2.6 Alertas e monitoramento
- Item abaixo do estoque mínimo → status **Crítico**.
- Item entre o mínimo e 1,5× o mínimo → status **Baixo**.
- Item vencendo em ≤ 30 dias → status **Vencendo**.
- Item vencendo entre 31 e 60 dias → status **Atenção**.
- Item já vencido → status **Vencido**.
- Item ≥ 95% do estoque máximo → status **Excessivo**.
- Log das últimas movimentações (entrada, saída, ajuste).

### 2.7 Identidade visual e responsividade
- Identidade UFPE (bordô `#990000`).
- Layout responsivo desktop e tablet.

## 3. Out-of-scope (NÃO faz parte do MVP)

| ID | Item | Decisão | Justificativa |
|----|------|---------|---------------|
| OUT01 | Integração com fornecedores externos | Excluído | Mantém complexidade controlada; processo de compras é institucional e atrasaria o piloto. |
| OUT02 | Recuperação de senha por e-mail | Excluído do MVP | Reset feito por administrador no piloto; e-mail institucional pode ser usado em fase posterior. |
| OUT03 | Cadastro self-service de usuários | Excluído | Universo pequeno e fechado; usuários são provisionados manualmente. |
| OUT04 | Múltiplos subdepartamentos além do CEO | Excluído | O piloto é o CEO; expansão é a fase 2. |
| OUT05 | Aplicativo mobile nativo | Excluído | Web responsivo cobre o caso de uso; nativo aumentaria custo sem ganho relevante. |
| OUT06 | Leitura de código de barras / QR | Excluído | Útil no futuro, mas exige hardware e fluxo extra; não bloqueia o piloto. |
| OUT07 | Notificações por e-mail / push | Excluído | Painel "Pendentes" no dashboard substitui no MVP; pode ser adicionado em fase 2. |
| OUT08 | Integração com sistemas da UFPE (SIGAA, etc.) | Excluído | Identidade institucional não é parte do MVP. |
| OUT09 | Edição/cancelamento de solicitação após envio | Excluído | Mantém o fluxo simples; dentista cria nova solicitação se errar. |
| OUT10 | Aprovação parcial (aprovar quantidade menor) | Excluído | Decidido com a coordenação para evitar conflitos no piloto; almoxarife nega e dentista refaz. |
| OUT11 | Histórico/versionamento de itens | Excluído | Auditoria via movimentações cobre o caso essencial. |
| OUT12 | Painel de fornecedores e ordens de compra | Excluído | Fora do escopo institucional do produto. |
| OUT13 | Multi-tenant / multi-instituição | Excluído | Produto é UFPE-específico no MVP. |

## 4. Premissas para o MVP

- **A1.** Os usuários são cadastrados manualmente por um administrador.
- **A2.** A massa inicial de itens da Dispensação e do CEO é importada por carga manual ou cadastro inicial, com apoio do almoxarife.
- **A3.** Em divergência físico × sistema, prevalece o físico, com **ajuste manual** registrado.
- **A4.** Datas de validade vêm do fornecedor; o sistema apenas as armazena e monitora.
- **A5.** O CEO consome materiais via **solicitação** ao almoxarife — não há acesso direto ao estoque da Dispensação.

## 5. Restrições

- **RT01.** Prazo letivo da disciplina (Desenvolvimento de Sistemas).
- **RT02.** Hospedagem gratuita ou em servidor da universidade.
- **RT03.** Identidade UFPE obrigatória.
- **RT04.** Sem dados clínicos sensíveis (LGPD se mantém em escopo administrativo).

## 6. Critérios de aceite do MVP (Definition of Done do produto)

O MVP é considerado pronto para piloto quando, simultaneamente:

- [ ] Todos os RFs marcados como **MVP** em [04-requisitos/01-requisitos-funcionais.md](../04-requisitos/01-requisitos-funcionais.md) estão implementados e testados.
- [ ] Todos os RNFs com prioridade **Must** estão atendidos.
- [ ] Os três perfis (Gestão, Almoxarife, Dentista) conseguem realizar suas jornadas sem fricção bloqueante.
- [ ] Há massa de dados realista (≥ 20 itens da Dispensação, ≥ 10 do CEO, ≥ 8 solicitações de exemplo) para treinamento.
- [ ] Sessão de treinamento de 1 hora foi conduzida com almoxarife e ao menos 2 dentistas do CEO.
- [ ] Documentação de uso (cartilha de 1 página por perfil) foi entregue.

## 7. Critérios de saída do piloto (vai para fase 2?)

Após **90 dias** de operação no CEO, decidir continuação a partir do quadro abaixo:

| Métrica | Meta | Próximo passo se atingir | Próximo passo se NÃO atingir |
|--------|------|--------------------------|-------------------------------|
| % solicitações registradas no sistema | ≥ 80% | Expandir para Endodontia + Cirurgia | Investigar fricção UX, instalar mais pontos de acesso |
| Tempo médio de resposta | ≤ 24h úteis | Expandir | Reforçar processo do almoxarife, revisar SLA |
| Redução de descarte por vencimento | ≥ 50% | Expandir | Auditar uso de alertas, treinar reposição |
| NPS interno | ≥ +30 | Expandir | Rodada qualitativa de feedback e nova iteração |
