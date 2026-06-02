# -*- coding: utf-8 -*-
"""
Canonical v2 backlog (docs/PO) encoded for Jira sync.
Source of truth: docs/PO/05-backlog/01-epicos.md + 02-user-stories.md (v2, 14/05/2026).
MoSCoW split (revisão 01/06/2026): 25 Must / 10 Should / 2 Could -> Jira priority High/Medium/Low.
See docs/PO/05-backlog/02-user-stories.md "Demotions desta revisão" for rationale. Estimates in story points.
"""

EPICS = [
    ("EP01", "EP01 — Acesso e identidade",
     "Permitir login e segregação por perfil (gestor HO, gestor CEO, almoxarife, solicitante).\nRFs principais: RF01, RF07. Perfis: Todos.\nPré-requisito de todos os demais épicos."),
    ("EP02", "EP02 — Catálogo e estoque do almoxarifado (HO)",
     "CRUD de produtos do catálogo; gestão de lotes (entrada, edição, status); visão agregada e por lote.\nRFs principais: RF03. Perfis: Almoxarife, Gestor."),
    ("EP03", "EP03 — Estoque do CEO",
     "Estoque local alimentado automaticamente pelas expedições do HO; gestor do CEO ajusta consumo e recontagens.\nRFs principais: RF04. Perfis: Gestor CEO, Solicitante CEO (leitura), Gestor HO."),
    ("EP04", "EP04 — Pedidos (multi-item, multi-setor)",
     "Fluxo digital de pedido entre setor solicitante (CEO etc.) e a Dispensação (HO). Substitui e-mail como fonte de verdade.\nRFs principais: RF05. Perfis: Todos."),
    ("EP05", "EP05 — Alertas e dashboards setoriais",
     "KPIs e listas críticas por perfil; demanda represada; consumo por setor.\nRFs principais: RF02, RF06. Perfis: Todos."),
    ("EP06", "EP06 — Identidade visual e responsividade",
     "Aderência à marca UFPE (bordô #990000) e uso em desktop/tablet.\nRFs principais: RNF01. Perfis: Todos."),
    ("EP07", "EP07 — Ciclo de vida do lote (validade, segregação)",
     "Monitorar validade por lote; segregar vencidos (sala de biossegurança); bloquear expedição de vencidos.\nRFs principais: RF06.2, RF06.7. Perfis: Almoxarife, Gestor HO."),
]

# story = (sid, epic, title, story_sentence, priority, points, rfs, gherkin)
STORIES = [
    # ---------------- EP01 ----------------
    ("US-EP01-01", "EP01", "Login institucional",
     "Como usuário do hospital, eu quero entrar no sistema com meu e-mail institucional e senha, para que o sistema saiba quem eu sou e me mostre apenas o que me cabe.",
     "Must", 5, "RF01.1, RF01.2, RF01.6",
     """Cenário: Login bem-sucedido como almoxarife
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

DoR: credenciais de teste para os 4 perfis e os 2 setores iniciais (HO e CEO)."""),

    ("US-EP01-02", "EP01", "Logout",
     "Como usuário autenticado, eu quero sair com um clique, para que ninguém use minha sessão.",
     "Must", 1, "RF01.5",
     """Cenário: Logout encerra sessão
  Dado que estou autenticado
  Quando clico em "Sair" na sidebar
  Então sou redirecionado para "/login"
  E nova tentativa de acesso a "/dashboard" me devolve para "/login\""""),

    ("US-EP01-03", "EP01", "Restrição por perfil e setor",
     "Como Product Owner, eu quero que o sistema barre acessos não autorizados, para que dados sensíveis fiquem confinados ao perfil e setor correto.",
     "Must", 5, "RF01.3, RF07.2, RF07.3",
     """Cenário: Solicitante CEO não acessa estoque HO em escrita
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
  Então tenho as mesmas ações disponíveis para o almoxarife (expedir, aprovação parcial, negar)"""),

    ("US-EP01-04", "EP01", "Sessão persistente no navegador",
     "Como usuário, eu quero continuar logado enquanto a aba estiver aberta, para que não tenha que digitar a senha a cada navegação.",
     "Should", 2, "RF01.4, RNF03.2",
     """Cenário: Recarregar mantém sessão
  Dado que estou autenticado
  Quando recarrego a página
  Então continuo autenticado

Cenário: Fechar navegador encerra sessão
  Quando fecho o navegador completamente e abro novamente
  Então sou levado para "/login\""""),

    ("US-EP01-05", "EP01", "Escopo setorial do perfil",
     "Como PO, eu quero que cada usuário tenha um setor vinculado, para que pedidos, dashboards e estoques fiquem corretamente filtrados.",
     "Must", 3, "RF01.9",
     """Cenário: Solicitante criando pedido enxerga o próprio setor
  Dado que sou "solicitante" do setor "CEO"
  Quando crio um pedido
  Então o campo "setor de origem" está preenchido com "CEO" e bloqueado

Cenário: Gestor HO criando pedido em nome de outro setor
  Dado que sou "gestor" do setor "HO"
  Quando crio um pedido em nome de outro setor
  Então posso escolher o setor de origem em uma lista"""),

    ("US-EP01-06", "EP01", "Gestor cria usuário com senha provisória",
     "Como gestor, eu quero criar uma conta nova para almoxarife ou solicitante diretamente da minha aba de \"Usuários\", para que o provisionamento seja controlado e a tela de login fique limpa.",
     "Must", 5, "RF01.11, RF01.12",
     """Cenário: Gestor HO cria conta de almoxarife
  Dado que sou "gestor" do setor "HO"
  Quando abro "Usuários" -> "Novo Usuário"
  E preencho nome, e-mail institucional, cargo, perfil="almoxarife", setor="HO"
  E clico em "Criar"
  Então o sistema cria a conta com status "ativo"
  E gera uma senha provisória exibida em destaque ao gestor (com botão "Copiar")
  E exibe instrução de troca no primeiro login.

Cenário: Gestor CEO cria solicitante do CEO
  Dado que sou "gestor" do setor "CEO"
  Quando abro "Usuários" -> "Novo Usuário"
  Então só posso selecionar perfil="solicitante" e setor="CEO"
  E NÃO posso criar perfis "almoxarife", "gestor" ou usuários de outros setores

Cenário: Primeiro login força troca de senha
  Dado que recebi senha provisória do gestor
  Quando faço login pela primeira vez
  Então sou redirecionado para tela "Trocar senha"
  E só consigo acessar o sistema após definir uma nova senha (mínimo 8 caracteres)

Cenário: Tela de login não tem botão "Cadastrar"
  Quando abro "/login" sem estar autenticado
  Então NÃO vejo opção pública de cadastro

Cenário: E-mail já cadastrado
  Quando tento criar conta com e-mail já existente
  Então vejo "Já existe usuário com este e-mail." e a conta NÃO é criada

RBAC: Gestor HO cria gestor/almoxarife/solicitante de qualquer setor; Gestor CEO cria apenas solicitante do próprio setor."""),

    ("US-EP01-07", "EP01", "Aba de gerenciamento de usuários para o gestor",
     "Como gestor, eu quero listar e desativar usuários do meu escopo, para que o acesso fique sob controle.",
     "Should", 3, "RF01.13",
     """Cenário: Gestor HO lista todos os usuários
  Dado que sou "gestor" do setor "HO"
  Quando abro "Usuários"
  Então vejo todos os usuários com nome, e-mail, perfil, setor, status, último login

Cenário: Gestor CEO lista apenas usuários do CEO
  Quando abro "Usuários"
  Então vejo apenas usuários do setor "CEO"

Cenário: Desativar usuário
  Quando clico em "Desativar" num usuário do meu escopo
  Então o usuário fica "desativado" e não consegue mais logar; histórico preservado

Cenário: Resetar senha
  Quando clico em "Resetar senha"
  Então o sistema gera nova senha provisória; usuário troca no próximo login

Cenário: Não é possível remover usuário com histórico
  Quando tento remover um usuário que criou pedidos
  Então o sistema impede e sugere "Desative em vez de remover, para preservar histórico.\""""),

    # ---------------- EP02 ----------------
    ("US-EP02-01", "EP02", "Listar catálogo agregado",
     "Como almoxarife/gestor HO, eu quero ver todos os produtos do catálogo com a quantidade total (soma dos lotes ativos), para que eu tenha visão de \"tem ou não tem\".",
     "Must", 5, "RF03.1, RF03.6, RF03.7",
     """Cenário: Tabela exibe agregação
  Quando abro "Estoque HO"
  Então vejo colunas: Produto, Categoria, Qtd total, Unidade, Mín/Máx, Status, Ações
  E a Qtd total é a soma das quantidades dos lotes "ativos" do produto

Cenário: Produto sem lote ativo
  Dado que o produto "Ácido Fluorídrico 5%" não tem nenhum lote ativo
  Quando vejo a listagem
  Então o produto aparece com "0" e badge "Indisponível\""""),

    ("US-EP02-02", "EP02", "Visualizar lotes de um produto",
     "Como almoxarife/gestor HO, eu quero expandir o produto e ver cada lote, para que eu saiba a validade e fabricação de cada pilha física.",
     "Should", 3, "RF03.1b",
     """Cenário: Expandir produto
  Dado que o produto "Ácido Fosfórico 37%" tem 3 lotes ativos
  Quando clico em "Ver lotes" na linha do produto
  Então vejo cada lote com: número, fabricação, validade, qtd, status do lote
  E os lotes vencidos/segregados não aparecem nesta visão (filtrados)"""),

    ("US-EP02-03", "EP02", "Filtrar catálogo",
     "Como almoxarife/gestor HO, eu quero filtrar produtos por nome/lote, categoria, status e \"só com/sem estoque\", para que eu encontre rápido.",
     "Should", 3, "RF03.5",
     """Cenário: Filtrar por status "Indisponível"
  Quando seleciono status "Indisponível"
  Então vejo apenas produtos com 0 unidades totais"""),

    ("US-EP02-04", "EP02", "Cadastrar produto no catálogo",
     "Como almoxarife/gestor HO, eu quero cadastrar um produto novo no catálogo, para que ele possa ser pedido e ter lotes associados.",
     "Must", 3, "RF03.2, RF03.9",
     """Cenário: Cadastro válido de produto
  Quando clico em "Novo Produto" e preencho nome, categoria, unidade, estoque mín/máx
  Então o produto é criado com 0 lotes
  E aparece na listagem com status "Indisponível"

Cenário: Campo obrigatório vazio
  Quando deixo "categoria" em branco e tento salvar
  Então vejo "Obrigatório\""""),

    ("US-EP02-05", "EP02", "Cadastrar lote (entrada de estoque)",
     "Como almoxarife/gestor HO, eu quero registrar um lote novo ao receber material do fornecedor, para que o estoque reflita a entrada.",
     "Must", 5, "RF03.2b",
     """Cenário: Lote válido
  Dado que o produto "Luva P" existe no catálogo
  Quando clico em "+ Lote" na linha do produto
  E preencho lote="458/24", fabricação="06/2024", validade="06/2028", qtd="120"
  Então o lote é criado e fica como "ativo"
  E gera Movimentação de tipo "entrada"
  E a Qtd total do produto aumenta em 120

Cenário: Validade no passado
  Quando informo validade "01/2020"
  Então o lote pode ser criado, mas já entra como "vencido"
  E um alerta é exibido pedindo confirmação"""),

    ("US-EP02-06", "EP02", "Editar e remover produto/lote",
     "Como almoxarife/gestor HO, eu quero editar dados de produto ou lote, e remover (com confirmação), para que eu corrija registros.",
     "Should", 3, "RF03.3, RF03.4",
     """Cenário: Editar quantidade do lote
  Quando altero a qtd de um lote
  Então a Qtd total do produto recalcula
  E gera Movimentação de tipo "ajuste" com a diferença

Cenário: Remover lote com confirmação
  Quando clico em remover lote
  Então vejo modal "Tem certeza?"
  E clicando "Remover", o lote some"""),

    ("US-EP02-07", "EP02", "Visão de leitura para solicitante (catálogo agregado, sem lote)",
     "Como solicitante, eu quero ver o catálogo agregado (sem ver lotes), para que eu saiba o que está disponível para pedir.",
     "Must", 2, "RF03.10",
     """Cenário: Solicitante vê catálogo
  Dado que sou "solicitante"
  Quando abro a tela de "Novo Pedido"
  Então vejo lista de produtos com nome, categoria, qtd disponível e status
  E NÃO vejo lote nem fabricação nem validade"""),

    # ---------------- EP03 ----------------
    ("US-EP03-01", "EP03", "Entrada automática de estoque ao expedir",
     "Como PO, eu quero que toda expedição com destino \"CEO\" alimente automaticamente o estoque do CEO, para que o CEO tenha visibilidade real do que foi recebido.",
     "Must", 5, "RF04.1, RF04.5",
     """Cenário: Expedição abastece CEO
  Dado que existe pedido "PED-001" com destino "CEO" e item "Gaze" qtd 4
  Quando o almoxarife marca o item como "atendido integral" com lote "183/23"
  Então é criado/atualizado o lote-CEO "183/23" do produto "Gaze" com +4 unidades
  E é registrada Movimentação tipo "entrada" no CEO referenciando o pedido

Cenário: Expedição parcial
  Quando o almoxarife expede 3 (de 4 solicitados) com lote "183/23"
  Então o CEO recebe +3 unidades do lote "183/23"
  E o item do pedido fica "atendido parcial\""""),

    ("US-EP03-02", "EP03", "Listar estoque do CEO",
     "Como gestor CEO / solicitante CEO / gestor HO, eu quero ver o estoque do CEO com produto, qtd, status, para que eu acompanhe o que existe localmente.",
     "Must", 3, "RF04.2, RF04.4",
     """Cenário: Gestor CEO abre estoque
  Quando abro "Estoque CEO"
  Então vejo tabela com Produto, Categoria, Qtd, Mínimo, Status
  E os status usam as mesmas regras do HO (Crítico/Baixo/Vencendo/Vencido)

Cenário: Solicitante CEO em leitura
  Dado que sou "solicitante" do CEO
  Quando abro "Estoque CEO"
  Então tenho visualização de leitura (sem botões de edição)"""),

    ("US-EP03-03", "EP03", "Gestor do CEO registra consumo",
     "Como gestor CEO, eu quero abater quantidade do estoque local (consumo clínico), para que o saldo reflita a realidade.",
     "Must", 5, "RF04.7",
     """Cenário: Consumo válido
  Dado que existem 10 unidades de "Gaze" no CEO
  Quando registro consumo de 3 unidades, motivo="uso clínico"
  Então o saldo passa a 7
  E é gerada Movimentação tipo "consumo" no CEO

Cenário: Consumo maior que saldo
  Quando tento registrar consumo de 15 (com 10 em estoque)
  Então o sistema impede e sugere "Faça ajuste de inventário se a contagem física divergir.\""""),

    ("US-EP03-04", "EP03", "Gestor do CEO faz ajuste de inventário",
     "Como gestor CEO, eu quero fazer recontagem (saldo novo) com observação, para que divergências físicas sejam regularizadas.",
     "Could", 3, "RF04.8",
     """Cenário: Ajuste de inventário
  Dado que o saldo do sistema é 12 e a contagem física é 9
  Quando registro ajuste para 9 com observação "Recontagem do dia 14/05"
  Então o saldo passa a 9
  E é gerada Movimentação tipo "ajuste" com delta -3 e observação preservada"""),

    # ---------------- EP04 ----------------
    ("US-EP04-01", "EP04", "Solicitante cria pedido com múltiplos itens",
     "Como solicitante (CEO ou outro setor), eu quero criar um pedido com vários itens de uma vez, para que o fluxo digital substitua o e-mail.",
     "Must", 8, "RF05.1, RF05.2, RF05.3, RF05.14",
     """Cenário: Pedido válido com 3 itens
  Dado que sou "solicitante" do "CEO"
  Quando clico em "Novo Pedido"
  E adiciono item "Gaze" qtd 4, item "Luva P" qtd 2, item "Prilocaína" qtd 1
  E informo justificativa geral "Reposição semanal CEO"
  E clico em "Enviar Pedido"
  Então o pedido é criado com ID "PED-NNN"
  E o cabeçalho registra setor="CEO", solicitante, data
  E cada item entra como "pendente"

Cenário: Quantidade inválida em um item
  Quando informo qtd "0" em uma das linhas
  Então vejo "Quantidade deve ser >= 1" e o pedido NÃO é enviado

Cenário: Justificativa muito curta
  Quando a justificativa geral tem menos de 10 caracteres
  Então vejo "Justificativa deve ter pelo menos 10 caracteres.\""""),

    ("US-EP04-02", "EP04", "Linha livre (fora do catálogo)",
     "Como solicitante, eu quero adicionar uma linha de texto livre quando o item não está no catálogo, para que demandas novas não fiquem fora do fluxo.",
     "Must", 3, "RF05.15",
     """Cenário: Adicionar linha livre
  Quando clico em "+ Outro item (descrever)"
  E digito "Evidenciador de biofilme" e qtd "2"
  Então a linha entra no pedido marcada como "linha livre"
  E ao expedir, NÃO há baixa automática de estoque para esta linha

Cenário: Almoxarife converte linha livre em produto do catálogo
  Dado que existe linha livre "Evidenciador de biofilme"
  Quando o almoxarife clica em "Cadastrar no catálogo"
  Então abre o modal de cadastro pré-preenchido com o nome
  E após cadastrar, a linha vira item normal vinculado ao produto recém-criado"""),

    ("US-EP04-03", "EP04", "Pedir item indisponível (demanda represada)",
     "Como solicitante, eu quero poder pedir item que está atualmente em falta, para que a demanda fique registrada como pressão por reposição.",
     "Must", 3, "RF05.16, RN08 (invertida)",
     """Cenário: Pedido de item com 0 em estoque
  Dado que "Ácido Fluorídrico 5%" tem 0 no HO
  Quando adiciono este item ao pedido com qtd 3
  Então o sistema exibe alerta: "Este item está em falta. O pedido ficará como Aguardando Reposição."
  E confirmando, o item entra com status "aguardando_reposicao"

Cenário: Pedido inteiro com itens disponíveis e indisponíveis
  Quando o pedido tem 3 itens disponíveis e 1 indisponível
  Então o pedido nasce com status agregado "pendente"
  E o item indisponível aparece destacado como "aguardando reposição\""""),

    ("US-EP04-04", "EP04", "Almoxarife processa pedido item-a-item",
     "Como almoxarife/gestor HO, eu quero processar cada item do pedido (integral, parcial, em falta), para que o sistema reflita a realidade da separação física.",
     "Must", 8, "RF05.4, RF05.5, RF05.6, RF05.13",
     """Cenário: Atendimento integral
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
  Então o item fica status="nao_atendido" e é exigido motivo da divergência

Cenário: Status do pedido é derivado
  Dado pedido com 3 itens: 2 integral, 1 parcial
  Então status do pedido = "atendido_parcial"

Cenário: Sugestão FEFO ao escolher lote
  Quando seleciono o produto "Ácido Fosfórico 37%"
  Então a lista de lotes oferece primeiro o de validade mais próxima (FEFO)
  E lotes vencidos NÃO aparecem
  E lotes segregados NÃO aparecem"""),

    ("US-EP04-05", "EP04", "Desdobrar item em múltiplos lotes",
     "Como almoxarife, eu quero desdobrar uma linha do pedido em entregas de lotes diferentes, para que cenários como \"1 unidade do lote A + 1 do lote B\" sejam registráveis.",
     "Must", 5, "RF05.17",
     """Cenário: Desdobrar
  Dado item do pedido "Godiva bastão qtd 2"
  Quando clico em "+ Desdobrar em lotes"
  E informo: 1 unidade lote "1908191" + 1 unidade lote "2110191"
  Então a linha vira 2 sub-entregas, cada uma com seu lote
  E ambas geram Movimentação de saída no HO e entrada no CEO"""),

    ("US-EP04-06", "EP04", "Visão por abas",
     "Como usuário, eu quero filtrar pedidos por status em abas, para que eu foque no que importa.",
     "Must", 3, "RF05.7",
     """Cenário: Contadores por aba
  Dado que existem 3 pendentes, 2 em processamento, 5 concluídos, 1 aguardando reposição
  Quando abro "Pedidos"
  Então vejo abas com contadores: Pendentes (3), Em Processamento (2), Concluídos (5), Aguardando Reposição (1), Todos (11)"""),

    ("US-EP04-07", "EP04", "Notificação por e-mail ao criar pedido (ponte de migração)",
     "Como PO, eu quero que cada pedido criado dispare um e-mail para o almoxarifado, para que o hábito do e-mail seja preservado como apoio durante a migração.",
     "Should", 5, "RF06.6b",
     """Cenário: E-mail enviado ao criar pedido
  Quando solicitante envia um pedido novo
  Então o sistema envia e-mail para o endereço institucional do almoxarifado
  E o e-mail contém: ID do pedido, setor, solicitante, lista de itens com qtd
  E o e-mail NÃO substitui a fonte de verdade (sistema)"""),

    ("US-EP04-08", "EP04", "Visibilidade de pedidos por perfil",
     "Como PO, eu quero que cada perfil veja só os pedidos que lhe cabem, para que as listas façam sentido.",
     "Must", 3, "RF05.8, RF05.9, RF05.10",
     """Cenário: Solicitante CEO
  Quando abro "Pedidos"
  Então vejo apenas pedidos do setor "CEO"

Cenário: Gestor CEO
  Quando abro "Pedidos"
  Então vejo apenas pedidos do setor "CEO" (criados por qualquer solicitante do CEO)

Cenário: Almoxarife / Gestor HO
  Quando abro "Pedidos"
  Então vejo pedidos de TODOS os setores"""),

    # ---------------- EP05 ----------------
    ("US-EP05-01", "EP05", "KPIs por perfil",
     "Como usuário, eu quero ver KPIs no topo do dashboard, para que eu entenda o estado em segundos.",
     "Must", 5, "RF02.1, RF02.5",
     """Cenário: KPIs Gestor HO
  Então vejo: Total de Produtos no catálogo, Lotes Vencendo (<=60d), Produtos Críticos, Pedidos Pendentes, Itens em Demanda Represada

Cenário: KPIs Gestor CEO
  Então vejo: Itens no estoque CEO, Itens Críticos no CEO, Pedidos enviados pendentes, Pedidos aguardando reposição

Cenário: KPIs Almoxarife
  Então vejo: Pedidos Pendentes, Lotes Vencendo (<=30d), Produtos Críticos, Demanda Represada

Cenário: KPI atualiza em tempo real
  Dado KPI "Pendentes" = 5
  Quando processo um pedido (todos os itens atendidos)
  Então o KPI passa a 4 sem reload"""),

    ("US-EP05-02", "EP05", "Gráfico de consumo mensal por setor",
     "Como gestor HO, eu quero ver consumo mensal por setor destinatário, para que eu negocie reposição com dados.",
     "Should", 5, "RF02.2",
     """Cenário: Gráfico com setores
  Quando abro o Dashboard como gestor HO
  Então vejo gráfico de barras com eixo X = meses (últimos 6) e barras por setor (CEO, CME, Laboratórios, Dispensação interna)"""),

    ("US-EP05-03", "EP05", "Listas de vencendo e crítico",
     "Como gestor/almoxarife, eu quero ver listas de itens vencendo e críticos, para que eu atue rapidamente.",
     "Should", 3, "RF02.2, RF02.3",
     """Cenário: Lista de vencimento (HO)
  Quando abro o dashboard
  Então vejo "Lotes vencendo nos próximos 30 dias", ordenados do mais próximo

Cenário: Lista de crítico (HO)
  Então vejo "Produtos críticos" (Qtd total <= estoque mínimo)"""),

    ("US-EP05-04", "EP05", "Fila de pedidos pendentes (almoxarife)",
     "Como almoxarife, eu quero ver pedidos pendentes diretamente no dashboard, para que eu comece o turno com a fila visível.",
     "Must", 5, "RF02.3",
     """Cenário: Fila com badge
  Dado 5 pedidos pendentes
  Quando entro como "almoxarife"
  Então vejo "Fila de Pedidos Pendentes" com badge "5"
  E posso entrar em cada um para processar"""),

    ("US-EP05-05", "EP05", "Log de movimentações",
     "Como gestor, eu quero ver últimas movimentações (entrada, saída, ajuste, consumo, segregação), para que eu acompanhe o pulso operacional.",
     "Should", 3, "RF06.4",
     """Cenário: Log filtrável
  Quando abro o Dashboard como gestor HO
  Então vejo "Últimas Movimentações" com até 10 entradas
  E posso filtrar por tipo (entrada, saída, ajuste, consumo, segregação)"""),

    ("US-EP05-06", "EP05", "Demanda represada",
     "Como gestor HO, eu quero ver os itens com mais pedidos \"aguardando reposição\", para que eu use isso como argumento para compras.",
     "Must", 3, "RF06.7",
     """Cenário: Top itens de demanda represada
  Quando abro o Dashboard como gestor HO
  Então vejo "Demanda represada (top 10)" com produto, qtd_solicitada_total, número de pedidos, setores envolvidos"""),

    # ---------------- EP06 ----------------
    ("US-EP06-01", "EP06", "Identidade UFPE aplicada",
     "Como PO, eu quero que toda a interface respeite a marca UFPE.",
     "Must", 3, "RNF01.1",
     """Cenário: Cor primária
  Então a cor primária é "#990000" em botões, badges, tabs e headers"""),

    ("US-EP06-02", "EP06", "Layout responsivo",
     "Como usuário em tablet, eu quero o layout adaptado.",
     "Could", 5, "RNF01.2, RNF05.3",
     """Cenário: Tablet retrato (>=768px)
  Então a sidebar permanece visível e tabelas têm rolagem horizontal sem quebra

Cenário: Mobile (<768px)
  Então o conteúdo é navegável (algumas colunas podem ser ocultadas)"""),

    # ---------------- EP07 ----------------
    ("US-EP07-01", "EP07", "Estado calculado do lote por validade",
     "Como PO, eu quero que o estado de um lote seja calculado em relação à data atual, para que alertas sejam precisos.",
     "Must", 3, "RF06.2",
     """Cenário: Lote vencendo em 30 dias
  Dado que hoje é 14/05/2026 e um lote vence em 10/06/2026
  Então o lote aparece com status "Vencendo (<=30d)"

Cenário: Lote vencido
  Dado validade no passado
  Então o lote aparece como "Vencido"

Cenário: Vencido bloqueia expedição
  Quando o almoxarife escolhe lote para expedir
  Então lotes vencidos não aparecem na seleção"""),

    ("US-EP07-02", "EP07", "Segregar lote vencido",
     "Como almoxarife/gestor HO, eu quero segregar um lote vencido em um clique, para que ele saia do estoque ativo e fique na \"sala de biossegurança\".",
     "Must", 5, "RF06.8",
     """Cenário: Segregar
  Dado um lote com status "Vencido"
  Quando clico em "Segregar"
  Então o lote passa a estado "segregado"
  E é gerada Movimentação tipo "segregação" com responsável, data e qtd
  E o lote some da visão de "Estoque" e aparece em "Lotes segregados"

Cenário: Filtragem padrão
  Quando vejo a tabela "Estoque HO"
  Então lotes segregados não aparecem
  E há um link/aba para "Lotes segregados (N)\""""),

    ("US-EP07-03", "EP07", "Alerta de reposição para demanda represada",
     "Como almoxarife, eu quero ser alertado quando chega um lote novo de produto com pedidos aguardando_reposicao, para que eu atenda a fila represada.",
     "Should", 5, "RF06.9",
     """Cenário: Lote novo de produto represado
  Dado que existem 3 pedidos "aguardando_reposicao" do produto "Ácido Fluorídrico 5%"
  Quando o almoxarife cadastra um lote novo deste produto
  Então o sistema exibe alerta: "3 pedidos aguardando este produto — abrir fila represada?"
  E ao clicar, o almoxarife vai para a lista filtrada dos pedidos represados deste produto

Cenário: Pedido represado pode ser processado
  Quando entro num pedido em "aguardando_reposicao"
  E há lote ativo do produto agora
  Então posso processar o item normalmente (integral / parcial)"""),
]
