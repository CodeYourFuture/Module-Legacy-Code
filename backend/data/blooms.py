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
    is_rebloom: bool = False
    original_sender: Optional[str] = None
    rebloomed_by: Optional[str] = None


def add_bloom(*, sender: User, content: str) -> None:
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
        kwargs: Dict[str, Any]= {
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
              u1.username AS original_author, 
              b.content, 
              b.send_timestamp,
              b.is_rebloom,
              u2.username AS rebloomed_by_author
            FROM blooms b
            INNER JOIN users u1 ON u1.id = b.sender_id
            LEFT JOIN users u2 ON u2.id = b.rebloomed_by_id
            WHERE
              u1.username = %(sender_username)s OR u2.username = %(sender_username)s
              {before_clause}
            ORDER BY b.send_timestamp DESC
            {limit_clause}
            """,
            kwargs,
        )
        rows = cur.fetchall()
        blooms = []
        for row in rows:
            bloom_id, orig_author, content, timestamp, is_rebloom, rebloomed_by = row
            display_sender = rebloomed_by if is_rebloom else orig_author

            blooms.append(
                Bloom(
                    id=bloom_id,
                    sender=display_sender,
                    content=content,
                    sent_timestamp=timestamp,
                    is_rebloom=bool(is_rebloom),
                    original_sender=orig_author if is_rebloom else None,
                    rebloomed_by=rebloomed_by if is_rebloom else None
                )
            )
    return blooms


def get_bloom(bloom_id: int) -> Optional[Bloom]:
    with db_cursor() as cur:
        cur.execute(
            """SELECT 
                b.id, 
                u1.username AS original_author, 
                b.content, 
                b.send_timestamp,
                b.is_rebloom,
                u2.username AS rebloomed_by_author
               FROM blooms b 
               INNER JOIN users u1 ON u1.id = b.sender_id 
               LEFT JOIN users u2 ON u2.id = b.rebloomed_by_id
               WHERE b.id = %s""",
            (bloom_id,),
        )
        row = cur.fetchone()
        if row is None:
            return None
        bloom_id, orig_author, content, timestamp, is_rebloom, rebloomed_by = row
        return Bloom(
            id=bloom_id,
            sender=orig_author,
            content=content,
            sent_timestamp=timestamp,
            is_rebloom=bool(is_rebloom),
            original_sender=orig_author if is_rebloom else None,
            rebloomed_by=rebloomed_by if is_rebloom else None
        )


def get_blooms_with_hashtag(
    hashtag_without_leading_hash: str, *, limit: Optional[int] = None
) -> List[Bloom]:
    kwargs = {
        "hashtag_without_leading_hash": hashtag_without_leading_hash,
    }
    limit_clause = make_limit_clause(limit, kwargs)
    with db_cursor() as cur:
        cur.execute(
            f"""SELECT
              b.id, 
              u1.username AS original_author, 
              b.content, 
              b.send_timestamp,
              b.is_rebloom,
              u2.username AS rebloomed_by_author
            FROM blooms b 
            INNER JOIN hashtags ON b.id = hashtags.bloom_id 
            INNER JOIN users u1 ON b.sender_id = u1.id
            LEFT JOIN users u2 ON b.rebloomed_by_id = u2.id
            WHERE
              hashtag = %(hashtag_without_leading_hash)s
            ORDER BY b.send_timestamp DESC
            {limit_clause}
            """,
            kwargs,
        )
        rows = cur.fetchall()
        blooms = []
        for row in rows:
            bloom_id, orig_author, content, timestamp, is_rebloom, rebloomed_by = row
            blooms.append(
                Bloom(
                    id=bloom_id,
                    sender=orig_author,
                    content=content,
                    sent_timestamp=timestamp,
                    is_rebloom=bool(is_rebloom),
                    original_sender=orig_author if is_rebloom else None,
                    rebloomed_by=rebloomed_by if is_rebloom else None
                )
            )
    return blooms

def add_rebloom(*, current_user: User, original_bloom_id: int) -> Optional[Bloom]:
    # Fetch the original bloom 
    orig_bloom = get_bloom(original_bloom_id)
    if orig_bloom is None:
        return None  

    # Generate ID
    now = datetime.datetime.now(tz=datetime.UTC)
    new_bloom_id = int(now.timestamp() * 1000000)

    # Save the rebloom pointer into db 
    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO blooms 
                (id, sender_id, content, send_timestamp, is_rebloom, original_bloom_id, rebloomed_by_id) 
            VALUES 
                (%(new_id)s, (SELECT id FROM users WHERE username = %(orig_username)s), %(content)s, %(timestamp)s, TRUE, %(orig_id)s, %(current_user_id)s)
            """,
            dict(
                new_id=new_bloom_id,
                orig_username=orig_bloom.sender,  
                content=orig_bloom.content,         
                timestamp=now,
                orig_id=original_bloom_id,
                current_user_id=current_user.id    
            ),
        )

    # Return the new Bloom object 
    return Bloom(
        id=new_bloom_id,
        sender=current_user.username,
        content=orig_bloom.content,
        sent_timestamp=now,
        is_rebloom=True,
        original_sender=orig_bloom.sender,
        rebloomed_by=current_user.username
    )


def make_limit_clause(limit: Optional[int], kwargs: Dict[Any, Any]) -> str:
    if limit is not None:
        limit_clause = "LIMIT %(limit)s"
        kwargs["limit"] = limit
    else:
        limit_clause = ""
    return limit_clause
