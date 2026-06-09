# python scripts/import_tmdb_tv.py "Tv Show Title"

import os
import sys

from sqlmodel import select

sys.path.append(os.getcwd())

from model.TVShow import TVShow
from scripts.lib.db_helpers import (
    get_or_create_actor,
    get_or_create_director,
    get_or_create_genre,
    get_or_create_writer,
    get_session,
)
from scripts.lib.tmdb import (
    backdrop_url,
    get_trailer_video,
    poster_url,
    tmdb_get,
    year_from_date,
)


def search_tv(query: str):
    data = tmdb_get("/search/tv", {"query": query, "include_adult": "false"})
    return data.get("results", [])


def get_tv_details(tmdb_id: int):
    return tmdb_get(f"/tv/{tmdb_id}")


def get_tv_credits(tmdb_id: int):
    return tmdb_get(f"/tv/{tmdb_id}/credits")


def upsert_tv_show(details: dict):
    tmdb_id = details["id"]
    title = details.get("name") or details.get("original_name") or "Untitled"
    year = year_from_date(details.get("first_air_date"))

    video_url = get_trailer_video(tmdb_id, "tv")
    credits = get_tv_credits(tmdb_id)

    with get_session() as session:
        existing_show = session.exec(
            select(TVShow).where(TVShow.title == title, TVShow.year == year)
        ).first()

        if existing_show:
            show = existing_show
            action = "Updated"
        else:
            show = TVShow(title=title)
            show.rating = 0
            show.rating_count = 0
            action = "Created"

        session.add(show)
        session.flush()

        show.description = details.get("overview")
        show.year = year
        show.cover = poster_url(details.get("poster_path"))
        show.back_drop = backdrop_url(details.get("backdrop_path"))
        show.video = video_url
        show.episode_count = details.get("number_of_episodes") or 0
        show.season_count = details.get("number_of_seasons") or 0

        show.genres = [
            get_or_create_genre(session, g["name"])
            for g in details.get("genres", [])
            if g.get("name")
        ]
        show.actors = [
            get_or_create_actor(session, c["name"])
            for c in credits.get("cast", [])[:10]
            if c.get("name")
        ]

        creator_names = [c["name"] for c in details.get("created_by", []) if c.get("name")]
        director_names = {
            c["name"]
            for c in credits.get("crew", [])
            if c.get("job") == "Director" and c.get("name")
        }
        writer_names = {
            c["name"]
            for c in credits.get("crew", [])
            if c.get("job") in ["Writer", "Screenplay", "Story", "Teleplay"] and c.get("name")
        }
        for name in creator_names:
            writer_names.add(name)

        show.directors = [get_or_create_director(session, name) for name in sorted(director_names)]
        show.writers = [get_or_create_writer(session, name) for name in sorted(writer_names)]

        session.add(show)
        session.commit()
        session.refresh(show)

        print(f"\n{action} TV show:")
        print(f"  ID: {show.id}")
        print(f"  Title: {show.title}")
        print(f"  Year: {show.year}")
        print(f"  TMDB ID: {tmdb_id}")
        print(f"  Video: {show.video}")
        print(f"  Seasons: {show.season_count}")
        print(f"  Episodes: {show.episode_count}")


def main():
    if len(sys.argv) < 2:
        print('Usage: python scripts/import_tmdb_tv.py "Breaking Bad"')
        raise SystemExit(1)

    query = " ".join(sys.argv[1:]).strip()
    results = search_tv(query)

    if not results:
        print(f"No TMDB results found for: {query}")
        return

    selected = results[0]
    print(f'Auto-selected: {selected.get("name")} ({selected.get("first_air_date", "Unknown date")})')
    details = get_tv_details(selected["id"])
    upsert_tv_show(details)


if __name__ == "__main__":
    main()
