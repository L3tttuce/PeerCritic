from typing import Any, Callable, Type

from fastapi import HTTPException
from fastapi_pagination import Page, Params, set_page, set_params
from fastapi_pagination.ext.sqlmodel import paginate
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import Session, SQLModel, select

from model.Movie import Movie
from model.Song import Song
from model.TVShow import TVShow
from model.media_dto import (
    MediaCardPublic,
    MediaDetailPublic,
    MovieDetailPublic,
    SongCardPublic,
    SongDetailPublic,
    TVShowDetailPublic,
)

_detail_load_options_cache: dict[type, list] = {}


def _get_detail_load_options(model: Type[SQLModel]) -> list:
    """Build selectinload options lazily to avoid configuring mappers at import time."""
    if model in _detail_load_options_cache:
        return _detail_load_options_cache[model]

    if model is Movie:
        options = [
            selectinload(Movie.writers),
            selectinload(Movie.actors),
            selectinload(Movie.directors),
            selectinload(Movie.genres),
            selectinload(Movie.reviews),
        ]
    elif model is TVShow:
        options = [
            selectinload(TVShow.writers),
            selectinload(TVShow.actors),
            selectinload(TVShow.directors),
            selectinload(TVShow.genres),
            selectinload(TVShow.reviews),
        ]
    elif model is Song:
        options = [
            selectinload(Song.artists),
            selectinload(Song.genres),
            selectinload(Song.reviews),
        ]
    else:
        options = []

    _detail_load_options_cache[model] = options
    return options


def get_detail(session: Session, model: Type[SQLModel], media_id: int) -> Any:
    load_options = _get_detail_load_options(model)
    stmt = select(model).where(model.id == media_id)
    for opt in load_options:
        stmt = stmt.options(opt)
    entity = session.exec(stmt).first()
    if entity is None:
        raise HTTPException(status_code=404, detail="Not found")
    return entity


def _card_transformer(
    card_mapper: Callable[[Any], MediaCardPublic] | None,
) -> Callable[[list[Any]], list[MediaCardPublic]] | None:
    if card_mapper is None:
        return None
    return lambda items: [card_mapper(item) for item in items]


def get_similar(
    session: Session,
    model: Type[Any],
    link_model: Type[Any],
    media_id: int,
    page: int,
    size: int,
    card_dto: Type[MediaCardPublic],
    card_mapper: Callable[[Any], MediaCardPublic] | None = None,
    load_options: list | None = None,
) -> Page[MediaCardPublic]:
    from utils.cache import similar_media_cache

    cache_key = (model.__name__, media_id, page, size)
    cached = similar_media_cache.get(cache_key)
    if cached is not None:
        return cached

    entity = get_detail(session, model, media_id)
    genre_ids = [g.genre_id for g in entity.genres]

    set_page(Page[card_dto])
    set_params(Params(size=size, page=page))

    statement = (
        select(model)
        .distinct()
        .outerjoin(link_model)
        .where(model.id != media_id)
        .where(link_model.genre_id.in_(genre_ids))
        .order_by(model.id)
    )
    if load_options:
        for opt in load_options:
            statement = statement.options(opt)

    result = paginate(
        session,
        statement,
        transformer=_card_transformer(card_mapper),
    )
    similar_media_cache.set(cache_key, result)
    return result


def search_media(
    session: Session,
    model: Type[Any],
    card_dto: Type[MediaCardPublic],
    *,
    search_text: str | None = None,
    search_year: int | None = None,
    relation_filters: dict[str, Any] | None = None,
    page: int = 1,
    size: int = 20,
    card_mapper: Callable[[Any], MediaCardPublic] | None = None,
    load_options: list | None = None,
) -> Page[MediaCardPublic]:
    set_page(Page[card_dto])
    set_params(Params(size=size, page=page))

    statement = select(model)

    if search_text is not None:
        statement = statement.where(
            func.lower(model.title).contains(search_text.casefold())
        )

    if search_year is not None:
        statement = statement.where(model.year == search_year)

    if relation_filters:
        for _, (rel_attr, _rel_model, condition) in relation_filters.items():
            statement = statement.where(getattr(model, rel_attr).any(condition))

    if load_options:
        for opt in load_options:
            statement = statement.options(opt)

    return paginate(session, statement, transformer=_card_transformer(card_mapper))


def _names(items: list, attr: str) -> list[str]:
    return [getattr(item, attr) for item in items]


def to_movie_detail(movie) -> MovieDetailPublic:
    return MovieDetailPublic(
        id=movie.id,
        title=movie.title,
        description=movie.description,
        year=movie.year,
        length=movie.length,
        cover=movie.cover,
        back_drop=movie.back_drop,
        video=movie.video,
        rating=movie.rating,
        rating_count=movie.rating_count,
        writers=_names(movie.writers, "writer_name"),
        actors=_names(movie.actors, "actor_name"),
        directors=_names(movie.directors, "director_name"),
        genres=_names(movie.genres, "genre_name"),
        reviews=[r.review for r in movie.reviews if r.review],
    )


def to_tvshow_detail(show) -> TVShowDetailPublic:
    base = to_movie_detail(show)
    return TVShowDetailPublic(
        **base.model_dump(),
        episode_count=show.episode_count,
        season_count=show.season_count,
    )


def to_song_detail(song) -> SongDetailPublic:
    return SongDetailPublic(
        id=song.id,
        title=song.title,
        year=song.year,
        length=song.length,
        cover=song.cover,
        video=song.video,
        rating=song.rating,
        rating_count=song.rating_count,
        artists=_names(song.artists, "artist_name"),
        genres=_names(song.genres, "genre_name"),
        reviews=[r.review for r in song.reviews if r.review],
    )


def to_song_card(song) -> SongCardPublic:
    return SongCardPublic(
        id=song.id,
        title=song.title,
        year=song.year,
        length=song.length,
        cover=song.cover,
        rating=song.rating,
        rating_count=song.rating_count,
        artists=_names(song.artists, "artist_name"),
    )
