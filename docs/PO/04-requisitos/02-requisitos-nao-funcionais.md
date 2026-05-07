# Requisitos Não Funcionais

**Documento:** 02-requisitos-nao-funcionais
**Última atualização:** 07/05/2026

---

## Convenções

- **Prioridade:** MoSCoW — `Must`, `Should`, `Could`, `Wont`.
- **Verificação:** como o requisito será aferido (manual, ferramenta, métrica).

---

## RNF01 — Usabilidade

| ID | Descrição | Prioridade | Verificação |
|----|-----------|-----------|-------------|
| RNF01.1 | A interface **deve seguir a identidade visual da UFPE**: bordô `#990000` como cor primária, complementada por preto e branco. | Must | Inspeção visual + design tokens |
| RNF01.2 | O sistema **deve ser responsivo**, adaptando-se a desktop e tablet (≥ 768px). Mobile (< 768px) com layout funcional, mesmo que reduzido. | Must | Teste em breakpoints |
| RNF01.3 | Ações destrutivas (remover item, negar solicitação) **devem exigir confirmação** explícita do usuário. | Must | Inspeção UX |
| RNF01.4 | Campos obrigatórios em formulários **devem ser indicados visualmente** (asterisco vermelho `*`) e validados antes do envio. | Must | Inspeção UX |
| RNF01.5 | O sistema **deve fornecer feedback visual imediato**: badges de status, destaque de linhas, mensagens inline de sucesso/erro. | Must | Inspeção UX |
| RNF01.6 | O sistema **deve usar linguagem clara em português brasileiro**, sem jargão técnico desnecessário. | Must | Revisão de PO |
| RNF01.7 | Tempo de aprendizado para um novo dentista realizar sua primeira solicitação **deve ser ≤ 5 minutos** sem treinamento formal. | Should | Teste de usabilidade |
| RNF01.8 | O sistema **deve atender critérios WCAG 2.1 nível AA** de acessibilidade. | Could | Auditoria axe-core |

## RNF02 — Desempenho

| ID | Descrição | Prioridade | Verificação |
|----|-----------|-----------|-------------|
| RNF02.1 | A interface **deve carregar em ≤ 2 segundos** em conexão padrão (10 Mbps). | Must | Lighthouse |
| RNF02.2 | Atualizações de estado (adicionar/editar/remover) **devem refletir na tela sem recarregamento**. | Must | Inspeção manual |
| RNF02.3 | A tabela de estoque **deve suportar até 1000 itens** sem perda perceptível de fluidez. | Should | Teste de carga |
| RNF02.4 | Aprovar/negar solicitação **deve completar em ≤ 500ms** após o clique. | Should | Métrica de UX |

## RNF03 — Segurança

| ID | Descrição | Prioridade | Verificação |
|----|-----------|-----------|-------------|
| RNF03.1 | O acesso a funcionalidades **deve ser controlado por perfil de usuário** (RBAC). | Must | Inspeção de código |
| RNF03.2 | A sessão **deve expirar ao fechar o navegador** (sessionStorage, não localStorage). | Must | Inspeção comportamental |
| RNF03.3 | Em produção, **senhas devem ser armazenadas com hash** (bcrypt ou argon2). | Must (produção) | Code review |
| RNF03.4 | Em produção, a comunicação **deve ser feita via HTTPS**. | Must (produção) | Configuração de servidor |
| RNF03.5 | O sistema **deve registrar tentativas de login** falhas para auditoria. | Should | Inspeção de logs |
| RNF03.6 | O sistema **deve invalidar a sessão** quando o usuário fizer logout explícito. | Must | Inspeção comportamental |
| RNF03.7 | Toda chamada à API **deve verificar o token de sessão** e o perfil do usuário. | Must (backend) | Code review |
| RNF03.8 | O sistema **deve limitar tentativas** de login (rate limit ≥ 5/min por IP). | Could | Configuração de rate limit |

## RNF04 — Manutenibilidade

| ID | Descrição | Prioridade | Verificação |
|----|-----------|-----------|-------------|
| RNF04.1 | O código **deve ser modular**, com separação clara entre páginas, componentes, contextos, dados e rotas. | Must | Inspeção de estrutura |
| RNF04.2 | Componentes de UI **devem ser reutilizáveis**: Button, Card, Badge, Modal, Input, Select. | Must | Inspeção de componentes |
| RNF04.3 | A fonte de dados **deve estar centralizada** em um único módulo (`data/data.js` no protótipo), facilitando substituição por API. | Must | Inspeção de código |
| RNF04.4 | O sistema **deve ter padrão de commit** (Conventional Commits). | Should | Inspeção de histórico |
| RNF04.5 | O sistema **deve ter pelo menos 60% de cobertura de testes** unitários para regras de negócio críticas. | Could (v1.x) | CI / coverage report |

## RNF05 — Compatibilidade

| ID | Descrição | Prioridade | Verificação |
|----|-----------|-----------|-------------|
| RNF05.1 | O sistema **deve funcionar em** Chrome, Firefox, Edge e Safari nas versões mais recentes (≤ 2 anos). | Must | Teste manual |
| RNF05.2 | O sistema **deve funcionar em** Windows, macOS e Linux. | Must | Teste manual |
| RNF05.3 | O sistema **deve funcionar em iPad** (Safari iPadOS) e tablets Android (Chrome ≥ 110). | Should | Teste manual |

## RNF06 — Portabilidade

| ID | Descrição | Prioridade | Verificação |
|----|-----------|-----------|-------------|
| RNF06.1 | A arquitetura **deve permitir substituir** a camada de dados (hardcoded) por API REST sem reescrever os componentes de interface. | Must | Inspeção de arquitetura |
| RNF06.2 | O sistema **deve ser implantável** em servidor web estático (Vercel, Netlify, GitHub Pages) ou em servidor próprio da UFPE. | Must | Pipeline de deploy |
| RNF06.3 | O sistema **deve ter variáveis de ambiente documentadas** em `.env.example`. | Must | Inspeção de repositório |

## RNF07 — Confiabilidade e Auditoria

| ID | Descrição | Prioridade | Verificação |
|----|-----------|-----------|-------------|
| RNF07.1 | Toda criação, edição, remoção, aprovação ou negação **deve gerar registro** com usuário, data e ação. | Must | Inspeção de logs |
| RNF07.2 | O sistema **deve ter rotina de backup diário** dos dados em produção. | Must (produção) | Configuração de infra |
| RNF07.3 | O sistema **deve ter SLA de disponibilidade ≥ 98%** durante horário comercial (8h–20h). | Should | Monitoração |
| RNF07.4 | Em caso de falha de rede, o sistema **deve exibir mensagem clara** ao usuário e oferecer ação de retry. | Should | Inspeção UX |

## RNF08 — Conformidade Legal

| ID | Descrição | Prioridade | Verificação |
|----|-----------|-----------|-------------|
| RNF08.1 | O sistema **deve respeitar a LGPD** quanto aos dados pessoais dos usuários (nome, e-mail, cargo). | Must | Revisão jurídica |
| RNF08.2 | O sistema **não deve armazenar dados clínicos** de pacientes — está fora do escopo. | Must | Revisão de produto |
| RNF08.3 | O sistema **deve ter termo de uso** apresentado no primeiro acesso. | Should (produção) | Revisão jurídica |

---

## Resumo

| Categoria | Must | Should | Could | Wont |
|-----------|------|--------|-------|------|
| Usabilidade | 6 | 1 | 1 | 0 |
| Desempenho | 2 | 2 | 0 | 0 |
| Segurança | 5 | 1 | 1 | 0 |
| Manutenibilidade | 3 | 1 | 1 | 0 |
| Compatibilidade | 2 | 1 | 0 | 0 |
| Portabilidade | 3 | 0 | 0 | 0 |
| Confiabilidade | 2 | 2 | 0 | 0 |
| Conformidade | 2 | 1 | 0 | 0 |
| **Total** | **25** | **9** | **3** | **0** |
