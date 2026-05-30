import os
from logging.config import fileConfig

from alembic import context
from dotenv import load_dotenv
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from sqlmodel import SQLModel

from model.BaseTable import BaseTable

from model.Actor import Actor
from model.Artist import Artist
from model.Director import Director
from model.Episode import Episode
from model.Friendship import Friendship
from model.Genre import Genre
from model.Messages import Message
from model.Movie import Movie
from model.MovieActor import MovieActor
from model.MovieDirector import MovieDirector
from model.MovieGenre import MovieGenre
from model.MovieWriter import MovieWriter
from model.Post import Post
from model.Profile import Profile
from model.Review import Review
from model.Song import Song
from model.SongArtist import SongArtist
from model.SongGenre import SongGenre
from model.Thread import Thread
from model.User import User
from model.Writer import Writer

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
# target_metadata = None
target_metadata = SQLModel.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
load_dotenv()
postgresql_url = os.getenv("DATABASE_URL")
config.set_main_option("sqlalchemy.url", postgresql_url)
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
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
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
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
