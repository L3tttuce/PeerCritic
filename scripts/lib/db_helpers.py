from sqlmodel import Session, select

from model.Actor import Actor
from model.Artist import Artist
from model.Director import Director
from model.Genre import Genre
from model.Writer import Writer
from model.database import engine


def get_session():
    return Session(engine)


def get_or_create_genre(session: Session, name: str) -> Genre:
    genre = session.exec(select(Genre).where(Genre.genre_name == name)).first()
    if genre:
        return genre
    genre = Genre(genre_name=name)
    session.add(genre)
    session.flush()
    return genre


def get_or_create_actor(session: Session, name: str) -> Actor:
    actor = session.exec(select(Actor).where(Actor.actor_name == name)).first()
    if actor:
        return actor
    actor = Actor(actor_name=name)
    session.add(actor)
    session.flush()
    return actor


def get_or_create_director(session: Session, name: str) -> Director:
    director = session.exec(select(Director).where(Director.director_name == name)).first()
    if director:
        return director
    director = Director(director_name=name)
    session.add(director)
    session.flush()
    return director


def get_or_create_writer(session: Session, name: str) -> Writer:
    writer = session.exec(select(Writer).where(Writer.writer_name == name)).first()
    if writer:
        return writer
    writer = Writer(writer_name=name)
    session.add(writer)
    session.flush()
    return writer


def get_or_create_artist(session: Session, name: str) -> Artist:
    artist = session.exec(select(Artist).where(Artist.artist_name == name)).first()
    if artist:
        return artist
    artist = Artist(artist_name=name)
    session.add(artist)
    session.flush()
    return artist
