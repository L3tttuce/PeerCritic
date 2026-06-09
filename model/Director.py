from typing import TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

from model.BaseTable import BaseTable

# Condition to break circular import
if TYPE_CHECKING:
    from model.Movie import Movie
    from model.TVShow import TVShow

from model.links import MovieDirector, TVShowDirector

# Create Director database table
class Director(BaseTable, table=True):
    director_id: int | None = Field(default=None, primary_key=True) # Create id
    director_name: str = Field(index=True)

    movies: list["Movie"] = Relationship(back_populates="directors", link_model=MovieDirector)
    shows: list["TVShow"] = Relationship(back_populates="directors", link_model=TVShowDirector)


# Create Data Transfer Object (DTO) for showing director information public
class DirectorCardPublic(BaseTable):
    director_id: int | None
    director_name: str 