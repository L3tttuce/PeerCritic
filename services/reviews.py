from enum import Enum
from typing import Type

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import Session, SQLModel, select

from model.Movie import Movie
from model.Review import Review
from model.Song import Song
from model.TVShow import TVShow
from model.User import User
from schemas.reviews import ReviewCreateIn, ReviewOut
from utils.friends import get_accepted_friend_ids
from utils.reviews import review_to_user_out


class MediaKind(str, Enum):
    movie = "movie"
    tv = "tv"
    song = "song"


MEDIA_CONFIG: dict[MediaKind, dict] = {
    MediaKind.movie: {
        "model": Movie,
        "fk_column": Review.movie_id,
        "rating_attr": "rating",
        "rating_count_attr": "rating_count",
        "kind": "movie",
    },
    MediaKind.tv: {
        "model": TVShow,
        "fk_column": Review.tvshow_id,
        "rating_attr": "rating",
        "rating_count_attr": "rating_count",
        "kind": "tv",
    },
    MediaKind.song: {
        "model": Song,
        "fk_column": Review.song_id,
        "rating_attr": "rating",
        "rating_count_attr": "rating_count",
        "kind": "song",
    },
}


def _config(kind: MediaKind) -> dict:
    return MEDIA_CONFIG[kind]


def get_media(session: Session, kind: MediaKind, media_id: int):
    cfg = _config(kind)
    entity = session.get(cfg["model"], media_id)
    if entity is None:
        raise HTTPException(status_code=404, detail="Not found")
    return entity


def update_rating(session: Session, kind: MediaKind, media_id: int, entity=None) -> None:
    cfg = _config(kind)
    fk = cfg["fk_column"]

    result = session.exec(
        select(func.avg(Review.review_rating), func.count(Review.review_id)).where(
            fk == media_id
        )
    ).first()

    avg, count = result if result else (None, 0)
    if entity is None:
        entity = session.get(cfg["model"], media_id)
    if entity:
        setattr(
            entity,
            cfg["rating_attr"],
            round(float(avg), 1) if avg is not None else None,
        )
        setattr(entity, cfg["rating_count_attr"], count)
        session.add(entity)


def create_or_update_review(
    session: Session,
    kind: MediaKind,
    media_id: int,
    payload: ReviewCreateIn,
    current_user: User,
) -> ReviewOut:
    cfg = _config(kind)
    entity = get_media(session, kind, media_id)
    fk = cfg["fk_column"]

    existing = session.exec(
        select(Review).where(
            Review.user_id == current_user.user_id,
            fk == media_id,
        )
    ).first()

    if existing:
        existing.review = payload.review
        existing.review_rating = payload.reviewRating
        session.add(existing)
        update_rating(session, kind, media_id, entity=entity)
        session.commit()
        session.refresh(existing)
        return ReviewOut(
            reviewId=existing.review_id,
            review=existing.review,
            reviewRating=existing.review_rating,
            reviewRatingCount=existing.review_rating_count,
            mediaId=media_id,
            kind=cfg["kind"],
        )

    new_review = Review(
        review=payload.review,
        review_rating=payload.reviewRating,
        review_rating_count=None,
        user_id=current_user.user_id,
        movie_id=media_id if kind == MediaKind.movie else None,
        song_id=media_id if kind == MediaKind.song else None,
        tvshow_id=media_id if kind == MediaKind.tv else None,
    )

    session.add(new_review)
    update_rating(session, kind, media_id, entity=entity)
    session.commit()
    session.refresh(new_review)

    return ReviewOut(
        reviewId=new_review.review_id,
        review=new_review.review,
        reviewRating=new_review.review_rating,
        reviewRatingCount=new_review.review_rating_count,
        mediaId=media_id,
        kind=cfg["kind"],
    )


def friend_reviews(
    session: Session,
    kind: MediaKind,
    media_id: int,
    current_user: User,
    page: int,
    size: int,
) -> list:
    cfg = _config(kind)
    friend_ids = get_accepted_friend_ids(current_user.user_id, session)
    if not friend_ids:
        return []

    entity = get_media(session, kind, media_id)
    fk = cfg["fk_column"]

    stmt = (
        select(Review)
        .where(fk == media_id, Review.user_id.in_(friend_ids))
        .options(selectinload(Review.user).selectinload(User.profile))
        .order_by(Review.review_id.desc())
        .offset((page - 1) * size)
        .limit(size)
    )

    reviews = session.exec(stmt).all()
    out = []
    for review in reviews:
        item = review_to_user_out(
            review,
            kind=cfg["kind"],
            title=entity.title,
            cover=entity.cover,
            media_id=entity.id,
        )
        if item:
            out.append(item)
    return out


def media_reviews(
    session: Session,
    kind: MediaKind,
    media_id: int,
    page: int,
    size: int,
) -> list:
    cfg = _config(kind)
    entity = get_media(session, kind, media_id)
    fk = cfg["fk_column"]

    stmt = (
        select(Review)
        .where(fk == media_id)
        .options(selectinload(Review.user).selectinload(User.profile))
        .order_by(Review.review_id.desc())
        .offset((page - 1) * size)
        .limit(size)
    )

    reviews = session.exec(stmt).all()
    out = []
    for review in reviews:
        item = review_to_user_out(
            review,
            kind=cfg["kind"],
            title=entity.title,
            cover=entity.cover,
            media_id=entity.id,
        )
        if item:
            out.append(item)
    return out


def delete_review(session: Session, review: Review, current_user: User) -> None:
    kind: MediaKind | None = None
    media_id: int | None = None
    entity = None

    if review.movie_id is not None:
        kind = MediaKind.movie
        media_id = review.movie_id
        entity = session.get(Movie, media_id)
    elif review.song_id is not None:
        kind = MediaKind.song
        media_id = review.song_id
        entity = session.get(Song, media_id)
    elif review.tvshow_id is not None:
        kind = MediaKind.tv
        media_id = review.tvshow_id
        entity = session.get(TVShow, media_id)

    session.delete(review)
    if kind is not None and media_id is not None:
        update_rating(session, kind, media_id, entity=entity)
    session.commit()
