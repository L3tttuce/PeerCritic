# python scripts/import_spotify_song.py "Song Title"

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


SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_BASE_URL = "https://api.spotify.com/v1"
LASTFM_BASE_URL = "https://ws.audioscrobbler.com/2.0/"

SPOTIFY_TOKEN: str | None = None


def spotify_access_token() -> str:
    global SPOTIFY_TOKEN

    if SPOTIFY_TOKEN:
        return SPOTIFY_TOKEN

    load_dotenv()

    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")

    if not client_id or not client_secret:
        raise RuntimeError("SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in .env")

    response = requests.post(
        SPOTIFY_TOKEN_URL,
        data={"grant_type": "client_credentials"},
        auth=(client_id, client_secret),
        timeout=15,
    )
    response.raise_for_status()

    SPOTIFY_TOKEN = response.json()["access_token"]
    return SPOTIFY_TOKEN


def spotify_get(path: str, params: dict | None = None):
    response = requests.get(
        f"{SPOTIFY_BASE_URL}{path}",
        headers={"Authorization": f"Bearer {spotify_access_token()}"},
        params=params or {},
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


def lastfm_get(params: dict):
    load_dotenv()

    api_key = os.getenv("LASTFM_API_KEY")

    if not api_key:
        return {}

    response = requests.get(
        LASTFM_BASE_URL,
        params={
            **params,
            "api_key": api_key,
            "format": "json",
        },
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
        try:
            return int(date_value[:4])
        except ValueError:
            return None


def length_from_ms(duration_ms: int | None) -> str | None:
    if duration_ms is None:
        return None

    total_seconds = duration_ms // 1000
    minutes = total_seconds // 60
    seconds = total_seconds % 60

    return f"{minutes}m {seconds}s"


def search_songs(query: str):
    data = spotify_get(
        "/search",
        {
            "q": query,
            "type": "track",
            "limit": 10,
        },
    )

    return data.get("tracks", {}).get("items", [])


def get_artist_details(spotify_artist_id: str):
    return spotify_get(f"/artists/{spotify_artist_id}")


def choose_song(results: list[dict]) -> dict | None:
    if not results:
        print("No Spotify results found.")
        return None

    print("\nSpotify song results:")

    for index, track in enumerate(results[:10], start=1):
        song_name = track.get("name") or "Untitled"

        artist_names = ", ".join(
            artist["name"]
            for artist in track.get("artists", [])
            if artist.get("name")
        )

        album_name = track.get("album", {}).get("name") or "Unknown album"
        release_date = track.get("album", {}).get("release_date") or "Unknown date"

        print(f"{index}. {song_name} - {artist_names}")
        print(f"   Album: {album_name} ({release_date})")

    while True:
        choice = input("\nPick a song number to import, or press Enter to cancel: ").strip()

        if choice == "":
            return None

        if choice.isdigit():
            index = int(choice)

            if 1 <= index <= min(len(results), 10):
                return results[index - 1]

        print("Invalid choice. Try again.")


def get_or_create_artist(session: Session, name: str) -> Artist:
    artist = session.exec(
        select(Artist).where(Artist.artist_name == name)
    ).first()

    if artist:
        return artist

    artist = Artist(artist_name=name)
    session.add(artist)
    session.flush()
    return artist


def get_or_create_genre(session: Session, name: str) -> Genre:
    genre = session.exec(
        select(Genre).where(Genre.genre_name == name)
    ).first()

    if genre:
        return genre

    genre = Genre(genre_name=name)
    session.add(genre)
    session.flush()
    return genre


def get_album_cover(track: dict) -> str | None:
    images = track.get("album", {}).get("images", [])

    if not images:
        return None

    return images[0].get("url")


def spotify_embed_url(spotify_id: str | None) -> str | None:
    if not spotify_id:
        return None

    return f"https://open.spotify.com/embed/track/{spotify_id}"


def clean_lastfm_tag(tag_name: str) -> str | None:
    if not tag_name:
        return None

    tag = tag_name.strip().lower()

    blocked_tags = {
        "seen live",
        "favorites",
        "favourite",
        "favorite",
        "spotify",
        "lastfm",
        "albums i own",
        "songs",
        "song",
        "music",
        "track",
        "tracks",
        "beautiful",
        "awesome",
        "love",
        "loved",
    }

    if tag in blocked_tags:
        return None

    return tag.title()


def get_lastfm_track_genres(song_name: str, artist_name: str, limit: int = 5) -> set[str]:
    data = lastfm_get(
        {
            "method": "track.getTopTags",
            "track": song_name,
            "artist": artist_name,
            "autocorrect": 1,
        }
    )

    tags = data.get("toptags", {}).get("tag", [])
    genre_names: set[str] = set()

    for tag in tags[:limit]:
        cleaned = clean_lastfm_tag(tag.get("name", ""))

        if cleaned:
            genre_names.add(cleaned)

    return genre_names


def get_lastfm_artist_genres(artist_name: str, limit: int = 5) -> set[str]:
    data = lastfm_get(
        {
            "method": "artist.getTopTags",
            "artist": artist_name,
            "autocorrect": 1,
        }
    )

    tags = data.get("toptags", {}).get("tag", [])
    genre_names: set[str] = set()

    for tag in tags[:limit]:
        cleaned = clean_lastfm_tag(tag.get("name", ""))

        if cleaned:
            genre_names.add(cleaned)

    return genre_names


def get_spotify_artist_genres(artist_items: list[dict]) -> set[str]:
    genre_names: set[str] = set()

    for artist in artist_items:
        artist_id = artist.get("id")

        if not artist_id:
            continue

        artist_details = get_artist_details(artist_id)

        for genre_name in artist_details.get("genres", []):
            if genre_name:
                genre_names.add(genre_name.title())

    return genre_names


def get_genres(song_name: str, artist_items: list[dict]) -> set[str]:
    genre_names = get_spotify_artist_genres(artist_items)

    if genre_names:
        print("Genres found from Spotify.")
        return genre_names

    print("No Spotify genres found. Trying Last.fm track tags...")

    primary_artist_name = None

    if artist_items:
        primary_artist_name = artist_items[0].get("name")

    if primary_artist_name:
        genre_names.update(
            get_lastfm_track_genres(song_name, primary_artist_name)
        )

    if genre_names:
        print("Genres found from Last.fm track tags.")
        return genre_names

    print("No Last.fm track genres found. Trying Last.fm artist tags...")

    for artist in artist_items:
        artist_name = artist.get("name")

        if artist_name:
            genre_names.update(
                get_lastfm_artist_genres(artist_name)
            )

    if genre_names:
        print("Genres found from Last.fm artist tags.")
        return genre_names

    print("No genres found from Spotify or Last.fm.")
    manual = input("Enter genres separated by commas, or press Enter to skip: ").strip()

    if manual:
        genre_names.update(
            genre.strip().title()
            for genre in manual.split(",")
            if genre.strip()
        )

    return genre_names


def upsert_song(track: dict):
    spotify_id = track.get("id")

    song_name = track.get("name") or "Untitled"
    album = track.get("album", {})

    year = year_from_date(album.get("release_date"))
    length = length_from_ms(track.get("duration_ms"))
    cover = get_album_cover(track)
    video = spotify_embed_url(spotify_id)

    artist_items = track.get("artists", [])

    with Session(engine) as session:
        existing_song = session.exec(
            select(Song).where(
                Song.song_name == song_name,
                Song.year == year,
            )
        ).first()

        if existing_song:
            song = existing_song
            action = "Updated"
        else:
            song = Song(song_name=song_name)
            song.song_rating = 0
            song.song_rating_count = 0
            action = "Created"

        song.year = year
        song.length = length
        song.cover = cover
        song.video = video

        song.artists = [
            get_or_create_artist(session, artist["name"])
            for artist in artist_items
            if artist.get("name")
        ]

        genre_names = get_genres(song_name, artist_items)

        song.genres = [
            get_or_create_genre(session, genre_name)
            for genre_name in sorted(genre_names)
        ]

        session.add(song)
        session.commit()
        session.refresh(song)

        print(f"\n{action} song:")
        print(f"  ID: {song.song_id}")
        print(f"  Title: {song.song_name}")
        print(f"  Year: {song.year}")
        print(f"  Length: {song.length}")
        print(f"  Spotify ID: {spotify_id}")
        print(f"  Embed: {song.video}")

        if song.artists:
            print(f"  Artists: {', '.join(a.artist_name for a in song.artists)}")

        if song.genres:
            print(f"  Genres: {', '.join(g.genre_name for g in song.genres)}")
        else:
            print("  Genres: None")


def main():
    if len(sys.argv) < 2:
        print('Usage: python scripts/import_spotify_song.py "Blinding Lights"')
        raise SystemExit(1)

    query = " ".join(sys.argv[1:]).strip()

    results = search_songs(query)
    selected = choose_song(results)

    if not selected:
        print("Cancelled.")
        return

    upsert_song(selected)


if __name__ == "__main__":
    main()