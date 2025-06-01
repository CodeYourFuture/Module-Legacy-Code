#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for program in python3 docker; do
  if ! type "$program" >/dev/null 2>&1; then
      echo "Missing prerequisite: $program"
      exit 1
  fi
done

npm --prefix="$SCRIPT_DIR/front-end" ci
npm --prefix="$SCRIPT_DIR/front-end" exec -- playwright install --with-deps

python3 -m venv "$SCRIPT_DIR/backend/.venv"
"$SCRIPT_DIR/backend/.venv/bin/pip" install -r "$SCRIPT_DIR/backend/requirements.txt"

DOTENV_FILE="$SCRIPT_DIR/backend/.env"
if [ ! -f "$DOTENV_FILE" ]; then
  echo '# add environment variables here' > "$DOTENV_FILE"
  echo "JWT_SECRET_KEY=$(python3 -c 'import secrets;print(secrets.token_hex(12))')" >> "$DOTENV_FILE"
  echo "POSTGRES_PASSWORD=$(python3 -c 'import secrets;print(secrets.token_hex(12))')" >> "$DOTENV_FILE"
  echo 'POSTGRES_USER=postgres' >> "$DOTENV_FILE"
fi
