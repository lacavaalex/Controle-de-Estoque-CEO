# Backlog — User Stories

**Documento:** 02-user-stories
**Última atualização:** 07/05/2026

---

## Convenções

- **Formato da story:** `Como [persona], eu quero [ação] para que [valor].`
- **Critérios de aceite:** Gherkin (`Dado / Quando / Então`).
- **Estimativa:** Story Points em escala Fibonacci (1, 2, 3, 5, 8, 13).
- **Status (sugerido):** Backlog · Pronta · Em desenvolvimento · Em revisão · Concluída.
- **Prioridade:** MoSCoW. Stories `Must` formam o MVP.

> Os IDs das stories seguem o épico (US-EP01-01, US-EP02-03 etc.) e **não mudam** ao longo do projeto.

---

## EP01 — Acesso e identidade

### US-EP01-01 — Login institucional
**Como** qualquer usuário do hospital,
**eu quero** entrar no sistema com meu e-mail institucional e senha,
**para que** o sistema saiba quem eu sou e me mostre apenas o que me cabe.

- Prioridade: Must
- Estimativa: 5
- RFs: RF01.1, RF01.2, RF01.6
- DoR: credenciais de teste para os 3 perfis disponíveis.

**Critérios de aceite (Gherkin):**

```gherkin
Cenário: Login bem-sucedido
  Dado que sou um usuário cadastrado com perfil "almoxarife"
  E que estou na tela de login
  Quando preencho o e-mail "almoxarife@ufpe.br" e a senha correta
  E clico em "Entrar no Sistema"
  Então sou redirecionado para o Dashboard
  E vejo a sidebar com itens "Dashboard", "Dispensação", "Estoque CEO" e "Solicitações"

Cenário: Credenciais inválidas
  Dado que estou na tela de login
  Quando preencho a senha incorreta
  Então vejo a mensagem "E-mail ou senha incorretos."
  E permaneço na tela de login

Cenário: Campos vazios
  Dado que estou na tela de login
  Quando clico em "Entrar no Sistema" sem preencher os campos
  Então vejo a mensagem "Preencha o e-mail e a senha."
```

---

### US-EP01-02 — Logout
**Como** usuário autenticado,
**eu quero** sair do sistema com um clique,
**para que** ninguém use minha sessão depois que eu sair do computador.

- Prioridade: Must · Estimativa: 1 · RFs: RF01.5

```gherkin
Cenário: Logout encerra sessão
  Dado que estou autenticado
  Quando clico em "Sair" na sidebar
  Então sou redirecionado para "/login"
  E uma nova tentativa de acessar "/dashboard" pela URL me devolve para "/login"
```

---

### US-EP01-03 — Restrição de rotas por perfil
**Como** Product Owner,
**eu quero** que o sistema barre acessos não autorizados,
**para que** o dentista nunca veja a tela da Dispensação e a confiança nos dados se mantenha.

- Prioridade: Must · Estimativa: 3 · RFs: RF01.3, RF03.8, RF07.2, RF07.3

```gherkin
Cenário: Dentista tentando acessar Estoque Dispensação
  Dado que estou autenticado como "dentista"
  Quando navego diretamente para "/estoque-dispensacao"
  Então sou redirecionado para "/dashboard"
  E o item "Dispensação" não aparece na sidebar

Cenário: Almoxarife acessa Estoque Dispensação
  Dado que estou autenticado como "almoxarife"
  Quando clico em "Dispensação" na sidebar
  Então vejo a tabela completa de itens
```

---

### US-EP01-04 — Sessão persistente no navegador
**Como** usuário,
**eu quero** continuar logado enquanto a aba do navegador estiver aberta,
**para que** não tenha que digitar a senha a cada vez que mudar de tela.

- Prioridade: Must · Estimativa: 2 · RFs: RF01.4, RNF03.2

```gherkin
Cenário: Recarregar mantém sessão
  Dado que estou autenticado
  Quando recarrego a página
  Então continuo autenticado e vejo o dashboard

Cenário: Fechar navegador encerra sessão
  Dado que estou autenticado
  Quando fecho o navegador completamente e abro novamente
  Então sou levado para a tela de login
```

---

## EP02 — Estoque da Dispensação

### US-EP02-01 — Listar itens da Dispensação
**Como** almoxarife,
**eu quero** ver todos os itens em tabela com nome, lote, quantidade, mín/máx, localização, validade e status,
**para que** eu tenha uma visão única do estoque.

- Prioridade: Must · Estimativa: 5 · RFs: RF03.1, RF03.6, RF03.7

```gherkin
Cenário: Tabela popula com 20 itens da carga inicial
  Dado que estou autenticado como "almoxarife"
  Quando abro "Estoque Dispensação"
  Então vejo "20 de 20 itens exibidos"
  E a tabela tem as colunas: Item, Lote, Qtd, Mín/Máx, Localização, Validade, Status, Ações

Cenário: Linha crítica destacada
  Dado que existe um item com quantidade abaixo do estoque mínimo
  Quando vejo a tabela
  Então a linha está destacada em vermelho claro
  E o badge "Crítico" aparece na coluna Status
```

---

### US-EP02-02 — Filtrar itens
**Como** almoxarife,
**eu quero** filtrar por nome/lote, categoria e status,
**para que** eu encontre o item rapidamente.

- Prioridade: Must · Estimativa: 3 · RFs: RF03.5

```gherkin
Cenário: Filtrar por categoria
  Dado que estou na tela de Estoque Dispensação
  Quando seleciono a categoria "EPI"
  Então vejo apenas itens da categoria "EPI"
  E o subtítulo mostra "X de 20 itens exibidos"

Cenário: Buscar por lote parcial
  Quando digito "LT-2025" no campo de busca
  Então vejo apenas os itens cujo lote começa com "LT-2025"
```

---

### US-EP02-03 — Cadastrar novo item
**Como** almoxarife,
**eu quero** cadastrar um item recebido do fornecedor com poucos campos obrigatórios,
**para que** o estoque reflita a realidade rapidamente.

- Prioridade: Must · Estimativa: 5 · RFs: RF03.2, RF03.9

```gherkin
Cenário: Cadastro válido
  Dado que estou autenticado como "almoxarife"
  E que estou em "Estoque Dispensação"
  Quando clico em "Novo Item"
  E preencho nome="Algodão em Rolo", categoria="Material Cirúrgico", lote="LT-2025-100",
    quantidade="200", unidade="pacote", validade="2027-06-30"
  E clico em "Adicionar Item"
  Então o modal fecha
  E o novo item aparece na tabela com status "Normal"

Cenário: Falha por campo obrigatório
  Quando deixo o campo "Lote" em branco e tento salvar
  Então vejo a mensagem "Obrigatório" abaixo do campo
  E o item NÃO é cadastrado

Cenário: Quantidade inválida
  Quando informo quantidade "-5"
  Então vejo "Número válido"
  E o item NÃO é cadastrado
```

---

### US-EP02-04 — Editar item
**Como** almoxarife,
**eu quero** editar dados de um item existente,
**para que** corrija quantidades, localização ou validade quando houver ajuste.

- Prioridade: Must · Estimativa: 3 · RFs: RF03.3

```gherkin
Cenário: Edição de quantidade
  Dado que existe um item "Luvas Descartáveis M" com quantidade 120
  Quando clico no ícone de editar dessa linha
  E altero a quantidade para 200
  E clico em "Salvar Alterações"
  Então a tabela mostra a quantidade atualizada
  E o status é recalculado automaticamente
```

---

### US-EP02-05 — Remover item com confirmação
**Como** almoxarife,
**eu quero** remover um item do estoque com confirmação prévia,
**para que** evite remoções acidentais.

- Prioridade: Must · Estimativa: 2 · RFs: RF03.4, RNF01.3

```gherkin
Cenário: Confirmar remoção
  Dado que existe um item "Papel Articular"
  Quando clico no ícone de remover dessa linha
  E vejo o modal "Tem certeza que deseja remover Papel Articular do estoque?"
  E clico em "Remover Item"
  Então o item desaparece da tabela

Cenário: Cancelar remoção
  Quando clico em "Cancelar" no modal de confirmação
  Então o modal fecha
  E o item permanece na tabela
```

---

### US-EP02-06 — Dentista não vê Estoque Dispensação
**Como** PO,
**eu quero** garantir que o dentista não tenha visibilidade do estoque da Dispensação,
**para que** não haja confusão de dados entre estoques.

- Prioridade: Must · Estimativa: 1 · RFs: RF03.8, RF07.2

```gherkin
Cenário: Sidebar oculta a rota
  Dado que estou autenticado como "dentista"
  Quando observo a sidebar
  Então não vejo o item "Dispensação"
```

---

## EP03 — Estoque do CEO

### US-EP03-01 — Visão em cards (dentista)
**Como** dentista do CEO,
**eu quero** ver os itens do CEO em cards visuais com status,
**para que** eu identifique rapidamente o que está faltando.

- Prioridade: Must · Estimativa: 5 · RFs: RF04.1, RF04.3, RF04.5

```gherkin
Cenário: Cards renderizam status
  Dado que estou autenticado como "dentista"
  Quando abro "Estoque CEO"
  Então vejo cards com nome, categoria, quantidade, unidade, mínimo e badge de status
  E o card "Resina Composta A2" (qtd 3, mín 5) tem badge "Crítico"
  E o card "Ácido Fosfórico 37%" (qtd 0) tem badge "Indisponível"
```

---

### US-EP03-02 — Visão em tabela (gestão e almoxarife)
**Como** almoxarife ou gestão,
**eu quero** ver o estoque do CEO em tabela compacta,
**para que** consiga avaliar várias linhas rapidamente.

- Prioridade: Must · Estimativa: 3 · RFs: RF04.2, RF04.4

```gherkin
Cenário: Almoxarife abre Estoque CEO
  Dado que estou autenticado como "almoxarife"
  Quando abro "Estoque CEO"
  Então vejo uma tabela com colunas Item, Categoria, Qtd, Mínimo, Status
  E não vejo botão "Solicitar Item" em nenhuma linha
```

---

### US-EP03-03 — Botão "Solicitar Item" desabilitado em indisponíveis
**Como** PO,
**eu quero** que o sistema impeça uma solicitação de item indisponível,
**para que** se evite ruído no fluxo de aprovação.

- Prioridade: Must · Estimativa: 2 · RFs: RF04.6, RN08

```gherkin
Cenário: Card de item indisponível
  Dado que existe item "Ácido Fosfórico 37%" com quantidade 0 no CEO
  Quando vejo o card desse item como dentista
  Então o botão exibe "Indisponível" e está desabilitado
```

---

## EP04 — Solicitações

### US-EP04-01 — Dentista cria solicitação a partir do card
**Como** dentista,
**eu quero** clicar em "Solicitar Item" no card do estoque CEO,
**para que** a solicitação seja iniciada já com o item pré-selecionado.

- Prioridade: Must · Estimativa: 5 · RFs: RF05.1, RF05.2, RF05.3

```gherkin
Cenário: Solicitação válida
  Dado que estou em "Estoque CEO" como dentista
  Quando clico em "Solicitar Item" no card "Hipoclorito de Sódio"
  E preencho quantidade "10"
  E preencho justificativa "Reposição para semana de endodontia"
  E clico em "Enviar Solicitação"
  Então o modal fecha
  E vejo a solicitação no topo da lista de "Minhas Solicitações" com status "Pendente"

Cenário: Justificativa muito curta
  Quando informo justificativa "Preciso"
  Então vejo "Justificativa deve ter pelo menos 10 caracteres."
  E a solicitação NÃO é criada

Cenário: Quantidade inválida
  Quando informo quantidade "0"
  Então vejo "Informe uma quantidade válida."
```

---

### US-EP04-02 — Almoxarife aprova solicitação
**Como** almoxarife,
**eu quero** aprovar uma solicitação pendente em um clique,
**para que** o atendimento seja rápido.

- Prioridade: Must · Estimativa: 3 · RFs: RF05.4, RF05.6

```gherkin
Cenário: Aprovar pendente
  Dado que existe a solicitação "SOL-001" com status "Pendente"
  Quando clico em "Aprovar" na linha dessa solicitação
  Então a solicitação some da aba "Pendentes"
  E aparece na aba "Aprovadas"
  E na aba "Aprovadas" vejo responsável e data de conclusão preenchidos
```

---

### US-EP04-03 — Almoxarife nega solicitação com observação
**Como** almoxarife,
**eu quero** negar uma solicitação registrando o motivo,
**para que** o dentista entenda por que o pedido não foi atendido.

- Prioridade: Must · Estimativa: 3 · RFs: RF05.5, RF05.6, RNF01.3

```gherkin
Cenário: Negação com observação
  Dado que existe a solicitação "SOL-002" pendente
  Quando clico em "Negar"
  E informo a observação "Quantidade acima do limite por solicitação"
  E clico em "Confirmar Negação"
  Então a solicitação aparece em "Negadas"
  E a observação fica visível abaixo do badge na linha

Cenário: Cancelar negação
  Quando abro o modal de negação e clico em "Cancelar"
  Então a solicitação continua "Pendente"
```

---

### US-EP04-04 — Dentista vê só as próprias solicitações
**Como** dentista,
**eu quero** ver apenas as solicitações que eu mesmo criei,
**para que** minha tela não fique poluída com pedidos de outros.

- Prioridade: Must · Estimativa: 2 · RFs: RF05.8

```gherkin
Cenário: Filtragem por solicitante
  Dado que existem solicitações criadas por mim e por outros dentistas
  Quando abro "Solicitações"
  Então vejo apenas as criadas por mim
  E o subtítulo mostra "X solicitações no total"
```

---

### US-EP04-05 — Visão por abas (Pendentes, Aprovadas, Negadas, Todas)
**Como** usuário do sistema,
**eu quero** filtrar solicitações por status em abas,
**para que** eu foque no que importa.

- Prioridade: Must · Estimativa: 3 · RFs: RF05.7

```gherkin
Cenário: Contadores por aba
  Dado que existem 3 pendentes, 5 aprovadas e 2 negadas
  Quando abro "Solicitações"
  Então vejo as abas com os números: Pendentes (3), Aprovadas (5), Negadas (2), Todas (10)

Cenário: Aba "Todas" mostra histórico completo
  Quando clico em "Todas"
  Então vejo todas as solicitações independentemente do status
```

---

### US-EP04-06 — Gestão tem visão de auditoria
**Como** gestão,
**eu quero** ver todas as solicitações em modo somente leitura,
**para que** eu possa auditar o fluxo sem alterar dados operacionais.

- Prioridade: Must · Estimativa: 2 · RFs: RF05.10

```gherkin
Cenário: Gestão sem botões de ação
  Dado que estou autenticado como "gestao"
  Quando abro "Solicitações"
  Então não vejo botões "Aprovar" ou "Negar" em nenhuma linha
  E vejo o título "Histórico de Solicitações" com subtítulo "Visualização completa para auditoria"
```

---

## EP05 — Alertas e Dashboards

### US-EP05-01 — KPIs do dashboard
**Como** usuário do sistema,
**eu quero** ver indicadores-chave no topo do dashboard,
**para que** eu entenda o estado geral em segundos.

- Prioridade: Must · Estimativa: 5 · RFs: RF02.1, RF02.5

```gherkin
Cenário: KPIs Gestão
  Dado que estou autenticado como "gestao"
  Quando abro o Dashboard
  Então vejo 4 KPIs: "Total de Itens", "Vencendo em Breve", "Estoque Crítico", "Solicitações Pendentes"

Cenário: KPI atualiza em tempo real
  Dado que existem 5 solicitações pendentes
  E o KPI "Pendentes" mostra 5
  Quando aprovo uma solicitação na fila
  Então o KPI passa a mostrar 4 sem recarregar a página
```

---

### US-EP05-02 — Gráfico de consumo mensal
**Como** gestão,
**eu quero** ver um gráfico comparativo de consumo entre Dispensação e CEO,
**para que** eu negocie reposição com base em dados.

- Prioridade: Must · Estimativa: 5 · RFs: RF02.2

```gherkin
Cenário: Gráfico renderiza dados de 6 meses
  Dado que estou autenticado como "gestao"
  Quando abro o Dashboard
  Então vejo o gráfico "Consumo Mensal por Unidade"
  E ele tem 6 meses no eixo X com barras de "Dispensação" (bordô) e "CEO" (cinza)
```

---

### US-EP05-03 — Listas de vencendo e crítico
**Como** gestão ou almoxarife,
**eu quero** ver listas dedicadas de itens vencendo e críticos,
**para que** atue rapidamente sobre eles.

- Prioridade: Must · Estimativa: 3 · RFs: RF02.2, RF02.3

```gherkin
Cenário: Lista de vencimento ordenada
  Quando abro o Dashboard como gestão
  Então vejo a seção "Itens Próximos do Vencimento"
  E os itens são ordenados pelo mais próximo do vencimento
```

---

### US-EP05-04 — Fila de pendentes para o almoxarife
**Como** almoxarife,
**eu quero** ver as solicitações pendentes diretamente no dashboard,
**para que** comece o turno já com a fila visível.

- Prioridade: Must · Estimativa: 5 · RFs: RF02.3

```gherkin
Cenário: Fila com badge de contagem
  Dado que existem 5 solicitações pendentes
  Quando entro como "almoxarife"
  Então vejo a seção "Fila de Solicitações Pendentes" com badge "5 pendentes"
  E posso aprovar/negar cada uma direto da fila

Cenário: Sem pendentes
  Dado que não existem solicitações pendentes
  Então vejo a mensagem "Nenhuma solicitação pendente."
  E o KPI "Pendentes" mostra 0 com cor verde
```

---

### US-EP05-05 — Log de movimentações
**Como** gestão,
**eu quero** ver as últimas movimentações registradas,
**para que** eu acompanhe o pulso operacional sem entrar em outras telas.

- Prioridade: Must · Estimativa: 3 · RFs: RF06.4

```gherkin
Cenário: Log limita por padrão a 10 entradas
  Quando abro o Dashboard como gestão
  Então vejo a seção "Últimas Movimentações"
  E vejo até 10 linhas com tipo, item, destino, responsável, data
```

---

## EP06 — Identidade visual e responsividade

### US-EP06-01 — Identidade UFPE aplicada
**Como** PO,
**eu quero** que toda a interface respeite a marca UFPE,
**para que** o produto pareça institucional e confiável.

- Prioridade: Must · Estimativa: 3 · RFs: RNF01.1

```gherkin
Cenário: Cor primária correta
  Quando abro qualquer tela autenticada
  Então a cor primária dos botões, badges ativos, tabs e headers é "#990000"
  E o brasão da UFPE aparece no painel esquerdo do login
```

---

### US-EP06-02 — Layout responsivo
**Como** dentista usando tablet,
**eu quero** que as telas se adaptem ao meu dispositivo,
**para que** eu use o sistema entre consultas.

- Prioridade: Must · Estimativa: 5 · RFs: RNF01.2, RNF05.3

```gherkin
Cenário: Tablet em retrato (≥ 768px)
  Quando abro o sistema em um iPad em retrato
  Então a sidebar permanece visível
  E as tabelas têm rolagem horizontal sem quebrar layout

Cenário: Mobile (< 768px)
  Quando abro em smartphone
  Então o conteúdo é navegável (mesmo que algumas colunas auxiliares sejam ocultadas)
```

---

## Resumo do backlog

| Épico | Stories | Must | Should | Could |
|-------|---------|------|--------|-------|
| EP01 — Acesso | 4 | 4 | 0 | 0 |
| EP02 — Dispensação | 6 | 6 | 0 | 0 |
| EP03 — CEO | 3 | 3 | 0 | 0 |
| EP04 — Solicitações | 6 | 6 | 0 | 0 |
| EP05 — Dashboards | 5 | 5 | 0 | 0 |
| EP06 — UI | 2 | 2 | 0 | 0 |
| **Total** | **26** | **26** | **0** | **0** |

> Stories de fase 2 (notificações por e-mail, exportação, expansão para outros subdepartamentos) serão adicionadas em ciclo de refinamento posterior, conforme [07-roadmap-metricas/01-roadmap.md](../07-roadmap-metricas/01-roadmap.md).
