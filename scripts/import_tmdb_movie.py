# python scripts/import_tmdb_movie.py "Movie Title"

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

from model.Movie import Movie


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


def search_movies(query: str):
    data = tmdb_get("/search/movie", {"query": query, "include_adult": "false"})
    return data.get("results", [])


def get_movie_details(tmdb_id: int):
    return tmdb_get(f"/movie/{tmdb_id}")


def choose_movie(results: list[dict]) -> dict | None:
    if not results:
        print("No TMDB results found.")
        return None

    print("\nTMDB results:")
    for index, movie in enumerate(results[:10], start=1):
        title = movie.get("title") or "Untitled"
        release_date = movie.get("release_date") or "Unknown date"
        overview = (movie.get("overview") or "").strip()
        short_overview = overview[:90] + "..." if len(overview) > 90 else overview

        print(f"{index}. {title} ({release_date})")
        if short_overview:
            print(f"   {short_overview}")

    while True:
        choice = input("\nPick a movie number to import, or press Enter to cancel: ").strip()

        if choice == "":
            return None

        if choice.isdigit():
            index = int(choice)
            if 1 <= index <= min(len(results), 10):
                return results[index - 1]

        print("Invalid choice. Try again.")

def get_movie_video(tmdb_id: int):
    data = tmdb_get(f"/movie/{tmdb_id}/videos")

    for v in data.get("results", []):
        if v.get("type") == "Trailer" and v.get("site") == "YouTube":
            return f"https://www.youtube.com/embed/{v['key']}"

    return None

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

def get_movie_credits(tmdb_id: int):
    return tmdb_get(f"/movie/{tmdb_id}/credits")

def upsert_movie(details: dict):
    tmdb_id = details["id"]
    movie_name = details.get("title") or details.get("original_title") or "Untitled"
    year = year_from_date(details.get("release_date"))
    runtime = details.get("runtime")
    video_url = get_movie_video(tmdb_id)

    length = f"{runtime} min" if runtime else None

    with Session(engine) as session:
        # Since your Movie model does not currently store tmdb_id,
        # this avoids duplicates by matching name + year.
        existing_movie = session.exec(
            select(Movie).where(
                Movie.movie_name == movie_name,
                Movie.year == year,
            )
        ).first()

        if existing_movie:
            movie = existing_movie
            action = "Updated"
        else:
            movie = Movie(movie_name=movie_name)
            movie.movie_rating = 0
            movie.movie_rating_count = 0
            action = "Created"

        movie.description = details.get("overview")
        movie.year = year
        movie.length = length
        movie.cover = poster_url(details.get("poster_path"))
        movie.back_drop = backdrop_url(details.get("backdrop_path"))
        movie.video = video_url
        credits = get_movie_credits(tmdb_id)

        movie.genres = [
            get_or_create_genre(session, g["name"])
            for g in details.get("genres", [])
            if g.get("name")
        ]

        movie.actors = [
            get_or_create_actor(session, c["name"])
            for c in credits.get("cast", [])[:10]
            if c.get("name")
        ]

        movie.directors = [
            get_or_create_director(session, c["name"])
            for c in credits.get("crew", [])
            if c.get("job") == "Director" and c.get("name")
        ]

        movie.writers = [
            get_or_create_writer(session, c["name"])
            for c in credits.get("crew", [])
            if c.get("job") in ["Writer", "Screenplay", "Story"] and c.get("name")
        ]

        session.add(movie)
        session.commit()
        session.refresh(movie)

        print(f"\n{action} movie:")
        print(f"  ID: {movie.movie_id}")
        print(f"  Title: {movie.movie_name}")
        print(f"  Year: {movie.year}")
        print(f"  TMDB ID: {tmdb_id}")
        print(f"  Video: {movie.video}")

def main():
    if len(sys.argv) < 2:
        print('Usage: python scripts/import_tmdb_movie.py "The Dark Knight"')
        raise SystemExit(1)

    query = " ".join(sys.argv[1:]).strip()
    results = search_movies(query)
    selected = choose_movie(results)

    if not selected:
        print("Cancelled.")
        return

    details = get_movie_details(selected["id"])
    upsert_movie(details)


if __name__ == "__main__":
    main()