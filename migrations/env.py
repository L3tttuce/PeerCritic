import os
from logging.config import fileConfig

from alembic import context
from dotenv import load_dotenv
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from sqlmodel import SQLModel

from model.Actor import Actor
from model.Artist import Artist
from model.Director import Director
from model.Friendship import Friendship
from model.Genre import Genre
from model.Messages import Conversation, ConversationMember, Message
from model.Movie import Movie
from model.Post import Post
from model.Profile import Profile
from model.Review import Review
from model.Song import Song
from model.Thread import Thread
from model.TVShow import TVShow
from model.User import User
from model.Writer import Writer
from model.links import (
    MovieActor,
    MovieDirector,
    MovieGenre,
    MovieWriter,
    SongArtist,
    SongGenre,
    TVShowActor,
    TVShowDirector,
    TVShowGenre,
    TVShowWriter,
)

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata

load_dotenv()
postgresql_url = os.getenv("DATABASE_URL")
config.set_main_option("sqlalchemy.url", postgresql_url)


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
