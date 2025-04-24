#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

export PGPASSWORD="$(cat "${SCRIPT_DIR}/../backend/.env" | grep ^PGPASSWORD= | cut -d= -f2-)"

psql -h 127.0.0.1 -U postgres -f "${SCRIPT_DIR}/schema.sql"
