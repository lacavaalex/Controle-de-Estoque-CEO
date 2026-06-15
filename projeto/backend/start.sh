#!/usr/bin/env bash
# =============================================================================
# CEO-UFPE — Bootstrap do backend em UM comando.
# Sobe Postgres (docker), instala deps, aplica schema, popula dados e roda a API.
# Uso (a partir de projeto/backend):   bash start.sh
#   bash start.sh --reset   -> derruba o banco e recria do zero (apaga dados)
#   bash start.sh --no-dev  -> prepara tudo mas NÃO sobe a API (só deixa pronto)
# Requer: Docker Desktop ligado, Node 20+.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")"

RESET=0; NODEV=0
for arg in "$@"; do
  case "$arg" in
    --reset) RESET=1 ;;
    --no-dev) NODEV=1 ;;
    *) echo "Argumento desconhecido: $arg"; exit 1 ;;
  esac
done

say() { printf "\n\033[1;31m==> %s\033[0m\n" "$1"; }   # vermelho UFPE :)

# 0. Pré-checagens -------------------------------------------------------------
command -v docker >/dev/null || { echo "Docker não encontrado. Ligue o Docker Desktop."; exit 1; }
command -v node   >/dev/null || { echo "Node não encontrado. Instale Node 20+."; exit 1; }
docker info >/dev/null 2>&1   || { echo "Docker daemon não está rodando. Abra o Docker Desktop e tente de novo."; exit 1; }

# 1. .env ----------------------------------------------------------------------
if [ ! -f .env ]; then
  say "Criando .env a partir de .env.example"
  cp .env.example .env
else
  echo ".env já existe — mantendo."
fi

# 2. Postgres ------------------------------------------------------------------
if [ "$RESET" -eq 1 ]; then
  say "Reset: derrubando banco e volume"
  docker compose down -v
fi
say "Subindo Postgres (porta 5433)"
docker compose up -d

# Espera o healthcheck ficar 'healthy'
say "Aguardando o banco ficar pronto"
for i in $(seq 1 30); do
  status=$(docker inspect -f '{{.State.Health.Status}}' ceo-estoque-db 2>/dev/null || echo "starting")
  [ "$status" = "healthy" ] && { echo "Banco pronto."; break; }
  printf "."; sleep 2
  [ "$i" -eq 30 ] && { echo " timeout esperando o banco."; exit 1; }
done

# 3. Dependências --------------------------------------------------------------
if [ ! -d node_modules ]; then
  say "Instalando dependências (npm install)"
  npm install
else
  echo "node_modules já existe — pulando install."
fi

# 4. Schema + dados ------------------------------------------------------------
say "Aplicando migrations (drizzle)"
npm run db:migrate
say "Populando dados de exemplo (seed)"
npm run db:seed

# 5. Resumo --------------------------------------------------------------------
cat <<'EOF'

──────────────────────────────────────────────────────────────
 Pronto. Banco no ar (localhost:5433) com dados de exemplo.

 Usuários de teste (senha de todos: ceoufpe2026):
   gestor HO ......... ana.costa@ufpe.br
   almoxarife HO ..... joao.silva@ufpe.br
   solicitante CEO ... rafael.moura@ufpe.br
   gestora CEO ....... helena.lima@ufpe.br

 Comandos úteis:
   npm run dev        -> sobe a API em http://localhost:3000
   npm test           -> roda os testes (vitest)
   npm run db:studio  -> abre o Drizzle Studio (inspecionar o banco)
   bash start.sh --reset  -> recomeça o banco do zero
──────────────────────────────────────────────────────────────
EOF

# 6. API -----------------------------------------------------------------------
if [ "$NODEV" -eq 1 ]; then
  say "Tudo pronto (--no-dev: API não iniciada). Rode 'npm run dev' quando quiser."
else
  say "Subindo a API (Ctrl+C para parar)"
  npm run dev
fi
