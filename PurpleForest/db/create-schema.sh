#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

source "$SCRIPT_DIR/../backend/.env"

PGPASSWORD="$POSTGRES_PASSWORD" psql \
  --dbname "${POSTGRES_DB:-postgres}" \
  --file "${SCRIPT_DIR}/schema.sql" \
  --host "${POSTGRES_HOST:-127.0.0.1}" \
  --port "${POSTGRES_PORT:-5432}" \
  --username "${POSTGRES_USER:-postgres}"
