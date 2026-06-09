import os
from datetime import datetime

import requests
from dotenv import load_dotenv

TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"
TMDB_BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/w1280"


def tmdb_headers():
    load_dotenv()
    token = os.getenv("TMDB_ACCESS_TOKEN")
    if not token:
        raise RuntimeError("TMDB_ACCESS_TOKEN is not set in .env")
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }


def tmdb_get(path: str, params: dict | None = None):
    response = requests.get(
        f"{TMDB_BASE_URL}{path}",
        headers=tmdb_headers(),
        params=params or {},
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


def year_from_date(date_value: str | None) -> int | None:
    if not date_value:
        return None
    try:
        return datetime.strptime(date_value, "%Y-%m-%d").year
    except ValueError:
        return None


def poster_url(path: str | None) -> str | None:
    if not path:
        return None
    return f"{TMDB_IMAGE_BASE_URL}{path}"


def backdrop_url(path: str | None) -> str | None:
    if not path:
        return None
    return f"{TMDB_BACKDROP_BASE_URL}{path}"


def get_trailer_video(tmdb_id: int, media_type: str) -> str | None:
    data = tmdb_get(f"/{media_type}/{tmdb_id}/videos")
    for v in data.get("results", []):
        if v.get("type") == "Trailer" and v.get("site") == "YouTube":
            return f"https://www.youtube.com/embed/{v['key']}"
    return None
