"""add performance indexes

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-06-08 22:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_review_user_id", "review", ["user_id"], unique=False)
    op.create_index("ix_review_movie_id", "review", ["movie_id"], unique=False)
    op.create_index("ix_review_song_id", "review", ["song_id"], unique=False)
    op.create_index("ix_review_tvshow_id", "review", ["tvshow_id"], unique=False)

    op.create_index("ix_user_username", "user", ["username"], unique=True)
    op.create_index("ix_profile_user_id", "profile", ["user_id"], unique=True)

    op.create_index("ix_movie_year", "movie", ["year"], unique=False)
    op.create_index("ix_song_year", "song", ["year"], unique=False)
    op.create_index("ix_tvshow_year", "tvshow", ["year"], unique=False)

    op.create_index("ix_genre_genre_name", "genre", ["genre_name"], unique=False)
    op.create_index("ix_actor_actor_name", "actor", ["actor_name"], unique=False)
    op.create_index("ix_director_director_name", "director", ["director_name"], unique=False)
    op.create_index("ix_writer_writer_name", "writer", ["writer_name"], unique=False)
    op.create_index("ix_artist_artist_name", "artist", ["artist_name"], unique=False)

    op.create_index("ix_post_thread_id", "post", ["thread_id"], unique=False)
    op.create_index("ix_thread_profile_id", "thread", ["profile_id"], unique=False)

    op.create_index(
        "ix_conversationmember_last_read_message_id",
        "conversationmember",
        ["last_read_message_id"],
        unique=False,
    )

    op.create_index("ix_moviegenre_genre_id", "moviegenre", ["genre_id"], unique=False)
    op.create_index("ix_tvshowgenre_genre_id", "tvshowgenre", ["genre_id"], unique=False)
    op.create_index("ix_songgenre_genre_id", "songgenre", ["genre_id"], unique=False)

    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute(
        "CREATE INDEX ix_movie_title_trgm ON movie USING gin (lower(title) gin_trgm_ops)"
    )
    op.execute(
        "CREATE INDEX ix_song_title_trgm ON song USING gin (lower(title) gin_trgm_ops)"
    )
    op.execute(
        "CREATE INDEX ix_tvshow_title_trgm ON tvshow USING gin (lower(title) gin_trgm_ops)"
    )
    op.execute(
        "CREATE INDEX ix_user_username_trgm ON \"user\" USING gin (lower(username) gin_trgm_ops)"
    )


def downgrade() -> None:
    op.execute('DROP INDEX IF EXISTS ix_user_username_trgm')
    op.execute('DROP INDEX IF EXISTS ix_tvshow_title_trgm')
    op.execute('DROP INDEX IF EXISTS ix_song_title_trgm')
    op.execute('DROP INDEX IF EXISTS ix_movie_title_trgm')

    op.drop_index("ix_songgenre_genre_id", table_name="songgenre")
    op.drop_index("ix_tvshowgenre_genre_id", table_name="tvshowgenre")
    op.drop_index("ix_moviegenre_genre_id", table_name="moviegenre")

    op.drop_index(
        "ix_conversationmember_last_read_message_id", table_name="conversationmember"
    )
    op.drop_index("ix_thread_profile_id", table_name="thread")
    op.drop_index("ix_post_thread_id", table_name="post")
    op.drop_index("ix_artist_artist_name", table_name="artist")
    op.drop_index("ix_writer_writer_name", table_name="writer")
    op.drop_index("ix_director_director_name", table_name="director")
    op.drop_index("ix_actor_actor_name", table_name="actor")
    op.drop_index("ix_genre_genre_name", table_name="genre")
    op.drop_index("ix_tvshow_year", table_name="tvshow")
    op.drop_index("ix_song_year", table_name="song")
    op.drop_index("ix_movie_year", table_name="movie")
    op.drop_index("ix_profile_user_id", table_name="profile")
    op.drop_index("ix_user_username", table_name="user")
    op.drop_index("ix_review_tvshow_id", table_name="review")
    op.drop_index("ix_review_song_id", table_name="review")
    op.drop_index("ix_review_movie_id", table_name="review")
    op.drop_index("ix_review_user_id", table_name="review")
