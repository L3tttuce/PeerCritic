from typing import TYPE_CHECKING

from sqlmodel import Relationship

from model.MediaBase import MediaBase
from model.links import MovieActor, MovieDirector, MovieGenre, MovieWriter

if TYPE_CHECKING:
    from model.Writer import Writer
    from model.Actor import Actor
    from model.Director import Director
    from model.Genre import Genre
    from model.Review import Review


class Movie(MediaBase, table=True):
    writers: list["Writer"] = Relationship(back_populates="movies", link_model=MovieWriter)
    actors: list["Actor"] = Relationship(back_populates="movies", link_model=MovieActor)
    directors: list["Director"] = Relationship(back_populates="movies", link_model=MovieDirector)
    genres: list["Genre"] = Relationship(back_populates="movies", link_model=MovieGenre)
    reviews: list["Review"] = Relationship(back_populates="movie")
