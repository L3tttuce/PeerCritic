from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship

from model.BaseTable import BaseTable

if TYPE_CHECKING:
    from model.Movie import Movie
    from model.Song import Song
    from model.TVShow import TVShow
    from model.User import User


class Review(BaseTable, table=True):
    review_id: int | None = Field(default=None, primary_key=True)
    review: str | None = Field(default=None, nullable=True)
    review_rating: float
    review_rating_count: int | None = Field(default=None, nullable=True)

    user_id: int | None = Field(default=None, foreign_key="user.user_id", index=True)
    user: Optional["User"] = Relationship(back_populates="reviews")

    movie_id: int | None = Field(default=None, foreign_key="movie.id", index=True)
    movie: Optional["Movie"] = Relationship(back_populates="reviews")

    song_id: int | None = Field(default=None, foreign_key="song.id", index=True)
    song: Optional["Song"] = Relationship(back_populates="reviews")

    tvshow_id: int | None = Field(default=None, foreign_key="tvshow.id", index=True)
    tvshow: Optional["TVShow"] = Relationship(back_populates="reviews")
