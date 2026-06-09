from typing import Annotated

from fastapi import APIRouter, Path
from fastapi_pagination import Page
from sqlalchemy.orm import selectinload

from model.Artist import Artist
from model.Genre import Genre
from model.Song import Song
from model.database import SessionDep
from model.links import SongGenre
from model.media_dto import SongCardPublic, SongDetailPublic
from services.media import get_detail, get_similar, search_media, to_song_card, to_song_detail

router = APIRouter()


@router.get("/songs/{song_id}", response_model=SongDetailPublic)
async def read_song(
    song_id: Annotated[int, Path(title="id of song")],
    session: SessionDep,
) -> SongDetailPublic:
    song = get_detail(session, Song, song_id)
    return to_song_detail(song)


@router.get("/songs/{song_id}/similar", response_model=Page[SongCardPublic])
async def read_similar_song(
    song_id: Annotated[int, Path(title="id of song")],
    session: SessionDep,
    page: int = 1,
    size: int = 20,
) -> Page[SongCardPublic]:
    return get_similar(
        session,
        Song,
        SongGenre,
        song_id,
        page,
        size,
        SongCardPublic,
        card_mapper=to_song_card,
        load_options=[selectinload(Song.artists)],
    )


@router.get("/songs", response_model=Page[SongCardPublic])
async def search_songs(
    session: SessionDep,
    search_text: str = None,
    search_year: int = None,
    search_artist: str = None,
    search_genre: str = None,
    page: int = 1,
    size: int = 20,
) -> Page[SongCardPublic]:
    relation_filters = {}
    if search_artist is not None:
        relation_filters["artist"] = ("artists", Artist, Artist.artist_name == search_artist)
    if search_genre is not None:
        relation_filters["genre"] = ("genres", Genre, Genre.genre_name == search_genre)

    return search_media(
        session,
        Song,
        SongCardPublic,
        search_text=search_text,
        search_year=search_year,
        relation_filters=relation_filters,
        page=page,
        size=size,
        card_mapper=to_song_card,
        load_options=[selectinload(Song.artists)],
    )
