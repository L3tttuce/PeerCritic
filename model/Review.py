from typing import TYPE_CHECKING, Optional

from sqlmodel import SQLModel, Field, Relationship

from model.BaseTable import BaseTable

# Condition to break circular import
if TYPE_CHECKING:
    from model.Movie import Movie
    from model.Song import Song
    from model.TVShow import TVShow
    from model.User import User

# Create Review database table
class Review(BaseTable, table=True):
    review_id: int | None = Field(default=None, primary_key=True)   # Create id
    review: str | None = Field(nullable=True)                       # Optional field
    review_rating: float                                            # required field
    review_rating_count: int | None = Field(nullable=True)          # Optional field
    
    # Create foreign key
    user_id: int | None = Field(default=None, foreign_key="user.user_id")
    # Create many-to-one relationship between Review and User
    user: Optional["User"] = Relationship(back_populates="reviews")

    # Create foreign key
    movie_id: int | None = Field(default=None, foreign_key="movie.movie_id")
    # Create many-to-one relationship between Review and Movie
    movie: Optional["Movie"] = Relationship(back_populates="reviews")

    # Create foreign key
    song_id: int | None = Field(default=None, foreign_key="song.song_id")
    song: Optional["Song"] = Relationship(back_populates="reviews")

    tvshow_id: int | None = Field(default=None, foreign_key="tvshow.show_id")
    tvshow: Optional["TVShow"] = Relationship(back_populates="reviews")