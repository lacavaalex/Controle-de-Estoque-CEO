# Riscos e Mitigações

**Documento:** 03-riscos
**Última atualização:** 07/05/2026

---

## Convenções

- **Probabilidade × Impacto:** matriz Baixa / Média / Alta (1–3 cada). Prioridade = P × I.
- **Categoria:** Produto (P), Operação (O), Técnico (T), Adoção (A), Conformidade (C).
- **Status:** Aberto · Mitigado · Aceito · Encerrado.

---

## 1. Top riscos do piloto

| ID | Risco | Categoria | Prob. | Impac. | Prio. | Mitigação | Plano de contingência | Status |
|----|-------|-----------|:-----:|:------:|:-----:|-----------|----------------------|:------:|
| R01 | **Almoxarife continua usando o caderno em paralelo**, gerando dupla fonte de verdade. | A | Alta | Alto | 9 | Treinamento prático com cenários reais; "ronda diária" do PO no início do piloto; incentivo (reconhecimento) por uso correto. | Aceitar uso paralelo nos primeiros 14 dias; aposentar caderno gradualmente. | Aberto |
| R02 | **Dentistas ignoram o sistema** e continuam pedindo verbalmente. | A | Alta | Alto | 9 | Almoxarife passa a só atender via sistema (regra interna acordada com a coordenação CEO). | Comitê semanal verifica taxa de NSM; se < 50% após 30 dias, reforço de comunicação. | Aberto |
| R03 | **Indisponibilidade de internet** na Dispensação ou no CEO. | T | Média | Alto | 6 | Sistema funciona em modo somente leitura caso a API caia; cache local de visualização. | Procedimento de fallback documentado em cartilha; volta ao caderno em situação de emergência, com regularização posterior. | Aberto |
| R04 | **Cadastro inicial impreciso** (lotes, validades, mínimos errados) gera alertas falsos positivos e perde credibilidade do sistema. | O | Média | Alto | 6 | Mutirão inicial de 2 dias com almoxarife + PO conferindo cada item; revisão dos parâmetros após 30 dias. | Funcionalidade de "ajuste manual" (movimentação tipo `ajuste`) já existe no MVP. | Aberto |
| R05 | **Mudança de coordenação** durante o piloto (rotatividade institucional). | O | Baixa | Alto | 3 | Documentação completa neste diretório `docs/PO/`; pelo menos 2 stakeholders por função capacitados. | Reaplicar Discovery resumido com novo coordenador. | Aberto |
| R06 | **Vazamento de dados pessoais** (nome, e-mail, ações dos usuários) em ambiente de produção. | C | Baixa | Alto | 3 | HTTPS + senhas com hash + sessão em sessionStorage + acesso restrito a UFPE. | Plano de resposta a incidente alinhado com TI UFPE; comunicação aos titulares conforme LGPD. | Aberto |
| R07 | **Hospedagem gratuita instável** (Netlify/Vercel free) afeta SLA. | T | Média | Médio | 4 | Avaliar migração para servidor da UFPE caso o piloto avance. | Migrar para servidor institucional na fase 2. | Aberto |
| R08 | **Equipe acadêmica perde disponibilidade** após o término do semestre. | O | Alta | Médio | 6 | Definir escopo do MVP cabível no semestre; `Definition of Done` clara. | Modo "manutenção" no fim do piloto: só correções; incrementos esperam novo ciclo. | Aberto |
| R09 | **Conflito entre dentistas pelo mesmo item** quando o estoque está crítico. | P | Média | Médio | 4 | Fila visível por ordem de chegada; almoxarife é a autoridade de tiebreak (RN12). | Adicionar prioridade clínica em fase 2 (campo opcional na solicitação). | Aberto |
| R10 | **Erro lógico nas regras de status** (RN03–RN07) gera alertas errados e o time deixa de confiar. | T | Baixa | Alto | 3 | Testes unitários cobrindo `getItemStatus` e `getCEOItemStatus`; QA manual antes do go-live. | Hotfix com nova versão; comunicação imediata. | Aberto |
| R11 | **Aprovação parcial demanda forte** logo no início do piloto (faltou no escopo MVP). | P | Média | Médio | 4 | OUT11 documentado; coletar dados quantitativos para reavaliar em R1.1. | Adicionar como story Must em R1.1 caso > 30% das negações sejam por divergência de quantidade. | Aberto |
| R12 | **Solicitações criadas sem justificativa real** (texto fraco para passar nos 10 caracteres). | A | Baixa | Médio | 2 | Almoxarife como "guardião do uso correto" — pode negar com observação pedindo mais detalhe. | Aumentar mínimo para 20 caracteres na R1.1 se virar padrão. | Aberto |

## 2. Riscos relacionados a out-of-scope

Riscos que **não tratamos no MVP** e que ficam mapeados para fase 2:

| ID | Risco | Decisão MVP |
|----|-------|------------|
| R13 | Recuperação de senha autônoma | Reset manual via administrador (OUT02). |
| R14 | Falta de suporte mobile completo | Layout funcional, não otimizado (OUT05). |
| R15 | Perda de pedidos por ausência de notificação ativa | Painel "Pendentes" como compensação (OUT07). |
| R16 | Auditor externo solicita relatório PDF | Print de tela como contingência no MVP (OUT08). |

## 3. Plano de monitoramento de riscos

- **Reunião quinzenal de risco:** PO + Coordenação Dispensação + Coordenação CEO.
- **Indicadores observados:**
  - K1 (tempo de resposta) — se subir, ativar R01/R02.
  - NSM (% solicitações no sistema) — se cair, ativar R02.
  - Erros JS em produção (Q3) — se subir, ativar R10.
  - Disponibilidade (Q1) — se cair, ativar R07.
- **Documento vivo:** este arquivo é atualizado a cada nova ocorrência ou mudança de prioridade.
