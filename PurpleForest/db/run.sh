#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

BACKING_STORE_DIR="${SCRIPT_DIR}/pg_data"
mkdir -p "${BACKING_STORE_DIR}"

source "$SCRIPT_DIR/../backend/.env"

docker run \
  --env-file "$SCRIPT_DIR/../backend/.env" \
  --interactive \
  --publish "${POSTGRES_PORT:-5432}:5432" \
  --rm \
  --tty \
  --volume "${BACKING_STORE_DIR}:/var/lib/postgresql/data" \
  postgres:17.4
