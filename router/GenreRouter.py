from fastapi import APIRouter
from fastapi_pagination import Page, set_page, set_params, Params
from fastapi_pagination.ext.sqlmodel import paginate
from sqlalchemy.orm import joinedload
from sqlmodel import select

from model.Genre import Genre, GenreCardPublic
from model.database import SessionDep

# Create a router instance
router = APIRouter()

# Define routes for getting a list of genres for movies
@router.get("/genres/movies", response_model=Page[GenreCardPublic])
async def get_movie_genres(session: SessionDep, page: int = 1, size: int = 20) -> Page[GenreCardPublic]:
    set_page(Page[GenreCardPublic])
    set_params(Params(size=size, page=page))
    result = paginate(session, select(Genre).options(joinedload(Genre.movies)).where(Genre.movies.any()))
    return result


# Define routes for getting a list of genres for TV shows
@router.get("/genres/shows", response_model=Page[GenreCardPublic])
async def get_show_genres(session: SessionDep, page: int = 1, size: int = 20) -> Page[GenreCardPublic]:
    set_page(Page[GenreCardPublic])
    set_params(Params(size=size, page=page))
    result = paginate(session, select(Genre).options(joinedload(Genre.shows)).where(Genre.shows.any()))
    return result


# Define routes for getting a list of genres for songs
@router.get("/genres/songs", response_model=Page[GenreCardPublic])
async def get_song_genres(session: SessionDep, page: int = 1, size: int = 20) -> Page[GenreCardPublic]:
    set_page(Page[GenreCardPublic])
    set_params(Params(size=size, page=page))
    result = paginate(session, select(Genre).options(joinedload(Genre.songs)).where(Genre.songs.any()))
    return result