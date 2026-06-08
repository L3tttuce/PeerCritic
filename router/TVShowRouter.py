from typing import Annotated

from fastapi import APIRouter, Path
from fastapi_pagination import Page, Params, set_page, set_params
from fastapi_pagination.ext.sqlmodel import paginate
from sqlalchemy import func
from sqlmodel import select

from model.Actor import Actor
from model.Director import Director
from model.Episode import Episode
from model.Genre import Genre
from model.TVShow import TVShow, TVShowCardPublic, TVShowPublic
from model.TVShowGenre import TVShowGenre
from model.Writer import Writer
from model.database import SessionDep

router = APIRouter()


class TVShowPublicWithEpisodes(TVShowPublic):
    episodes: list[Episode]


@router.get("/shows/{show_id}", response_model=TVShowPublicWithEpisodes)
async def read_show(
    show_id: Annotated[int, Path(title="id of tv show")],
    session: SessionDep,
) -> TVShowPublicWithEpisodes:
    show = session.exec(select(TVShow).where(TVShow.show_id == show_id)).first()
    return TVShowPublicWithEpisodes(
        show_id=show.show_id,
        show_name=show.show_name,
        description=show.description,
        year=show.year,
        length=show.length,
        cover=show.cover,
        back_drop=show.back_drop,
        video=show.video,
        show_rating=show.show_rating,
        show_rating_count=show.show_rating_count,
        episodes=show.episodes,
        directors=[director.director_name for director in show.directors],
        writers=[writer.writer_name for writer in show.writers],
        actors=[actor.actor_name for actor in show.actors],
        genres=[genre.genre_name for genre in show.genres],
        reviews=[review.review for review in show.reviews],
    )


@router.get("/shows/{show_id}/similar", response_model=Page[TVShowCardPublic])
async def read_similar_show(
    show_id: Annotated[int, Path(title="id of tv show")],
    session: SessionDep,
    page: int = 1,
    size: int = 20,
) -> Page[TVShowCardPublic]:
    show = session.exec(select(TVShow).where(TVShow.show_id == show_id)).first()
    genres = [genre.genre_id for genre in show.genres]

    set_page(Page[TVShowCardPublic])
    set_params(Params(size=size, page=page))

    result = paginate(
        session,
        select(TVShow)
        .distinct()
        .outerjoin(TVShowGenre)
        .where(TVShow.show_id != show.show_id)
        .where(TVShowGenre.genre_id.in_(genres))
        .order_by(TVShow.show_id),
    )
    return result


@router.get("/shows", response_model=Page[TVShowCardPublic])
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
) -> Page[TVShowCardPublic]:
    set_page(Page[TVShowCardPublic])
    set_params(Params(size=size, page=page))

    statement = select(TVShow)

    if search_text is not None:
        statement = statement.where(
            func.lower(TVShow.show_name).contains(search_text.casefold())
        )

    if search_year is not None:
        statement = statement.where(TVShow.year == search_year)

    if search_writer is not None:
        statement = statement.where(
            TVShow.writers.any(Writer.writer_name == search_writer)
        )

    if search_actor is not None:
        statement = statement.where(TVShow.actors.any(Actor.actor_name == search_actor))

    if search_director is not None:
        statement = statement.where(
            TVShow.directors.any(Director.director_name == search_director)
        )

    if search_genre is not None:
        statement = statement.where(TVShow.genres.any(Genre.genre_name == search_genre))

    result = paginate(session, statement)
    return result
