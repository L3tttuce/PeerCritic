from typing import TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

from model.BaseTable import BaseTable

# Condition to break circular import
if TYPE_CHECKING:
    from model.Movie import Movie
    from model.TVShow import TVShow

from model.links import MovieActor, TVShowActor

# Create Actor database table
class Actor(BaseTable, table=True): 
    actor_id: int | None = Field(default=None, primary_key=True)    # create id
    actor_name: str = Field(index=True)
    
    movies: list["Movie"] = Relationship(back_populates="actors", link_model=MovieActor)
    shows: list["TVShow"] = Relationship(back_populates="actors", link_model=TVShowActor)


# Create Data transfer object (DTO) for showing actor information public
class ActorCardPublic(BaseTable):
    actor_id: int | None
    actor_name: str 