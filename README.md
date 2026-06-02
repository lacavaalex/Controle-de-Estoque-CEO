# Controle de Estoque — CEO / Hospital Odontológico UFPE

Sistema web para o controle do estoque de materiais consumíveis entre a
Unidade de Dispensação e o Centro de Especialidades Odontológicas (CEO) do
Hospital Odontológico da UFPE.

## Contexto

O hospital opera hoje com planilhas de Excel para registrar a saída de
materiais entre o almoxarifado central (Dispensação) e os subdepartamentos
clínicos. Isso gera divergência entre estoque registrado e estoque físico,
falta de rastreabilidade dos pedidos e perda de itens por vencimento sem
alerta.

O CEO é o subdepartamento piloto desta primeira fase. A ideia é validar a
solução nele antes de expandir para os demais (Endodontia, Cirurgia,
Radiologia etc.).

## O que o sistema faz

- Cadastro e listagem dos itens do estoque (com filtros por categoria, lote,
  status).
- Cálculo automático de status: Crítico, Vencendo, Vencido, Excessivo, etc.
- Fluxo de solicitação de material: o dentista pede, o almoxarife aprova ou
  nega.
- Registro auditável de toda movimentação (entrada, saída, ajuste).
- Três perfis de acesso (gestão, almoxarife, dentista) com permissões
  diferentes.

## Estrutura do repositório

```
Controle-de-Estoque-CEO/
├── docs/PO/             documentação de produto (requisitos, regras, modelo)
├── docs/db/             documentação técnica do banco
├── projeto/backend/     API em Node.js + Express + TypeScript + PostgreSQL
└── DS-prototype/        protótipo navegável em React (referência de UI)
```

## Como rodar

Pré-requisitos: Node.js 20+ e Docker (ou um PostgreSQL acessível).

```powershell
cd projeto\backend
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

A API sobe em `http://localhost:3000`. As credenciais e a string de conexão
estão em `projeto/backend/.env.example`.

## Documentação

| Documento                         | Caminho                                              |
| --------------------------------- | ---------------------------------------------------- |
| Contexto e problema               | `docs/PO/01-discovery/01-contexto-e-problema.md`     |
| Requisitos funcionais             | `docs/PO/04-requisitos/01-requisitos-funcionais.md`  |
| Requisitos não funcionais         | `docs/PO/04-requisitos/02-requisitos-nao-funcionais.md` |
| Backlog (user stories)            | `docs/PO/05-backlog/02-user-stories.md`              |
| Glossário                         | `docs/PO/06-dominio-regras/01-glossario.md`          |
| Regras de negócio                 | `docs/PO/06-dominio-regras/02-regras-de-negocio.md`  |
| Modelo conceitual                 | `docs/PO/06-dominio-regras/03-modelo-conceitual.md`  |
| Banco de dados                    | `docs/db/README.md`                                  |

## Status

Projeto em desenvolvimento — disciplina de Desenvolvimento de Sistemas
(UFPE), com piloto previsto para o CEO.
