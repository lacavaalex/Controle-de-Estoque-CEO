#!/bin/bash
set -e

MIGRATIONS_DIR="/migrations"
SEEDS_DIR="/seeds"

echo "Aplicando migrations..."
for f in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
    echo "  -> $f"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
done

echo "Aplicando seeds..."
for f in $(ls "$SEEDS_DIR"/*.sql | sort); do
    echo "  -> $f"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
done

echo "Banco inicializado com sucesso."
