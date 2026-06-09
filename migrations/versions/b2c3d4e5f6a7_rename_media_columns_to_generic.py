"""rename media columns to generic names

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-08 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _drop_fks(table: str, fks: list[str]) -> None:
    for fk in fks:
        op.drop_constraint(fk, table, type_="foreignkey")


def _rename_media_pk(table: str, old_pk: str) -> None:
    op.alter_column(table, old_pk, new_column_name="id")


def _rename_media_columns(table: str, old_name: str, old_rating: str, old_rating_count: str) -> None:
    op.alter_column(table, old_name, new_column_name="title")
    op.alter_column(table, old_rating, new_column_name="rating")
    op.alter_column(table, old_rating_count, new_column_name="rating_count")


def _recreate_fk(constraint: str, source_table: str, source_cols: list[str], target_table: str, target_cols: list[str]) -> None:
    op.create_foreign_key(constraint, source_table, target_table, source_cols, target_cols)


def upgrade() -> None:
    # Drop FKs referencing movie.show_id / movie.movie_id / song.song_id
    _drop_fks("movieactor", ["movieactor_movie_id_fkey"])
    _drop_fks("moviedirector", ["moviedirector_movie_id_fkey"])
    _drop_fks("moviegenre", ["moviegenre_movie_id_fkey"])
    _drop_fks("moviewriter", ["moviewriter_movie_id_fkey"])
    _drop_fks("review", ["review_movie_id_fkey"])
    _drop_fks("message", ["message_shared_movie_id_fkey"])

    _drop_fks("tvshowactor", ["tvshowactor_show_id_fkey"])
    _drop_fks("tvshowdirector", ["tvshowdirector_show_id_fkey"])
    _drop_fks("tvshowgenre", ["tvshowgenre_show_id_fkey"])
    _drop_fks("tvshowwriter", ["tvshowwriter_show_id_fkey"])
    _drop_fks("episode", ["fk_episode_show_id"])
    _drop_fks("review", ["fk_review_tvshow_id"])
    _drop_fks("message", ["fk_message_shared_tvshow"])

    _drop_fks("songartist", ["songartist_song_id_fkey"])
    _drop_fks("songgenre", ["songgenre_song_id_fkey"])
    _drop_fks("review", ["review_song_id_fkey"])
    _drop_fks("message", ["message_shared_song_id_fkey"])

    # Rename movie columns
    _rename_media_pk("movie", "movie_id")
    _rename_media_columns("movie", "movie_name", "movie_rating", "movie_rating_count")

    # Rename tvshow columns
    _rename_media_pk("tvshow", "show_id")
    _rename_media_columns("tvshow", "show_name", "show_rating", "show_rating_count")

    # Rename song columns
    _rename_media_pk("song", "song_id")
    _rename_media_columns("song", "song_name", "song_rating", "song_rating_count")

    # Recreate FKs pointing at renamed PKs
    _recreate_fk("movieactor_movie_id_fkey", "movieactor", ["movie_id"], "movie", ["id"])
    _recreate_fk("moviedirector_movie_id_fkey", "moviedirector", ["movie_id"], "movie", ["id"])
    _recreate_fk("moviegenre_movie_id_fkey", "moviegenre", ["movie_id"], "movie", ["id"])
    _recreate_fk("moviewriter_movie_id_fkey", "moviewriter", ["movie_id"], "movie", ["id"])
    _recreate_fk("review_movie_id_fkey", "review", ["movie_id"], "movie", ["id"])
    _recreate_fk("message_shared_movie_id_fkey", "message", ["shared_movie_id"], "movie", ["id"])

    _recreate_fk("tvshowactor_show_id_fkey", "tvshowactor", ["show_id"], "tvshow", ["id"])
    _recreate_fk("tvshowdirector_show_id_fkey", "tvshowdirector", ["show_id"], "tvshow", ["id"])
    _recreate_fk("tvshowgenre_show_id_fkey", "tvshowgenre", ["show_id"], "tvshow", ["id"])
    _recreate_fk("tvshowwriter_show_id_fkey", "tvshowwriter", ["show_id"], "tvshow", ["id"])
    _recreate_fk("fk_episode_show_id", "episode", ["show_id"], "tvshow", ["id"])
    _recreate_fk("fk_review_tvshow_id", "review", ["tvshow_id"], "tvshow", ["id"])
    _recreate_fk("fk_message_shared_tvshow", "message", ["shared_tvshow_id"], "tvshow", ["id"])

    _recreate_fk("songartist_song_id_fkey", "songartist", ["song_id"], "song", ["id"])
    _recreate_fk("songgenre_song_id_fkey", "songgenre", ["song_id"], "song", ["id"])
    _recreate_fk("review_song_id_fkey", "review", ["song_id"], "song", ["id"])
    _recreate_fk("message_shared_song_id_fkey", "message", ["shared_song_id"], "song", ["id"])


def downgrade() -> None:
    _drop_fks("movieactor", ["movieactor_movie_id_fkey"])
    _drop_fks("moviedirector", ["moviedirector_movie_id_fkey"])
    _drop_fks("moviegenre", ["moviegenre_movie_id_fkey"])
    _drop_fks("moviewriter", ["moviewriter_movie_id_fkey"])
    _drop_fks("review", ["review_movie_id_fkey"])
    _drop_fks("message", ["message_shared_movie_id_fkey"])

    _drop_fks("tvshowactor", ["tvshowactor_show_id_fkey"])
    _drop_fks("tvshowdirector", ["tvshowdirector_show_id_fkey"])
    _drop_fks("tvshowgenre", ["tvshowgenre_show_id_fkey"])
    _drop_fks("tvshowwriter", ["tvshowwriter_show_id_fkey"])
    _drop_fks("episode", ["fk_episode_show_id"])
    _drop_fks("review", ["fk_review_tvshow_id"])
    _drop_fks("message", ["fk_message_shared_tvshow"])

    _drop_fks("songartist", ["songartist_song_id_fkey"])
    _drop_fks("songgenre", ["songgenre_song_id_fkey"])
    _drop_fks("review", ["review_song_id_fkey"])
    _drop_fks("message", ["message_shared_song_id_fkey"])

    op.alter_column("movie", "id", new_column_name="movie_id")
    op.alter_column("movie", "title", new_column_name="movie_name")
    op.alter_column("movie", "rating", new_column_name="movie_rating")
    op.alter_column("movie", "rating_count", new_column_name="movie_rating_count")

    op.alter_column("tvshow", "id", new_column_name="show_id")
    op.alter_column("tvshow", "title", new_column_name="show_name")
    op.alter_column("tvshow", "rating", new_column_name="show_rating")
    op.alter_column("tvshow", "rating_count", new_column_name="show_rating_count")

    op.alter_column("song", "id", new_column_name="song_id")
    op.alter_column("song", "title", new_column_name="song_name")
    op.alter_column("song", "rating", new_column_name="song_rating")
    op.alter_column("song", "rating_count", new_column_name="song_rating_count")

    _recreate_fk("movieactor_movie_id_fkey", "movieactor", ["movie_id"], "movie", ["movie_id"])
    _recreate_fk("moviedirector_movie_id_fkey", "moviedirector", ["movie_id"], "movie", ["movie_id"])
    _recreate_fk("moviegenre_movie_id_fkey", "moviegenre", ["movie_id"], "movie", ["movie_id"])
    _recreate_fk("moviewriter_movie_id_fkey", "moviewriter", ["movie_id"], "movie", ["movie_id"])
    _recreate_fk("review_movie_id_fkey", "review", ["movie_id"], "movie", ["movie_id"])
    _recreate_fk("message_shared_movie_id_fkey", "message", ["shared_movie_id"], "movie", ["movie_id"])

    _recreate_fk("tvshowactor_show_id_fkey", "tvshowactor", ["show_id"], "tvshow", ["show_id"])
    _recreate_fk("tvshowdirector_show_id_fkey", "tvshowdirector", ["show_id"], "tvshow", ["show_id"])
    _recreate_fk("tvshowgenre_show_id_fkey", "tvshowgenre", ["show_id"], "tvshow", ["show_id"])
    _recreate_fk("tvshowwriter_show_id_fkey", "tvshowwriter", ["show_id"], "tvshow", ["show_id"])
    _recreate_fk("fk_episode_show_id", "episode", ["show_id"], "tvshow", ["show_id"])
    _recreate_fk("fk_review_tvshow_id", "review", ["tvshow_id"], "tvshow", ["show_id"])
    _recreate_fk("fk_message_shared_tvshow", "message", ["shared_tvshow_id"], "tvshow", ["show_id"])

    _recreate_fk("songartist_song_id_fkey", "songartist", ["song_id"], "song", ["song_id"])
    _recreate_fk("songgenre_song_id_fkey", "songgenre", ["song_id"], "song", ["song_id"])
    _recreate_fk("review_song_id_fkey", "review", ["song_id"], "song", ["song_id"])
    _recreate_fk("message_shared_song_id_fkey", "message", ["shared_song_id"], "song", ["song_id"])
