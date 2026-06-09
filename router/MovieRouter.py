from typing import Annotated

from fastapi import APIRouter, Path
from fastapi_pagination import Page

from model.Actor import Actor
from model.Director import Director
from model.Genre import Genre
from model.Movie import Movie
from model.Writer import Writer
from model.database import SessionDep
from model.links import MovieGenre
from model.media_dto import MediaCardPublic, MovieDetailPublic
from services.media import get_detail, get_similar, search_media, to_movie_detail

router = APIRouter()


@router.get("/movies/{movie_id}", response_model=MovieDetailPublic)
async def read_movie(
    movie_id: Annotated[int, Path(title="id of movie")],
    session: SessionDep,
) -> MovieDetailPublic:
    movie = get_detail(session, Movie, movie_id)
    return to_movie_detail(movie)


@router.get("/movies/{movie_id}/similar", response_model=Page[MediaCardPublic])
async def read_similar_movie(
    movie_id: Annotated[int, Path(title="id of movie")],
    session: SessionDep,
    page: int = 1,
    size: int = 20,
) -> Page[MediaCardPublic]:
    return get_similar(session, Movie, MovieGenre, movie_id, page, size, MediaCardPublic)


@router.get("/movies", response_model=Page[MediaCardPublic])
async def search_movies(
    session: SessionDep,
    search_text: str = None,
    search_year: int = None,
    search_writer: str = None,
    search_actor: str = None,
    search_director: str = None,
    search_genre: str = None,
    page: int = 1,
    size: int = 20,
) -> Page[MediaCardPublic]:
    relation_filters = {}
    if search_writer is not None:
        relation_filters["writer"] = ("writers", Writer, Writer.writer_name == search_writer)
    if search_actor is not None:
        relation_filters["actor"] = ("actors", Actor, Actor.actor_name == search_actor)
    if search_director is not None:
        relation_filters["director"] = ("directors", Director, Director.director_name == search_director)
    if search_genre is not None:
        relation_filters["genre"] = ("genres", Genre, Genre.genre_name == search_genre)

    return search_media(
        session,
        Movie,
        MediaCardPublic,
        search_text=search_text,
        search_year=search_year,
        relation_filters=relation_filters,
        page=page,
        size=size,
    )
