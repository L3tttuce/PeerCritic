"""split tv shows into tvshow table

Revision ID: a1b2c3d4e5f6
Revises: 564ceb1dbea6
Create Date: 2026-06-07 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "564ceb1dbea6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tvshow",
        sa.Column("show_id", sa.Integer(), nullable=False),
        sa.Column("show_name", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("description", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("length", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("cover", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("back_drop", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("video", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("show_rating", sa.Float(), nullable=True),
        sa.Column("show_rating_count", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("show_id"),
    )

    op.create_table(
        "tvshowactor",
        sa.Column("show_id", sa.Integer(), nullable=False),
        sa.Column("actor_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["actor_id"], ["actor.actor_id"]),
        sa.ForeignKeyConstraint(["show_id"], ["tvshow.show_id"]),
        sa.PrimaryKeyConstraint("show_id", "actor_id"),
    )
    op.create_table(
        "tvshowdirector",
        sa.Column("show_id", sa.Integer(), nullable=False),
        sa.Column("director_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["director_id"], ["director.director_id"]),
        sa.ForeignKeyConstraint(["show_id"], ["tvshow.show_id"]),
        sa.PrimaryKeyConstraint("show_id", "director_id"),
    )
    op.create_table(
        "tvshowwriter",
        sa.Column("show_id", sa.Integer(), nullable=False),
        sa.Column("writer_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["show_id"], ["tvshow.show_id"]),
        sa.ForeignKeyConstraint(["writer_id"], ["writer.writer_id"]),
        sa.PrimaryKeyConstraint("show_id", "writer_id"),
    )
    op.create_table(
        "tvshowgenre",
        sa.Column("show_id", sa.Integer(), nullable=False),
        sa.Column("genre_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["genre_id"], ["genre.genre_id"]),
        sa.ForeignKeyConstraint(["show_id"], ["tvshow.show_id"]),
        sa.PrimaryKeyConstraint("show_id", "genre_id"),
    )

    op.add_column("review", sa.Column("tvshow_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_review_tvshow_id", "review", "tvshow", ["tvshow_id"], ["show_id"]
    )

    op.add_column("message", sa.Column("shared_tvshow_id", sa.Integer(), nullable=True))
    op.create_index(
        op.f("ix_message_shared_tvshow_id"), "message", ["shared_tvshow_id"], unique=False
    )
    op.create_foreign_key(
        "fk_message_shared_tvshow",
        "message",
        "tvshow",
        ["shared_tvshow_id"],
        ["show_id"],
    )

    op.add_column("episode", sa.Column("show_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_episode_show_id", "episode", "tvshow", ["show_id"], ["show_id"]
    )

    # Data backfill: migrate movies-with-episodes into tvshow
    op.execute(
        """
        ALTER TABLE tvshow ADD COLUMN _legacy_movie_id INTEGER;
        """
    )

    op.execute(
        """
        INSERT INTO tvshow (
            show_name, description, year, length, cover, back_drop, video,
            show_rating, show_rating_count, _legacy_movie_id
        )
        SELECT
            m.movie_name, m.description, m.year, m.length, m.cover, m.back_drop, m.video,
            m.movie_rating, m.movie_rating_count, m.movie_id
        FROM movie m
        WHERE EXISTS (SELECT 1 FROM episode e WHERE e.movie_id = m.movie_id);
        """
    )

    op.execute(
        """
        INSERT INTO tvshowactor (show_id, actor_id)
        SELECT t.show_id, ma.actor_id
        FROM tvshow t
        JOIN movieactor ma ON ma.movie_id = t._legacy_movie_id;
        """
    )

    op.execute(
        """
        INSERT INTO tvshowdirector (show_id, director_id)
        SELECT t.show_id, md.director_id
        FROM tvshow t
        JOIN moviedirector md ON md.movie_id = t._legacy_movie_id;
        """
    )

    op.execute(
        """
        INSERT INTO tvshowwriter (show_id, writer_id)
        SELECT t.show_id, mw.writer_id
        FROM tvshow t
        JOIN moviewriter mw ON mw.movie_id = t._legacy_movie_id;
        """
    )

    op.execute(
        """
        INSERT INTO tvshowgenre (show_id, genre_id)
        SELECT t.show_id, mg.genre_id
        FROM tvshow t
        JOIN moviegenre mg ON mg.movie_id = t._legacy_movie_id;
        """
    )

    op.execute(
        """
        UPDATE episode e
        SET show_id = t.show_id
        FROM tvshow t
        WHERE t._legacy_movie_id = e.movie_id;
        """
    )

    op.execute(
        """
        UPDATE episode
        SET movie_id = NULL
        WHERE movie_id IN (SELECT _legacy_movie_id FROM tvshow);
        """
    )

    op.execute(
        """
        UPDATE review r
        SET tvshow_id = t.show_id, movie_id = NULL
        FROM tvshow t
        WHERE t._legacy_movie_id = r.movie_id;
        """
    )

    op.execute(
        """
        UPDATE message msg
        SET shared_tvshow_id = t.show_id, shared_movie_id = NULL
        FROM tvshow t
        WHERE t._legacy_movie_id = msg.shared_movie_id;
        """
    )

    op.execute(
        """
        DELETE FROM movieactor
        WHERE movie_id IN (SELECT _legacy_movie_id FROM tvshow);
        """
    )
    op.execute(
        """
        DELETE FROM moviedirector
        WHERE movie_id IN (SELECT _legacy_movie_id FROM tvshow);
        """
    )
    op.execute(
        """
        DELETE FROM moviewriter
        WHERE movie_id IN (SELECT _legacy_movie_id FROM tvshow);
        """
    )
    op.execute(
        """
        DELETE FROM moviegenre
        WHERE movie_id IN (SELECT _legacy_movie_id FROM tvshow);
        """
    )
    op.execute(
        """
        DELETE FROM movie
        WHERE movie_id IN (SELECT _legacy_movie_id FROM tvshow);
        """
    )

    op.execute("ALTER TABLE tvshow DROP COLUMN _legacy_movie_id;")

    op.drop_constraint("episode_movie_id_fkey", "episode", type_="foreignkey")
    op.drop_column("episode", "movie_id")


def downgrade() -> None:
    """Best-effort downgrade: moves tvshow data back into movie table."""
    op.add_column("episode", sa.Column("movie_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "episode_movie_id_fkey", "episode", "movie", ["movie_id"], ["movie_id"]
    )

    op.execute(
        """
        ALTER TABLE movie ADD COLUMN _legacy_show_id INTEGER;
        """
    )

    op.execute(
        """
        INSERT INTO movie (
            movie_name, description, year, length, cover, back_drop, video,
            movie_rating, movie_rating_count, _legacy_show_id
        )
        SELECT
            t.show_name, t.description, t.year, t.length, t.cover, t.back_drop, t.video,
            t.show_rating, t.show_rating_count, t.show_id
        FROM tvshow t;
        """
    )

    op.execute(
        """
        INSERT INTO movieactor (movie_id, actor_id)
        SELECT m.movie_id, ta.actor_id
        FROM movie m
        JOIN tvshowactor ta ON ta.show_id = m._legacy_show_id;
        """
    )
    op.execute(
        """
        INSERT INTO moviedirector (movie_id, director_id)
        SELECT m.movie_id, td.director_id
        FROM movie m
        JOIN tvshowdirector td ON td.show_id = m._legacy_show_id;
        """
    )
    op.execute(
        """
        INSERT INTO moviewriter (movie_id, writer_id)
        SELECT m.movie_id, tw.writer_id
        FROM movie m
        JOIN tvshowwriter tw ON tw.show_id = m._legacy_show_id;
        """
    )
    op.execute(
        """
        INSERT INTO moviegenre (movie_id, genre_id)
        SELECT m.movie_id, tg.genre_id
        FROM movie m
        JOIN tvshowgenre tg ON tg.show_id = m._legacy_show_id;
        """
    )

    op.execute(
        """
        UPDATE episode e
        SET movie_id = m.movie_id
        FROM movie m
        WHERE m._legacy_show_id = e.show_id;
        """
    )

    op.execute(
        """
        UPDATE review r
        SET movie_id = m.movie_id, tvshow_id = NULL
        FROM movie m
        WHERE m._legacy_show_id = r.tvshow_id;
        """
    )

    op.execute(
        """
        UPDATE message msg
        SET shared_movie_id = m.movie_id, shared_tvshow_id = NULL
        FROM movie m
        WHERE m._legacy_show_id = msg.shared_tvshow_id;
        """
    )

    op.execute("ALTER TABLE movie DROP COLUMN _legacy_show_id;")

    op.drop_constraint("fk_episode_show_id", "episode", type_="foreignkey")
    op.drop_column("episode", "show_id")

    op.drop_constraint("fk_message_shared_tvshow", "message", type_="foreignkey")
    op.drop_index(op.f("ix_message_shared_tvshow_id"), table_name="message")
    op.drop_column("message", "shared_tvshow_id")

    op.drop_constraint("fk_review_tvshow_id", "review", type_="foreignkey")
    op.drop_column("review", "tvshow_id")

    op.drop_table("tvshowgenre")
    op.drop_table("tvshowwriter")
    op.drop_table("tvshowdirector")
    op.drop_table("tvshowactor")
    op.drop_table("tvshow")
