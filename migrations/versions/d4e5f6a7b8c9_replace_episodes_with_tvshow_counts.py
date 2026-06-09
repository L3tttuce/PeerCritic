"""replace episode table with tvshow episode_count and season_count

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-06-08 20:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tvshow",
        sa.Column("episode_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "tvshow",
        sa.Column("season_count", sa.Integer(), nullable=False, server_default="0"),
    )

    op.execute(
        """
        UPDATE tvshow t
        SET
            episode_count = COALESCE(
                (SELECT COUNT(*) FROM episode e WHERE e.show_id = t.id),
                0
            ),
            season_count = COALESCE(
                (SELECT COUNT(DISTINCT e.season) FROM episode e WHERE e.show_id = t.id),
                0
            )
        """
    )

    op.drop_constraint("fk_episode_show_id", "episode", type_="foreignkey")
    op.drop_table("episode")

    op.alter_column("tvshow", "episode_count", server_default=None)
    op.alter_column("tvshow", "season_count", server_default=None)


def downgrade() -> None:
    op.create_table(
        "episode",
        sa.Column("episode_id", sa.Integer(), nullable=False),
        sa.Column("episode_name", sa.String(), nullable=False),
        sa.Column("season", sa.Integer(), nullable=True),
        sa.Column("episode_number", sa.Integer(), nullable=True),
        sa.Column("show_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["show_id"], ["tvshow.id"], name="fk_episode_show_id"),
        sa.PrimaryKeyConstraint("episode_id"),
    )
    op.drop_column("tvshow", "season_count")
    op.drop_column("tvshow", "episode_count")
