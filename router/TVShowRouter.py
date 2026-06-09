from typing import Annotated

from fastapi import APIRouter, Path
from fastapi_pagination import Page

from model.Actor import Actor
from model.Director import Director
from model.Genre import Genre
from model.TVShow import TVShow
from model.Writer import Writer
from model.database import SessionDep
from model.links import TVShowGenre
from model.media_dto import MediaCardPublic, TVShowDetailPublic
from services.media import get_detail, get_similar, search_media, to_tvshow_detail

router = APIRouter()


@router.get("/shows/{show_id}", response_model=TVShowDetailPublic)
async def read_show(
    show_id: Annotated[int, Path(title="id of tv show")],
    session: SessionDep,
) -> TVShowDetailPublic:
    show = get_detail(session, TVShow, show_id)
    return to_tvshow_detail(show)


@router.get("/shows/{show_id}/similar", response_model=Page[MediaCardPublic])
async def read_similar_show(
    show_id: Annotated[int, Path(title="id of tv show")],
    session: SessionDep,
    page: int = 1,
    size: int = 20,
) -> Page[MediaCardPublic]:
    return get_similar(session, TVShow, TVShowGenre, show_id, page, size, MediaCardPublic)


@router.get("/shows", response_model=Page[MediaCardPublic])
async def search_shows(
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
        TVShow,
        MediaCardPublic,
        search_text=search_text,
        search_year=search_year,
        relation_filters=relation_filters,
        page=page,
        size=size,
    )
