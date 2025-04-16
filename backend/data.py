import hashlib
import random
import string

from bidi_multidict import BidiMultiDict
from bloom_store import BloomStore

from dataclasses import dataclass
from typing import Dict


@dataclass
class User:
    username: str
    password_salt: bytes
    password_scrypt: str

    def check_password(self, password_plaintext: str) -> bool:
        return self.password_scrypt == scrypt(
            password_plaintext.encode("utf-8"), self.password_salt
        )


def scrypt(password_plaintext: bytes, password_salt: bytes) -> bytes:
    return hashlib.scrypt(password_plaintext, salt=password_salt, n=8, r=8, p=1)


SALT_CHARACTERS = string.ascii_uppercase + string.ascii_lowercase + string.digits


def generate_salt() -> bytes:
    return (
        "".join(random.SystemRandom().choice(SALT_CHARACTERS) for _ in range(10))
    ).encode("utf-8")


users: Dict[str, User] = {}


def register_user(username: str, password_plaintext: str) -> User:
    salt = generate_salt()
    user = User(
        username=username,
        password_salt=salt,
        password_scrypt=scrypt(password_plaintext.encode("utf-8"), salt),
    )
    users[username] = user
    return user


follows: BidiMultiDict[str, str] = BidiMultiDict()

blooms = BloomStore()


def lookup_user(header_info, payload_info):
    return users.get(payload_info["sub"])
