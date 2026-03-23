from contextlib import contextmanager
import os
import psycopg2


@contextmanager
def db_cursor():
    with psycopg2.connect(
        dbname=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.environ["POSTGRES_PASSWORD"],
        host=os.getenv("POSTGRES_HOST", "127.0.0.1"),
        port=os.getenv("POSTGRES_PORT"),
    ) as conn:
        with conn.cursor() as cur:
            yield cur
