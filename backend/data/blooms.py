import datetime

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from data.connection import db_cursor
from data.users import User


@dataclass
class Bloom:
    id: int
    sender: str
    content: str
    sent_timestamp: datetime.datetime
    rebloom_of: int | None = None
    original_sender: str | None = None
    original_content: str | None = None
    original_sent_timestamp: datetime.datetime | None = None
    rebloom_count: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return _make_bloom_dict(self)


def _make_bloom_dict(bloom: Bloom) -> Dict[str, Any]:
    return {
        "id": bloom.id,
        "sender": bloom.sender,
        "content": bloom.content,
        "sent_timestamp": bloom.sent_timestamp,
        "rebloom_of": bloom.rebloom_of,
        "original_sender": bloom.original_sender,
        "original_content": bloom.original_content,
        "original_sent_timestamp": bloom.original_sent_timestamp,
        "rebloom_count": bloom.rebloom_count,
    }


def _row_to_bloom(row):
    (
        bloom_id,
        sender_username,
        content,
        timestamp,
        rebloom_of,
        original_sender,
        original_content,
        original_timestamp,
        rebloom_count,
    ) = row
    return Bloom(
        id=bloom_id,
        sender=sender_username,
        content=content,
        sent_timestamp=timestamp,
        rebloom_of=rebloom_of,
        original_sender=original_sender,
        original_content=original_content,
        original_sent_timestamp=original_timestamp,
        rebloom_count=rebloom_count or 0,
    )


def _default_bloom_query():
    return """SELECT
              blooms.id,
              users.username,
              blooms.content,
              blooms.send_timestamp,
              blooms.rebloom_of,
              original_users.username AS original_sender,
              original_blooms.content AS original_content,
              original_blooms.send_timestamp AS original_sent_timestamp,
              COALESCE(rebloom_counts.num_rebloomed, 0) AS rebloom_count
            FROM blooms
            INNER JOIN users ON users.id = blooms.sender_id
            LEFT JOIN blooms AS original_blooms ON original_blooms.id = blooms.rebloom_of
            LEFT JOIN users AS original_users ON original_users.id = original_blooms.sender_id
            LEFT JOIN (
              SELECT rebloom_of, COUNT(*) AS num_rebloomed
              FROM blooms
              WHERE rebloom_of IS NOT NULL
              GROUP BY rebloom_of
            ) rebloom_counts ON rebloom_counts.rebloom_of = blooms.id"""


def add_bloom(*, sender: User, content: str, rebloom_of=None) -> Bloom:
    hashtags = [word[1:] for word in content.split(" ") if word.startswith("#")]

    now = datetime.datetime.now(tz=datetime.UTC)
    bloom_id = int(now.timestamp() * 1000000)
    with db_cursor() as cur:
        cur.execute(
            "INSERT INTO blooms (id, sender_id, content, send_timestamp, rebloom_of) VALUES (%(bloom_id)s, %(sender_id)s, %(content)s, %(timestamp)s, %(rebloom_of)s)",
            dict(
                bloom_id=bloom_id,
                sender_id=sender.id,
                content=content,
                timestamp=datetime.datetime.now(datetime.UTC),
                rebloom_of=rebloom_of,
            ),
        )
        for hashtag in hashtags:
            cur.execute(
                "INSERT INTO hashtags (hashtag, bloom_id) VALUES (%(hashtag)s, %(bloom_id)s)",
                dict(hashtag=hashtag, bloom_id=bloom_id),
            )

    return Bloom(
        id=bloom_id,
        sender=sender.username,
        content=content,
        sent_timestamp=now,
        rebloom_of=rebloom_of,
    )


def get_blooms_for_user(
    username: str, *, before: Optional[int] = None, limit: Optional[int] = None
) -> List[Bloom]:
    with db_cursor() as cur:
        kwargs = {
            "sender_username": username,
        }
        if before is not None:
            before_clause = "AND blooms.send_timestamp < %(before_limit)s"
            kwargs["before_limit"] = before
        else:
            before_clause = ""

        limit_clause = make_limit_clause(limit, kwargs)

        cur.execute(
            f"""{_default_bloom_query()}
            WHERE
              users.username = %(sender_username)s
              {before_clause}
            ORDER BY blooms.send_timestamp DESC
            {limit_clause}
            """,
            kwargs,
        )
        rows = cur.fetchall()
        return [_row_to_bloom(row) for row in rows]


def get_bloom(bloom_id: int) -> Optional[Bloom]:
    with db_cursor() as cur:
        cur.execute(
            f"""{_default_bloom_query()}
            WHERE blooms.id = %s""",
            (bloom_id,),
        )
        row = cur.fetchone()
        if row is None:
            return None
        return _row_to_bloom(row)


def get_blooms_with_hashtag(
    hashtag_without_leading_hash: str, *, limit: int = None
) -> List[Bloom]:
    kwargs = {
        "hashtag_without_leading_hash": hashtag_without_leading_hash,
    }
    limit_clause = make_limit_clause(limit, kwargs)
    with db_cursor() as cur:
        cur.execute(
            f"""{_default_bloom_query()}
            INNER JOIN hashtags ON blooms.id = hashtags.bloom_id
            WHERE
              hashtag = %(hashtag_without_leading_hash)s
            ORDER BY blooms.send_timestamp DESC
            {limit_clause}
            """,
            kwargs,
        )
        rows = cur.fetchall()
        return [_row_to_bloom(row) for row in rows]


def make_limit_clause(limit: Optional[int], kwargs: Dict[Any, Any]) -> str:
    if limit is not None:
        limit_clause = "LIMIT %(limit)s"
        kwargs["limit"] = limit
    else:
        limit_clause = ""
    return limit_clause
