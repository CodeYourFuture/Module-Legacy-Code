import datetime
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from data.connection import db_cursor
from data.users import User
from data.users import get_user


@dataclass
class Bloom:
    id: int
    sender: User
    content: str
    sent_timestamp: datetime.datetime
    rebloom_count: int = 0
    


def add_bloom(*, sender: User, content: str) -> Bloom:
    
    if len(content) > 280:
       raise ValueError("Bloom content cannot exceed 280 characters")

    hashtags = re.findall(r'#(\w+)', content)

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
              COALESCE((SELECT COUNT(*) FROM reblooms r WHERE r.bloom_id = blooms.id), 0) as rebloom_count
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
            bloom_id, sender_username, content, timestamp, rebloom_count = row
            sender_user = get_user(sender_username)
            if sender_user:               
                 blooms.append(
                     Bloom(
                         id=bloom_id,
                         sender=sender_user, 
                         content=content,
                         sent_timestamp=timestamp,
                         rebloom_count=rebloom_count,
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
        sender_user = get_user(sender_username)
        if sender_user:
            return Bloom(
               id=bloom_id,
               sender=sender_user,
               content=content,
               sent_timestamp=timestamp,
        )
        return None


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
            sender_user = get_user(sender_username)
            if sender_user:
               blooms.append(
                   Bloom(
                      id=bloom_id,
                      sender=sender_user,
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

#rebloom function

def add_rebloom(*, user: User, bloom_id: int) -> None:
    """Adds a rebloom for a user."""
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO reblooms (user_id, bloom_id)
            VALUES (%(user_id)s, %(bloom_id)s)
            ON CONFLICT (user_id, bloom_id) DO NOTHING
            """,
            dict(user_id=user.id, bloom_id=bloom_id),
        )


def get_rebloom_count(bloom_id: int) -> int:
    """Returns the number of times a bloom has been rebloomed."""
    with db_cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) FROM reblooms WHERE bloom_id = %s",
            (bloom_id,),
        )
        count = cur.fetchone()[0]
    return count

def get_user_reblooms(username: str, limit: Optional[int] = 50) -> List[Bloom]:
    from data.users import get_user
    with db_cursor() as cur:
        kwargs = {"username": username}
        limit_clause = make_limit_clause(limit, kwargs)
        
        cur.execute(f"""
            SELECT DISTINCT 
                blooms.id, users.username as sender_username, blooms.content, blooms.send_timestamp,
                COALESCE((SELECT COUNT(*) FROM reblooms r WHERE r.bloom_id = blooms.id), 0) as rebloom_count
            FROM reblooms r
            INNER JOIN blooms ON r.bloom_id = blooms.id
            INNER JOIN users ON blooms.sender_id = users.id
            WHERE r.user_id = (SELECT id FROM users WHERE username = %(username)s)
            ORDER BY blooms.send_timestamp DESC
            {limit_clause}
        """, kwargs)
        
        rows = cur.fetchall()
        reblooms = []
        for row in rows:
            bloom_id, sender_username, content, timestamp, rebloom_count = row
            sender_user = get_user(sender_username)
            if sender_user:
                reblooms.append(Bloom(
                    id=bloom_id,
                    sender=sender_user,
                    content=content,
                    sent_timestamp=timestamp,
                    rebloom_count=rebloom_count,
                ))
        return reblooms