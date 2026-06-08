from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship

from model.BaseTable import BaseTable
from model.TVShowActor import TVShowActor
from model.TVShowDirector import TVShowDirector
from model.TVShowGenre import TVShowGenre
from model.TVShowWriter import TVShowWriter

if TYPE_CHECKING:
    from model.Writer import Writer
    from model.Actor import Actor
    from model.Director import Director
    from model.Genre import Genre
    from model.Review import Review
    from model.Episode import Episode


class TVShow(BaseTable, table=True):
    show_id: int | None = Field(default=None, primary_key=True)
    show_name: str
    description: str | None = Field(nullable=True)
    year: int | None = Field(nullable=True)
    length: str | None = Field(nullable=True)
    cover: str | None = Field(nullable=True)
    back_drop: str | None = Field(nullable=True)
    video: str | None = Field(nullable=True)
    show_rating: float | None = Field(nullable=True)
    show_rating_count: int | None = Field(nullable=True)

    writers: list["Writer"] = Relationship(back_populates="shows", link_model=TVShowWriter)
    actors: list["Actor"] = Relationship(back_populates="shows", link_model=TVShowActor)
    directors: list["Director"] = Relationship(back_populates="shows", link_model=TVShowDirector)
    genres: list["Genre"] = Relationship(back_populates="shows", link_model=TVShowGenre)
    episodes: list["Episode"] = Relationship(back_populates="show")
    reviews: list["Review"] = Relationship(back_populates="tvshow")


class TVShowPublic(BaseTable):
    show_id: int | None
    show_name: str
    description: str | None
    year: int | None
    length: str | None
    cover: str | None
    video: str | None
    show_rating: float | None
    show_rating_count: int | None
    writers: list[str]
    actors: list[str]
    directors: list[str]
    genres: list[str]
    reviews: list[str]


class TVShowCardPublic(BaseTable):
    show_id: int | None
    show_name: str
    description: str | None
    year: int | None
    length: str | None
    cover: str | None
    back_drop: str | None
    show_rating: float | None
    show_rating_count: int | None
