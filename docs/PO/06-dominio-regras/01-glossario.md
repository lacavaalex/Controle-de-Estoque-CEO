# Glossário — Linguagem Ubíqua

**Documento:** 01-glossario
**Última atualização:** 07/05/2026

---

Este glossário define o vocabulário do domínio. **Use exatamente estes termos** em código, telas, mensagens, commits, PRs, tickets e conversas com stakeholders. Sinônimos não são bem-vindos.

---

## Atores e perfis

| Termo | Definição | Sinônimos a evitar |
|-------|-----------|--------------------|
| **Hospital Odontológico UFPE** | Instituição de saúde do Departamento de Odontologia da UFPE. Abriga Dispensação e diversos subdepartamentos clínicos. | "HUO", "HO" (não usar) |
| **Dispensação** | Unidade central de almoxarifado do hospital. Recebe materiais de fornecedores e os redistribui aos subdepartamentos. | "Almoxarifado central" |
| **CEO (Centro de Especialidades Odontológicas)** | Subdepartamento clínico do hospital, piloto deste sistema. Consome materiais via solicitação à Dispensação. | "Especialidades", "Clínica" |
| **Subdepartamento** | Unidade clínica do hospital que consome materiais (CEO, Endodontia, Cirurgia etc.). | "Unidade clínica" |
| **Gestão** | Perfil de usuário; coordenação administrativa. No protótipo, role `gestao`. | "Coordenação" (no contexto de UI usar "Gestão") |
| **Almoxarife** | Perfil de usuário; operador da Dispensação. Role `almoxarife`. | — |
| **Dentista CEO** | Perfil de usuário; profissional clínico que consome material. Role `dentista`. | "Profissional", "Usuário clínico" |

## Conceitos do domínio

| Termo | Definição |
|-------|-----------|
| **Item** | Material consumível registrado no estoque (ex.: Luvas Descartáveis M, Resina Composta A2). Pertence a uma **categoria**. |
| **Categoria** | Classificação do item. Conjunto fechado: EPI, Anestésico, Material Restaurador, Instrumentais, Higienização, Material Cirúrgico, Outros. |
| **Lote** | Identificador do conjunto de produção do item (ex.: `LT-2025-010`). Importante para rastreabilidade de validade e recall. |
| **Unidade** | Unidade de medida do item (caixa, tubo, seringa, kit, pacote, rolo, unidade, frasco, bastão, folha, par). |
| **Estoque mínimo** | Quantidade abaixo da qual o item entra em estado **Crítico**. |
| **Estoque máximo** | Quantidade-teto de referência. Quantidades ≥ 95% deste valor entram em estado **Excessivo**. |
| **Validade** | Data limite de uso seguro do item (data ISO `YYYY-MM-DD`). |
| **Localização** | Texto livre indicando onde o item está fisicamente (ex.: "Prateleira A-1", "Armário B-2"). |
| **Fornecedor** | Empresa que entregou o lote (ex.: DistribMed Ltda, 3M ESPE). |
| **Estoque da Dispensação** | Conjunto completo de itens armazenados na Dispensação. |
| **Estoque do CEO** | Subconjunto de itens disponíveis no subdepartamento CEO, com quantidades menores e mínimo próprio. |

## Estados de um item

| Status (Dispensação) | Quando aplica |
|----------------------|---------------|
| **Normal** | Quantidade saudável, nenhum alerta ativo. |
| **Baixo** | Quantidade entre o mínimo e 1,5× o mínimo. |
| **Crítico** | Quantidade ≤ estoque mínimo. |
| **Atenção** | Item vencendo entre 31 e 60 dias. |
| **Vencendo** | Item vencendo em ≤ 30 dias. |
| **Vencido** | Data de validade já passou. |
| **Excessivo** | Quantidade ≥ 95% do estoque máximo. |

| Status (CEO) | Quando aplica |
|--------------|---------------|
| **Disponível** | Quantidade saudável. |
| **Baixo** | Quantidade entre o mínimo e 2× o mínimo. |
| **Crítico** | Quantidade ≤ estoque mínimo (e > 0). |
| **Indisponível** | Quantidade = 0. |

## Solicitações

| Termo | Definição |
|-------|-----------|
| **Solicitação** | Pedido formal de material feito por um Dentista CEO ao Almoxarife. ID no formato `SOL-NNN`. |
| **Justificativa** | Texto livre que o dentista escreve ao criar a solicitação. Mínimo 10 caracteres. |
| **Status da solicitação** | Pendente · Aprovada · Negada. |
| **Pendente** | Solicitação criada, aguardando decisão do almoxarife. |
| **Aprovada** | Solicitação resolvida positivamente; gera saída do estoque da Dispensação. |
| **Negada** | Solicitação recusada com observação opcional do almoxarife. |
| **Observação (de negação)** | Texto livre explicando o motivo da negação. |
| **Responsável** | Usuário (almoxarife) que tomou a decisão de aprovar ou negar. |
| **Data de conclusão** | Data em que a solicitação saiu do estado pendente. |

## Movimentações

| Termo | Definição |
|-------|-----------|
| **Movimentação** | Registro de qualquer alteração física do estoque. ID no formato `MOV-NNN`. |
| **Entrada** | Movimentação de chegada de material (ex.: recebimento de fornecedor). |
| **Saída** | Movimentação de retirada de material (ex.: atendimento de uma solicitação). |
| **Ajuste** | Correção manual de quantidade (positiva ou negativa) sem origem em solicitação ou compra (ex.: contagem física, perda, descarte). |
| **Origem** | De onde o material veio (Fornecedor, Dispensação, CEO). |
| **Destino** | Para onde foi (Dispensação, CEO). |

## Métricas e UI

| Termo | Definição |
|-------|-----------|
| **KPI** | Indicador-chave numérico exibido no dashboard. |
| **Badge** | Pequena etiqueta colorida indicando status (Crítico, Vencendo, Pendente etc.). |
| **Card** | Bloco visual usado para exibir um item do estoque CEO no dashboard do dentista. |
| **Aba** | Filtro horizontal de status na tela de Solicitações (Pendentes, Aprovadas, Negadas, Todas). |
| **Sidebar** | Barra lateral de navegação (esquerda). |
| **Topbar** | Barra superior do app (acima do conteúdo). |

## Termos a evitar

| Não usar | Use |
|----------|-----|
| "Almoxarifado" | **Dispensação** |
| "Pedido" | **Solicitação** |
| "Liberar/Atender" para uma solicitação | **Aprovar** |
| "Recusar/Rejeitar" | **Negar** |
| "Setor" | **Subdepartamento** ou nome próprio (CEO) |
| "Login feito com SSO" | (não há SSO no MVP) |
| "Cliente" | **Dentista** ou **Solicitante** |
