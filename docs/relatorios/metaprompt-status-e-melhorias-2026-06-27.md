# Metaprompt — onde estamos e o que melhorar (27/06/2026)

> Documento de retomada para a fase pós-projeto (Luiz trabalhando solo, sem prazo,
> alimentando o Jira). Cole o conteúdo relevante numa nova sessão para continuar
> de onde paramos. Convenções vivem em `CLAUDE.md` e na memória do agente.

---

## 1. Onde estamos

**Projeto:** Controle de Estoque CEO/HO-UFPE. Backend Express+TS+Drizzle+Postgres
(camadas, domínio puro), frontend React **JS/JSX** (sem TS), CI real (backend ~142
testes + frontend 56), deploy Docker em `/estoque-ho` (branch `deploy`). Apresentado
aos professores; `develop` = fonte de verdade (v2).

**Última entrega (PR #49, branch `feat/dashboard-consumo-e-log`):**
- Log de movimentações (CEO-252 → **Done**): rota `/dashboard/movimentacoes`, painel
  no Dashboard + página `/movimentacoes` filtrável.
- Consumo mensal por setor (CEO-249/253 → **In Progress**): rota `/dashboard/consumo-mensal`,
  gráfico recharts (code-split). Backend consertado (bug que zerava o gráfico; saídas
  têm quantidade negativa → usa `Math.abs`). **Falta validar com dados reais (seed).**
- Revisado via `/code-review` (3 achados, todos corrigidos e cobertos por teste).

**Jira:** CEO-228 e CEO-252 → Done nesta rodada. CEO-249/253 comentados, mantidos
In Progress até validação com app rodando. Worker EP08 (CEO-275) com backup em
`github.com/LuizTaiguara/agente-dispensacao-worker`, ainda In Progress (sem teste
ponta-a-ponta; PO quer no monorepo).

---

## 2. Próximos passos imediatos (destravar o que está aberto)

1. **Validar consumo mensal com dados reais.** Subir app local (`start-all.sh` /
   `start-all.ps1`), rodar o seed, gerar saídas (expedir pedidos HO→CEO) e conferir o
   gráfico. Se ok, fechar **CEO-249** e **CEO-253**.
2. **Mergear o PR #49.** Convenção do projeto é PR → `develop` (este foi pra `main`
   conforme pedido; reapontar se for seguir a convenção).
3. **Restaurar o stash de apresentação** (`apresentacao-pessoal-luiz-27-06`) ao
   voltar para `develop`.

---

## 3. Melhorias propostas, por valor (com o porquê)

### Tier A — fecham histórias já no backlog (maior valor/menor risco)
- **CEO-267 — assinatura de quem retira na expedição** (High, pedido do J.Victor).
  *Por quê:* fecha o elo de auditoria da saída física; complementa o log que acabamos
  de entregar. Já há `responsavelId` na movimentação — falta capturar/exibir o retirante.
- **CEO-269 — anexar nota fiscal à entrada de lote.** *Por quê:* rastreabilidade
  fiscal; requisito comum de almoxarifado hospitalar.
- **Completar CEO-228 (gestão de usuários):** hoje só provisiona. Faltam listar /
  desativar / resetar senha (estavam nos critérios de aceite originais). *Por quê:*
  controle de acesso é segurança; meio-caminho deixa contas órfãs ativas.

### Tier B — robustez técnica (dívida estrutural)
- **TypeScript no frontend.** Backend é TS, frontend é JS solto — sem type-safety no
  contrato de API. *Por quê:* pega erros de shape em tempo de compilação; foi
  exatamente onde nasceram os bugs desta entrega (quantidade negativa, NaN).
- **Investigar o hang do `vitest run` no WSL.** A suíte completa trava (PID a 114%
  CPU); só roda arquivo-a-arquivo com `--no-file-parallelism`. *Por quê:* atrita todo
  desenvolvimento futuro; provavelmente um teste com timer/promise pendente.
- **Paginação real no log de movimentações.** Hoje é `limite` + slice em memória, com
  N+1 query para nomes. *Por quê:* não escala com histórico grande; resolver com JOIN
  no repositório e cursor.

### Tier C — produto/UX
- **Deploy real no servidor CIn.** Docker pronto, mas não publicado (depende de TI).
  *Por quê:* transforma "funciona local" em "está no ar".
- **Filtro por intervalo de datas** no log e no gráfico (hoje é fixo em meses/limite).
- **Exportar CSV** do log de movimentações. *Por quê:* almoxarife vive em planilha;
  ponte de migração suave.

---

## 4. Gaps de documentação corrigidos nesta rodada
- Criado `docs/PO/07-roadmap-metricas/05-contrato-api.md` (era referenciado pelo
  README e por 6 arquivos do frontend, mas **não existia**). Documenta §EP05 (rotas
  novas) e deixa stubs para as demais seções.
- Atualizada a coluna "Origem" de RF02.2/RF02.3 para os componentes reais.
- Adicionado o contrato ao nav do `mkdocs.yml`.

### Gaps de doc ainda abertos
- Preencher os stubs do contrato (§EP01, §EP02, §EP03/04, §Setores, §EP08) a partir
  das rotas reais em `routes.ts`.
- `docs/PO/07-roadmap-metricas/01-roadmap.md` está praticamente vazio ("TDB").
- Não há doc de "como rodar localmente" consolidada fora do README e dos scripts.

---

## 5. Como retomar (prompt sugerido)

> "Leia este metaprompt e a memória do projeto. Suba o app local, rode o seed e valide
> o gráfico de consumo mensal com dados reais; se ok, feche CEO-249/253 no Jira. Depois
> pegue CEO-267 (assinatura na expedição). Commit on branch, PR para develop, alimente
> o Jira a cada passo."
