from sqlmodel import Field

from model.BaseTable import BaseTable


class TVShowDirector(BaseTable, table=True):
    show_id: int | None = Field(default=None, foreign_key="tvshow.show_id", primary_key=True)
    director_id: int | None = Field(default=None, foreign_key="director.director_id", primary_key=True)
