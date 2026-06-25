# Controle de Estoque — CEO / Hospital Odontológico da UFPE

> Sistema web para o controle de materiais consumíveis entre a **Unidade de
> Dispensação (almoxarifado HO)** e o **Centro de Especialidades Odontológicas
> (CEO)** do Hospital Odontológico da UFPE.
>
> Projeto da disciplina de Engenharia de Software — **Grupo 5, CIn-UFPE**.

---

## O problema, em uma frase

O hospital controla o estoque por **planilhas de Excel**, o que gera divergência
entre o estoque registrado e o físico, ausência de rastreabilidade dos pedidos e
**perda de materiais por vencimento sem alerta**.

## O insight que mudou o projeto

A demanda inicial dizia que *"o CEO não tem controle de estoque"*. Ao investigar o
fluxo real com o almoxarife, percebemos que **o CEO não tem estoque próprio para
controlar — ele depende inteiramente do HO**, a Unidade de Dispensação que abastece
os subdepartamentos clínicos.

Isso reposicionou o escopo:

- **O HO (Dispensação) é a fonte de verdade** do estoque — onde os materiais
  entram, são loteados e expedidos.
- **O CEO é a célula-piloto** de organização: o primeiro setor a validar o fluxo
  digital de pedidos e o estoque local alimentado automaticamente pelas expedições.
- A arquitetura é **modular**, para que outras células (CME, laboratórios,
  Endodontia, Cirurgia) sejam acopladas depois com o mesmo modelo.

## Quem usa

| Perfil | O que faz |
|--------|-----------|
| **Gestor (HO)** | Super-usuário global: vê todos os setores, gere catálogo, lotes, usuários e dashboards. |
| **Almoxarife (HO)** | Processa pedidos item-a-item (FEFO), gere lotes e validade. |
| **Gestor (CEO)** | Gere o estoque local do CEO (consumo, ajuste de inventário). |
| **Solicitante (CEO)** | Cria pedidos multi-item para a Dispensação. |

## Principais funcionalidades

- **Catálogo × Lotes** (1:N) com controle de validade e segregação de vencidos.
- **Pedidos multi-item, multi-setor**, com status **derivado** dos itens e
  aprovação parcial (FEFO sugerido na expedição).
- **Estoque do CEO alimentado automaticamente** pelas expedições do HO.
- **Dashboards por perfil**: itens críticos, vencendo, demanda represada, consumo
  por setor.
- **Agente de e-mail (EP08)** — uma decisão de **UX**: em vez de obrigar
  solicitantes esporádicos a aprender um sistema, um agente lê os e-mails que eles
  já enviam e cria o pedido como rascunho para o almoxarife revisar.

---

## Como esta documentação está organizada

A navegação segue os **critérios de avaliação da entrega final**:

1. **[Problema & Visão](PO/01-discovery/01-contexto-e-problema.md)** — contexto, stakeholders, personas, escopo.
2. **[Requisitos & Backlog](PO/04-requisitos/01-requisitos-funcionais.md)** — RFs, RNFs, épicos, User Stories, roadmap.
3. **[Domínio & Regras](PO/06-dominio-regras/01-glossario.md)** — glossário, regras de negócio, modelo de dados.
4. **[Arquitetura & Decisões](adr/index.md)** — os **ADRs** que registram cada decisão arquitetural.
5. **[Qualidade & Testes](qualidade/como-testar.md)** — estratégia de testes, CI, como rodar.
6. **[Infraestrutura & Deploy](infra/deploy.md)** — Docker, arquitetura de implantação.
7. **[Entrega & Relatórios](relatorios/status-entrega-2026-06-23.md)** — status, roteiro da demo, slides.

!!! note "Sobre o uso de IA neste projeto"
    A equipe usou assistentes de IA como **ferramenta de engenharia e gestão**
    (não para gerar código sem supervisão). O método está documentado de forma
    transparente no **[ADR-0011](adr/ADR-0011.md)**, e todo código passou por
    Pull Request com revisão humana e CI.

---

## Stack resumida

=== "Backend"

    Express 5 · Drizzle ORM · PostgreSQL 16 · JWT + bcrypt · Vitest
    Arquitetura em camadas (Ports & Adapters) · domínio puro testável

=== "Frontend"

    React 19 · React Router 7 · Vite 8 · Context API · Vitest + Testing Library

=== "Infra & Qualidade"

    Docker Compose (4 containers) · Nginx (proxy, subcaminho `/estoque-ho`)
    CI no GitHub Actions · **190 testes** automatizados (137 backend + 53 frontend)
