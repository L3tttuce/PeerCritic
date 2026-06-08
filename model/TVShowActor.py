from sqlmodel import Field

from model.BaseTable import BaseTable


class TVShowActor(BaseTable, table=True):
    show_id: int | None = Field(default=None, foreign_key="tvshow.show_id", primary_key=True)
    actor_id: int | None = Field(default=None, foreign_key="actor.actor_id", primary_key=True)
