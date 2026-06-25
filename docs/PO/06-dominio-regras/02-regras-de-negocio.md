# Regras de Negócio

**Documento:** 02-regras-de-negocio
**Última atualização:** 14/05/2026
**Revisão:** v2 — alinhada com descobertas do fluxo real (depoimento João Victor, planilhas, PDF do CEO).

---

## Convenções

- IDs `RNxx` são estáveis.
- Cada regra cita o **requisito funcional** que a operacionaliza.
- Toda regra é **testável**.

---

## RN01 — Identificação de usuário, perfil e setor

> **Regra:** Cada usuário possui exatamente **um perfil** entre `gestor`, `almoxarife`, `solicitante` (e, na fase 2, `dentista`) **e um setor** vinculado (`HO` ou `CEO` no MVP). As permissões são determinadas pela combinação **perfil × setor**.
>
> O perfil `gestor` é setorial: `gestor HO` é super-user com visão global; `gestor CEO` é super-user restrito ao CEO. `Gestor HO` herda os poderes de `almoxarife`. `Gestor` (em qualquer setor) herda os poderes de `solicitante` do próprio setor.
>
> **Origem:** RF01.2, RF01.3, RF01.9, RF01.10.

## RN02 — Catálogo fechado de categorias

> **Regra:** Categoria de produto pertence a um conjunto fechado: **EPI, Anestésico, Material Restaurador, Instrumentais, Higienização, Material Cirúrgico, Equipamento, Outros**.
>
> **Equipamento** (fotopolimerizador, raio X, câmara escura) é categoria **especial**: itens dessa categoria **não entram na lógica de status crítico/baixo/excessivo** (estoque mínimo não se aplica). Aparecem em listagem separada do "consumível".
>
> **Origem:** RF03.9.
> **Observação:** Cadastro dinâmico de categorias fica para fase 2.

## RN03 — Status "Crítico" e "Baixo" no estoque (HO e CEO)

> **Regra:** Cálculo sobre o **total agregado** do produto (soma de lotes ativos):
> - Se `qtd_total ≤ estoque_minimo` → **Crítico**.
> - Se `qtd_total ≤ estoque_minimo × 1,5` → **Baixo**.
>
> Aplica-se identicamente ao HO e ao CEO (o CEO tem seu próprio `estoque_minimo` por produto).
>
> **Origem:** RF03.6, RF06.1.

## RN04 — Status "Excessivo" no HO

> **Regra:** Se `qtd_total ≥ estoque_maximo × 0,95`, o produto está **Excessivo**.
>
> Não se aplica ao CEO (estoque do CEO não tem teto definido no MVP).
>
> **Origem:** RF03.6, RF06.3.

## RN05 — Estados de validade do lote

> **Regra:** Cada **lote** tem estado de validade calculado em relação à data atual:
> - `diasParaVencer ≤ 0` → **Vencido**.
> - `0 < diasParaVencer ≤ 30` → **Vencendo**.
> - `30 < diasParaVencer ≤ 60` → **Atenção**.
>
> O status do produto agregado leva em conta o **lote mais próximo do vencimento** entre os lotes ativos.
>
> **Origem:** RF03.6, RF06.2.

## RN06 — Precedência de status (produto agregado)

> **Regra:** O status final do produto é avaliado **na seguinte ordem**, e o primeiro que casar é aplicado:
> 1. Indisponível (qtd_total = 0).
> 2. Vencido (algum lote ativo está vencido).
> 3. Vencendo (algum lote ativo vence em ≤ 30d).
> 4. Atenção (algum lote ativo vence em 31–60d).
> 5. Crítico (qtd_total ≤ mínimo).
> 6. Baixo (qtd_total ≤ mínimo × 1,5).
> 7. Excessivo (qtd_total ≥ máximo × 0,95) — só HO.
> 8. Normal.
>
> **Origem:** RF03.6.
> **Por que importa:** o risco mais grave (vencimento) tem precedência sobre quantidade.

## RN07 — Catálogo × Lote (relacionamento 1:N)

> **Regra:** Um **Produto** é entidade do catálogo (nome, categoria, unidade, estoque mín/máx). Pode existir no catálogo **mesmo sem lotes** (caso "Não Tem" da planilha real). Um **Lote** sempre pertence a um único Produto e contém: número do lote, fabricação, validade, qtd, estado (`ativo` / `vencido` / `segregado`).
>
> `qtd_total` do produto = soma de qtd dos lotes em estado **ativo** (calculado em runtime).
>
> Lotes vencidos e segregados **não entram** na qtd_total.
>
> **Origem:** RF03.1, RF03.1b, RF03.2b.

## RN08 — Solicitação de item indisponível (regra invertida)

> **Regra (v2 — INVERTIDA em relação à v1):** O solicitante **pode** pedir item com qtd_total = 0. O item entra no pedido com status `aguardando_reposicao`. O sistema exibe alerta antes da confirmação: *"Este item está em falta. O pedido ficará registrado como demanda represada e será atendido quando houver reposição."*
>
> Pedidos `aguardando_reposicao` viram **sinal mensurável de demanda represada** (vide RF06.7 e dashboard de gestão).
>
> Quando um **lote novo** do produto é cadastrado e existem pedidos represados, o sistema **alerta o almoxarife** (RF06.9).
>
> **Origem:** RF05.16, RF06.7, RF06.9.

## RN09 — Validação de criação do pedido

> **Regra:** Para que um **pedido** seja criado, **simultaneamente**:
> - O pedido tem **pelo menos 1 item** (catálogo ou linha livre).
> - Cada item tem `qtd_solicitada` inteiro **≥ 1**.
> - A justificativa geral tem `length ≥ 10` caracteres.
> - O `setor_origem` do pedido é o setor do usuário (ou — para gestor HO — pode ser selecionado).
>
> **Origem:** RF05.1, RF05.2, RF05.3, RF05.14.

## RN10 — Ciclo de vida do pedido e dos itens do pedido

> **Regra:** Estados possíveis:
> - **Item do pedido:** `pendente`, `aguardando_reposicao`, `atendido_integral`, `atendido_parcial`, `nao_atendido`.
> - **Pedido (status derivado):**
>   - `pendente` — todos os itens em `pendente` (ou mistura de `pendente` + `aguardando_reposicao`).
>   - `em_processamento` — pelo menos um item já processado, mas existem itens ainda `pendente`.
>   - `atendido_integral` — todos os itens em `atendido_integral`.
>   - `atendido_parcial` — todos os itens processados, com pelo menos um em `atendido_parcial` ou `nao_atendido`, mas pelo menos um atendido (integral ou parcial).
>   - `nao_atendido` — todos os itens em `nao_atendido` ou `aguardando_reposicao` (nada saiu).
>   - `aguardando_reposicao` — todos os itens (pendentes) estão em `aguardando_reposicao`.
>
> Transições proibidas no MVP:
> - Reverter um item processado para `pendente`.
> - Editar pedido após criado (incluir/remover itens, alterar qtd_solicitada).
>
> **Origem:** RF05.4, RF05.6, RF05.12, RF05.18.

## RN11 — Registro auditável de toda decisão

> **Regra:** Toda decisão do almoxarife/gestor sobre um item do pedido **deve registrar**:
> - identidade do responsável,
> - data de processamento,
> - lote_expedido (se houver),
> - qtd_expedida,
> - motivo da divergência (enum + texto livre opcional) se `qtd_expedida ≠ qtd_solicitada`.
>
> Cada decisão gera **Movimentação** rastreável.
>
> **Origem:** RF05.5, RF05.6, RNF07.1.

## RN12 — Visibilidade por perfil e setor

> **Regra:**
> - **Solicitante** vê apenas pedidos do **próprio setor**.
> - **Gestor CEO** vê todos os pedidos do CEO; **não vê** outros setores.
> - **Almoxarife** e **Gestor HO** veem **todos os pedidos** de todos os setores.
> - Solicitante e Gestor CEO veem **estoque do CEO**; Gestor CEO pode editar (consumo, ajuste). Solicitante CEO é leitor.
> - Solicitante e Dentista (fase 2) **não veem lotes** do catálogo do HO — apenas o agregado.
>
> **Origem:** RF01.3, RF01.9, RF03.10, RF05.8–RF05.10.

## RN13 — Confirmação obrigatória em remoção

> **Regra:** Remoção de produto/lote/registro requer modal de confirmação. Produto só pode ser removido se **não tiver lotes ativos** (forçar segregação primeiro).
>
> **Origem:** RF03.4.

## RN14 — Sessão atrelada ao navegador

> **Regra:** Sessão em `sessionStorage`, encerra ao fechar navegador, preservada em reload.
>
> **Origem:** RF01.4.

## RN15 — Identidade visual UFPE

> **Regra:** Cor primária `#990000`, aplicada em botões, badges, abas e elementos de marca.
>
> **Origem:** RNF01.1.

## RN16 — Motivo enumerado para divergência

> **Regra:** Quando `qtd_expedida ≠ qtd_solicitada` (parcial ou em falta), o almoxarife **deve** selecionar um **motivo** de uma enumeração:
> - `falta_estoque` — não há saldo suficiente.
> - `racionalizacao_setor` — corte deliberado por priorização (ex.: priorizar HO clínico sobre laboratórios de aula).
> - `lote_indisponivel` — produto existe, mas lote disponível não atende (ex.: vencendo logo, em segregação iminente).
> - `outros` — abre campo de **texto livre opcional**.
>
> Esta enumeração transforma a "racionalização" mencionada pelo almoxarife em **dado mensurável** para a Gestão.
>
> **Origem:** RF05.5.

## RN17 — Ciclo de vida do lote (validade e segregação)

> **Regra:** Estados do lote: `ativo → vencido → segregado` (descarte fica para fase 2).
> - `ativo`: validade no futuro, qtd > 0, expedível.
> - `vencido`: validade no passado. **Não é expedível** (não aparece na seleção do almoxarife).
> - `segregado`: ação manual do almoxarife/gestor HO. Sai do estoque ativo, vai para "Lotes segregados" (representa fisicamente a sala de biossegurança).
>
> Segregação **gera Movimentação** de tipo `segregação`.
>
> **Origem:** RF06.8, RF06.9.

## RN18 — Linha livre no pedido

> **Regra:** Uma linha livre é um item do pedido **sem vínculo** com produto do catálogo (campo `produto_id` nulo, campo `descricao_livre` preenchido).
>
> Comportamento:
> - **Não** gera movimentação de estoque automática quando expedida.
> - Pode ser "promovida" pelo almoxarife: ao clicar em "Cadastrar no catálogo", abre modal de cadastro pré-preenchido com a descrição. Após cadastro, a linha vira item vinculado ao novo produto.
> - Pode ser marcada como `atendido_integral` mesmo sem produto vinculado (entrega manual fora do catálogo).
>
> **Origem:** RF05.15.

## RN19 — Expedição alimenta estoque do CEO

> **Regra:** Quando um item de pedido com `setor_destino = CEO` é marcado como `atendido_integral` ou `atendido_parcial`, o sistema **cria ou atualiza** o lote-CEO correspondente:
> - Se já existe lote-CEO com mesmo `lote` e mesmo `produto_id`, soma a qtd.
> - Caso contrário, cria novo lote-CEO com lote, fabricação, validade copiados do lote-HO.
> - Gera Movimentação tipo `saída` no HO **e** Movimentação tipo `entrada` no CEO, referenciando o pedido.
>
> O Gestor CEO pode posteriormente fazer **ajuste de inventário** se a contagem física divergir (RF04.7).
>
> **Origem:** RF04.1, RF04.5.

## RN20 — FEFO (First Expired, First Out) na expedição

> **Regra:** Ao escolher lote para expedir um item, o sistema **ordena a lista** dos lotes ativos pelo critério **FEFO** (lote com validade mais próxima primeiro). Almoxarife pode escolher manualmente outro, mas o padrão (e a sugestão) é FEFO.
>
> Lotes vencidos e segregados **não aparecem na seleção**.
>
> **Origem:** RF05.19.

---

## Mapa rápido: regra ↔ requisito ↔ arquivo

| Regra | RFs principais | Local (protótipo) |
|-------|----------------|-------------------|
| RN01 | RF01.2, RF01.3, RF01.9, RF01.10 | `AuthContext.jsx`, `ProtectedRoute.jsx` |
| RN02 | RF03.9 | `ItemModal.jsx`, `data/data.js` |
| RN03–RN06 | RF03.6, RF06 | `data/data.js → getItemStatus` |
| RN07 | RF03.1, RF03.1b, RF03.2b | (novo) — `data/products.js`, `data/lots.js` |
| RN08 | RF05.16, RF06.7, RF06.9 | (novo) |
| RN09 | RF05.1–3, RF05.14 | `NovoPedidoModal.jsx` (novo) |
| RN10 | RF05.4–6, RF05.18 | `PedidosContext.jsx` (revisado) |
| RN11 | RF05.5–6 | `PedidosContext.jsx` |
| RN12 | RF01.3, RF03.10, RF05.8–10 | `Pedidos.jsx`, `EstoqueCEO.jsx` |
| RN13 | RF03.4 | `EstoqueDispensacao.jsx → ConfirmDelete` |
| RN14 | RF01.4 | `AuthContext.jsx` |
| RN15 | RNF01.1 | UI distribuída |
| RN16 | RF05.5 | (novo) `MotivoModal.jsx` |
| RN17 | RF06.8, RF06.9 | (novo) `LotesSegregados.jsx` |
| RN18 | RF05.15 | (novo) `NovoPedidoModal.jsx` |
| RN19 | RF04.1, RF04.5 | (novo) `ProcessarPedido.jsx`, `EstoqueCEO.jsx` |
| RN20 | RF05.19 | (novo) — sugestão na seleção de lote |

---

## Mudanças desta revisão (v1 → v2)

- **RN08 invertida**: solicitar item indisponível agora é **permitido** (vira `aguardando_reposicao`).
- **RN07, RN17–RN20 são novas**: refletem a separação Produto × Lote, ciclo de vida do lote, linha livre, expedição que alimenta CEO, e FEFO.
- **RN16 é nova**: motivo enumerado de divergência (transforma "racionalização" em dado).
- **RN10 reescrita**: ciclo de vida do **item do pedido** e do **pedido** (status derivado).
- **RN12 expandida**: visibilidade leva em conta perfil × setor; gestor CEO ≠ gestor HO.
- **RN02 expandida**: categoria `Equipamento` adicionada, com regra de exclusão de status de quantidade.
