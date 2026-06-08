from typing import TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

from model.BaseTable import BaseTable
from model.SongGenre import SongGenre

# Condition to break circular import
if TYPE_CHECKING:
    from model.Movie import Movie
    from model.Song import Song
    from model.TVShow import TVShow

from model.MovieGenre import MovieGenre
from model.TVShowGenre import TVShowGenre

# Create Genre database table
class Genre(BaseTable, table=True):
    genre_id: int | None = Field(default=None, primary_key=True)    # Create id
    genre_name: str                                                 # Required field

    movies: list["Movie"] = Relationship(back_populates="genres", link_model=MovieGenre)
    shows: list["TVShow"] = Relationship(back_populates="genres", link_model=TVShowGenre)
    songs: list["Song"] = Relationship(back_populates="genres", link_model=SongGenre)


# Create Data Transfer Object (DTO) for showing Genre information public
class GenreCardPublic(BaseTable):
    genre_id: int | None
    genre_name: str     