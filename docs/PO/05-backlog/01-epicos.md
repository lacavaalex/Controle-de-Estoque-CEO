# Mapa de Épicos

**Documento:** 01-epicos
**Última atualização:** 07/05/2026

---

## 1. Épicos do MVP

| ID | Épico | Objetivo | RFs principais | Personas |
|----|-------|---------|----------------|----------|
| EP01 | **Acesso e identidade** | Permitir que cada usuário entre no sistema e veja apenas o que pode ver. | RF01, RF07 | Todos |
| EP02 | **Estoque da Dispensação** | Cadastrar, consultar, editar e remover itens do almoxarifado central. | RF03 | Almoxarife, Gestão |
| EP03 | **Estoque do CEO** | Dar visibilidade do estoque local do subdepartamento piloto. | RF04 | Todos |
| EP04 | **Solicitações** | Formalizar o fluxo CEO ↔ Dispensação com rastreabilidade. | RF05 | Todos |
| EP05 | **Alertas e dashboards** | Sinalizar estados críticos e dar visão consolidada por perfil. | RF02, RF06 | Todos |
| EP06 | **Identidade visual e responsividade** | Garantir aderência à marca UFPE e uso confortável em desktop e tablet. | RNF01 | Todos |

## 2. Mapa de dependências

```
              ┌────────────────────────┐
              │ EP01 — Acesso e        │
              │  identidade            │
              └─────────┬──────────────┘
                        │
        ┌───────────────┼─────────────────┐
        ▼               ▼                 ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ EP02 — Estoque │ │ EP03 — Estoque │ │ EP06 — Identi- │
│  Dispensação   │ │  CEO           │ │  dade visual   │
└──────┬─────────┘ └──────┬─────────┘ └────────────────┘
       │                  │
       └────────┬─────────┘
                ▼
       ┌──────────────────┐
       │ EP04 — Solicit.  │
       └──────┬───────────┘
              ▼
       ┌──────────────────┐
       │ EP05 — Alertas e │
       │  Dashboards      │
       └──────────────────┘
```

EP01 é pré-requisito para todos. EP02 e EP03 podem ser desenvolvidos em paralelo. EP04 depende de ambos. EP05 depende de tudo (consome dados consolidados). EP06 atravessa todos (não é desenvolvido sequencialmente).

## 3. Critérios de aceite por épico

### EP01 — Acesso e identidade
- [ ] Login funciona para os 3 perfis com mensagens claras de erro.
- [ ] Sessão persiste enquanto o navegador estiver aberto.
- [ ] Sidebar exibe apenas rotas permitidas para o perfil.
- [ ] Tentativa de URL não autorizada redireciona para Dashboard.

### EP02 — Estoque da Dispensação
- [ ] Tabela com 9 colunas, filtros funcionando (nome, lote, categoria, status).
- [ ] CRUD completo com validação de obrigatórios.
- [ ] Status calculado e exibido com cor/badge.
- [ ] Linhas críticas/vencidas/excessivas destacadas.
- [ ] Dentista não acessa esta tela.

### EP03 — Estoque do CEO
- [ ] Cards (dentista) e tabela (gestão/almoxarife) renderizando o mesmo dataset.
- [ ] Status calculado conforme RN07.
- [ ] Botão "Solicitar Item" desabilitado para itens indisponíveis.

### EP04 — Solicitações
- [ ] Dentista cria solicitação via modal com validações.
- [ ] Almoxarife aprova com 1 clique e nega com modal de observação.
- [ ] Gestão tem visão somente leitura de tudo.
- [ ] ID `SOL-NNN`, data, responsável e status registrados.
- [ ] Abas Pendentes/Aprovadas/Negadas/Todas com contadores corretos.

### EP05 — Alertas e dashboards
- [ ] 4 KPIs renderizando por perfil.
- [ ] Gráfico de consumo mensal (gestão).
- [ ] Listas de "vencendo" e "estoque crítico" (gestão e almoxarife).
- [ ] Log das últimas 10 movimentações (gestão).

### EP06 — Identidade visual e responsividade
- [ ] Cor primária `#990000` aplicada de forma consistente.
- [ ] Layout funcional em desktop (≥ 1280px) e tablet (≥ 768px).
- [ ] Componentes de UI reutilizáveis em uso (Button, Card, Badge, Modal, Input, Select).
