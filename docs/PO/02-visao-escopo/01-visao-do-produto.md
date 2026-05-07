# Visão do Produto — CEO Estoque UFPE

**Documento:** 01-visao-do-produto
**Última atualização:** 07/05/2026

---

## 1. Statement de visão 

> **Para** a equipe do Hospital Odontológico da UFPE — em especial o almoxarifado central (Dispensação) e o Centro de Especialidades Odontológicas (CEO) —
> **que** sofre com falta de visibilidade de estoque, perdas por vencimento e solicitações sem rastreabilidade,
> o **CEO Estoque UFPE** será um **sistema web de controle de estoque e fluxo de solicitações internas**
> **que** centraliza o estoque da Dispensação e dos subdepartamentos, automatiza alertas de vencimento e estoque crítico, e formaliza a comunicação entre dentistas e almoxarife.
> **Diferentemente** de planilhas Excel descentralizadas, nosso produto **oferece visibilidade em tempo real, papéis bem definidos por perfil (Gestão, Almoxarife, Dentista) e auditoria completa de toda movimentação.**

## 2. Product Vision Board

| Bloco | Conteúdo |
|-------|----------|
| **Visão** | Eliminar perdas por vencimento e dar previsibilidade total ao consumo de materiais odontológicos no Hospital Odontológico da UFPE. |
| **Grupo-alvo (piloto)** | Coordenação, almoxarife e dentistas do CEO. |
| **Necessidades atendidas** | Saber em tempo real o que existe; pedir material sem fricção; ter alerta antes do vencimento; auditar quem aprovou/negou cada pedido. |
| **Produto** | Sistema web responsivo (desktop e tablet), com login institucional, três dashboards diferentes por perfil, gestão de estoque, fluxo de solicitação e log auditável. |
| **Objetivos de negócio** | Reduzir perdas por vencimento ≥ 50%; reduzir tempo médio de resposta a solicitação para ≤ 24h úteis; aumentar a % de solicitações com registro formal para ≥ 80%. |
| **Concorrência** | Sistemas de ERP comerciais (SAP, TOTVS) — genéricos, complexos, fora do orçamento e excessivos para o piloto; planilhas — barato, mas sem rastreabilidade. |
| **Diferencial** | Feito sob medida para o vocabulário e o fluxo do hospital odontológico (Dispensação ↔ CEO), com identidade UFPE e curva de aprendizado mínima. |

## 3. Princípios do produto

1. **Clareza acima de funcionalidade.** Um almoxarife com pressa precisa entender a tela em 3 segundos.
2. **Diferenciação clara entre os dois estoques.** Dispensação ≠ CEO, sempre. Nunca confunda visualmente o que é um e o que é outro.
3. **Controle de acesso por perfil é inegociável.** Cada um vê só o que deve ver e pode fazer só o que pode fazer.
4. **Identidade visual UFPE.** Bordô institucional `#990000` é a marca; o produto deve parecer "da UFPE".
5. **Caminho feliz primeiro.** Antes de tratar todos os edge cases, garanta que o fluxo principal (solicitar → aprovar → atender) seja impecável.
6. **Auditável por padrão.** Toda decisão (aprovar, negar, ajustar) deixa registro de quem, quando e por quê.
7. **Pronto para crescer.** A arquitetura precisa permitir adicionar novos subdepartamentos sem reescrita.

## 4. Posicionamento (Geoffrey Moore)

> **Para** coordenadores e operadores de estoque do Hospital Odontológico da UFPE
> **que** precisam controlar materiais clínicos com rastreabilidade e baixa perda por vencimento,
> o **CEO Estoque UFPE** é um **sistema web de gestão interna de estoque e solicitações**
> **que** torna visível, em tempo real, o estoque da Dispensação e dos subdepartamentos, com alertas automáticos e auditoria completa.
> **Diferentemente** de soluções genéricas de ERP ou de planilhas isoladas, ele é desenhado para o vocabulário e o fluxo do hospital, com curva de aprendizado mínima e zero custo de licenciamento.

## 5. Indicadores-chave (North Star + KPIs)

- **North Star Metric:** **Solicitações registradas no sistema / Solicitações totais (estimadas)** — mede a real adoção do canal digital.
- **KPI 1:** Tempo médio de resposta a solicitação (≤ 24h úteis).
- **KPI 2:** Itens descartados por vencimento por mês (redução ≥ 50%).
- **KPI 3:** Taxa de solicitações aprovadas no primeiro turno (≥ 80%).
- **KPI 4:** NPS interno por perfil (≥ +30).

> Definições completas em [07-roadmap-metricas/02-metricas-de-sucesso.md](../07-roadmap-metricas/02-metricas-de-sucesso.md).
