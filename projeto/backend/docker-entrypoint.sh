#!/bin/sh
# Espera o banco, aplica migrations, roda o seed e sobe a API.
set -e

DB_HOST="${POSTGRES_HOST:-db}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-ceo}"

echo "[entrypoint] aguardando Postgres em ${DB_HOST}:${DB_PORT}..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; do
  sleep 1
done
echo "[entrypoint] Postgres pronto."

npm run db:migrate

# SEED_ON_BOOT=false em produção pra não repopular dados de exemplo.
if [ "${SEED_ON_BOOT:-true}" = "true" ]; then
  npm run db:seed || echo "[entrypoint] seed falhou/já aplicado — seguindo."
fi

exec node dist/server.js
