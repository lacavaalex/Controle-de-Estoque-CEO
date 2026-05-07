# Jornadas — Estado Futuro (To-Be)

**Documento:** 02-jornadas-to-be
**Última atualização:** 07/05/2026

---

Este documento mostra como cada persona usa o produto. Compare com o estado atual em [01-discovery/03-jornada-atual-as-is.md](../01-discovery/03-jornada-atual-as-is.md).

---

## Jornada 1 — Dentista solicita material (caminho feliz)

**Persona:** Dr. Alex Pereira (Dentista CEO)
**Gatilho:** Percebe estoque baixo no CEO durante o turno.
**Objetivo:** Receber o material em até 24h.

```
┌──────────────┬───────────────────────────────────────────────────────────────┐
│ Etapa        │ Ação                                                          │
├──────────────┼───────────────────────────────────────────────────────────────┤
│ 1. Login     │ Abre sistema no tablet, faz login com e-mail @ufpe.br         │
│ 2. Visão     │ Cai na home: cards do CEO com status visual                   │
│ 3. Detectar  │ Vê o card "Hipoclorito de Sódio" amarelo (Baixo)              │
│ 4. Abrir     │ Clica "Solicitar Item" diretamente do card                    │
│ 5. Preencher │ Quantidade 5, justificativa "Endodontia da semana"            │
│ 6. Enviar    │ Clica "Enviar Solicitação" — recebe confirmação               │
│ 7. Acompanhar│ Vai em "Solicitações" → aba "Pendentes" e confirma o pedido   │
│ 8. Receber   │ Em 24h, status muda para "Aprovada" e dentista é notificado   │
│              │ via dashboard (ou recebe o material fisicamente)              │
└──────────────┴───────────────────────────────────────────────────────────────┘
```

**Pontos críticos de UX:**
- Card colorido funciona como "pré-alerta visual" antes do número.
- O botão "Solicitar Item" precisa estar **dentro** do card, não em outra tela.
- Se o item está `indisponivel`, o botão fica desabilitado com texto claro.

---

## Jornada 2 — Dentista solicita item indisponível (caminho com fricção)

**Persona:** Dr. Alex Pereira
**Gatilho:** Item está como "Indisponível" no CEO.

1. Dentista percebe item zerado.
2. Tenta clicar em "Solicitar Item" — botão está desabilitado, com label `Indisponível`.
3. Compreende que o material **também** está zerado no estoque do CEO; pode procurar via "Estoque CEO" → tabela completa para confirmar.
4. Encerra a tentativa ou contata o almoxarife (canal informal — esse caso será revisitado em fase 2 com chat ou notificação).

**Decisão de produto:** o MVP **não permite** solicitar item indisponível pelo card. Esta é uma decisão consciente para pressionar a Dispensação a manter cadastro saudável. (Ver RN08.)

---

## Jornada 3 — Almoxarife processa solicitações pendentes

**Persona:** Carlos Prates (Almoxarife)
**Gatilho:** Início do turno; expectativa: zerar pendências antes do almoço.

```
┌──────────────┬───────────────────────────────────────────────────────────────┐
│ Etapa        │ Ação                                                          │
├──────────────┼───────────────────────────────────────────────────────────────┤
│ 1. Login     │ Login institucional; cai no Dashboard Almoxarife              │
│ 2. KPI       │ Lê os 4 KPIs: Total, Crítico, Vencendo, Pendentes             │
│ 3. Fila      │ Vê a "Fila de Solicitações Pendentes" com 5 itens             │
│ 4. Validar   │ Para cada solicitação, lê item, qtd, solicitante, justificat. │
│ 5. Aprovar   │ Separa o material fisicamente, clica "Aprovar"                │
│ 6. Negar     │ Para um pedido fora do limite, clica "Negar" e informa motivo │
│              │ ("Quantidade acima do limite por solicitação")                │
│ 7. Confirmar │ A linha sai da aba Pendentes; vai para Aprovadas ou Negadas   │
└──────────────┴───────────────────────────────────────────────────────────────┘
```

**Pontos críticos de UX:**
- Botões inline na tabela. Sem modal só para aprovar (modal só na negação).
- Contador de pendentes no badge ao lado do título.
- Quando não há pendentes, mensagem positiva ("tudo em dia").

---

## Jornada 4 — Almoxarife cadastra novo item recebido

**Persona:** João
**Gatilho:** Recebimento de fornecedor com nota fiscal e produto físico.

1. Confere fisicamente: quantidade, lote, validade.
2. Acessa "Dispensação" → "Novo Item".
3. Preenche o formulário (10 campos, 6 obrigatórios).
4. Salva. Item aparece na tabela com status calculado automaticamente.
5. Em paralelo, registra a entrada no caderno físico durante a transição (hábito até o sistema gerar confiança plena).

**Critério de aceite UX:** cadastro precisa ser feito em **≤ 90 segundos**.

---

## Jornada 5 — Gestão prepara reunião mensal

**Persona:** Dra. Renata
**Gatilho:** Primeira segunda-feira do mês, 9h.

1. Login.
2. Cai no Dashboard Gestão.
3. Lê os KPIs: Total de Itens, Vencendo (60 dias), Estoque Crítico, Pendentes.
4. Inspeciona o gráfico "Consumo Mensal por Unidade" — Dispensação vs. CEO.
5. Verifica a lista "Itens Próximos do Vencimento" (top 5).
6. Verifica "Estoque Crítico" (top 5).
7. Lê o "Log de Movimentações" das últimas 10 entradas/saídas.
8. Vai à reunião com print da tela.

**Decisão de produto:** no MVP, exportação não existe; print da tela cobre o caso. Exportação fica para fase 2.

---

## Mapa de jornadas × telas do produto

| Jornada | Tela primária | Telas auxiliares |
|---------|---------------|------------------|
| Dentista solicita | `Dashboard` (cards CEO) ou `Estoque CEO` | `Solicitações` (aba "Pendentes" e "Negadas") |
| Almoxarife atende | `Dashboard` (fila pendentes) | `Solicitações` (todas as abas), `Estoque Dispensação` |
| Almoxarife cadastra item | `Estoque Dispensação` | Modal "Novo Item" |
| Gestão acompanha | `Dashboard` Gestão | `Solicitações` (aba "Todas"), `Estoque Dispensação` (auditoria), `Estoque CEO` |
| Auditoria pós-fato | `Solicitações` (aba "Todas") | `Dashboard` (log de movimentações) |
