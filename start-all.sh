#!/usr/bin/env bash
# =============================================================================
# CEO-UFPE — Sobe TUDO com um comando: banco + API (backend) + UI (frontend).
#
# Uso (a partir da raiz do repositório):
#   bash start-all.sh
#   bash start-all.sh --reset   -> recria o banco do zero (apaga dados) e sobe tudo
#
# O que faz:
#   1. Roda projeto/backend/start.sh --no-dev (Docker Postgres + migrate + seed).
#   2. Sobe a API (npm run dev) em background, em http://localhost:3000.
#   3. Sobe o frontend (npm run dev) em primeiro plano, em http://localhost:5173.
#   4. Ctrl+C encerra os DOIS processos (a API junto com o front).
#
# Requer: Docker Desktop ligado e Node 20+ (o start.sh checa isso pra você).
# O banco (container) continua rodando após o Ctrl+C — pare com:
#   cd projeto/backend && docker compose down
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")"

BACKEND="projeto/backend"
FRONTEND="projeto/frontend"
API_PID=""

say() { printf "\n\033[1;31m==> %s\033[0m\n" "$1"; }   # vermelho UFPE

# Garante que a API morra quando este script terminar (Ctrl+C, erro, ou saída).
cleanup() {
  if [ -n "$API_PID" ] && kill -0 "$API_PID" 2>/dev/null; then
    say "Encerrando a API (pid $API_PID)"
    kill "$API_PID" 2>/dev/null || true
    wait "$API_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# 1. Banco + migrations + seed (reaproveita o start.sh, sem subir a API ainda) --
say "Preparando banco e backend (start.sh --no-dev)"
( cd "$BACKEND" && bash start.sh --no-dev "$@" )

# 2. API em background ---------------------------------------------------------
say "Subindo a API em http://localhost:3000 (background)"
( cd "$BACKEND" && npm run dev ) &
API_PID=$!

# Espera a API responder (evita o front subir antes do backend estar pronto).
say "Aguardando a API ficar pronta"
for i in $(seq 1 45); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/health 2>/dev/null || echo 000)
  if [ "$code" = "200" ]; then
    echo "API pronta."
    break
  fi
  if ! kill -0 "$API_PID" 2>/dev/null; then
    echo "A API encerrou logo no início. Verifique os logs acima." >&2
    exit 1
  fi
  printf "."; sleep 1
  if [ "$i" -eq 45 ]; then
    echo " timeout — a API não respondeu em :3000/health." >&2
    exit 1
  fi
done

# 3. Dependências do frontend (só na 1ª vez) -----------------------------------
if [ ! -d "$FRONTEND/node_modules" ]; then
  say "Instalando dependências do frontend (npm install)"
  ( cd "$FRONTEND" && npm install )
fi

# 4. Frontend em primeiro plano ------------------------------------------------
cat <<'EOF'

──────────────────────────────────────────────────────────────
 Tudo no ar:
   API ........ http://localhost:3000
   Frontend ... http://localhost:5173   (abre quando o Vite terminar de subir)

 Login (senha de todos: ceoufpe2026):
   gestor HO ......... ana.costa@ufpe.br
   almoxarife HO ..... joao.silva@ufpe.br
   solicitante CEO ... rafael.moura@ufpe.br
   gestora CEO ....... helena.lima@ufpe.br

 Ctrl+C encerra API + frontend. O banco (Docker) segue rodando;
 pare com:  cd projeto/backend && docker compose down
──────────────────────────────────────────────────────────────
EOF
say "Subindo o frontend (Ctrl+C para parar tudo)"
( cd "$FRONTEND" && npm run dev )
