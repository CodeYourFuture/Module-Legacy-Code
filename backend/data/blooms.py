import datetime

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from data.connection import db_cursor
from data.users import User


@dataclass
class Bloom:
    id: int
    sender: User
    content: str
    sent_timestamp: datetime.datetime
    rebloom_count: int = 0
    rebloomed_from_id: int | None = None
    original_sender: str | None = None

def add_bloom(*, sender: User, content: str,rebloomed_from_id: int | None = None) -> Bloom:
    hashtags = [word[1:] for word in content.split(" ") if word.startswith("#")]

    now = datetime.datetime.now(tz=datetime.UTC)
    bloom_id = int(now.timestamp() * 1000000)
    with db_cursor() as cur:
        cur.execute(
            "INSERT INTO blooms (id, sender_id, content, send_timestamp, rebloomed_from_id) VALUES (%(bloom_id)s, %(sender_id)s, %(content)s, %(timestamp)s, %(rebloomed_from_id)s)",
            dict(
                bloom_id=bloom_id,
                sender_id=sender.id,
                content=content,
                timestamp=datetime.datetime.now(datetime.UTC),
                rebloomed_from_id=rebloomed_from_id,
            ),
        )
        for hashtag in hashtags:
            cur.execute(
                "INSERT INTO hashtags (hashtag, bloom_id) VALUES (%(hashtag)s, %(bloom_id)s)",
                dict(hashtag=hashtag, bloom_id=bloom_id),
            )


def get_blooms_for_user(
    username: str, *, before: Optional[int] = None, limit: Optional[int] = None
) -> List[Bloom]:
    with db_cursor() as cur:
        kwargs = {
            "sender_username": username,
        }
        if before is not None:
            before_clause = "AND send_timestamp < %(before_limit)s"
            kwargs["before_limit"] = before
        else:
            before_clause = ""

        limit_clause = make_limit_clause(limit, kwargs)

        cur.execute(
            f"""SELECT
             blooms.id, users.username, blooms.content, blooms.send_timestamp, blooms.rebloomed_from_id, original_users.username, (
                SELECT COUNT(*)
                FROM blooms rb
                WHERE rb.rebloomed_from_id = blooms.id
            ) AS rebloom_count
            FROM
                blooms
                INNER JOIN users ON users.id = blooms.sender_id
                LEFT JOIN blooms original_blooms ON blooms.rebloomed_from_id = original_blooms.id
                LEFT JOIN users original_users ON original_blooms.sender_id = original_users.id            WHERE
              users.username = %(sender_username)s
              {before_clause}
            ORDER BY send_timestamp DESC
            {limit_clause}
            """,
            kwargs,
        )
        rows = cur.fetchall()
        blooms = []
        for row in rows:
            bloom_id, sender_username, content, timestamp, rebloomed_from_id,original_sender, rebloom_count = row
            blooms.append(
                Bloom(
                    id=bloom_id,
                    sender=sender_username,
                    content=content,
                    sent_timestamp=timestamp,
                    rebloom_count=rebloom_count,
                    rebloomed_from_id=rebloomed_from_id,
                    original_sender=original_sender,

                )
            )
    return blooms

def get_bloom(bloom_id: int) -> Optional[Bloom]:
        with db_cursor() as cur:
            cur.execute(
                    "SELECT blooms.id, users.username, blooms.content, blooms.send_timestamp, blooms.rebloomed_from_id, original_users.username, "
                    "(SELECT COUNT(*) FROM blooms rb WHERE rb.rebloomed_from_id = blooms.id) AS rebloom_count "
                    "FROM blooms "
                    "INNER JOIN users ON users.id = blooms.sender_id "
                    "LEFT JOIN blooms original_blooms ON blooms.rebloomed_from_id = original_blooms.id "
                    "LEFT JOIN users original_users ON original_blooms.sender_id = original_users.id "
                    "WHERE blooms.id = %s",
                    (bloom_id,),
                )
            row = cur.fetchone()
            if row is None:
                return None
            bloom_id, sender_username, content, timestamp, rebloomed_from_id, original_sender, rebloom_count = row
            return Bloom(
                id=bloom_id,
                sender=sender_username,
                content=content,
                sent_timestamp=timestamp,
                rebloom_count=rebloom_count,
                rebloomed_from_id=rebloomed_from_id,
                original_sender=original_sender,

        )



def get_blooms_with_hashtag(
    hashtag_without_leading_hash: str, *, limit: int = None
) -> List[Bloom]:
    kwargs = {
        "hashtag_without_leading_hash": hashtag_without_leading_hash,
    }
    limit_clause = make_limit_clause(limit, kwargs)
    with db_cursor() as cur:
        cur.execute(
            f"""SELECT
              blooms.id, users.username, content, send_timestamp,    (
            SELECT COUNT(*)
            FROM blooms rb
            WHERE rb.rebloomed_from_id = blooms.id
        ) AS rebloom_count
            FROM
              blooms INNER JOIN hashtags ON blooms.id = hashtags.bloom_id INNER JOIN users ON blooms.sender_id = users.id
            WHERE
              hashtag = %(hashtag_without_leading_hash)s
            ORDER BY send_timestamp DESC
            {limit_clause}
            """,
            kwargs,
        )
        rows = cur.fetchall()
        blooms = []
        for row in rows:
            bloom_id, sender_username, content, timestamp, rebloom_count = row
            blooms.append(
                Bloom(
                    id=bloom_id,
                    sender=sender_username,
                    content=content,
                    sent_timestamp=timestamp,
                    rebloom_count=rebloom_count

                )
            )
    return blooms


def make_limit_clause(limit: Optional[int], kwargs: Dict[Any, Any]) -> str:
    if limit is not None:
        limit_clause = "LIMIT %(limit)s"
        kwargs["limit"] = limit
    else:
        limit_clause = ""
    return limit_clause
