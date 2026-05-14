# Backlog — User Stories

**Documento:** 02-user-stories
**Última atualização:** 14/05/2026
**Revisão:** v2 — alinhada com [01-epicos.md] (v2) e com as descobertas do fluxo real do almoxarifado.

---

## Convenções

- **Formato da story:** `Como [perfil], eu quero [ação] para que [valor].`
- **Critérios de aceite:** Gherkin (`Dado / Quando / Então`).
- **Estimativa:** Story Points em escala Fibonacci (1, 2, 3, 5, 8, 13).
- **Status (sugerido):** Backlog · Pronta · Em desenvolvimento · Em revisão · Concluída.
- **Prioridade:** MoSCoW. Stories `Must` formam o MVP.

> Os IDs das stories seguem o épico (US-EP01-01, US-EP02-03 etc.). IDs descartados nesta revisão são listados ao final em "Histórico de mudanças".

---

## EP01 — Acesso e identidade

### US-EP01-01 — Login institucional
**Como** usuário do hospital,
**eu quero** entrar no sistema com meu e-mail institucional e senha,
**para que** o sistema saiba quem eu sou e me mostre apenas o que me cabe.

- Prioridade: Must · Estimativa: 5 · RFs: RF01.1, RF01.2, RF01.6
- DoR: credenciais de teste para os 4 perfis (`gestor`, `almoxarife`, `solicitante`, `dentista`) e os 2 setores iniciais (HO e CEO).

```gherkin
Cenário: Login bem-sucedido como almoxarife
  Dado que sou usuário "almoxarife" do setor "HO"
  Quando preencho o e-mail e a senha corretos
  Então sou redirecionado para o Dashboard
  E vejo a sidebar com itens "Dashboard", "Estoque HO", "Pedidos", "Lotes"

Cenário: Credenciais inválidas
  Quando preencho a senha incorreta
  Então vejo "E-mail ou senha incorretos."

Cenário: Campos vazios
  Quando clico em "Entrar" sem preencher
  Então vejo "Preencha o e-mail e a senha."
```

### US-EP01-02 — Logout
**Como** usuário autenticado, **eu quero** sair com um clique, **para que** ninguém use minha sessão.

- Prioridade: Must · Estimativa: 1 · RFs: RF01.5

```gherkin
Cenário: Logout encerra sessão
  Dado que estou autenticado
  Quando clico em "Sair" na sidebar
  Então sou redirecionado para "/login"
  E nova tentativa de acesso a "/dashboard" me devolve para "/login"
```

### US-EP01-03 — Restrição por perfil e setor
**Como** Product Owner, **eu quero** que o sistema barre acessos não autorizados, **para que** dados sensíveis fiquem confinados ao perfil e setor correto.

- Prioridade: Must · Estimativa: 5 · RFs: RF01.3, RF07.2, RF07.3

```gherkin
Cenário: Solicitante CEO não acessa estoque HO em escrita
  Dado que estou autenticado como "solicitante" do setor "CEO"
  Quando navego para "/estoque-ho"
  Então sou redirecionado para o Dashboard

Cenário: Gestor CEO só vê dados do CEO
  Dado que estou autenticado como "gestor" do setor "CEO"
  Quando abro o dashboard
  Então vejo KPIs apenas do CEO
  E NÃO vejo dados de outros setores destinatários

Cenário: Gestor HO vê tudo
  Dado que estou autenticado como "gestor" do setor "HO"
  Quando abro o dashboard
  Então vejo KPIs consolidados de todos os setores
  E posso acessar estoque do HO e do CEO

Cenário: Gestor herda poderes do almoxarife no HO
  Dado que estou autenticado como "gestor" do setor "HO"
  Quando abro a tela de processamento de pedidos
  Então tenho as mesmas ações disponíveis para o almoxarife (expedir, aprovação parcial, negar)
```

### US-EP01-04 — Sessão persistente no navegador
**Como** usuário, **eu quero** continuar logado enquanto a aba estiver aberta, **para que** não tenha que digitar a senha a cada navegação.

- Prioridade: Must · Estimativa: 2 · RFs: RF01.4, RNF03.2

```gherkin
Cenário: Recarregar mantém sessão
  Dado que estou autenticado
  Quando recarrego a página
  Então continuo autenticado

Cenário: Fechar navegador encerra sessão
  Quando fecho o navegador completamente e abro novamente
  Então sou levado para "/login"
```

### US-EP01-05 — Escopo setorial do perfil
**Como** PO, **eu quero** que cada usuário tenha um **setor** vinculado, **para que** pedidos, dashboards e estoques fiquem corretamente filtrados.

- Prioridade: Must · Estimativa: 3 · RFs: RF01.9 (novo)

```gherkin
Cenário: Solicitante criando pedido enxerga o próprio setor
  Dado que sou "solicitante" do setor "CEO"
  Quando crio um pedido
  Então o campo "setor de origem" está preenchido com "CEO" e bloqueado

Cenário: Gestor HO criando pedido em nome de outro setor
  Dado que sou "gestor" do setor "HO"
  Quando crio um pedido em nome de outro setor
  Então posso escolher o setor de origem em uma lista
```

### US-EP01-06 — Gestor cria usuário com senha provisória
**Como** gestor, **eu quero** criar uma conta nova para almoxarife ou solicitante diretamente da minha aba de "Usuários", **para que** o provisionamento seja controlado e a tela de login fique limpa (sem botão público de "Cadastrar").

- Prioridade: Must · Estimativa: 5 · RFs: RF01.11 (novo), RF01.12 (novo)

```gherkin
Cenário: Gestor HO cria conta de almoxarife
  Dado que sou "gestor" do setor "HO"
  Quando abro "Usuários" → "Novo Usuário"
  E preencho nome, e-mail institucional, cargo, perfil="almoxarife", setor="HO"
  E clico em "Criar"
  Então o sistema cria a conta com status "ativo"
  E gera uma senha provisória exibida em destaque ao gestor (com botão "Copiar")
  E exibe instrução: "Entregue a senha provisória ao usuário. Ele deverá trocá-la no primeiro login."

Cenário: Gestor CEO cria solicitante do CEO
  Dado que sou "gestor" do setor "CEO"
  Quando abro "Usuários" → "Novo Usuário"
  Então só posso selecionar perfil="solicitante" e setor="CEO"
  E NÃO posso criar perfis "almoxarife", "gestor" ou usuários de outros setores

Cenário: Primeiro login força troca de senha
  Dado que recebi senha provisória do gestor
  Quando faço login pela primeira vez
  Então sou redirecionado para tela "Trocar senha"
  E só consigo acessar o sistema após definir uma nova senha
  E a nova senha tem mínimo de 8 caracteres

Cenário: Tela de login não tem botão "Cadastrar"
  Quando abro "/login" sem estar autenticado
  Então NÃO vejo opção pública de cadastro
  E a única forma de obter conta é ser criada por um gestor

Cenário: E-mail já cadastrado
  Quando tento criar conta com e-mail já existente
  Então vejo "Já existe usuário com este e-mail."
  E a conta NÃO é criada
```

> **RBAC do provisionamento:**
> - **Gestor HO**: pode criar `gestor`, `almoxarife` e `solicitante` de **qualquer setor**.
> - **Gestor CEO** (e outros gestores setoriais): pode criar apenas `solicitante` do **próprio setor**.
> - **Almoxarife / Solicitante**: não podem criar usuários.

### US-EP01-07 — Aba de gerenciamento de usuários para o gestor
**Como** gestor, **eu quero** listar e desativar usuários do meu escopo, **para que** o acesso fique sob controle.

- Prioridade: Must · Estimativa: 3 · RFs: RF01.13 (novo)

```gherkin
Cenário: Gestor HO lista todos os usuários
  Dado que sou "gestor" do setor "HO"
  Quando abro "Usuários"
  Então vejo todos os usuários (de todos os setores) com nome, e-mail, perfil, setor, status (ativo/desativado), último login

Cenário: Gestor CEO lista apenas usuários do CEO
  Dado que sou "gestor" do setor "CEO"
  Quando abro "Usuários"
  Então vejo apenas usuários do setor "CEO"

Cenário: Desativar usuário
  Quando clico em "Desativar" num usuário do meu escopo
  Então o usuário fica com status "desativado"
  E não consegue mais fazer login
  E seus registros históricos (pedidos, movimentações) são preservados

Cenário: Resetar senha (gerar nova senha provisória)
  Quando clico em "Resetar senha" num usuário do meu escopo
  Então o sistema gera uma nova senha provisória exibida ao gestor
  E o usuário será obrigado a trocá-la no próximo login

Cenário: Não é possível remover usuário com histórico
  Quando tento remover um usuário que criou pedidos
  Então o sistema impede e sugere "Desative em vez de remover, para preservar histórico."
```

---

## EP02 — Catálogo e estoque do almoxarifado (HO)

### US-EP02-01 — Listar catálogo agregado
**Como** almoxarife/gestor HO, **eu quero** ver todos os produtos do catálogo com a quantidade total (soma dos lotes ativos), **para que** eu tenha visão de "tem ou não tem".

- Prioridade: Must · Estimativa: 5 · RFs: RF03.1, RF03.6, RF03.7

```gherkin
Cenário: Tabela exibe agregação
  Quando abro "Estoque HO"
  Então vejo colunas: Produto, Categoria, Qtd total, Unidade, Mín/Máx, Status, Ações
  E a Qtd total é a soma das quantidades dos lotes "ativos" do produto

Cenário: Produto sem lote ativo
  Dado que o produto "Ácido Fluorídrico 5%" não tem nenhum lote ativo
  Quando vejo a listagem
  Então o produto aparece com "0" e badge "Indisponível"
```

### US-EP02-02 — Visualizar lotes de um produto
**Como** almoxarife/gestor HO, **eu quero** expandir o produto e ver cada lote, **para que** eu saiba a validade e fabricação de cada pilha física.

- Prioridade: Must · Estimativa: 3 · RFs: RF03.1b (novo)

```gherkin
Cenário: Expandir produto
  Dado que o produto "Ácido Fosfórico 37%" tem 3 lotes ativos
  Quando clico em "Ver lotes" na linha do produto
  Então vejo cada lote com: número, fabricação, validade, qtd, status do lote
  E os lotes vencidos/segregados não aparecem nesta visão (filtrados)
```

### US-EP02-03 — Filtrar catálogo
**Como** almoxarife/gestor HO, **eu quero** filtrar produtos por nome/lote, categoria, status e "só com/sem estoque", **para que** eu encontre rápido.

- Prioridade: Must · Estimativa: 3 · RFs: RF03.5

```gherkin
Cenário: Filtrar por status "Indisponível"
  Quando seleciono status "Indisponível"
  Então vejo apenas produtos com 0 unidades totais
```

### US-EP02-04 — Cadastrar produto no catálogo
**Como** almoxarife/gestor HO, **eu quero** cadastrar um produto novo no catálogo, **para que** ele possa ser pedido e ter lotes associados.

- Prioridade: Must · Estimativa: 3 · RFs: RF03.2, RF03.9

```gherkin
Cenário: Cadastro válido de produto
  Quando clico em "Novo Produto" e preencho nome, categoria, unidade, estoque mín/máx
  Então o produto é criado com 0 lotes
  E aparece na listagem com status "Indisponível"

Cenário: Campo obrigatório vazio
  Quando deixo "categoria" em branco e tento salvar
  Então vejo "Obrigatório"
```

### US-EP02-05 — Cadastrar lote (entrada de estoque)
**Como** almoxarife/gestor HO, **eu quero** registrar um lote novo ao receber material do fornecedor, **para que** o estoque reflita a entrada.

- Prioridade: Must · Estimativa: 5 · RFs: RF03.2b (novo)

```gherkin
Cenário: Lote válido
  Dado que o produto "Luva P" existe no catálogo
  Quando clico em "+ Lote" na linha do produto
  E preencho lote="458/24", fabricação="06/2024", validade="06/2028", qtd="120"
  Então o lote é criado e fica como "ativo"
  E gera Movimentação de tipo "entrada"
  E a Qtd total do produto aumenta em 120

Cenário: Validade no passado
  Quando informo validade "01/2020"
  Então o lote pode ser criado, mas já entra como "vencido"
  E um alerta é exibido pedindo confirmação
```

### US-EP02-06 — Editar e remover produto/lote
**Como** almoxarife/gestor HO, **eu quero** editar dados de produto ou lote, e remover (com confirmação), **para que** eu corrija registros.

- Prioridade: Must · Estimativa: 3 · RFs: RF03.3, RF03.4

```gherkin
Cenário: Editar quantidade do lote
  Quando altero a qtd de um lote
  Então a Qtd total do produto recalcula
  E gera Movimentação de tipo "ajuste" com a diferença

Cenário: Remover lote com confirmação
  Quando clico em remover lote
  Então vejo modal "Tem certeza?"
  E clicando "Remover", o lote some
```

### US-EP02-07 — Visão de leitura para solicitante (catálogo agregado, sem lote)
**Como** solicitante, **eu quero** ver o catálogo agregado (sem ver lotes), **para que** eu saiba o que está disponível para pedir.

- Prioridade: Must · Estimativa: 2 · RFs: RF03.10 (novo)

```gherkin
Cenário: Solicitante vê catálogo
  Dado que sou "solicitante"
  Quando abro a tela de "Novo Pedido"
  Então vejo lista de produtos com nome, categoria, qtd disponível e status
  E NÃO vejo lote nem fabricação nem validade
```

---

## EP03 — Estoque do CEO

### US-EP03-01 — Entrada automática de estoque ao expedir
**Como** PO, **eu quero** que toda expedição com destino "CEO" alimente automaticamente o estoque do CEO, **para que** o CEO tenha visibilidade real do que foi recebido.

- Prioridade: Must · Estimativa: 5 · RFs: RF04.1, RF04.5

```gherkin
Cenário: Expedição abastece CEO
  Dado que existe pedido "PED-001" com destino "CEO" e item "Gaze" qtd 4
  Quando o almoxarife marca o item como "atendido integral" com lote "183/23"
  Então é criado/atualizado o lote-CEO "183/23" do produto "Gaze" com +4 unidades
  E é registrada Movimentação tipo "entrada" no CEO referenciando o pedido

Cenário: Expedição parcial
  Quando o almoxarife expede 3 (de 4 solicitados) com lote "183/23"
  Então o CEO recebe +3 unidades do lote "183/23"
  E o item do pedido fica "atendido parcial"
```

### US-EP03-02 — Listar estoque do CEO
**Como** gestor CEO / solicitante CEO / gestor HO, **eu quero** ver o estoque do CEO com produto, qtd, status, **para que** eu acompanhe o que existe localmente.

- Prioridade: Must · Estimativa: 3 · RFs: RF04.2, RF04.4

```gherkin
Cenário: Gestor CEO abre estoque
  Quando abro "Estoque CEO"
  Então vejo tabela com Produto, Categoria, Qtd, Mínimo, Status
  E os status usam as mesmas regras do HO (Crítico/Baixo/Vencendo/Vencido)

Cenário: Solicitante CEO em leitura
  Dado que sou "solicitante" do CEO
  Quando abro "Estoque CEO"
  Então tenho visualização de leitura (sem botões de edição)
```

### US-EP03-03 — Gestor do CEO registra consumo
**Como** gestor CEO, **eu quero** abater quantidade do estoque local (consumo clínico), **para que** o saldo reflita a realidade.

- Prioridade: Must · Estimativa: 5 · RFs: RF04.7 (novo)

```gherkin
Cenário: Consumo válido
  Dado que existem 10 unidades de "Gaze" no CEO
  Quando registro consumo de 3 unidades, motivo="uso clínico"
  Então o saldo passa a 7
  E é gerada Movimentação tipo "consumo" no CEO

Cenário: Consumo maior que saldo
  Quando tento registrar consumo de 15 (com 10 em estoque)
  Então o sistema impede e sugere "Faça ajuste de inventário se a contagem física divergir."
```

### US-EP03-04 — Gestor do CEO faz ajuste de inventário
**Como** gestor CEO, **eu quero** fazer recontagem (saldo novo) com observação, **para que** divergências físicas sejam regularizadas.

- Prioridade: Must · Estimativa: 3 · RFs: RF04.8 (novo)

```gherkin
Cenário: Ajuste de inventário
  Dado que o saldo do sistema é 12 e a contagem física é 9
  Quando registro ajuste para 9 com observação "Recontagem do dia 14/05"
  Então o saldo passa a 9
  E é gerada Movimentação tipo "ajuste" com delta -3 e observação preservada
```

---

## EP04 — Pedidos (multi-item, multi-setor)

### US-EP04-01 — Solicitante cria pedido com múltiplos itens
**Como** solicitante (CEO ou outro setor), **eu quero** criar um pedido com vários itens de uma vez, **para que** o fluxo digital substitua o e-mail.

- Prioridade: Must · Estimativa: 8 · RFs: RF05.1, RF05.2, RF05.3, RF05.14 (novo)

```gherkin
Cenário: Pedido válido com 3 itens
  Dado que sou "solicitante" do "CEO"
  Quando clico em "Novo Pedido"
  E adiciono item "Gaze" qtd 4, item "Luva P" qtd 2 (caixas), item "Prilocaína" qtd 1
  E informo justificativa geral "Reposição semanal CEO"
  E clico em "Enviar Pedido"
  Então o pedido é criado com ID "PED-NNN"
  E o cabeçalho registra setor="CEO", solicitante, data
  E cada item entra como "pendente"

Cenário: Quantidade inválida em um item
  Quando informo qtd "0" em uma das linhas
  Então vejo "Quantidade deve ser ≥ 1" nessa linha e o pedido NÃO é enviado

Cenário: Justificativa muito curta
  Quando a justificativa geral tem menos de 10 caracteres
  Então vejo "Justificativa deve ter pelo menos 10 caracteres."
```

### US-EP04-02 — Linha livre (fora do catálogo)
**Como** solicitante, **eu quero** adicionar uma linha de texto livre quando o item não está no catálogo, **para que** demandas novas não fiquem fora do fluxo.

- Prioridade: Must · Estimativa: 3 · RFs: RF05.15 (novo)

```gherkin
Cenário: Adicionar linha livre
  Quando clico em "+ Outro item (descrever)"
  E digito "Evidenciador de biofilme" e qtd "2"
  Então a linha entra no pedido marcada como "linha livre"
  E ao expedir, NÃO há baixa automática de estoque para esta linha

Cenário: Almoxarife converte linha livre em produto do catálogo
  Dado que existe linha livre "Evidenciador de biofilme"
  Quando o almoxarife clica em "Cadastrar no catálogo"
  Então abre o modal de cadastro de produto pré-preenchido com o nome
  E após cadastrar, a linha vira item normal vinculado ao produto recém-criado
```

### US-EP04-03 — Pedir item indisponível (demanda represada)
**Como** solicitante, **eu quero** poder pedir item que está atualmente em falta, **para que** a demanda fique registrada como pressão por reposição.

- Prioridade: Must · Estimativa: 3 · RFs: RF05.16 (novo), RN08 (invertida)

```gherkin
Cenário: Pedido de item com 0 em estoque
  Dado que "Ácido Fluorídrico 5%" tem 0 no HO
  Quando adiciono este item ao pedido com qtd 3
  Então o sistema exibe alerta: "Este item está em falta. O pedido ficará como Aguardando Reposição."
  E confirmando, o item entra com status "aguardando_reposicao"

Cenário: Pedido inteiro com itens disponíveis e indisponíveis
  Quando o pedido tem 3 itens disponíveis e 1 indisponível
  Então o pedido nasce com status agregado "pendente"
  E o item indisponível aparece destacado como "aguardando reposição"
```

### US-EP04-04 — Almoxarife processa pedido item-a-item
**Como** almoxarife/gestor HO, **eu quero** processar cada item do pedido (integral, parcial, em falta), **para que** o sistema reflita a realidade da separação física.

- Prioridade: Must · Estimativa: 8 · RFs: RF05.4, RF05.5, RF05.6, RF05.13 (promovida)

```gherkin
Cenário: Atendimento integral
  Dado que o pedido tem item "Gaze qtd 4"
  Quando seleciono lote "183/23" e marco "atendido integral"
  Então qtd_expedida=4, lote registrado, status do item="atendido_integral"
  E é gerada Movimentação tipo "saida" do HO (e tipo "entrada" no CEO)

Cenário: Atendimento parcial com motivo
  Quando informo qtd_expedida=3 (de 4 solicitados), lote "183/23"
  Então o sistema exige motivo (falta_estoque / racionalizacao_setor / lote_indisponivel / outros)
  E se motivo="outros", abre campo de texto opcional
  E o status do item="atendido_parcial"

Cenário: Item em falta
  Quando marco o item como "em falta" (qtd_expedida=0)
  Então o item fica status="nao_atendido"
  E é exigido motivo da divergência

Cenário: Status do pedido é derivado
  Dado pedido com 3 itens: 2 integral, 1 parcial
  Então status do pedido = "atendido_parcial"

Cenário: Sugestão FEFO ao escolher lote
  Quando seleciono o produto "Ácido Fosfórico 37%"
  Então a lista de lotes oferece primeiro o de validade mais próxima (FEFO)
  E lotes vencidos NÃO aparecem
  E lotes segregados NÃO aparecem
```

### US-EP04-05 — Desdobrar item em múltiplos lotes
**Como** almoxarife, **eu quero** desdobrar uma linha do pedido em entregas de lotes diferentes, **para que** cenários como "1 unidade do lote A + 1 do lote B" sejam registráveis.

- Prioridade: Must · Estimativa: 5 · RFs: RF05.17 (novo)

```gherkin
Cenário: Desdobrar
  Dado item do pedido "Godiva bastão qtd 2"
  Quando clico em "+ Desdobrar em lotes"
  E informo: 1 unidade lote "1908191" + 1 unidade lote "2110191"
  Então a linha vira 2 sub-entregas, cada uma com seu lote
  E ambas geram Movimentação de saída no HO e entrada no CEO
```

### US-EP04-06 — Visão por abas
**Como** usuário, **eu quero** filtrar pedidos por status em abas, **para que** eu foque no que importa.

- Prioridade: Must · Estimativa: 3 · RFs: RF05.7

```gherkin
Cenário: Contadores por aba
  Dado que existem 3 pendentes, 2 em processamento, 5 concluídos, 1 aguardando reposição
  Quando abro "Pedidos"
  Então vejo abas com contadores: Pendentes (3), Em Processamento (2), Concluídos (5), Aguardando Reposição (1), Todos (11)
```

### US-EP04-07 — Notificação por e-mail ao criar pedido (ponte de migração)
**Como** PO, **eu quero** que cada pedido criado dispare um e-mail para o almoxarifado, **para que** o hábito do e-mail seja preservado como apoio durante a migração.

- Prioridade: Must · Estimativa: 5 · RFs: RF06.6b (novo)

```gherkin
Cenário: E-mail enviado ao criar pedido
  Quando solicitante envia um pedido novo
  Então o sistema envia e-mail para o endereço institucional do almoxarifado
  E o e-mail contém: ID do pedido, setor, solicitante, lista de itens com qtd
  E o e-mail NÃO substitui a fonte de verdade (sistema)
```

### US-EP04-08 — Visibilidade de pedidos por perfil
**Como** PO, **eu quero** que cada perfil veja só os pedidos que lhe cabem, **para que** as listas façam sentido.

- Prioridade: Must · Estimativa: 3 · RFs: RF05.8, RF05.9, RF05.10

```gherkin
Cenário: Solicitante CEO
  Quando abro "Pedidos"
  Então vejo apenas pedidos do setor "CEO"

Cenário: Gestor CEO
  Quando abro "Pedidos"
  Então vejo apenas pedidos do setor "CEO" (criados por qualquer solicitante do CEO)

Cenário: Almoxarife / Gestor HO
  Quando abro "Pedidos"
  Então vejo pedidos de TODOS os setores
```

---

## EP05 — Alertas e Dashboards

### US-EP05-01 — KPIs por perfil
**Como** usuário, **eu quero** ver KPIs no topo do dashboard, **para que** eu entenda o estado em segundos.

- Prioridade: Must · Estimativa: 5 · RFs: RF02.1, RF02.5

```gherkin
Cenário: KPIs Gestor HO
  Quando abro o Dashboard como "gestor" do HO
  Então vejo: Total de Produtos no catálogo, Lotes Vencendo (≤ 60d), Produtos Críticos, Pedidos Pendentes, Itens em Demanda Represada

Cenário: KPIs Gestor CEO
  Quando abro o Dashboard como "gestor" do CEO
  Então vejo: Itens no estoque CEO, Itens Críticos no CEO, Pedidos enviados pendentes, Pedidos aguardando reposição

Cenário: KPIs Almoxarife
  Então vejo: Pedidos Pendentes, Lotes Vencendo (≤ 30d), Produtos Críticos, Demanda Represada

Cenário: KPI atualiza em tempo real
  Dado KPI "Pendentes" = 5
  Quando processo um pedido (todos os itens atendidos)
  Então o KPI passa a 4 sem reload
```

### US-EP05-02 — Gráfico de consumo mensal por setor
**Como** gestor HO, **eu quero** ver consumo mensal por setor destinatário, **para que** eu negocie reposição com dados.

- Prioridade: Must · Estimativa: 5 · RFs: RF02.2

```gherkin
Cenário: Gráfico com setores
  Quando abro o Dashboard como gestor HO
  Então vejo gráfico de barras com eixo X = meses (últimos 6) e barras por setor (CEO, CME, Laboratórios, Dispensação interna)
```

### US-EP05-03 — Listas de vencendo e crítico
**Como** gestor/almoxarife, **eu quero** ver listas de itens vencendo e críticos, **para que** eu atue rapidamente.

- Prioridade: Must · Estimativa: 3 · RFs: RF02.2, RF02.3

```gherkin
Cenário: Lista de vencimento (HO)
  Quando abro o dashboard
  Então vejo "Lotes vencendo nos próximos 30 dias", ordenados do mais próximo

Cenário: Lista de crítico (HO)
  Então vejo "Produtos críticos" (Qtd total ≤ estoque mínimo)
```

### US-EP05-04 — Fila de pedidos pendentes (almoxarife)
**Como** almoxarife, **eu quero** ver pedidos pendentes diretamente no dashboard, **para que** eu comece o turno com a fila visível.

- Prioridade: Must · Estimativa: 5 · RFs: RF02.3

```gherkin
Cenário: Fila com badge
  Dado 5 pedidos pendentes
  Quando entro como "almoxarife"
  Então vejo "Fila de Pedidos Pendentes" com badge "5"
  E posso entrar em cada um para processar
```

### US-EP05-05 — Log de movimentações
**Como** gestor, **eu quero** ver últimas movimentações (entrada, saída, ajuste, consumo, segregação), **para que** eu acompanhe o pulso operacional.

- Prioridade: Must · Estimativa: 3 · RFs: RF06.4

```gherkin
Cenário: Log filtrável
  Quando abro o Dashboard como gestor HO
  Então vejo "Últimas Movimentações" com até 10 entradas
  E posso filtrar por tipo (entrada, saída, ajuste, consumo, segregação)
```

### US-EP05-06 — Demanda represada
**Como** gestor HO, **eu quero** ver os itens com mais pedidos "aguardando reposição", **para que** eu use isso como argumento para compras.

- Prioridade: Must · Estimativa: 3 · RFs: RF06.7 (novo)

```gherkin
Cenário: Top itens de demanda represada
  Quando abro o Dashboard como gestor HO
  Então vejo "Demanda represada (top 10)" com produto, qtd_solicitada_total, número de pedidos, setores envolvidos
```

---

## EP06 — Identidade visual e responsividade

### US-EP06-01 — Identidade UFPE aplicada
**Como** PO, **eu quero** que toda a interface respeite a marca UFPE.

- Prioridade: Must · Estimativa: 3 · RFs: RNF01.1

```gherkin
Cenário: Cor primária
  Então a cor primária é "#990000" em botões, badges, tabs e headers
```

### US-EP06-02 — Layout responsivo
**Como** usuário em tablet, **eu quero** o layout adaptado.

- Prioridade: Must · Estimativa: 5 · RFs: RNF01.2, RNF05.3

```gherkin
Cenário: Tablet retrato (≥ 768px)
  Então a sidebar permanece visível e tabelas têm rolagem horizontal sem quebra

Cenário: Mobile (< 768px)
  Então o conteúdo é navegável (algumas colunas podem ser ocultadas)
```

---

## EP07 — Ciclo de vida do lote

### US-EP07-01 — Estado calculado do lote por validade
**Como** PO, **eu quero** que o estado de um lote seja calculado em relação à data atual, **para que** alertas sejam precisos.

- Prioridade: Must · Estimativa: 3 · RFs: RF06.2

```gherkin
Cenário: Lote vencendo em 30 dias
  Dado que hoje é 14/05/2026 e um lote vence em 10/06/2026
  Então o lote aparece com status "Vencendo (≤30d)"

Cenário: Lote vencido
  Dado validade no passado
  Então o lote aparece como "Vencido"

Cenário: Vencido bloqueia expedição
  Quando o almoxarife escolhe lote para expedir
  Então lotes vencidos não aparecem na seleção
```

### US-EP07-02 — Segregar lote vencido
**Como** almoxarife/gestor HO, **eu quero** segregar um lote vencido em um clique, **para que** ele saia do estoque ativo e fique na "sala de biossegurança".

- Prioridade: Must · Estimativa: 5 · RFs: RF06.8 (novo)

```gherkin
Cenário: Segregar
  Dado um lote com status "Vencido"
  Quando clico em "Segregar"
  Então o lote passa a estado "segregado"
  E é gerada Movimentação tipo "segregação" com responsável, data e qtd
  E o lote some da visão de "Estoque" e aparece em "Lotes segregados"

Cenário: Filtragem padrão
  Quando vejo a tabela "Estoque HO"
  Então lotes segregados não aparecem
  E há um link/aba para "Lotes segregados (N)"
```

### US-EP07-03 — Alerta de reposição para demanda represada
**Como** almoxarife, **eu quero** ser alertado quando chega um lote novo de produto com pedidos `aguardando_reposicao`, **para que** eu atenda a fila represada.

- Prioridade: Must · Estimativa: 5 · RFs: RF06.9 (novo)

```gherkin
Cenário: Lote novo de produto represado
  Dado que existem 3 pedidos "aguardando_reposicao" do produto "Ácido Fluorídrico 5%"
  Quando o almoxarife cadastra um lote novo deste produto
  Então o sistema exibe alerta: "3 pedidos aguardando este produto — abrir fila represada?"
  E ao clicar, o almoxarife vai para a lista filtrada dos pedidos represados deste produto

Cenário: Pedido represado pode ser processado
  Quando entro num pedido em "aguardando_reposicao"
  E há lote ativo do produto agora
  Então posso processar o item normalmente (integral / parcial)
```

---

## Histórico de mudanças (stories descartadas/movidas)

| ID antigo | Mudança | Justificativa |
|-----------|---------|---------------|
| US-EP02-06 (dentista não vê estoque dispensação) | **descartada** | Perfil `dentista` adiado para fase 2; restrição é tratada pela RBAC do solicitante. |
| US-EP03-01 (cards do dentista) | **adiada (fase 2)** | Perfil `dentista` fora do MVP. |
| US-EP03-03 (botão "Solicitar Item" desabilitado em indisponíveis) | **descartada** | RN08 invertida — solicitar indisponível agora gera demanda represada. |
| US-EP04-01 (dentista cria solicitação a partir do card) | **substituída** por US-EP04-01 (solicitante cria pedido multi-item). |
| US-EP04-02 (aprovar em 1 clique) | **substituída** por US-EP04-04 (processamento item-a-item). |
| US-EP04-03 (negar com observação) | **fundida** em US-EP04-04 (motivos enumerados de divergência). |
| US-EP04-04 (dentista vê só as próprias) | **substituída** por US-EP04-08 (visibilidade por setor). |

---

## Resumo do backlog (MVP)

| Épico | Stories | Must | Should | Could |
|-------|---------|------|--------|-------|
| EP01 — Acesso | 7 | 7 | 0 | 0 |
| EP02 — Catálogo + Estoque HO | 7 | 7 | 0 | 0 |
| EP03 — Estoque CEO | 4 | 4 | 0 | 0 |
| EP04 — Pedidos | 8 | 8 | 0 | 0 |
| EP05 — Dashboards | 6 | 6 | 0 | 0 |
| EP06 — UI | 2 | 2 | 0 | 0 |
| EP07 — Ciclo de vida do lote | 3 | 3 | 0 | 0 |
| **Total** | **37** | **37** | **0** | **0** |

> Stories adiadas para fase 2 (dentista, descarte oficial, catálogo recomendado por setor, ingestão automática de e-mail, estoque local para outros setores) estão listadas em [01-epicos.md §4].
