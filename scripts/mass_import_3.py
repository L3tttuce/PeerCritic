# scripts/mass_import_3.py

import subprocess
import sys
import time
from pathlib import Path

SONGS_FILE = Path("scripts/songs.txt")

songs = [
    line.strip()
    for line in SONGS_FILE.read_text(encoding="utf-8").splitlines()
    if line.strip() and not line.strip().startswith("#")
]

failed = []

for song in songs:
    print(f"\n{'=' * 60}")
    print(f"Importing song: {song}")
    print(f"{'=' * 60}")

    result = subprocess.run(
        [sys.executable, "scripts/import_spotify_song.py", song],
        check=False,
    )

    if result.returncode != 0:
        failed.append(song)

    time.sleep(1)

print("\nFinished importing songs.")

if failed:
    print("\nFailed imports:")
    for song in failed:
        print(f" - {song}")