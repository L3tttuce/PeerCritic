# scripts/import_movies_auto.py

import subprocess
import sys
from pathlib import Path

MOVIES_FILE = Path("scripts/movies.txt")

movies = [
    line.strip()
    for line in MOVIES_FILE.read_text(encoding="utf-8").splitlines()
    if line.strip() and not line.strip().startswith("#")
]

for movie in movies:
    print(f"\n{'=' * 60}")
    print(f"Importing: {movie}")
    print(f"{'=' * 60}")

    subprocess.run(
        [sys.executable, "scripts/import_tmdb_movie.py", movie],
        input="1\n",
        text=True,
        check=False,
    )