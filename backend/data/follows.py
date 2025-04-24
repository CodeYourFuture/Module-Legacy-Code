from typing import List

from data.connection import db_cursor
from data.users import User


def follow(follower: User, followee: User):
    with db_cursor() as cur:
        cur.execute(
            "INSERT INTO follows (follower, followee) VALUES (%(follower_id)s, %(followee_id)s)",
            dict(
                follower_id=follower.id,
                followee_id=followee.id,
            ),
        )

def get_followed_usernames(follower: User) -> List[str]:
    """get_followed_usernames returns a list of usernames followee follows."""
    with db_cursor() as cur:
        cur.execute("SELECT users.username FROM follows INNER JOIN users ON follows.followee = users.id WHERE follower = %s", (follower.id,))
        rows = cur.fetchall()
        return [row[0] for row in rows]

def get_inverse_followed_usernames(followee: User) -> List[str]:
    """get_followed_usernames returns a list of usernames followed by follower."""
    with db_cursor() as cur:
        cur.execute("SELECT users.username FROM follows INNER JOIN users ON follows.follower = users.id WHERE followee = %s", (followee.id,))
        rows = cur.fetchall()
        return [row[0] for row in rows]
