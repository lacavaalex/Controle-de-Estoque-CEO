# Roadmap

**Documento:** 01-roadmap
**Última atualização:** 07/05/2026

---

## 1. Linha do tempo (visão alto nível)

### Sequenciamento de sprints do MVP (revisão 01/06/2026)

6 sprints back-to-back de ~3 dias, **02/06 → 19/06/2026** (runway de 17 dias, "meta — provavelmente não bate exato"), no board **37 ("quadro CEO")**. O sequenciamento aplica a priorização MoSCoW (ver [05-backlog/02-user-stories.md]): **S1–S5 concentram 100% das Must (85 SP de trabalho restante)** e **S6 é um _buffer_ com todas as Should/Could (41 SP), cortável sob o prazo sem perder Must.**

| Sprint | Datas | Tema | SP | Composição |
|--------|-------|------|----|------------|
| **S1** | 02–04/06 | Login (EP01) | 21 | Must (EP01-04 já _Done_) |
| **S2** | 05–07/06 | Catálogo (EP02) + EP07-01 | 18 | 100% Must — EP07-01 puxada cedo (pré-req do FEFO) |
| **S3** | 08–10/06 | Estoque CEO + base de pedido (EP03 + EP04-01) | 21 | 100% Must |
| **S4** | 11–13/06 | Fluxo de pedidos (EP04) | 20 | 100% Must |
| **S5** | 14–16/06 | Dashboards + Lote Must (EP05 + EP07-02 + EP06-01 + EP04-05) | 26 | 100% Must — última parede de Must |
| **S6** | 17–19/06 | **Buffer cortável** | 41 | 100% Should/Could |

**Total:** 147 SP (104 Must / 35 Should / 8 Could). **Linha de corte:** se o prazo apertar, corta-se de baixo de S6 — primeiro as Could (ajuste de inventário, responsivo tablet), depois as Should de menor valor no piloto (gráfico de consumo mensal — sem histórico para plotar em 90 dias). Nada em S6 bloqueia o piloto.

**Riscos de carga:** S5 (26 SP) e S6 (41 SP) estão acima da média (~20 SP/sprint). S6 é grande de propósito — é o sprint expansível. Em S5, o candidato natural a transbordar para o topo de S6 é EP04-05 (desdobrar em lotes, 5 SP — Must avançada). O board (sprints 171–176) é a fonte operacional; este doc é o espelho.



## 2. Releases

### R0 — Discovery e Protótipo (concluído)

- **Período:** março–abril/2026.
- **Entrega:** documentação de PO (este conjunto de artefatos), protótipo navegável em React (`DS-prototype/`), validação do fluxo principal com almoxarife e dois dentistas do CEO.
- **Saída:** decisão de seguir para Build do MVP.

### R1.0 — MVP (Piloto CEO)

- **Período-alvo:** Maio/2026.
- **Janela de piloto em produção:** agosto–outubro/2026 (90 dias).
- **Stories:** todas as 26 stories `Must` listadas em [05-backlog/02-user-stories.md](../05-backlog/02-user-stories.md).
- **Foco:** substituir os canais informais de solicitação no CEO; gerar histórico mínimo de auditoria; entregar dashboards por perfil.
- **Critérios de aceite:** ver "Definition of Done do produto" em [02-visao-escopo/02-escopo-mvp.md](../02-visao-escopo/02-escopo-mvp.md).

### R1.1 — Hardening e UX Polish (pós-piloto)

- **Período-alvo:** junho/2026.
- **Foco:** correções e refinamentos identificados nas primeiras 6 semanas do piloto.
- **Possíveis incrementos (fila priorizada após observação real):**
  - Recuperação de senha por e-mail (RF01.7).
  - Notificação por e-mail ao dentista quando solicitação é resolvida (RF06.6).
  - Notificação por e-mail ao almoxarife quando item ficar crítico (RF06.5).
  - Importação CSV de itens (RF03.10).
  - Acessibilidade WCAG 2.1 AA (RNF01.8).

### R2.0 — Expansão para outros subdepartamentos

- **Pré-requisito:** atingir os critérios de saída do piloto (ver [02-visao-escopo/02-escopo-mvp.md](../02-visao-escopo/02-escopo-mvp.md), seção 7).
- **Período-alvo:** 2026.2.
- **Foco:** generalizar a entidade "Subdepartamento" e suportar **vários** estoques locais além do CEO. Onboarding gradual: Endodontia → Cirurgia → demais.
- **Stories candidatas:**
  - Cadastro de subdepartamento e roles por subdepartamento.
  - Roteamento de solicitações por subdepartamento de origem.
  - Dashboards comparativos entre subdepartamentos (gestão).
  - Exportação de relatórios (PDF/Excel).

### R2.x — Integrações e maturidade

- **Período-alvo:** 2027 H1+.
- **Possíveis temas:**
  - Integração com sistemas internos da UFPE (autenticação SSO).
  - Leitura de código de barras / QR Code para entradas (RF da fase 2).
  - Painel de fornecedores e ordens de compra.
  - Aprovação parcial e edição de solicitação (revisitar RF05.13 e OUT10).
  - LGPD compliance avançado (termo de uso, consentimento).

## 3. Cadência operacional

| Cadência | O quê |
|----------|-------|
| Dois dias | Daily de 15min (durante o build) |
| Semanal | Refinamento de backlog (PO + dev) |
| Quinzenal | Demo de incremento + retro |
| Mensal | Comitê com Coordenação Hospital, Dispensação e CEO |
| Trimestral | Revisão de roadmap + KPIs do piloto |

## 4. Princípios de priorização

A priorização do backlog segue, nesta ordem:

1. **Bloqueio do piloto:** se uma history bloqueia uso real no CEO, sobe ao topo.
2. **Risco elevado:** itens de segurança, perda de dados ou risco regulatório têm precedência.
3. **Valor por persona:** alternar entre as três personas para que ninguém fique sem progresso visível.
4. **Esforço:** para risco/valor equivalentes, prioriza-se o de menor esforço.

## 5. Referências

- Backlog detalhado: [05-backlog/02-user-stories.md](../05-backlog/02-user-stories.md).
- Métricas: [02-metricas-de-sucesso.md](02-metricas-de-sucesso.md).
- Riscos: [03-riscos.md](03-riscos.md).
