# python scripts/fix_song_genres.py

import os
import sys

from dotenv import load_dotenv
from sqlalchemy import text
from sqlmodel import Session, select

sys.path.append(os.getcwd())

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
from model.database import engine
from model.song_genres import (
    CANONICAL_SONG_GENRES,
    manual_genres_for_song,
    map_raw_genres_to_canonical,
)


def get_or_create_genre(session: Session, name: str) -> Genre:
    genre = session.exec(select(Genre).where(Genre.genre_name == name)).first()

    if genre:
        return genre

    genre = Genre(genre_name=name)
    session.add(genre)
    session.flush()
    return genre


def delete_orphan_genres(session: Session) -> int:
    orphan_ids = session.exec(
        text(
            """
            SELECT g.genre_id
            FROM genre g
            LEFT JOIN songgenre sg ON g.genre_id = sg.genre_id
            LEFT JOIN moviegenre mg ON g.genre_id = mg.genre_id
            WHERE sg.genre_id IS NULL AND mg.genre_id IS NULL
            """
        )
    ).all()

    deleted = 0

    for row in orphan_ids:
        genre = session.get(Genre, row[0])

        if genre:
            session.delete(genre)
            deleted += 1

    return deleted


def fix_song_genres() -> None:
    load_dotenv()

    updated_songs = 0
    songs_without_genres = 0

    with Session(engine) as session:
        songs = session.exec(select(Song)).all()

        for song in songs:
            session.refresh(song, attribute_names=["genres"])

            current_names = {genre.genre_name for genre in song.genres}
            canonical_names = map_raw_genres_to_canonical(current_names)

            if not canonical_names:
                canonical_names = manual_genres_for_song(song.song_name)

            if not canonical_names:
                song.genres = []
                songs_without_genres += 1
            else:
                song.genres = [
                    get_or_create_genre(session, name)
                    for name in sorted(canonical_names)
                ]

            session.add(song)
            updated_songs += 1

        deleted_orphans = delete_orphan_genres(session)
        session.commit()

    print(f"Processed {updated_songs} songs.")
    print(f"Songs left without genres: {songs_without_genres}")
    print(f"Deleted orphan genres: {deleted_orphans}")
    print(f"Canonical song genres: {len(CANONICAL_SONG_GENRES)}")


def print_summary() -> None:
    with Session(engine) as conn:
        rows = conn.exec(
            text(
                """
                SELECT g.genre_name, COUNT(*) AS song_count
                FROM genre g
                JOIN songgenre sg ON g.genre_id = sg.genre_id
                GROUP BY g.genre_id, g.genre_name
                ORDER BY song_count DESC, g.genre_name
                """
            )
        ).all()

    print("\nSong genres after cleanup:")
    for genre_name, song_count in rows:
        print(f"  {song_count:3d}  {genre_name}")

    print(f"\nTotal song genres in use: {len(rows)}")


if __name__ == "__main__":
    fix_song_genres()
    print_summary()
