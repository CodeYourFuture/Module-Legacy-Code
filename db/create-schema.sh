#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

source "$SCRIPT_DIR/../backend/.env"

psql \
  --dbname "${PGDATABASE:-postgres}" \
  --file "${SCRIPT_DIR}/schema.sql" \
  --host "${PGHOST:-127.0.0.1}" \
  --port "${PGPORT:-5432}" \
  --username "${PGUSER:-postgres}"
