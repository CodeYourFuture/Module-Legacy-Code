#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

BACKING_STORE_DIR="${SCRIPT_DIR}/pg_data"
mkdir -p "${BACKING_STORE_DIR}"

POSTGRES_PASSWORD="$(cat "${SCRIPT_DIR}/../backend/.env" | grep ^PGPASSWORD= | cut -d= -f2-)"

docker run -it --rm -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" -p 5432:5432 -v "${BACKING_STORE_DIR}:/var/lib/postgresql/data" postgres:17.4
