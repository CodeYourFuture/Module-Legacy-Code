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
    rebloomed_by: Optional[str] = None  # Tracks if someone shared it
    rebloom_count: int = 0              # Tracks share count


def add_bloom(*, sender: User, content: str) -> Bloom:
    hashtags = [word[1:] for word in content.split(" ") if word.startswith("#")]

    now = datetime.datetime.now(tz=datetime.UTC)
    bloom_id = int(now.timestamp() * 1000000)
    with db_cursor() as cur:
        cur.execute(
            "INSERT INTO blooms (id, sender_id, content, send_timestamp) VALUES (%(bloom_id)s, %(sender_id)s, %(content)s, %(timestamp)s)",
            dict(
                bloom_id=bloom_id,
                sender_id=sender.id,
                content=content,
                timestamp=datetime.datetime.now(datetime.UTC),
            ),
        )
        for hashtag in hashtags:
            cur.execute(
                "INSERT INTO hashtags (hashtag, bloom_id) VALUES (%(hashtag)s, %(bloom_id)s)",
                dict(hashtag=hashtag, bloom_id=bloom_id),
            )

def add_rebloom(*, rebloomer: User, original_bloom_id: int) -> None:
    original = get_bloom(original_bloom_id)
    if not original:
        return
        
    now = datetime.datetime.now(tz=datetime.UTC)
    new_bloom_id = int(now.timestamp() * 1000000)
    
    with db_cursor() as cur:
        # 1. Insert the shared copy as a new timeline entry attributed to the rebloomer
        cur.execute(
            """INSERT INTO blooms 
               (id, sender_id, content, send_timestamp, rebloomed_by_id) 
               VALUES (%(bloom_id)s, %(sender_id)s, %(content)s, %(timestamp)s, %(rebloomed_by_id)s)""",
            dict(
                bloom_id=new_bloom_id,
                sender_id=original.sender_id, # Keep original author tracking if needed, or mapping structure
                content=original.content,
                timestamp=now,
                rebloomed_by_id=rebloomer.id
            ),
        )
        # 2. Increment a counter system or handle via a tracking table aggregation

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
              b.id, 
              u.username AS sender_username, 
              b.content, 
              b.send_timestamp,
              rb_u.username AS rebloomed_by_username,
              (SELECT COUNT(*) FROM blooms WHERE rebloomed_from_id = b.id) AS rebloom_count
            FROM
              blooms b
              INNER JOIN users u ON u.id = b.sender_id
              LEFT JOIN users rb_u ON rb_u.id = b.rebloomed_by_id
            WHERE
              (u.username = %(sender_username)s AND b.rebloomed_by_id IS NULL)
              OR rb_u.username = %(sender_username)s
              {before_clause}
            ORDER BY b.send_timestamp DESC
            {limit_clause}
            """,
            kwargs,
        )
        rows = cur.fetchall()
        blooms = []
        for row in rows:
            bloom_id, sender_username, content, timestamp, rebloomed_by, rebloom_count = row
            blooms.append(
                Bloom(
                    id=bloom_id,
                    sender=sender_username,
                    content=content,
                    sent_timestamp=timestamp,
                    rebloomed_by=rebloomed_by,
                    rebloom_count=rebloom_count
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
