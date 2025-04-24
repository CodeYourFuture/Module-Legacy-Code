from contextlib import contextmanager
import os
import psycopg2

@contextmanager
def db_cursor():
    with psycopg2.connect(dbname=os.getenv("PGDATABASE"), user=os.getenv("PGUSER"), password=os.environ["PGPASSWORD"], host=os.getenv("PGHOST", "127.0.0.1"), port=os.getenv("PGPORT")) as conn:
        with conn.cursor() as cur:
            yield cur
