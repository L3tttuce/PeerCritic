from typing import TYPE_CHECKING

from sqlmodel import Relationship

from model.MediaBase import MediaBase
from model.links import SongArtist, SongGenre

if TYPE_CHECKING:
    from model.Artist import Artist
    from model.Genre import Genre
    from model.Review import Review


class Song(MediaBase, table=True):
    artists: list["Artist"] = Relationship(back_populates="songs", link_model=SongArtist)
    genres: list["Genre"] = Relationship(back_populates="songs", link_model=SongGenre)
    reviews: list["Review"] = Relationship(back_populates="song")
