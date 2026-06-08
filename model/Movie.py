from typing import TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

from model.BaseTable import BaseTable
from model.MovieActor import MovieActor
from model.MovieDirector import MovieDirector
from model.MovieGenre import MovieGenre
from model.MovieWriter import MovieWriter

# Condition to break circular import
if TYPE_CHECKING:
    from model.Writer import Writer
    from model.Actor import Actor
    from model.Director import Director
    from model.Genre import Genre
    from model.Review import Review


# Create Movie database table
class Movie(BaseTable, table=True):
    movie_id: int | None = Field(default=None, primary_key=True)    # Create id
    movie_name: str                                                 # required field
    description: str | None = Field(nullable=True)                  # Optional field
    year: int | None = Field(nullable=True)                         # Optional field
    length: str | None = Field(nullable=True)                       # Optional field
    cover: str | None = Field(nullable=True)                        # Optional field
    back_drop: str | None = Field(nullable=True)                    # Optional field
    video: str | None = Field(nullable=True)                        # Optional field
    movie_rating: float | None = Field(nullable=True)               # Optional field
    movie_rating_count: int | None = Field(nullable=True)           # Optional field

    # Create many-to-many relationship between Movie and Writer
    writers: list["Writer"] = Relationship(back_populates="movies", link_model=MovieWriter)
    # Create many-to-many relationship between Movie and Actor
    actors: list["Actor"] = Relationship(back_populates="movies", link_model=MovieActor)
    # Create many-to-many relationship between Movie and Director
    directors: list["Director"] = Relationship(back_populates="movies", link_model=MovieDirector)
    # Create many-to-many relationship between Movie and Genre
    genres: list["Genre"] = Relationship(back_populates="movies", link_model=MovieGenre)
    # Create one-to-many relationship between Movie and Review
    reviews: list["Review"] = Relationship(back_populates="movie")
    
# Create Data Transfer Object (DTO) for detailed movie view
class MoviePublic(BaseTable): 
    movie_id: int | None
    movie_name: str
    description: str | None
    year: int | None
    length: str | None
    cover: str | None
    video: str | None
    movie_rating: float | None
    movie_rating_count: int | None
    writers: list[str]
    actors: list[str]
    directors: list[str]
    genres: list[str]
    reviews: list[str]
   
    
# Create Data Transfer Object (DTO) for movie card view
class MovieCardPublic(BaseTable): 
    movie_id: int | None
    movie_name: str
    description: str | None
    year: int | None
    length: str | None
    cover: str | None
    back_drop: str | None
    movie_rating: float | None
    movie_rating_count: int | None
    
