import datetime
import unittest

from flask import Flask

from custom_json_provider import CustomJsonProvider


class TestCustomJsonProvider(unittest.TestCase):
    def test_datetime(self):
        serialised = CustomJsonProvider(Flask("Dummy")).dumps(
            {
                "timestamp": datetime.datetime(
                    year=2020,
                    month=3,
                    day=4,
                    hour=14,
                    minute=15,
                    second=16,
                    tzinfo=datetime.UTC,
                )
            }
        )
        self.assertEqual(serialised, """{"timestamp": "2020-03-04T14:15:16+00:00"}""")


if __name__ == "__main__":
    unittest.main()
