from typing import TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

from model.BaseTable import BaseTable

# Condition to break circular import
if TYPE_CHECKING:
    from model.Movie import Movie
    from model.TVShow import TVShow

from model.links import MovieWriter, TVShowWriter

# Create Writer database table
class Writer(BaseTable, table=True):
    writer_id: int | None = Field(default=None, primary_key=True)   # Create id
    writer_name: str = Field(index=True)

    movies: list["Movie"] = Relationship(back_populates="writers", link_model=MovieWriter)
    shows: list["TVShow"] = Relationship(back_populates="writers", link_model=TVShowWriter)


# Create Data Transfer Object (DTO) for showing Writer information public
class WriterCardPublic(BaseTable):
    writer_id: int | None
    writer_name: str 
    
