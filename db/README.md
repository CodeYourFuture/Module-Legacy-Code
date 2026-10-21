# Database setup

## Start PostgreSQL

From the project root, run:

```bash
./db/run.sh
```

Keep this process running in its terminal.

## Create the database schema

In a separate terminal, run:

```bash
./db/create-schema.sh
```

This applies the initial schema defined in `db/schema.sql`.

## Apply the re-bloom migration

The re-bloom feature requires the `reblooms` table. The migration is defined in `db/migrations/create_reblooms.sql`.

After starting PostgreSQL and creating the initial schema, run this command from the project root:

```bash
source backend/.env
PGPASSWORD="$POSTGRES_PASSWORD" psql \
  --dbname "${POSTGRES_DB:-postgres}" \
  --host "${POSTGRES_HOST:-127.0.0.1}" \
  --port "${POSTGRES_PORT:-5432}" \
  --username "${POSTGRES_USER:-postgres}" \
  --file db/migrations/create_reblooms.sql
```

Run this migration only once per database. It creates the `reblooms` table, so running it again on a database where the table already exists will fail.

**Note:** The migration is currently a separate manual step; `db/create-schema.sh` does not apply it automatically.
