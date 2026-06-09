from typing import Callable, Type

from fastapi import APIRouter
from fastapi_pagination import Page, Params, set_page, set_params
from fastapi_pagination.ext.sqlmodel import paginate
from sqlmodel import SQLModel, select

from model.database import SessionDep


def build_list_router(
    model: Type[SQLModel],
    card_dto: Type,
    path: str,
    order_by: Callable,
) -> APIRouter:
    router = APIRouter()

    @router.get(path, response_model=Page[card_dto])
    async def list_items(
        session: SessionDep,
        page: int = 1,
        size: int = 20,
    ) -> Page[card_dto]:
        set_page(Page[card_dto])
        set_params(Params(size=size, page=page))
        return paginate(session, select(model).order_by(order_by()))

    return router


def build_genre_list_endpoint(relationship_attr: str):
    async def endpoint(session: SessionDep, page: int = 1, size: int = 20):
        from sqlalchemy.orm import joinedload
        from model.Genre import Genre, GenreCardPublic
        from utils.cache import genre_list_cache

        cache_key = (relationship_attr, page, size)
        cached = genre_list_cache.get(cache_key)
        if cached is not None:
            return cached

        set_page(Page[GenreCardPublic])
        set_params(Params(size=size, page=page))
        rel = getattr(Genre, relationship_attr)
        result = paginate(
            session,
            select(Genre).options(joinedload(rel)).where(rel.any()),
        )
        genre_list_cache.set(cache_key, result)
        return result

    return endpoint
