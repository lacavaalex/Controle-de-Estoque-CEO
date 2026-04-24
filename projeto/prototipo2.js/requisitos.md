# CEO Estoque UFPE — Requisitos do Sistema

**Projeto:** Sistema de Controle de Estoque do Centro de Especialidades Odontológicas — UFPE
**Data:** 23/04/2026

---

## 1. Requisitos Funcionais

### RF01 — Autenticação e Controle de Acesso

| ID | Descrição |
|---|---|
| RF01.1 | O sistema deve permitir login por e-mail e senha. |
| RF01.2 | O sistema deve suportar três perfis de acesso: **Gestão**, **Almoxarife** e **Dentista CEO**. |
| RF01.3 | O sistema deve restringir rotas e funcionalidades de acordo com o perfil do usuário autenticado. |
| RF01.4 | O sistema deve manter a sessão do usuário ativa enquanto o navegador estiver aberto. |
| RF01.5 | O sistema deve permitir logout a qualquer momento. |

### RF02 — Dashboard

| ID | Descrição |
|---|---|
| RF02.1 | O sistema deve exibir indicadores-chave (KPIs): total de itens, itens vencendo, estoque crítico e solicitações pendentes. |
| RF02.2 | O dashboard da **Gestão** deve exibir gráfico de consumo mensal (Dispensação vs CEO), lista de itens próximos ao vencimento, alertas de estoque e log de movimentações. |
| RF02.3 | O dashboard do **Almoxarife** deve exibir KPIs, fila de solicitações pendentes com ações de aprovar/negar, e alertas de estoque. |
| RF02.4 | O dashboard do **Dentista** deve exibir cards com o estoque do CEO, suas solicitações recentes e botão para nova solicitação. |
| RF02.5 | Os KPIs devem refletir em tempo real as alterações feitas no estoque. |

### RF03 — Gestão de Estoque da Dispensação

| ID | Descrição |
|---|---|
| RF03.1 | O sistema deve listar todos os itens do estoque da Dispensação em tabela com: nome, lote, quantidade, unidade, estoque mínimo/máximo, localização, validade e status. |
| RF03.2 | O **Almoxarife** e a **Gestão** devem poder **adicionar** novos itens ao estoque. |
| RF03.3 | O **Almoxarife** e a **Gestão** devem poder **editar** itens existentes. |
| RF03.4 | O **Almoxarife** e a **Gestão** devem poder **remover** itens do estoque, com confirmação prévia. |
| RF03.5 | O sistema deve permitir filtrar itens por **nome/lote**, **categoria** e **status**. |
| RF03.6 | O sistema deve calcular e exibir automaticamente o status de cada item (Normal, Baixo, Crítico, Vencendo, Vencido, Excessivo). |
| RF03.7 | Linhas de itens críticos, vencidos ou excessivos devem ser destacadas visualmente na tabela. |

### RF04 — Estoque do CEO

| ID | Descrição |
|---|---|
| RF04.1 | O sistema deve listar os itens disponíveis no estoque do CEO com quantidade e status (Disponível, Baixo, Crítico, Indisponível). |
| RF04.2 | Todos os perfis devem ter acesso de leitura ao estoque do CEO. |

### RF05 — Solicitações

| ID | Descrição |
|---|---|
| RF05.1 | O **Dentista** deve poder criar uma solicitação informando: item desejado, quantidade e justificativa. |
| RF05.2 | O **Almoxarife** deve poder **aprovar** solicitações pendentes. |
| RF05.3 | O **Almoxarife** deve poder **negar** solicitações pendentes, informando uma observação/motivo. |
| RF05.4 | O sistema deve registrar data, responsável e observação em cada ação de aprovação ou negação. |
| RF05.5 | O sistema deve permitir visualização das solicitações por abas: Pendentes, Aprovadas e Negadas. |
| RF05.6 | O **Dentista** deve visualizar apenas suas próprias solicitações. |

### RF06 — Alertas e Monitoramento

| ID | Descrição |
|---|---|
| RF06.1 | O sistema deve alertar quando um item estiver com quantidade **abaixo do estoque mínimo**. |
| RF06.2 | O sistema deve alertar quando um item estiver **vencendo em 30 ou 60 dias**, ou **já vencido**. |
| RF06.3 | O sistema deve alertar quando um item estiver com quantidade **acima de 95% do estoque máximo** (excessivo). |
| RF06.4 | O sistema deve exibir um log das últimas movimentações de entrada, saída e ajuste. |

### RF07 — Navegação

| ID | Descrição |
|---|---|
| RF07.1 | O sistema deve ter uma barra lateral (sidebar) com links para Dashboard, Estoque Dispensação, Estoque CEO e Solicitações. |
| RF07.2 | A rota "Estoque Dispensação" deve ser **oculta** para o perfil Dentista. |
| RF07.3 | Tentativa de acesso a rota não autorizada deve redirecionar para o Dashboard. |

---

## 2. Requisitos Não Funcionais

### RNF01 — Usabilidade

| ID | Descrição |
|---|---|
| RNF01.1 | A interface deve seguir a identidade visual da UFPE (bordô `#990000`, preto, branco). |
| RNF01.2 | O sistema deve ser responsivo, adaptando-se a telas de desktop, tablet e celular. |
| RNF01.3 | Ações destrutivas (remoção de itens, negação de solicitações) devem exigir confirmação do usuário. |
| RNF01.4 | Campos obrigatórios em formulários devem ser indicados visualmente e validados antes do envio. |
| RNF01.5 | O sistema deve fornecer feedback visual imediato ao realizar ações (badges de status, destaque de linhas). |

### RNF02 — Desempenho

| ID | Descrição |
|---|---|
| RNF02.1 | A interface deve carregar em menos de 2 segundos em conexões padrão. |
| RNF02.2 | Atualizações de estado (adicionar/editar/remover itens) devem refletir na tela sem recarregamento de página. |

### RNF03 — Segurança

| ID | Descrição |
|---|---|
| RNF03.1 | O acesso às funcionalidades deve ser controlado por perfil de usuário (RBAC). |
| RNF03.2 | Sessões devem expirar ao fechar o navegador. |
| RNF03.3 | Em uma versão de produção, senhas devem ser armazenadas com hash seguro (bcrypt ou equivalente). |
| RNF03.4 | Em uma versão de produção, a comunicação deve ser feita via HTTPS. |

### RNF04 — Manutenibilidade

| ID | Descrição |
|---|---|
| RNF04.1 | O código deve ser modular, com separação entre páginas, componentes, contextos e dados. |
| RNF04.2 | Componentes de UI devem ser reutilizáveis (Button, Card, Badge, Modal, Input, Select). |
| RNF04.3 | A fonte de dados deve estar centralizada em um único módulo, facilitando a substituição por um backend real. |

### RNF05 — Compatibilidade

| ID | Descrição |
|---|---|
| RNF05.1 | O sistema deve funcionar nos navegadores Chrome, Firefox, Edge e Safari em suas versões mais recentes. |
| RNF05.2 | O sistema deve funcionar em sistemas operacionais Windows, macOS e Linux. |

### RNF06 — Portabilidade

| ID | Descrição |
|---|---|
| RNF06.1 | A arquitetura deve permitir substituição da camada de dados (hardcoded) por uma API REST sem reescrever os componentes de interface. |
| RNF06.2 | O sistema deve ser implantável em qualquer servidor web estático (Vercel, Netlify, GitHub Pages) ou com backend próprio. |
