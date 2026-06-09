from sqlalchemy import Index
from sqlmodel import Field

from model.BaseTable import BaseTable


class LinkBase(BaseTable):
    """Base for junction tables; subclasses set the two FK columns."""


class MovieGenre(LinkBase, table=True):
    movie_id: int | None = Field(default=None, foreign_key="movie.id", primary_key=True)
    genre_id: int | None = Field(default=None, foreign_key="genre.genre_id", primary_key=True)

    __table_args__ = (Index("ix_moviegenre_genre_id", "genre_id"),)


class MovieActor(LinkBase, table=True):
    movie_id: int | None = Field(default=None, foreign_key="movie.id", primary_key=True)
    actor_id: int | None = Field(default=None, foreign_key="actor.actor_id", primary_key=True)


class MovieDirector(LinkBase, table=True):
    movie_id: int | None = Field(default=None, foreign_key="movie.id", primary_key=True)
    director_id: int | None = Field(default=None, foreign_key="director.director_id", primary_key=True)


class MovieWriter(LinkBase, table=True):
    movie_id: int | None = Field(default=None, foreign_key="movie.id", primary_key=True)
    writer_id: int | None = Field(default=None, foreign_key="writer.writer_id", primary_key=True)


class TVShowGenre(LinkBase, table=True):
    show_id: int | None = Field(default=None, foreign_key="tvshow.id", primary_key=True)
    genre_id: int | None = Field(default=None, foreign_key="genre.genre_id", primary_key=True)

    __table_args__ = (Index("ix_tvshowgenre_genre_id", "genre_id"),)


class TVShowActor(LinkBase, table=True):
    show_id: int | None = Field(default=None, foreign_key="tvshow.id", primary_key=True)
    actor_id: int | None = Field(default=None, foreign_key="actor.actor_id", primary_key=True)


class TVShowDirector(LinkBase, table=True):
    show_id: int | None = Field(default=None, foreign_key="tvshow.id", primary_key=True)
    director_id: int | None = Field(default=None, foreign_key="director.director_id", primary_key=True)


class TVShowWriter(LinkBase, table=True):
    show_id: int | None = Field(default=None, foreign_key="tvshow.id", primary_key=True)
    writer_id: int | None = Field(default=None, foreign_key="writer.writer_id", primary_key=True)


class SongGenre(LinkBase, table=True):
    song_id: int | None = Field(default=None, foreign_key="song.id", primary_key=True)
    genre_id: int | None = Field(default=None, foreign_key="genre.genre_id", primary_key=True)

    __table_args__ = (Index("ix_songgenre_genre_id", "genre_id"),)


class SongArtist(LinkBase, table=True):
    song_id: int | None = Field(default=None, foreign_key="song.id", primary_key=True)
    artist_id: int | None = Field(default=None, foreign_key="artist.artist_id", primary_key=True)
