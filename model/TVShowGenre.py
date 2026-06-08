from sqlmodel import Field

from model.BaseTable import BaseTable


class TVShowGenre(BaseTable, table=True):
    show_id: int | None = Field(default=None, foreign_key="tvshow.show_id", primary_key=True)
    genre_id: int | None = Field(default=None, foreign_key="genre.genre_id", primary_key=True)
