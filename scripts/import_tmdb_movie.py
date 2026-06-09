# python scripts/import_tmdb_movie.py "Movie Title"

import os
import sys

from sqlmodel import select

sys.path.append(os.getcwd())

from model.Movie import Movie
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


def get_movie_credits(tmdb_id: int):
    return tmdb_get(f"/movie/{tmdb_id}/credits")


def upsert_movie(details: dict):
    tmdb_id = details["id"]
    title = details.get("title") or details.get("original_title") or "Untitled"
    year = year_from_date(details.get("release_date"))
    runtime = details.get("runtime")
    video_url = get_trailer_video(tmdb_id, "movie")
    length = f"{runtime} min" if runtime else None

    with get_session() as session:
        existing_movie = session.exec(
            select(Movie).where(Movie.title == title, Movie.year == year)
        ).first()

        if existing_movie:
            movie = existing_movie
            action = "Updated"
        else:
            movie = Movie(title=title)
            movie.rating = 0
            movie.rating_count = 0
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
        print(f"  ID: {movie.id}")
        print(f"  Title: {movie.title}")
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
