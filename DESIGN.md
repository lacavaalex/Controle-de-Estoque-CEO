# DESIGN.md — Design system do Controle de Estoque CEO-UFPE

Fonte única de verdade visual do frontend. Os tokens vivem em
`projeto/frontend/src/styles/theme.css` e **todo o resto consome `var(--token)`** —
não use cor/fonte/spacing hardcoded nos componentes.

## Identidade visual — qual marca?

Existem **duas marcas** no contexto do projeto, e a decisão (16/06/2026, **reconfirmada
pelo dono em 28/06/2026**) está registrada nos requisitos: **fica o bordô `#990000`** —
sem rebrand para o vermelho do CIn.

| | Marca | Primária | Fonte | Papel aqui |
|---|---|---|---|---|
| **Produto (oficial)** | UFPE (manual institucional) | **`#990000`** (bordô · Pantone 201C) | Trebuchet MS | **É a marca do produto** — RNF01.1 (Must), RN15, ACs de US |
| Acento (opcional) | CIn-UFPE (Centro de Informática) | `#DB1E2F` (Pantone 1795 C) | Proxima Nova ≈ Montserrat | Secundária — só como acento, se um dia for desejado |

> **Por quê:** o Controle de Estoque é um produto **da UFPE**, e o manual
> institucional da universidade diz que *"as cores institucionais da UFPE são o
> bordô e a cor preta"*. Portanto a primária é o **bordô `#990000`** + preto. O
> vermelho `#DB1E2F` é a marca do **Centro de Informática** (não da UFPE como um
> todo) — fica disponível como acento, mas **não** é a cor primária do produto.

**Requisitos que fixam isso:** `docs/PO/04-requisitos/02-requisitos-nao-funcionais.md`
(RNF01.1), `docs/PO/06-dominio-regras/02-regras-de-negocio.md` (RN15),
`docs/PO/05-backlog/02-user-stories.md` (AC de identidade visual).

## Como trocar a paleta (recolor)

Porque tudo passa por tokens, recolorir é **trocar um arquivo**: edite os valores
de marca em `theme.css` (`--ufpe-bordo`, `--ufpe-bordo-hover`, `--ufpe-bordo-weak`,
`--focus`). Nenhum componente precisa mudar.

Para adotar o vermelho do CIn como primária, por exemplo:

```css
--ufpe-bordo:       #DB1E2F;  /* CIn — Pantone 1795 C */
--ufpe-bordo-hover: #AF0421;  /* CIn vermelho escuro — Pantone 200 C */
--focus:            #DB1E2F;
```

> ⚠️ Trocar a primária para `#DB1E2F` **contraria RNF01.1/RN15** como estão hoje.
> Se for uma decisão deliberada (ex.: rebrand para a identidade do CIn), atualize
> também esses requisitos para manter spec e código coerentes.

## Catálogo de tokens (resumo)

- **Marca:** `--ufpe-bordo`, `--ufpe-bordo-hover`, `--ufpe-bordo-weak`, `--ufpe-preto`
- **Tinta/texto:** `--ink`, `--ink-2`, `--ink-3`
- **Superfícies:** `--bg`, `--surface`, `--surface-2`, `--line`
- **Estado de UI:** `--danger(-bg)`, `--warn(-bg)`, `--ok(-bg)`, `--info(-bg)`, `--focus`
- **Status de estoque (RN03–06):** `--st-critico`, `--st-baixo`, `--st-vencendo`, `--st-vencido`, `--st-ok`, `--st-indisponivel`
- **Tipografia:** `--font` + escala `--fs-12..28`, `--lh-tight`, `--lh-prose`
- **Ritmo/forma/movimento:** `--sp-1..7`, `--radius(-lg)`, `--shadow-1/2`, `--z-*`, `--t-fast/base`, `--ease`

### Cor em bibliotecas que não aceitam `var()`

Algumas libs (ex.: recharts no `fill` das barras) exigem uma cor concreta. Use o
helper `tokenColor("--token", "#fallback")` de `src/app/tokens.js`, que resolve o
token em runtime (com fallback para ambientes sem CSS computado, como o jsdom dos
testes). Ver `src/components/GraficoConsumoMensal.jsx`.

## Estados de UI (loading / erro / vazio)

Componentes compartilhados em `src/app/ui.jsx`: `PageHead`, `StatusEstoque`,
`StatusPedido`, `TableSkeleton`, `ErrorState`, `EmptyState`. Prefira o
`AsyncBoundary` para padronizar carregando/erro/vazio em telas que carregam dados.
