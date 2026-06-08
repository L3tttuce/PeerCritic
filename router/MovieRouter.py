from typing import Annotated

from fastapi import APIRouter, Path
from fastapi_pagination import Page, Params, set_page, set_params
from fastapi_pagination.ext.sqlmodel import paginate
from sqlalchemy import func
from sqlmodel import select

from model.Actor import Actor
from model.Director import Director
from model.Genre import Genre
from model.Movie import Movie, MovieCardPublic, MoviePublic
from model.MovieGenre import MovieGenre
from model.Writer import Writer
from model.database import SessionDep

router = APIRouter()


@router.get("/movies/{movie_id}", response_model=MoviePublic)
async def read_movie(
    movie_id: Annotated[int, Path(title="id of movie")],
    session: SessionDep,
) -> MoviePublic:
    movie = session.exec(select(Movie).where(Movie.movie_id == movie_id)).first()
    return MoviePublic(
        movie_id=movie.movie_id,
        movie_name=movie.movie_name,
        description=movie.description,
        year=movie.year,
        length=movie.length,
        cover=movie.cover,
        back_drop=movie.back_drop,
        video=movie.video,
        movie_rating=movie.movie_rating,
        movie_rating_count=movie.movie_rating_count,
        directors=[director.director_name for director in movie.directors],
        writers=[writer.writer_name for writer in movie.writers],
        actors=[actor.actor_name for actor in movie.actors],
        genres=[genre.genre_name for genre in movie.genres],
        reviews=[review.review for review in movie.reviews],
    )


@router.get("/movies/{movie_id}/similar", response_model=Page[MovieCardPublic])
async def read_similar_movie(
    movie_id: Annotated[int, Path(title="id of movie")],
    session: SessionDep,
    page: int = 1,
    size: int = 20,
) -> Page[MovieCardPublic]:
    movie = session.exec(select(Movie).where(Movie.movie_id == movie_id)).first()
    genres = [genre.genre_id for genre in movie.genres]

    set_page(Page[MovieCardPublic])
    set_params(Params(size=size, page=page))

    result = paginate(
        session,
        select(Movie)
        .distinct()
        .outerjoin(MovieGenre)
        .where(Movie.movie_id != movie.movie_id)
        .where(MovieGenre.genre_id.in_(genres))
        .order_by(Movie.movie_id),
    )
    return result


@router.get("/movies", response_model=Page[MovieCardPublic])
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
) -> Page[MovieCardPublic]:
    set_page(Page[MovieCardPublic])
    set_params(Params(size=size, page=page))

    statement = select(Movie)

    if search_text is not None:
        statement = statement.where(
            func.lower(Movie.movie_name).contains(search_text.casefold())
        )

    if search_year is not None:
        statement = statement.where(Movie.year == search_year)

    if search_writer is not None:
        statement = statement.where(
            Movie.writers.any(Writer.writer_name == search_writer)
        )

    if search_actor is not None:
        statement = statement.where(Movie.actors.any(Actor.actor_name == search_actor))

    if search_director is not None:
        statement = statement.where(
            Movie.directors.any(Director.director_name == search_director)
        )

    if search_genre is not None:
        statement = statement.where(Movie.genres.any(Genre.genre_name == search_genre))

    result = paginate(session, statement)
    return result
