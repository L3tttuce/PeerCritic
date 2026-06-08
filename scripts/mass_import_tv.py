import subprocess
import sys
import time
from pathlib import Path

TV_FILE = Path("scripts/tv_shows.txt")

shows = [
    line.strip()
    for line in TV_FILE.read_text(encoding="utf-8").splitlines()
    if line.strip() and not line.strip().startswith("#")
]

for show in shows:
    print(f"\n{'=' * 60}")
    print(f"Importing TV show: {show}")
    print(f"{'=' * 60}")

    subprocess.run(
        [sys.executable, "scripts/import_tmdb_tv.py", show],
        check=False,
    )

    time.sleep(1)