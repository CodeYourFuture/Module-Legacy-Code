import datetime

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from data.connection import db_cursor
from data.users import User
from psycopg2.errors import UniqueViolation


@dataclass
class Bloom:
    id: int
    sender: User
    content: str
    sent_timestamp: datetime.datetime
    re_bloom_count: int = 0
    re_bloomed_by: Optional[str] = None


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
              blooms.id, users.username, content, send_timestamp,
              (SELECT COUNT(*) FROM re_blooms WHERE re_blooms.bloom_id = blooms.id) AS re_bloom_count
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
            bloom_id, sender_username, content, timestamp, re_bloom_count = row
            blooms.append(
                Bloom(
                    id=bloom_id,
                    sender=sender_username,
                    content=content,
                    sent_timestamp=timestamp,
                    re_bloom_count=re_bloom_count,
                )
            )
    re_blooms_list = get_re_blooms_for_user(username, limit=limit)
    combined = blooms + re_blooms_list
    combined.sort(key=lambda b: b.sent_timestamp, reverse=True)
    if limit is not None:
        combined = combined[:limit]
        
        
    return combined


def get_bloom(bloom_id: int) -> Optional[Bloom]:
    with db_cursor() as cur:
        cur.execute(
            """SELECT
              blooms.id, users.username, content, send_timestamp,
              (SELECT COUNT(*) FROM re_blooms WHERE re_blooms.bloom_id = blooms.id) AS re_bloom_count
            FROM
              blooms INNER JOIN users ON users.id = blooms.sender_id
            WHERE
              blooms.id = %s""",
            (bloom_id,),
        )
        row = cur.fetchone()
        if row is None:
            return None
        bloom_id, sender_username, content, timestamp, re_bloom_count = row
        return Bloom(
            id=bloom_id,
            sender=sender_username,
            content=content,
            sent_timestamp=timestamp,
            re_bloom_count=re_bloom_count,
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
              blooms.id, users.username, content, send_timestamp,
              (SELECT COUNT(*) FROM re_blooms WHERE re_blooms.bloom_id = blooms.id) AS re_bloom_count
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
            bloom_id, sender_username, content, timestamp, re_bloom_count = row
            blooms.append(
                Bloom(
                    id=bloom_id,
                    sender=sender_username,
                    content=content,
                    sent_timestamp=timestamp,
                    re_bloom_count=re_bloom_count,
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


def re_bloom(bloom_id: int, re_bloomer: User) -> bool:
    
    bloom = get_bloom(bloom_id)
    
    if bloom is None:
        return False
    
    now = datetime.datetime.now(tz=datetime.UTC)
    
    with db_cursor() as cur:
        try:
            cur.execute(
                "INSERT INTO re_blooms (bloom_id, re_bloomer_id, re_bloom_timestamp) VALUES (%(bloom_id)s, %(re_bloomer_id)s, %(timestamp)s)",
                dict(
                    bloom_id=bloom_id,
                    re_bloomer_id=re_bloomer.id,
                    timestamp=now,
                ),
            )
            
        except UniqueViolation:
            return False    
    
    return True;


def get_re_blooms_for_user(username: str, *, limit: Optional[int] = None) -> List[Bloom]:
    kwargs = {"re_bloomer_username": username}
    limit_clause = make_limit_clause(limit, kwargs)
    with db_cursor() as cur:
        cur.execute(
            f"""SELECT
              blooms.id, original_sender.username, blooms.content, re_blooms.re_bloom_timestamp,
              (SELECT COUNT(*) FROM re_blooms WHERE re_blooms.bloom_id = blooms.id) AS re_bloom_count
            FROM
              re_blooms
              INNER JOIN blooms ON blooms.id = re_blooms.bloom_id
              INNER JOIN users AS original_sender ON original_sender.id = blooms.sender_id
              INNER JOIN users AS re_bloomer ON re_bloomer.id = re_blooms.re_bloomer_id
            WHERE
              re_bloomer.username = %(re_bloomer_username)s
            ORDER BY re_blooms.re_bloom_timestamp DESC
            {limit_clause}
            """,
            kwargs,
        )
        rows = cur.fetchall()
        re_blooms_list = []
        for row in rows:
            bloom_id, sender_username, content, re_bloom_timestamp, re_bloom_count = row
            re_blooms_list.append(
                Bloom(
                    id=bloom_id,
                    sender=sender_username,
                    content=content,
                    sent_timestamp=re_bloom_timestamp,
                    re_bloom_count=re_bloom_count,
                    re_bloomed_by=username,
                )
            )
    return re_blooms_list
