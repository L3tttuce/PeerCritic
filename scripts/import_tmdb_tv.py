# python scripts/import_tmdb_tv.py "Tv Show Title"

import os
import sys
from datetime import datetime

import requests
from dotenv import load_dotenv
from sqlmodel import Session, select

sys.path.append(os.getcwd())

from model.database import engine

from model.Actor import Actor
from model.Artist import Artist
from model.Director import Director
from model.Episode import Episode
from model.Friendship import Friendship
from model.Genre import Genre
from model.Messages import Message
from model.Movie import Movie
from model.MovieActor import MovieActor
from model.MovieDirector import MovieDirector
from model.MovieGenre import MovieGenre
from model.MovieWriter import MovieWriter
from model.Post import Post
from model.Profile import Profile
from model.Review import Review
from model.Song import Song
from model.SongArtist import SongArtist
from model.SongGenre import SongGenre
from model.Thread import Thread
from model.User import User
from model.Writer import Writer


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


def search_tv(query: str):
    data = tmdb_get("/search/tv", {"query": query, "include_adult": "false"})
    return data.get("results", [])


def get_tv_details(tmdb_id: int):
    return tmdb_get(f"/tv/{tmdb_id}")


def get_tv_credits(tmdb_id: int):
    return tmdb_get(f"/tv/{tmdb_id}/credits")


def get_tv_video(tmdb_id: int):
    data = tmdb_get(f"/tv/{tmdb_id}/videos")

    for v in data.get("results", []):
        if v.get("type") == "Trailer" and v.get("site") == "YouTube":
            return f"https://www.youtube.com/embed/{v['key']}"

    return None


def get_season_details(tmdb_id: int, season_number: int):
    return tmdb_get(f"/tv/{tmdb_id}/season/{season_number}")


def choose_tv(results: list[dict]) -> dict | None:
    if not results:
        print("No TMDB results found.")
        return None

    print("\nTMDB TV results:")
    for index, show in enumerate(results[:10], start=1):
        name = show.get("name") or "Untitled"
        first_air_date = show.get("first_air_date") or "Unknown date"
        overview = (show.get("overview") or "").strip()
        short_overview = overview[:90] + "..." if len(overview) > 90 else overview

        print(f"{index}. {name} ({first_air_date})")
        if short_overview:
            print(f"   {short_overview}")

    while True:
        choice = input("\nPick a TV show number to import, or press Enter to cancel: ").strip()

        if choice == "":
            return None

        if choice.isdigit():
            index = int(choice)
            if 1 <= index <= min(len(results), 10):
                return results[index - 1]

        print("Invalid choice. Try again.")


def get_or_create_genre(session: Session, name: str) -> Genre:
    genre = session.exec(select(Genre).where(Genre.genre_name == name)).first()

    if genre:
        return genre

    genre = Genre(genre_name=name)
    session.add(genre)
    session.flush()
    return genre


def get_or_create_actor(session: Session, name: str) -> Actor:
    actor = session.exec(select(Actor).where(Actor.actor_name == name)).first()

    if actor:
        return actor

    actor = Actor(actor_name=name)
    session.add(actor)
    session.flush()
    return actor


def get_or_create_director(session: Session, name: str) -> Director:
    director = session.exec(select(Director).where(Director.director_name == name)).first()

    if director:
        return director

    director = Director(director_name=name)
    session.add(director)
    session.flush()
    return director


def get_or_create_writer(session: Session, name: str) -> Writer:
    writer = session.exec(select(Writer).where(Writer.writer_name == name)).first()

    if writer:
        return writer

    writer = Writer(writer_name=name)
    session.add(writer)
    session.flush()
    return writer


def upsert_episode(
    session: Session,
    movie: Movie,
    episode_name: str,
    season_number: int | None,
    episode_number: int | None,
):
    existing_episode = session.exec(
        select(Episode).where(
            Episode.movie_id == movie.movie_id,
            Episode.season == season_number,
            Episode.episode_number == episode_number,
        )
    ).first()

    if existing_episode:
        existing_episode.episode_name = episode_name
        return existing_episode

    episode = Episode(
        episode_name=episode_name,
        season=season_number,
        episode_number=episode_number,
        movie_id=movie.movie_id,
    )
    session.add(episode)
    return episode


def upsert_tv_show(details: dict):
    tmdb_id = details["id"]

    tv_name = details.get("name") or details.get("original_name") or "Untitled"
    year = year_from_date(details.get("first_air_date"))

    episode_run_times = details.get("episode_run_time") or []
    runtime = episode_run_times[0] if episode_run_times else None
    length = f"{runtime} min" if runtime else None

    video_url = get_tv_video(tmdb_id)
    credits = get_tv_credits(tmdb_id)

    with Session(engine) as session:
        existing_show = session.exec(
            select(Movie).where(
                Movie.movie_name == tv_name,
                Movie.year == year,
            )
        ).first()

        if existing_show:
            show = existing_show
            action = "Updated"
        else:
            show = Movie(movie_name=tv_name)
            show.movie_rating = 0
            show.movie_rating_count = 0
            action = "Created"

        session.add(show)
        session.flush()

        show.description = details.get("overview")
        show.year = year
        show.length = length
        show.cover = poster_url(details.get("poster_path"))
        show.back_drop = backdrop_url(details.get("backdrop_path"))
        show.video = video_url

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

        creator_names = [
            c["name"]
            for c in details.get("created_by", [])
            if c.get("name")
        ]

        director_names = {
            c["name"]
            for c in credits.get("crew", [])
            if c.get("job") == "Director" and c.get("name")
        }

        writer_names = {
            c["name"]
            for c in credits.get("crew", [])
            if c.get("job") in ["Writer", "Screenplay", "Story", "Teleplay"]
            and c.get("name")
        }

        for name in creator_names:
            writer_names.add(name)

        show.directors = [
            get_or_create_director(session, name)
            for name in sorted(director_names)
        ]

        show.writers = [
            get_or_create_writer(session, name)
            for name in sorted(writer_names)
        ]

        session.add(show)
        session.flush()

        seasons = details.get("seasons", [])

        episode_count = 0

        for season in seasons:
            season_number = season.get("season_number")

            # Skip specials. Remove this if you want season 0 imported.
            if season_number is None or season_number == 0:
                continue

            season_details = get_season_details(tmdb_id, season_number)

            for ep in season_details.get("episodes", []):
                episode_name = ep.get("name") or f"Episode {ep.get('episode_number')}"
                episode_number = ep.get("episode_number")

                upsert_episode(
                    session=session,
                    movie=show,
                    episode_name=episode_name,
                    season_number=season_number,
                    episode_number=episode_number,
                )

                episode_count += 1

        session.commit()
        session.refresh(show)

        print(f"\n{action} TV show:")
        print(f"  ID: {show.movie_id}")
        print(f"  Title: {show.movie_name}")
        print(f"  Year: {show.year}")
        print(f"  TMDB ID: {tmdb_id}")
        print(f"  Video: {show.video}")
        print(f"  Episodes imported/updated: {episode_count}")


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