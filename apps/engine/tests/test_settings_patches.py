import unittest
from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from phonivra_engine.schemas import Settings, SettingsCommand
from phonivra_engine.studio import Studio
from pydantic import ValidationError


class SettingsPatchTests(unittest.TestCase):
    def test_disjoint_patches_merge_and_explicit_defaults_are_applied(self):
        with TemporaryDirectory() as directory, closing(Studio(Path(directory))) as studio:
            for patch_fields in ({"language": "fr"}, {"speed": 1.5}, {"title": "Take one"}):
                updated = studio.dispatch(
                    SettingsCommand(type="settings.update", settings=Settings(**patch_fields))
                )
                self.assertFalse(updated["statusIsError"])

            studio.dispatch(SettingsCommand(type="settings.update", settings=Settings(speed=1)))
            with closing(Studio(Path(directory))) as restarted:
                self.assertEqual(restarted.settings.title, "Take one")
                self.assertEqual(restarted.settings.language, "fr")
                self.assertEqual(restarted.settings.speed, 1)

    def test_invalid_or_unpersisted_patch_cannot_change_settings(self):
        with TemporaryDirectory() as directory, closing(Studio(Path(directory))) as studio:
            with self.assertRaises(ValidationError):
                SettingsCommand(type="settings.update", settings={"speed": 3})
            with patch.object(studio.storage, "save", side_effect=OSError("Disk full")):
                failed = studio.dispatch(
                    SettingsCommand(type="settings.update", settings=Settings(language="fr"))
                )
            self.assertTrue(failed["statusIsError"])
            self.assertEqual(failed["settings"]["language"], "en")
