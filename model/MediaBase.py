from sqlmodel import Field

from model.BaseTable import BaseTable


class MediaBase(BaseTable):
    """Shared media columns for Movie, TVShow, and Song tables."""

    id: int | None = Field(default=None, primary_key=True)
    title: str
    description: str | None = Field(default=None, nullable=True)
    year: int | None = Field(default=None, nullable=True, index=True)
    length: str | None = Field(default=None, nullable=True)
    cover: str | None = Field(default=None, nullable=True)
    back_drop: str | None = Field(default=None, nullable=True)
    video: str | None = Field(default=None, nullable=True)
    rating: float | None = Field(default=None, nullable=True)
    rating_count: int | None = Field(default=None, nullable=True)
