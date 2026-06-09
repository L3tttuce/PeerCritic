import argparse
import subprocess
import sys
import time
from pathlib import Path

CONFIG = {
    "movie": {
        "file": Path("scripts/movies.txt"),
        "script": "scripts/import_tmdb_movie.py",
        "input": "1\n",
        "sleep": False,
        "track_failures": False,
    },
    "tv": {
        "file": Path("scripts/tv_shows.txt"),
        "script": "scripts/import_tmdb_tv.py",
        "input": None,
        "sleep": True,
        "track_failures": False,
    },
    "song": {
        "file": Path("scripts/songs.txt"),
        "script": "scripts/import_spotify_song.py",
        "input": None,
        "sleep": True,
        "track_failures": True,
    },
}


def main():
    parser = argparse.ArgumentParser(description="Mass import media from data files")
    parser.add_argument("--type", choices=["movie", "tv", "song"], required=True)
    args = parser.parse_args()

    cfg = CONFIG[args.type]
    items = [
        line.strip()
        for line in cfg["file"].read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]

    failed: list[str] = []

    for item in items:
        print(f"\n{'=' * 60}")
        print(f"Importing: {item}")
        print(f"{'=' * 60}")

        result = subprocess.run(
            [sys.executable, cfg["script"], item],
            input=cfg["input"],
            text=True,
            check=False,
        )

        if cfg["track_failures"] and result.returncode != 0:
            failed.append(item)

        if cfg["sleep"]:
            time.sleep(1)

    print(f"\nFinished importing {args.type} items.")

    if failed:
        print("\nFailed imports:")
        for item in failed:
            print(f" - {item}")


if __name__ == "__main__":
    main()
