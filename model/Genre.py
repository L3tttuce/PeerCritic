from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship

from model.BaseTable import BaseTable
from model.links import MovieGenre, SongGenre, TVShowGenre

if TYPE_CHECKING:
    from model.Movie import Movie
    from model.Song import Song
    from model.TVShow import TVShow


class Genre(BaseTable, table=True):
    genre_id: int | None = Field(default=None, primary_key=True)
    genre_name: str = Field(index=True)

    movies: list["Movie"] = Relationship(back_populates="genres", link_model=MovieGenre)
    shows: list["TVShow"] = Relationship(back_populates="genres", link_model=TVShowGenre)
    songs: list["Song"] = Relationship(back_populates="genres", link_model=SongGenre)


class GenreCardPublic(BaseTable):
    genre_id: int | None
    genre_name: str
