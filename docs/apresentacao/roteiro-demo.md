# Roteiro da demonstração

Guia passo a passo para quem vai **operar e narrar a demonstração ao vivo**
(não é o PO — é quem conhece o sistema e vai conduzir o slide 9). Este roteiro é
literal: siga na ordem, sem improvisar fluxos novos no palco.

!!! danger "Antes de começar (checklist de 5 minutos)"
    - [ ] `bash start-all.sh --reset` rodado com sucesso (banco limpo + seed).
    - [ ] `http://localhost:5173` abre na tela de login.
    - [ ] Testou **um** login (ex.: João) e saiu, para confirmar que funciona.
    - [ ] Navegador em tela cheia, zoom ~110% para o projetor.
    - [ ] Abas extras já abertas: GitHub **Actions** (CI verde), board do **Jira**,
          o site de **documentação**.
    - [ ] Senha à mão: **`ceoufpe2026`** (todos os usuários do seed).

Tempo total alvo: **~3,5 minutos**. Não exceda — fique de olho no relógio.

---

## Fluxo A — Pedido ponta a ponta (principal · ~2 min)

> **Narrativa (PO):** "Vou mostrar o caminho completo de um pedido, do solicitante
> do CEO até a expedição pelo almoxarife, e como o estoque do CEO é alimentado
> automaticamente."

1. **Login como Solicitante CEO** — `rafael.moura@ufpe.br`.
2. Abrir **Novo Pedido**.
3. Adicionar **2 itens do catálogo** com quantidade (ex.: *Gaze* qtd 4, *Luva P* qtd 2).
4. Adicionar **1 item indisponível** (para mostrar a *demanda represada*).
5. Escrever a justificativa e **Enviar**. → o pedido nasce **pendente**.
6. **Sair** e **login como Almoxarife** — `joao.silva@ufpe.br`.
7. Abrir o pedido na fila. **Processar item a item**:
   - Escolher o **lote** — apontar que a sugestão segue **FEFO** (validade mais próxima).
   - Marcar um item **integral** e outro **parcial** (qtd menor).
8. Concluir e **mostrar que o status do pedido foi derivado** (ex.: "atendido parcial").
9. Abrir **Estoque CEO** e mostrar que os itens expedidos **entraram automaticamente** lá.

> **Pontos a verbalizar:** status derivado (não foi digitado), FEFO, e a entrada
> automática no CEO (a regra `planejarEntradaCeo`).

---

## Fluxo B — Lotes e validade (~1,5 min)

> **Narrativa (PO):** "Agora o controle de validade, que é o que evita a perda de
> material que o hospital tinha com as planilhas."

1. Como **Almoxarife** (ou Gestor HO), abrir **Estoque HO**.
2. Mostrar a coluna de **status de validade** (o seed traz lote *vencido*, *vencendo*).
3. Cadastrar um **lote novo** de um produto (entrada de estoque) e mostrar a Qtd subir.
4. **Segregar** o lote vencido em um clique → ele sai do estoque ativo.
5. Mostrar que, ao montar uma expedição, o **lote vencido não aparece** para seleção.

---

## Plano B — se algo falhar ao vivo

!!! warning "Se a aplicação travar, não insista no fluxo quebrado"
    Tenha estes fallbacks prontos, em ordem de preferência:

    1. **Recarregar a página** (F5) e tentar o passo de novo — costuma resolver.
    2. **Reiniciar rápido:** num terminal já aberto, `Ctrl+C` e `bash start-all.sh`
       (sem `--reset`, para não perder o estado da demo).
    3. **Cair para os prints:** ter no site/slides capturas de tela dos dois fluxos
       já prontas, e narrar por cima delas.
    4. **Triagem do agente (EP08):** se quiser mostrar o agente mesmo sem a caixa de
       e-mail, criar um rascunho pela API de serviço (`POST /rascunhos`) e abri-lo na
       tela de **Triagem** para aprovar. Demonstra o EP08 sem depender de IMAP.

---

## Perguntas antecipadas (Q&A)

Munição para as perguntas mais prováveis dos professores.

??? question "Vocês testaram a API com Postman?"
    Não usamos Postman. Temos **137 testes automatizados no backend** (Vitest),
    cobrindo serviços e regras de negócio, rodando **contra um banco real** (não só
    mocks), mais 53 no frontend. É uma garantia mais forte e repetível que cliques
    manuais, e roda no **CI a cada PR**. O trecho que ainda falta validar ponta a
    ponta é a ingestão por e-mail do agente, que depende de uma caixa institucional
    (documentado no [ADR-0004](../adr/ADR-0004.md)).

??? question "Por que monólito e não microsserviços?"
    Pelo escopo (um subdepartamento piloto) e o prazo (45 dias): o monólito dá
    desenvolvimento e deploy mais simples, testes de integração diretos e
    consistência transacional fácil. A modularidade interna (camadas + portas) já
    deixa o caminho aberto para extrair serviços se um dia precisar. Ver
    [ADR-0002](../adr/ADR-0002.md) e [ADR-0007](../adr/ADR-0007.md).

??? question "O status do pedido pode ficar inconsistente?"
    Não, por construção. O status **não é armazenado como verdade** — é **derivado**
    dos status dos itens por uma função pura (`statusDerivadoDoPedido`, RN10). A
    fonte de verdade são os itens; o cabeçalho é sempre recalculado. Ver
    [ADR-0008](../adr/ADR-0008.md).

??? question "Vocês usam mesmo Ports & Adapters? É arquitetura hexagonal pura?"
    Aplicamos Ports & Adapters de forma **pragmática, não dogmática**. Na
    persistência, sim: definimos **interfaces de repositório** (ports) e
    implementações Postgres/JSON (adapters), com injeção de dependência no
    `container.ts`. A prova de que a abstração funciona é termos **dois adapters
    para a mesma porta** (`JsonItemRepo` e `PgItemRepo`), trocáveis sem tocar o
    service; 6 dos 8 services dependem só da interface.

    **Onde abrimos exceção, conscientemente:** operações que coordenam várias
    tabelas atomicamente (a expedição de lote — baixa no lote + saída no HO +
    entrada no CEO) acessam o `db.transaction` do Drizzle diretamente, e o port
    aceita um executor de transação na assinatura. Abstrair isso atrás de portas
    puras (um Unit of Work próprio) adicionaria complexidade significativa para um
    ganho marginal no escopo de 45 dias; a **consistência transacional** tem
    precedência sobre a pureza do padrão nesses casos. Conhecemos o trade-off e o
    documentamos no [ADR-0007](../adr/ADR-0007.md).

??? question "Vocês usaram IA para fazer o projeto?"
    Sim, como **ferramenta de engenharia e gestão**, de forma transparente e
    supervisionada — nunca para gerar código sem revisão. Todo código passou por
    **Pull Request com code review humano** e **CI**. As ferramentas (Agent Skills,
    o hook de design Impeccable, revisão assistida, MCP do Jira) estão documentadas
    no [ADR-0011](../adr/ADR-0011.md). A autoria das decisões é humana e rastreável.

??? question "A aplicação está em produção?"
    A stack (4 containers Docker) está **construída e validada localmente**. O
    deploy no servidor compartilhado do CIn depende de acesso à infraestrutura da
    TI; o procedimento está documentado e é essencialmente um comando. A demo de
    hoje roda localmente. Ver [Infraestrutura](../infra/deploy.md).

??? question "Como vocês garantiram a qualidade do código?"
    Quatro camadas: **CI** (190 testes + type-check por PR), **code review humano**
    obrigatório no PR, **revisão assistida** da lógica (`/code-review`) e o **hook
    Impeccable** para o design do frontend. Mais exemplos concretos de refatoração
    (ex.: extrair a regra de status para o domínio puro). Ver [Qualidade](../qualidade/ci.md).
