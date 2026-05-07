# Métricas de Sucesso (KPIs)

**Documento:** 02-metricas-de-sucesso
**Última atualização:** 07/05/2026

---

## 1. North Star Metric

> **Taxa de adoção do canal digital de solicitações:**
>
> `% solicitações = (Solicitações registradas no sistema / Solicitações totais estimadas) × 100`
>
> Calculada por **mês** durante o piloto.
>
> **Meta no fim de 90 dias:** ≥ **80%**.

Por que esta é a métrica-norte: ela só sobe se **todos os atores** participam — dentistas registrando, almoxarife reagindo, gestão cobrando. Se cair, mostra que o canal informal (verbal, WhatsApp) ainda predomina e o produto perdeu valor.

## 2. KPIs primários

| ID | KPI | Definição | Meta no piloto | Frequência | Fonte |
|----|-----|-----------|----------------|------------|-------|
| K1 | **Tempo médio de resposta a solicitação** | Mediana de horas úteis entre `dataSolicitacao` e `dataConclusao` para solicitações resolvidas | ≤ **24h úteis** | Semanal | Banco de solicitações |
| K2 | **Taxa de aprovação no primeiro turno** | Solicitações aprovadas / Solicitações resolvidas | ≥ **80%** | Semanal | Banco de solicitações |
| K3 | **Itens descartados por vencimento por mês** | Contagem manual reportada pela Dispensação | Redução ≥ **50%** vs. baseline | Mensal | Reporte do almoxarife |
| K4 | **NPS interno por perfil** | "Você recomendaria este sistema para um colega?" 0–10, segregado por role | ≥ **+30** | A cada 30 dias | Pesquisa Forms |
| K5 | **DAU / WAU efetivos** | Usuários distintos com pelo menos 1 sessão ativa | DAU ≥ 60% dos usuários ativos esperados | Diária | Logs de sessão |

## 3. KPIs operacionais

| ID | KPI | Definição | Meta | Frequência |
|----|-----|-----------|------|-----------|
| OP1 | **# itens em estado Crítico** | Itens com `qtd ≤ mínimo` na Dispensação | < 10% do catálogo | Diária |
| OP2 | **# itens em estado Vencendo (≤ 30d)** | Itens vencendo no próximo mês | Tendência decrescente | Semanal |
| OP3 | **# solicitações Pendentes em fim de dia** | Pendentes ainda não resolvidas ao final do expediente | 0 ao fim do turno do almoxarife | Diária |
| OP4 | **# Movimentações registradas / dia** | Volume de entradas + saídas + ajustes | Tendência crescente nos primeiros 30 dias (curva de adoção) | Diária |

## 4. KPIs de qualidade do produto

| ID | KPI | Definição | Meta |
|----|-----|-----------|------|
| Q1 | **Disponibilidade (uptime)** | % do tempo em que o sistema responde corretamente | ≥ 98% (hor. 8h–20h) |
| Q2 | **Tempo de carregamento da home** | LCP em conexão 10 Mbps | ≤ 2s |
| Q3 | **Erros JavaScript em produção** | Quantidade de erros não tratados por sessão | ≤ 0,1 por sessão |
| Q4 | **Issues abertas críticas** | Bugs com severidade alta | 0 ao final de cada sprint |

## 5. Comparativo Antes × Depois (baseline)

| Indicador | Estado atual (As-Is) | Meta (To-Be, fim do piloto) |
|-----------|---------------------|----------------------------|
| Tempo médio de resposta | 2 a 5 dias úteis | ≤ 24h úteis (K1) |
| % solicitações com registro | < 30% | ≥ 80% (NSM) |
| Itens descartados / mês | 8 a 15 | ≤ 4 a 7 (redução ≥ 50%) (K3) |
| Geração de relatório de consumo mensal | > 1 dia (manual) | < 1 minuto (em tela) |
| Auditoria de quem aprovou | Inexistente | 100% das decisões com registro |

## 6. Como instrumentar

- **Sessões:** captar `userId`, `loginTime`, `logoutTime` no backend (fase de produção).
- **Solicitações:** já há campos `dataSolicitacao` e `dataConclusao` — basta calcular delta.
- **Movimentações:** mesmo princípio; agregar por dia no backend.
- **Itens descartados:** registrar manualmente (planilha) durante o piloto. Em fase 2, criar entidade "Descarte".
- **NPS:** Google Forms anônimo enviado por e-mail aos 3 perfis a cada 30 dias.

## 7. Dashboard executivo (sugestão de tela futura)

Em fase 2, criar uma página `/relatorios` (somente Gestão) com:
- Cartões: K1, K2, K3, K5 com valor atual e seta de tendência (mês a mês).
- Linha do tempo: % solicitações registradas (NSM) por semana.
- Heatmap: solicitações por dia × hora (entender pico do almoxarife).
- Lista: top 10 itens com maior consumo no mês.

> Fora do MVP — depende da fase 2 / R1.1.
