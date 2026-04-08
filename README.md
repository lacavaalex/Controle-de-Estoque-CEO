# 🦷 Estoque Dental - Gestão Odontológica Inteligente

Protótipo de baixa fidelidade desenvolvido para otimização de fluxo de inventário em clínicas odontológicas. O sistema foca em usabilidade (UX) e integridade de dados para profissionais de saúde.

## 🚀 Funcionalidades
- **Gestão de Inventário:** Cadastro dinâmico de produtos (nome, marca, especificação e unidade).
- **Controle de Fluxo:** Registro rápido de Entradas e Saídas com validação de saldo.
- **Persistência Local:** Dados salvos automaticamente no navegador via `localStorage` (os dados não se perdem ao fechar a aba).
- **Níveis de Acesso:** Sistema de autenticação simulado para Dentistas, Técnicos e Gerentes.
- **Alertas Inteligentes:** Notificação visual para itens com estoque crítico (abaixo de 5 unidades).

## 🛠️ Tecnologias Utilizadas
- **React.js** (Vite)
- **Tailwind CSS** (Estilização moderna e responsiva)
- **Lucide-React** (Biblioteca de ícones)
- **HTML5 Web Storage API** (Persistência de dados)