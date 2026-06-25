# Personas

**Documento:** 01-personas
**Última atualização:** 07/05/2026

---

## Visão geral

O sistema atende **três perfis** de usuário, cada um com escopo de ação distinto e dores próprias. Toda funcionalidade do produto deve ser justificada por ao menos uma das três personas abaixo.

| Perfil técnico | Persona representativa | Cargo |
|----------------|-----------------------|-------|
| `gestao` | Dra. Silvia | Coordenadora de Gestão da Diretoria CEO — UFPE |
| `almoxarife` | Carlos Prates | Almoxarife da Unidade de Dispensação |
| `dentista` | Dr. Alex Pereira | Cirurgião-Dentista — CEO Endodontia |

---

## Persona 1 — Dra. Ana Beatriz Costa (Gestão)

```
┌───────────────────────────────────────────────────────────────┐
│  RR   Dra. Renata                                             │
│       Coordenadora de Gestão · 52 anos                        │
│       Diretoria CEO — UFPE                                    │
└───────────────────────────────────────────────────────────────┘
```

### Quem é
Atua na coordenação administrativa do CEO. Faz a interface entre a operação clínica, a Dispensação e a direção do hospital. Reporta-se à diretoria do hospital odontológico.

### Objetivos
- Garantir que o CEO tenha material para atender a demanda clínica.
- Reduzir custo operacional (perdas, compras emergenciais, divergências).
- Apresentar dados confiáveis em reuniões de planejamento e prestação de contas.
- Tomar decisões de reposição com base em consumo histórico, não em "achismo".

### Frustrações
- Pedir um relatório de consumo demora dias e ele "não bate" entre as fontes.
- Surpresas com itens vencidos descobertos só no descarte.
- Conflitos entre dentistas e almoxarife sem registro do que foi pedido/aprovado.

### Comportamento digital
- Usa computador desktop institucional. Familiaridade média com ferramentas administrativas.
- Aprecia gráficos e visões consolidadas mais do que listas detalhadas.
- Lê em desktop; pode usar em celular.

### Cenário típico
> Toda primeira segunda-feira do mês, Renata abre o sistema antes da reunião com a diretoria para pegar três números: total de itens críticos, consumo de Dispensação vs. CEO no mês, e quantas solicitações foram resolvidas no prazo.

### O que esta persona precisa do produto (top 5)
1. KPIs consolidados acessíveis em um clique.
2. Gráfico de consumo mensal por unidade (Dispensação vs. CEO).
3. Lista clara dos itens vencendo nos próximos 60 dias.
4. Visão histórica de solicitações (para auditoria).
5. Confiança de que o que ela mostra na reunião é verdade.

---

## Persona 2 — Carlos Prates (Almoxarife)

```
┌───────────────────────────────────────────────────────────────┐
│  CP   Carlos Prates                                           │
│       Almoxarife · 32 anos                                    │
│       Unidade de Dispensação — UFPE                           │
└───────────────────────────────────────────────────────────────┘
```

### Quem é
Trabalha há mais de 10 anos na Dispensação. Conhece todo material de cabeça, sabe qual lote está em qual prateleira. É responsável por receber dos fornecedores, organizar o estoque e atender as solicitações de cada subdepartamento.

### Objetivos
- Não deixar nenhum dentista parado por falta de material.
- Não desperdiçar item por vencimento.
- Ter o registro do que entrou, saiu e foi ajustado — para se proteger em auditoria.
- Atender as solicitações no menor número de cliques possível.

### Frustrações
- Receber 3 pedidos verbais ao mesmo tempo e tentar lembrar de todos.
- Dupla digitação: anotar no caderno e depois lançar no Excel.
- Ter que justificar movimentações sem registro formal.

### Comportamento digital
- Usa um desktop fixo na Dispensação durante o turno.
- Quando está organizando o estoque físico, prefere um tablet.
- Tolerância **zero** a fricção: se a tarefa demorar mais de 30 segundos, ele cai pro caderno.

### Cenário típico
> Em uma manhã de segunda, João abre o sistema, vê 5 solicitações pendentes, separa fisicamente os itens e clica "Aprovar" em cada uma. Em 10 minutos resolveu o que antes levava o dia inteiro.

### O que esta persona precisa do produto (top 5)
1. Fila de pendentes visível assim que entra no sistema.
2. Botões "Aprovar" e "Negar" sem pop-ups longos.
3. Cadastro de novo item com poucos campos obrigatórios.
4. Filtros rápidos no estoque (busca por nome ou lote).
5. Status colorido — entender o estado de uma linha sem ler números.

---

## Persona 3 — Dr. Rafael Henrique Moura (Dentista CEO)

```
┌───────────────────────────────────────────────────────────────┐
│  AP   Dr. Alex Pereira                                        │
│       Cirurgião-Dentista · 38 anos                            │
│       CEO — Endodontia                                        │
└───────────────────────────────────────────────────────────────┘
```

### Quem é
Especialista em endodontia, atende em média 6 pacientes por dia no CEO. Entre uma consulta e outra, tem ~5 minutos livres. Precisa de processos rápidos para não comprometer o atendimento.

### Objetivos
- Ter material disponível na hora do atendimento.
- Solicitar reposição com o menor esforço possível.
- Saber se o pedido foi atendido (ou não) sem precisar perguntar.

### Frustrações
- Iniciar atendimento e descobrir que faltou material.
- Pedidos verbais que somem.
- Sentir-se um "burocrata" no meio do dia clínico.

### Comportamento digital
- Acessa o sistema rapidamente entre consultas, geralmente do tablet do consultório.
- Quer telas leves e claras; não tem paciência para muita informação.

### Cenário típico
> Dr. Alex Pereira termina um canal, percebe que faltam só 2 frascos de Hipoclorito. Abre o sistema no tablet, abre o card do item, clica "Solicitar Item", informa quantidade 5 e justificativa "Atendimentos da semana de endodontia", envia. Em segundos.

### O que esta persona precisa do produto (top 5)
1. Cards visuais do estoque do CEO com status colorido.
2. Botão "Solicitar Item" direto no card (sem ir a outra tela).
3. Aba "Minhas Solicitações" para acompanhar o status.
4. Indicação clara quando o pedido for negado e por quê.
5. Não enxergar a operação interna da Dispensação (rota oculta).
