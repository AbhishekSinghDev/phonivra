import unittest

from phonivra_engine.schemas import Settings
from phonivra_engine.text import dictionary_rules, prepare


class DictionaryRuleTests(unittest.TestCase):
    def test_documented_separators_and_comment_lines(self):
        rules = dictionary_rules("  # Use one rule per line\nPhonivra => fo-nee-vra\nAPI = A P I")
        self.assertEqual(rules, [("Phonivra", "fo-nee-vra"), ("API", "A P I")])
        with self.assertRaises(ValueError):
            dictionary_rules("Phonivra -> fo-nee-vra")

    def test_dictionary_uses_one_pass_and_prioritizes_longest_whole_match(self):
        dictionary = "alpha = beta\nbeta => gamma\nalpha group = team"
        result = prepare("ALPHA beta alphabet Alpha Group", Settings(pronounce=True), dictionary)
        self.assertEqual(result, "beta gamma alphabet team")
