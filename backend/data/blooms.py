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
    rebloom_id: Optional[int] = None    #adding rebloom_id to our class
    original_sender: Optional[str] = None
    rebloom_count: int = 0 


def add_bloom(*, sender: User, content: str,rebloom_id:Optional[int]=None) -> Bloom:
    hashtags = [word[1:] for word in content.split(" ") if word.startswith("#")]

    now = datetime.datetime.now(tz=datetime.UTC)
    bloom_id = int(now.timestamp() * 1000000)
    with db_cursor() as cur:
        cur.execute(
            "INSERT INTO blooms (id, sender_id, content, send_timestamp,rebloom_id) VALUES (%(bloom_id)s, %(sender_id)s, %(content)s, %(timestamp)s,%(rebloom_id)s)",#updating the query with rebloom_id
            dict(
                bloom_id=bloom_id,
                sender_id=sender.id,
                content=content,
                timestamp=datetime.datetime.now(datetime.UTC),
                rebloom_id=rebloom_id,
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
        rebloom_id=rebloom_id
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

        
        cur.execute(
            f"""SELECT
              b.id, 
              u.username, 
              b.content, 
              b.send_timestamp,
              b.rebloom_id,
              ou.username as original_sender,
              (SELECT COUNT(*) FROM blooms WHERE rebloom_id = COALESCE(b.rebloom_id, b.id)) as rebloom_count
            FROM blooms b
            INNER JOIN users u ON u.id = b.sender_id
            LEFT JOIN blooms ob ON b.rebloom_id = ob.id
            LEFT JOIN users ou ON ob.sender_id = ou.id
            WHERE
              u.username = %(sender_username)s
              {before_clause}
            ORDER BY b.send_timestamp DESC
            
            """,
            kwargs,
        )
        return map_rows_to_blooms(cur.fetchall())#gets all rows from the SQL query as a list of tuples,Each tuple-> map_rows_to_blooms()-> Bloom object.


def get_bloom(bloom_id: int) -> Optional[Bloom]:
    with db_cursor() as cur:
       #Rebloom support built-in the query
        cur.execute(
            """SELECT 
              b.id, 
              u.username, 
              b.content, 
              b.send_timestamp,
              b.rebloom_id,
              ou.username as original_sender,
              (SELECT COUNT(*) FROM blooms WHERE rebloom_id = COALESCE(b.rebloom_id, b.id)) as rebloom_count 
            FROM blooms b
            INNER JOIN users u ON u.id = b.sender_id 
            LEFT JOIN blooms ob ON b.rebloom_id = ob.id
            LEFT JOIN users ou ON ob.sender_id = ou.id
            WHERE b.id = %s""",
            (bloom_id,),
        )

        row = cur.fetchone()
        if row is None:
            return None
        return map_rows_to_blooms([row])[0]
        


def get_blooms_with_hashtag(
    hashtag_without_leading_hash: str, *, limit: int = None
) -> List[Bloom]:
    kwargs = {
        "hashtag_without_leading_hash": hashtag_without_leading_hash,
    }
    
    with db_cursor() as cur:
        cur.execute(
            f"""SELECT
              b.id, 
              u.username, 
              b.content, 
              b.send_timestamp,
              b.rebloom_id,
              ou.username as original_sender,
              (SELECT COUNT(*) FROM blooms WHERE rebloom_id = COALESCE(b.rebloom_id, b.id)) as rebloom_count
            FROM blooms b
            INNER JOIN hashtags h ON b.id = h.bloom_id 
            INNER JOIN users u ON b.sender_id = u.id
            LEFT JOIN blooms ob ON b.rebloom_id = ob.id
            LEFT JOIN users ou ON ob.sender_id = ou.id
            WHERE
              h.hashtag = %(hashtag_without_leading_hash)s
            ORDER BY b.send_timestamp DESC
            
            """,
            kwargs,
        )
        return map_rows_to_blooms(cur.fetchall())



def map_rows_to_blooms(rows) -> List[Bloom]: #helper to Converts any SQL row tuple into a Bloom object.
    blooms = []
    for row in rows:
        bloom_id, sender_username, content, timestamp, rebloom_id, original_sender, rebloom_count = row
        
        blooms.append(
            Bloom(
                id=bloom_id,
                sender=sender_username,
                content=content,
                sent_timestamp=timestamp,
                rebloom_id=rebloom_id,         
                original_sender=original_sender,
                rebloom_count=rebloom_count 
            )
        )
    return blooms
def has_user_rebloomed(original_bloom_id: int, user_id: int) -> bool:
    """
    Return True if the user has already rebloomed this bloom.
    """
    with db_cursor() as cur:
        cur.execute(
            "SELECT 1 FROM blooms WHERE rebloom_id = %s AND sender_id = %s",
            (original_bloom_id, user_id)
        )
        return cur.fetchone() is not None