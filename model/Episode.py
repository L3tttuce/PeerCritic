from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship

from model.BaseTable import BaseTable

if TYPE_CHECKING:
    from model.TVShow import TVShow


class Episode(BaseTable, table=True):
    episode_id: int | None = Field(default=None, primary_key=True)
    episode_name: str
    season: int | None = Field(nullable=True)
    episode_number: int | None = Field(nullable=True)

    show_id: int | None = Field(default=None, foreign_key="tvshow.show_id")
    show: Optional["TVShow"] = Relationship(back_populates="episodes")