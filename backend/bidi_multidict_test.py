import unittest

from bidi_multidict import BidiMultiDict


class BidiMultiDictTest(unittest.TestCase):
    def test_general(self):
        d = BidiMultiDict()

        self.assertEqual(d.get("foo"), set())

        d.add("foo", 1)
        d.add("foo", 2)
        d.add("bar", 2)
        self.assertEqual(d.get("foo"), set([1, 2]))
        self.assertEqual(d.get_inverse(1), set(["foo"]))
        self.assertEqual(d.get_inverse(2), set(["foo", "bar"]))

        d.delete("foo", 1)
        self.assertEqual(d.get("foo"), set([2]))
        self.assertEqual(d.get_inverse(1), set())
        self.assertEqual(d.get_inverse(2), set(["foo", "bar"]))

        d.delete("foo", 2)
        self.assertEqual(d.get("foo"), set())
        self.assertEqual(d.get_inverse(1), set())
        self.assertEqual(d.get_inverse(2), set(["bar"]))


if __name__ == "__main__":
    unittest.main()
