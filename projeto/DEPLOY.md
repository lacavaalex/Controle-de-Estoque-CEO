# Deploy com Docker

A stack roda em quatro containers orquestrados por um `docker compose`: nginx
(proxy reverso), frontend (React/Vite servido por nginx), backend (Express) e
Postgres. Tudo fica sob o subcaminho `/estoque-ho`, pra encaixar no domínio
compartilhado `clinicasdigitais.cin.ufpe.br`.

```
browser → nginx → frontend (SPA)
                → backend (Express :3000) → Postgres
```

## Subir

```bash
cd projeto
docker compose up -d --build
```

App em http://localhost/estoque-ho/ — a API entra por http://localhost/estoque-ho/api.

Para parar: `docker compose down` (mantém o banco) ou `docker compose down -v`
(apaga o volume do Postgres também).

## Portas e isolamento

Só o nginx publica porta no host (80). Backend e Postgres ficam na rede interna
do compose, sem `ports:` — não dá pra acessar de fora a não ser pelo proxy.

## No servidor do CIn

O `server` de `clinicasdigitais.cin.ufpe.br` é compartilhado entre as clínicas;
cada uma entra como um conjunto de `location`. Os nossos estão em
`deploy/nginx/estoque-ho.conf` — é só somar esses `location` ao server do
domínio (ajustando os `proxy_pass` para os hosts reais dos containers na VM).

O banco é um Postgres local em container (não é serviço externo). Se a turma for
consolidar um Postgres por tipo, apontar `DATABASE_URL` pro banco compartilhado
e remover o serviço `db` daqui resolve.

## Variáveis

Os defaults estão no `docker-compose.yml`. Em produção, crie um `.env` ao lado
dele sobrescrevendo o que for sensível:

```env
POSTGRES_PASSWORD=...
JWT_SECRET=...
AGENTE_TOKEN=...
SEED_ON_BOOT=false
```

## Trocar o subcaminho (outra clínica)

Substituir `estoque-ho` por `<nome>` em três lugares: os build args do frontend
no `docker-compose.yml`, o `frontend/nginx.conf` e o `deploy/nginx/estoque-ho.conf`.
O basename do react-router acompanha sozinho (vem do `base` do Vite).
