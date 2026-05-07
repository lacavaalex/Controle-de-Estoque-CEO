# Discovery — Contexto e Problema

**Documento:** 01-contexto-e-problema
**Última atualização:** 07/05/2026
**Status:** Validado

---

## 1. Contexto institucional

A Universidade Federal de Pernambuco (UFPE) opera, junto ao Departamento de Odontologia, um **Hospital Odontológico** que presta atendimento ao público e serve de campo de prática para alunos de graduação, pós-graduação e residência. Sua estrutura logística central é a **Unidade de Dispensação** (Almoxarifado Central), que recebe os materiais dos fornecedores e os redistribui para todos os subdepartamentos clínicos do hospital.

Entre esses subdepartamentos, o **Centro de Especialidades Odontológicas (CEO)** funciona como uma das unidades clínicas de maior demanda, com atendimentos em endodontia, periodontia, prótese, cirurgia oral menor, estomatologia e atendimento a pacientes com necessidades especiais. O CEO é o **subdepartamento piloto** desta primeira fase do produto.

```
┌──────────────────────────────────────────────────────────┐
│                  Hospital Odontológico UFPE              │
│                                                          │
│  ┌────────────────────────┐                              │
│  │ Unidade de Dispensação │ ◀── Fornecedores            │
│  │  (Almoxarifado central)│                              │
│  └─────────┬──────────────┘                              │
│            │                                             │
│            ├─▶ CEO (piloto)         ◀── usuários do MVP │
│            ├─▶ Endodontia                                │
│            ├─▶ Cirurgia                                  │
│            ├─▶ Outros subdepartamentos                   │
│            └─▶ ...                                       │
└──────────────────────────────────────────────────────────┘
```

## 2. Problema central

> **Hoje, o controle do estoque da unidade de dispensação é feito por planilhas Excel, sem integração entre a Dispensação e os subdepartamentos. Isso gera divergências entre o que está registrado e o que está fisicamente disponível, falta de rastreabilidade do consumo, perda de itens por vencimento e atrasos no atendimento clínico quando faltam materiais críticos.**

### 2.1 Sintomas observados

| # | Sintoma | Impacto |
|---|---------|---------|
| S1 | Itens vencendo sem alerta prévio para o almoxarifado | Descarte de material e custo desperdiçado |
| S2 | Solicitações dos dentistas feitas verbalmente ou em papel | Falta de rastreabilidade, esquecimentos, retrabalho |
| S3 | Quantidade real vs. registrada divergem com frequência | Atendimento clínico atrasa por falta material que "deveria existir" |
| S4 | Gestão sem visibilidade de consumo histórico | Reposição com fornecedor é decidida por intuição |
| S5 | Não há diferenciação clara entre estoque da Dispensação e estoque do CEO | Solicitações redundantes, dificuldade em saber o que está com quem |
| S6 | Aprovação/negação de pedidos sem registro formal | Conflitos sem possibilidade de auditoria |

## 3. Oportunidade

Implementar um **sistema digital de controle de estoque com fluxo de solicitação interna** entre a Dispensação e o CEO, com:

- visibilidade em tempo real do que está disponível em cada local;
- alertas automáticos de estoque crítico e vencimento;
- registro auditável de toda movimentação e decisão;
- experiência adequada a três perfis distintos (Gestão, Almoxarife, Dentista).

A escolha do CEO como piloto reduz risco e permite validar a solução antes de expandir para os demais subdepartamentos.

## 4. Premissas

- **PR01.** O CEO atua exclusivamente como **consumidor** do estoque da Dispensação no MVP — não recebe material direto de fornecedores.
- **PR02.** A Dispensação continua recebendo material via processos de compra atuais; o sistema **não** automatiza compras com fornecedores nesta versão.
- **PR03.** Há infraestrutura mínima de internet e dispositivos (computadores ou tablets) na Dispensação e no CEO para uso do sistema web.
- **PR04.** Cada usuário possui e-mail institucional `@ufpe.br` que será usado como identificador.
- **PR05.** O conjunto inicial de categorias (EPI, Anestésico, Material Restaurador, Instrumentais, Higienização, Material Cirúrgico, Outros) cobre o universo de materiais relevantes para o piloto.
- **PR06.** Em caso de divergência entre o registrado e o físico, prevalece sempre o **estoque físico**, com registro de ajuste manual no sistema.

## 5. Restrições

- **RT01.** O escopo do MVP precisa caber no período da disciplina. Evitar over engeneering.
- **RT02.** Não há orçamento para infraestrutura paga;
- **RT03.** A identidade visual deve respeitar a marca UFPE (bordô institucional `#990000`).
- **RT04.** Dados clínicos sensíveis (prontuários, dados de pacientes) **não fazem parte** do escopo deste sistema.

## 6. Hipóteses a validar no piloto

| ID | Hipótese | Como validar |
|----|----------|--------------|
| H1 | Dentistas vão preferir um botão "Solicitar Item" em uma tela visual a um pedido verbal | Comparar volume de solicitações registradas vs. estimativa anterior em papel |
| H2 | Almoxarife responde solicitações em até 24h se vê uma "fila" clara de pendentes | Medir tempo médio de resposta a solicitações |
| H3 | Alertas de vencimento reduzem perda de material em > 50% no piloto | Comparar quantidade descartada por vencimento antes/depois |
| H4 | Gestão tomará decisões de compra mais embasadas com gráfico de consumo mensal | Entrevista qualitativa com a coordenação após 60 dias de uso |

## 7. Definição de sucesso para o piloto

O piloto no CEO será considerado um sucesso se, após **45 dias de uso**, atingir simultaneamente:

- ≥ **80%** das solicitações entre CEO e Dispensação registradas pelo sistema (vs. canais informais).
- **Tempo médio de resposta a solicitação** ≤ **24h úteis**.
- **Redução ≥ 30%** em itens descartados por vencimento.
- **NPS interno** dos três perfis ≥ **+30**.

Atingidos os critérios, a solução é aprovada para expansão aos demais subdepartamentos.
