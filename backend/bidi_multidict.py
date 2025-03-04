from collections import defaultdict
from typing import Dict, Set


class BidiMultiDict[K, V]:
    def __init__[K, V](self):
        self.forward: Dict[K, Set[V]] = defaultdict(set)
        self.inverse: Dict[V, Set[K]] = defaultdict(set)

    def get(self, key):
        return self.forward[key]

    def get_inverse(self, value):
        return self.inverse[value]

    def add(self, key, value):
        self.forward[key].add(value)
        self.inverse[value].add(key)
