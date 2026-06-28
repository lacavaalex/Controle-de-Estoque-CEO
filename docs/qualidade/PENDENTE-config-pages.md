# Pendência (admin): habilitar GitHub Pages via Actions

O job **`Deploy (GitHub Pages)`** do workflow `.github/workflows/docs.yml` falha
porque o GitHub Pages do repositório **não está com a origem "GitHub Actions"**.
Isso é um ajuste único nas configurações do repositório e **exige permissão Admin**
(não dá para fazer por API/PR com permissão de escrita — retorna 404).

## Como resolver (≈ 30 segundos)

1. Vá em **Settings → Pages** do repositório
   (`https://github.com/lacavaalex/Controle-de-Estoque-CEO/settings/pages`).
2. Em **Build and deployment → Source**, selecione **GitHub Actions**.
3. Salve. No próximo push em `develop`, o job `Deploy (GitHub Pages)` passa e o
   site de documentação publica automaticamente.

> Enquanto isso não é feito, o **build** do site (`mkdocs build --strict`) continua
> verde — só a *publicação* fica pendente. Nenhum merge é bloqueado por isso, a não
> ser que o `Deploy` seja marcado como check obrigatório na Branch Protection
> (não recomendado — exija apenas `Build`, `Backend` e `Frontend`).
