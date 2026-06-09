from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship

from model.MediaBase import MediaBase
from model.links import TVShowActor, TVShowDirector, TVShowGenre, TVShowWriter

if TYPE_CHECKING:
    from model.Writer import Writer
    from model.Actor import Actor
    from model.Director import Director
    from model.Genre import Genre
    from model.Review import Review


class TVShow(MediaBase, table=True):
    episode_count: int = Field(default=0)
    season_count: int = Field(default=0)

    writers: list["Writer"] = Relationship(back_populates="shows", link_model=TVShowWriter)
    actors: list["Actor"] = Relationship(back_populates="shows", link_model=TVShowActor)
    directors: list["Director"] = Relationship(back_populates="shows", link_model=TVShowDirector)
    genres: list["Genre"] = Relationship(back_populates="shows", link_model=TVShowGenre)
    reviews: list["Review"] = Relationship(back_populates="tvshow")
