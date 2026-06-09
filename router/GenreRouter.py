from fastapi import APIRouter
from fastapi_pagination import Page

from model.Genre import GenreCardPublic
from model.database import SessionDep
from router._list import build_genre_list_endpoint

router = APIRouter()

router.add_api_route(
    "/genres/movies",
    build_genre_list_endpoint("movies"),
    methods=["GET"],
    response_model=Page[GenreCardPublic],
)
router.add_api_route(
    "/genres/shows",
    build_genre_list_endpoint("shows"),
    methods=["GET"],
    response_model=Page[GenreCardPublic],
)
router.add_api_route(
    "/genres/songs",
    build_genre_list_endpoint("songs"),
    methods=["GET"],
    response_model=Page[GenreCardPublic],
)
