# Regras de Negócio

**Documento:** 02-regras-de-negocio
**Última atualização:** 07/05/2026

---

## Convenções

- IDs `RNxx` são estáveis.
- Cada regra cita o **requisito funcional** e o **trecho do protótipo** que a operacionaliza.
- Toda regra é **testável** — há descrição clara da condição de verdade.

---

## RN01 — Identificação de usuário e perfil

> **Regra:** Cada usuário possui exatamente **um perfil** entre `gestao`, `almoxarife` e `dentista`. As permissões do sistema são determinadas exclusivamente por esse perfil.
>
> **Origem:** RF01.2, RF01.3.
> **Implementação no protótipo:** `data/data.js → USUARIOS`, `context/AuthContext.jsx → isRole`, `App.jsx → ProtectedRoute`.

## RN02 — Catálogo fechado de categorias

> **Regra:** Categoria de item pertence a um conjunto fechado: **EPI, Anestésico, Material Restaurador, Instrumentais, Higienização, Material Cirúrgico, Outros**. Nenhum item pode ser cadastrado fora dessas opções.
>
> **Origem:** RF03.9.
> **Implementação:** `data/data.js → CATEGORIAS`, `components/estoque/ItemModal.jsx`.
> **Observação:** Mudanças no catálogo exigem atualização do código e da regra. Não há cadastro dinâmico de categorias no MVP.

## RN03 — Status "Crítico" e "Baixo" no estoque da Dispensação

> **Regra:**
> - Se `quantidade ≤ estoqueMinimo` → **Crítico**.
> - Se `quantidade ≤ estoqueMinimo × 1,5` → **Baixo**.
>
> **Origem:** RF03.6, RF06.1.
> **Implementação:** `data/data.js → getItemStatus`.

## RN04 — Status "Excessivo" no estoque da Dispensação

> **Regra:** Se `quantidade ≥ estoqueMaximo × 0,95`, o item está **Excessivo**.
>
> **Origem:** RF03.6, RF06.3.
> **Implementação:** `data/data.js → getItemStatus`.
> **Justificativa de produto:** alertar a Gestão sobre compra exagerada que pode levar a vencimento.

## RN05 — Estados de validade

> **Regra:** Cada item tem um indicador de validade calculado em relação à data atual:
> - `diasParaVencer ≤ 0` → **Vencido**.
> - `0 < diasParaVencer ≤ 30` → **Vencendo**.
> - `30 < diasParaVencer ≤ 60` → **Atenção** (vencendo em 60d).
>
> Estados de validade **prevalecem** sobre estados de quantidade no cálculo do status final do item (vide RN06).
>
> **Origem:** RF03.6, RF06.2.
> **Implementação:** `data/data.js → getItemStatus`.

## RN06 — Precedência de status no item da Dispensação

> **Regra:** O status final do item é determinado **na seguinte ordem de avaliação**, e o primeiro que casar é aplicado:
> 1. Vencido
> 2. Vencendo (≤ 30d)
> 3. Atenção (31–60d)
> 4. Crítico (qtd ≤ mínimo)
> 5. Baixo (qtd ≤ mínimo × 1,5)
> 6. Excessivo (qtd ≥ máximo × 0,95)
> 7. Normal
>
> **Origem:** RF03.6.
> **Implementação:** `data/data.js → getItemStatus` (ordem dos `if`s).
> **Por que importa:** garante que um item vencido com estoque alto não apareça apenas como "Excessivo" — o risco mais grave (vencimento) é sempre destacado primeiro.

## RN07 — Status do item no estoque do CEO

> **Regra:**
> - `quantidade = 0` → **Indisponível**.
> - `quantidade ≤ estoqueMinimo` → **Crítico**.
> - `quantidade ≤ estoqueMinimo × 2` → **Baixo**.
> - Caso contrário → **Disponível**.
>
> **Origem:** RF04.5, RF06.1.
> **Implementação:** `data/data.js → getCEOItemStatus`.
> **Diferença frente à RN03:** o CEO tem volume menor e a faixa "Baixo" é proporcionalmente mais generosa (×2 do mínimo).

## RN08 — Solicitação de item indisponível é bloqueada

> **Regra:** O dentista **não pode iniciar uma solicitação** a partir do card de um item com status `Indisponível` no CEO. O botão "Solicitar Item" fica desabilitado.
>
> **Origem:** RF04.6.
> **Justificativa:** força que a Dispensação reabasteça o item antes de criar fila de espera; caso contrário, é necessário um canal informal.
> **Limitação:** não impede que o dentista crie a solicitação por outro caminho (Modal "Nova Solicitação" geral). Isso é tolerado no MVP — fica para refinamento.

## RN09 — Validação da solicitação no momento da criação

> **Regra:** Para que uma solicitação seja criada, **simultaneamente**:
> - `itemId` deve estar selecionado.
> - `quantidadeSolicitada` deve ser número inteiro **≥ 1**.
> - `justificativa.trim().length` deve ser **≥ 10**.
>
> Se qualquer condição falhar, a solicitação **não é criada** e uma mensagem específica é exibida.
>
> **Origem:** RF05.1, RF05.2, RF05.3.
> **Implementação:** `components/solicitacoes/NovaSolicitacaoModal.jsx → handleSubmit`.

## RN10 — Ciclo de vida da solicitação

> **Regra:** Uma solicitação possui exatamente os estados: **Pendente → Aprovada** ou **Pendente → Negada**.
>
> Transições permitidas no MVP:
> - `Pendente → Aprovada` (pelo Almoxarife).
> - `Pendente → Negada` (pelo Almoxarife, podendo registrar observação).
>
> Transições **proibidas no MVP**:
> - Reverter `Aprovada` ou `Negada` para `Pendente`.
> - Editar uma solicitação após criada.
> - Aprovação parcial (com quantidade menor).
>
> **Origem:** RF05.4 a RF05.6, RF05.12, RF05.13.
> **Implementação:** `context/SolicitacoesContext.jsx → aprovar` e `negar`.

## RN11 — Registro auditável de toda decisão

> **Regra:** Toda aprovação ou negação **deve registrar**: identidade do **responsável** (`usuario.nome`), **data de conclusão** (data ISO atual) e, no caso de negação, a **observação** informada (pode ser string vazia, mas o campo deve existir).
>
> **Origem:** RF05.6, RNF07.1.
> **Implementação:** `SolicitacoesContext.jsx → aprovar/negar`.

## RN12 — Visibilidade de solicitações por perfil

> **Regra:**
> - **Dentista** vê apenas as solicitações em que `solicitante = usuario.nome`.
> - **Almoxarife** e **Gestão** veem todas as solicitações.
> - Apenas o **Almoxarife** pode aprovar ou negar; **Gestão** tem visualização somente leitura.
>
> **Origem:** RF05.8, RF05.9, RF05.10.
> **Implementação:** `pages/Solicitacoes.jsx` (3 views distintas).

## RN13 — Confirmação obrigatória em remoção

> **Regra:** A remoção de um item do estoque da Dispensação **deve passar por modal de confirmação**. O ato só é efetivado quando o usuário clica explicitamente em "Remover Item".
>
> **Origem:** RF03.4, RNF01.3.
> **Implementação:** `pages/EstoqueDispensacao.jsx → ConfirmDelete`.

## RN14 — Sessão atrelada ao navegador

> **Regra:** A sessão do usuário é mantida em `sessionStorage` e termina ao fechar o navegador. Ao recarregar a página, a sessão deve ser preservada.
>
> **Origem:** RF01.4, RNF03.2.
> **Implementação:** `context/AuthContext.jsx`.

## RN15 — Identidade visual UFPE

> **Regra:** A cor primária do produto é o bordô institucional **#990000**, aplicada em botões primários, badges ativos, abas selecionadas e elementos de marca.
>
> **Origem:** RNF01.1.
> **Implementação:** distribuída pelos componentes (estilos em Tailwind e CSS inline).

---

## Mapa rápido: regra ↔ requisito ↔ código

| Regra | RFs | Arquivo do protótipo |
|-------|-----|----------------------|
| RN01 | RF01.2, RF01.3 | `AuthContext.jsx`, `ProtectedRoute.jsx` |
| RN02 | RF03.9 | `ItemModal.jsx`, `data/data.js` |
| RN03–RN06 | RF03.6, RF06 | `data/data.js → getItemStatus` |
| RN07 | RF04.5 | `data/data.js → getCEOItemStatus` |
| RN08 | RF04.6 | `EstoqueCEO.jsx → CardView` |
| RN09 | RF05.1–3 | `NovaSolicitacaoModal.jsx` |
| RN10–RN11 | RF05.4–6 | `SolicitacoesContext.jsx` |
| RN12 | RF05.8–10 | `Solicitacoes.jsx` |
| RN13 | RF03.4 | `EstoqueDispensacao.jsx → ConfirmDelete` |
| RN14 | RF01.4 | `AuthContext.jsx` |
| RN15 | RNF01.1 | múltiplos arquivos de UI |
