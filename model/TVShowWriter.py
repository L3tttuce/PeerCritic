from sqlmodel import Field

from model.BaseTable import BaseTable


class TVShowWriter(BaseTable, table=True):
    show_id: int | None = Field(default=None, foreign_key="tvshow.show_id", primary_key=True)
    writer_id: int | None = Field(default=None, foreign_key="writer.writer_id", primary_key=True)
