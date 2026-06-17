# DESIGN.md — Controle de Estoque CEO-UFPE

Visual system for the inventory app UI. Register: **product** (design serves the task). Source of brand truth: the official UFPE visual identity manual (bordô + black, Trebuchet MS).

## Theme

Light theme. Physical scene: staff at a desktop in a clinic almoxarifado/reception under office light, working a queue during business hours. Light wins — high legibility, neutral, calm; a dark tool here would read as "cool" for no task reason. Color strategy: **Restrained** — neutral surfaces + one institutional accent (bordô) for primary actions, current selection, and state. Status colors form a small semantic scale.

## Color palette

Tokens live in `projeto/frontend/src/styles/theme.css`. Authored as plain HEX/RGB to match the UFPE manual exactly (the manual specifies HEX).

### Brand
- `--ufpe-bordo: #990000` — primary brand (Pantone 201C). Primary buttons, active nav, selection, focus ring base.
- `--ufpe-bordo-hover: #7a0000` — darker bordô for hover/active (same hue, lower lightness — not a different color).
- `--ufpe-bordo-weak: #f7e9ea` — bordô tint for selected-row / subtle highlights (transparency of the hue, not gray).
- `--ufpe-preto: #000000` — institutional black (headlines on light).

### Neutrals (ink ramp + surfaces)
- `--ink: #1a1a1a` — primary body text (≥ 4.5:1 on white/surface).
- `--ink-2: #4d4d4d` — secondary text (still ≥ 4.5:1 on white).
- `--ink-3: #6b6b6b` — muted/captions (use only on pure white; verify ≥ 4.5:1).
- `--line: #e2e2e2` — borders/dividers.
- `--surface: #ffffff` — content surface (tables, cards, forms).
- `--surface-2: #f6f4f4` — second neutral layer for sidebar/toolbars/panels (a hair warm toward bordô, not gray-by-default).
- `--bg: #fafafa` — app background.

### Semantic — UI state
- `--focus: #990000` (focus ring uses bordô at 2px outline + offset).
- `--danger: #b3261e`, `--danger-bg: #fdecea`
- `--warn: #b35900`, `--warn-bg: #fff4e5`
- `--ok: #0a7d33`, `--ok-bg: #eaf6ee`
- `--info: #0b5cad`, `--info-bg: #e8f1fb`

### Semantic — estoque status (RN03–06 / contrato)
Each status = a dot/badge color + a text label, never color alone:
- Crítico → `--danger`; Baixo → `--warn`; Vencendo → `#a15c00`; Vencido → `--danger` (strong); OK → `--ok`; Indisponível → `--ink-3`.

## Typography

- Family: `--font: "Trebuchet MS", "Segoe UI", system-ui, -apple-system, sans-serif`. One family, multiple weights.
- **Fixed rem scale** (product UI, not fluid): 12 / 13 / 14(base) / 16 / 18 / 22 / 28 px. Ratio ~1.2.
- Weights: 400 body, 600 labels/buttons/table-headers, 700 page titles.
- Line-height 1.5 prose, 1.35 dense UI/tables. Prose width capped 65–75ch; tables may run dense.
- Numbers in tables/quantities: `font-variant-numeric: tabular-nums`.

## Components

Every interactive element ships with: default / hover / focus-visible / active / disabled / loading; data views add empty + error; loading uses **skeleton**, not a centered spinner.

- **Button**: primary (bordô bg, white text), secondary (surface + border), ghost (text only), danger. Radius `--radius:6px`. Min hit ~36px. Disabled = lower opacity + `not-allowed`, never full-saturation bordô.
- **Input / Select**: surface bg, `--line` border, focus = bordô ring (2px) + border. Same control vocabulary everywhere. Placeholder ≥ 4.5:1 (use `--ink-3`, not light gray).
- **Table**: header `--surface-2`, 600 weight, sticky header; zebra optional via very subtle tint; row hover `--surface-2`; selected row `--ufpe-bordo-weak`. Horizontal scroll wrapper (tablet). Empty state teaches the next action.
- **Badge / StatusDot**: pill or dot + label, semantic colors above.
- **Sidebar nav**: `--surface-2` panel; active item = bordô text + left affordance via full background tint (NOT a side-stripe border — that's banned); collapsible.
- **Toast**: top-right, semantic, auto-dismiss; z-index from scale.
- **Card**: used sparingly (KPI tiles on dashboard, the legit case). Never nested.

## Layout

- App shell: fixed sidebar (collapsible) + top header + content. Desktop-first.
- Content max-width for forms ~720px; tables full-width with scroll wrapper.
- Responsive is **structural**: sidebar collapses, tables scroll horizontally at ≤768px (CEO-255, Could — basic only this round). Type stays fixed rem.
- Grid for 2D (dashboard tiles `repeat(auto-fit, minmax(220px,1fr))`), flex for 1D toolbars.
- **z-index scale**: `--z-dropdown:1000; --z-sticky:1100; --z-modal-backdrop:1200; --z-modal:1300; --z-toast:1400; --z-tooltip:1500`. No 999/9999.

## Motion

- 150–250ms, ease-out (quart/expo). Conveys state only (hover, focus, row update, toast, skeleton→content), never page-load choreography.
- The expedição feedback (item status changing, CEO saldo updating) gets a brief highlight/fade so the user sees the stock move — that's state feedback, legit.
- `@media (prefers-reduced-motion: reduce)`: crossfade/instant for everything.

## Bans honored (impeccable)

No side-stripe borders, no gradient text, no decorative glassmorphism, no hero-metric template, no identical card grids, no uppercase tracked eyebrows, no numbered section scaffolding, no display fonts in UI, no modal-first, no full-saturation accents on inactive states, no text overflow at any breakpoint.
