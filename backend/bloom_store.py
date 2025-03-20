import bisect
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from typing import List


@dataclass
class Bloom:
    id: int
    sender: str
    content: str
    sent_timestamp: datetime


class BloomStore:
    def __init__(self):
        self.blooms: dict[int, Bloom] = dict()
        self.blooms_by_user: defaultdict[str, List[int]] = defaultdict(list)

    def add_bloom(self, *, sender: str, content: str) -> Bloom:
        now = datetime.now()
        id = int(now.timestamp() * 1000000)
        bloom = Bloom(id=id, sender=sender, content=content, sent_timestamp=now)
        self.blooms[id] = bloom
        self.blooms_by_user[sender].append(id)
        return bloom

    def get_blooms_for_user(
        self, username: str, *, before: int = None, limit: int = None
    ) -> List[Bloom]:
        blooms_by_user = self.blooms_by_user[username]
        start_index = 0
        if before is not None:
            start_index = bisect.bisect(blooms_by_user, before)
        end_index = (
            len(blooms_by_user) - start_index
            if limit is None
            else start_index + limit + 1
        )
        return [self.blooms[id] for id in blooms_by_user[start_index:end_index]]

    def get_bloom(self, id) -> Bloom:
        return self.blooms.get(id)

    def get_blooms_with_hashtag(self, hashtag: str) -> List[Bloom]:
        """
        Gets blooms containing the passed hashtag.

        Args:
            hashtag (str): The hashtag, excluding the leading #. e.g. the Bloom "I like #cake" would be returned when querying for the argument "cake".
        """
        # TODO: This should probably have an index, at least for popular hashtags
        hashtag_with_leading_hash = f"#{hashtag}"

        return [bloom for bloom in self.blooms.values() if hashtag_with_leading_hash in bloom.content.split(" ")]
