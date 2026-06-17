# PRODUCT.md — Controle de Estoque CEO-UFPE

## Register

**product** — design serves the task. This is an authenticated internal tool (app shell, data tables, forms, dashboard) used by staff to run an inventory operation. Familiarity and trust beat novelty. The interface should disappear into the task.

## Purpose

Sistema de controle de estoque para o **CEO (Centro de Especialidades Odontológicas) da UFPE**. Gerencia materiais odontológicos em dois setores: o **almoxarifado HO** (recebe de fornecedores, guarda em lotes) e o **CEO** (consome clinicamente). O coração do produto é um fluxo:

> login → solicitante cria pedido multi-item → almoxarife atende item por item por **FEFO** (first-expire-first-out) → o estoque do CEO sobe automaticamente → o dashboard reflete.

Modelo de domínio: Produto × Lote (cada lote tem validade), Pedido com itens, Movimentação (entrada/saída/ajuste/consumo/segregação). Regras de validade (vencido/vencendo/atenção/ok) governam o FEFO.

## Target users (4 perfis / RBAC por setor)

- **solicitante** (ex.: dentista/equipe CEO) — cria pedidos, vê catálogo do seu setor **sem ver lotes**. Tarefa: pedir material rápido, sem fricção.
- **almoxarife** (HO) — atende pedidos item-a-item (expedição FEFO), dá entrada em lotes. Tarefa: processar a fila com precisão; é quem mais usa o sistema.
- **gestor** (HO ou CEO) — vê dashboard/KPIs, gerencia produtos/usuários, ajusta/consome estoque do CEO. Tarefa: visão de controle.
- **dentista** — fase 2, fora do escopo desta entrega.

Ambiente físico: uso em **desktop** num almoxarifado/recepção clínica, luz de escritório, em horário de trabalho sob pressão de fila. Desktop-first; tablet é um "could".

## Brand personality

**Institucional, sóbrio, confiável** — é um sistema público universitário de saúde, não um produto de consumo. Sério sem ser cinza-burocrático. A identidade é a da **UFPE**: bordô institucional + preto, tipografia limpa. A cor é identidade e sinal de estado (ações primárias, seleção), nunca decoração.

## Brand colors (do manual oficial da UFPE — autoritativo)

- **Bordô institucional `#990000`** (Pantone 201C, CMYK C0 M100 Y63 K29) — cor primária.
- **Preto `#000000`** — segunda cor institucional; texto e contraste.
- Cinzas neutros para superfícies/bordas/texto secundário (compostos, não da marca).
- (CIn-UFPE usa um vermelho próprio `#DB1E2F`; **não** usar aqui — o produto é institucional UFPE, não do Centro de Informática.)

## Fonts

**Trebuchet MS** é a fonte oficial do Sistema de Identidade Visual da UFPE (escolhida por ser system font padrão do Windows — disponível sem licença). Uma família só, em múltiplos pesos, carrega títulos/labels/dados — coerente com a regra "product UIs don't need display/body pairing".

## Anti-references (o que NÃO ser)

- **Não** parecer SaaS-startup (gradientes, hero-metric template, cards iguais infinitos, eyebrows uppercase tracked, glassmorphism). Isto é ferramenta de trabalho institucional.
- **Não** usar fonte display em labels/botões/dados.
- **Não** transformar "institucional" em "cinza sem contraste" — texto legível, ≥4.5:1.
- **Não** modal como primeira escolha; preferir inline/progressivo.
- **Não** inventar afordância para tarefa padrão (tabela, filtro, form são tabela, filtro, form).

## Strategic design principles

1. **A fila é sagrada.** A tela do almoxarife (processar pedido item-a-item) é a mais usada e a estrela da demo — densidade, estados claros (pendente/expedido/aguardando reposição), feedback imediato quando o saldo move.
2. **Estado por toda parte.** Cada componente interativo tem default/hover/focus/disabled/loading/error; tabelas têm empty state que ensina, skeleton no loading.
3. **Restrained color.** Bordô só em ação primária, seleção e indicador de estado. Status de estoque usa uma escala semântica (crítico/baixo/vencendo/vencido/ok) com cor + rótulo, nunca cor sozinha.
4. **Perfil molda a navegação.** O shell lê `/eu` e mostra só o que o perfil pode fazer.
5. **Honestidade de dados.** Onde o backend ainda não entrega (dashboard P2), rotular claramente como provisório — não fingir gráfico cheio.
