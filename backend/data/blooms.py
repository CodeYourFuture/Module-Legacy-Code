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


@dataclass
class Rebloom:
    rebloomer: str
    original_bloom: Bloom
    rebloom_timestamp: datetime.datetime


@dataclass
class FeedItem:
    kind: str
    timestamp: datetime.datetime
    bloom: Bloom
    rebloomer: Optional[str] = None


def add_bloom(*, sender: User, content: str) -> Bloom:
    hashtags = [word[1:] for word in content.split(" ") if word.startswith("#")]

    now = datetime.datetime.now(tz=datetime.UTC)
    bloom_id = int(now.timestamp() * 1000000)
    with db_cursor() as cur:
        cur.execute(
            "INSERT INTO blooms (id, sender_id, content, send_timestamp) VALUES (%(bloom_id)s, %(sender_id)s, %(content)s, %(timestamp)s)",
            {
                "bloom_id": bloom_id,
                "sender_id": sender.id,
                "content": content,
                "timestamp": datetime.datetime.now(datetime.UTC),
            },
        )
        for hashtag in hashtags:
            cur.execute(
                "INSERT INTO hashtags (hashtag, bloom_id) VALUES (%(hashtag)s, %(bloom_id)s)",
                {"hashtag": hashtag, "bloom_id": bloom_id},
            )


def add_rebloom(*, rebloomer: User, original_bloom_id: int) -> bool:
    """Create a rebloom event.

    Returns True if a rebloom row was inserted, False if it already existed.
    """
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO reblooms (rebloomer_id, original_bloom_id, rebloom_timestamp)
            VALUES (%(rebloomer_id)s, %(original_bloom_id)s, %(rebloom_timestamp)s)
            ON CONFLICT (rebloomer_id, original_bloom_id) DO NOTHING
            """,
            {
                "rebloomer_id": rebloomer.id,
                "original_bloom_id": original_bloom_id,
                "rebloom_timestamp": datetime.datetime.now(datetime.UTC),
            },
        )
        return cur.rowcount == 1


def get_rebloom_count(original_bloom_id: int) -> int:
    with db_cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) FROM reblooms WHERE original_bloom_id = %s",
            (original_bloom_id,),
        )
        row = cur.fetchone()
        return int(row[0]) if row is not None else 0


def get_rebloom_counts(original_bloom_ids: List[int]) -> Dict[int, int]:
    if not original_bloom_ids:
        return {}

    with db_cursor() as cur:
        cur.execute(
            """
            SELECT original_bloom_id, COUNT(*)
            FROM reblooms
            WHERE original_bloom_id = ANY(%(original_bloom_ids)s)
            GROUP BY original_bloom_id
            """,
            {"original_bloom_ids": original_bloom_ids},
        )
        return {row[0]: int(row[1]) for row in cur.fetchall()}


def get_reblooms_for_user(
    username: str, *, limit: Optional[int] = None
) -> List[Rebloom]:
    kwargs = {
        "rebloomer_username": username,
    }
    limit_clause = make_limit_clause(limit, kwargs)

    with db_cursor() as cur:
        cur.execute(
            f"""SELECT
              rebloomer.username,
              reblooms.rebloom_timestamp,
              original_bloom.id,
              original_sender.username,
              original_bloom.content,
              original_bloom.send_timestamp
            FROM
              reblooms
              INNER JOIN users AS rebloomer ON rebloomer.id = reblooms.rebloomer_id
              INNER JOIN blooms AS original_bloom ON original_bloom.id = reblooms.original_bloom_id
              INNER JOIN users AS original_sender ON original_sender.id = original_bloom.sender_id
            WHERE
              rebloomer.username = %(rebloomer_username)s
            ORDER BY reblooms.rebloom_timestamp DESC
            {limit_clause}
            """,
            kwargs,
        )
        rows = cur.fetchall()
        reblooms = []
        for row in rows:
            rebloomer_username, rebloom_timestamp, bloom_id, sender_username, content, timestamp = row
            reblooms.append(
                Rebloom(
                    rebloomer=rebloomer_username,
                    original_bloom=Bloom(
                        id=bloom_id,
                        sender=sender_username,
                        content=content,
                        sent_timestamp=timestamp,
                    ),
                    rebloom_timestamp=rebloom_timestamp,
                )
            )
    return reblooms


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
              blooms.id, users.username, content, send_timestamp
            FROM
              blooms INNER JOIN users ON users.id = blooms.sender_id
            WHERE
              username = %(sender_username)s
              {before_clause}
            ORDER BY send_timestamp DESC
            {limit_clause}
            """,
            kwargs,
        )
        rows = cur.fetchall()
        blooms = []
        for row in rows:
            bloom_id, sender_username, content, timestamp = row
            blooms.append(
                Bloom(
                    id=bloom_id,
                    sender=sender_username,
                    content=content,
                    sent_timestamp=timestamp,
                )
            )
    return blooms


def get_bloom(bloom_id: int) -> Optional[Bloom]:
    with db_cursor() as cur:
        cur.execute(
            "SELECT blooms.id, users.username, content, send_timestamp FROM blooms INNER JOIN users ON users.id = blooms.sender_id WHERE blooms.id = %s",
            (bloom_id,),
        )
        row = cur.fetchone()
        if row is None:
            return None
        bloom_id, sender_username, content, timestamp = row
        return Bloom(
            id=bloom_id,
            sender=sender_username,
            content=content,
            sent_timestamp=timestamp,
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
              blooms.id, users.username, content, send_timestamp
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
            bloom_id, sender_username, content, timestamp = row
            blooms.append(
                Bloom(
                    id=bloom_id,
                    sender=sender_username,
                    content=content,
                    sent_timestamp=timestamp,
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
