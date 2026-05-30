from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import select

from model.database import SessionDep
from model.User import User
from model.Profile import Profile
from router.Authentication import get_current_user
from fastapi import HTTPException
from model.Review import Review
from model.Movie import Movie
from model.Song import Song
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from model.Friendship import Friendship

router = APIRouter(tags=["users"])


@router.get("/public/users/{user_id}/reviews")
def get_user_reviews(
    user_id: int,
    session: SessionDep,
):
    stmt = (
        select(Review)
        .where(Review.user_id == user_id)
        .options(
            selectinload(Review.movie).selectinload(Movie.episodes),
            selectinload(Review.song),
        )
        .order_by(Review.review_id.desc())
    )

    reviews = session.exec(stmt).all()

    out = []

    for r in reviews:
        if r.movie_id is not None and r.movie is not None:
            out.append(
                {
                    "reviewId": r.review_id,
                    "review": r.review,
                    "reviewRating": r.review_rating,
                    "reviewRatingCount": r.review_rating_count,
                    "kind": "tv" if r.movie.episodes else "movie",
                    "title": r.movie.movie_name,
                    "cover": r.movie.cover,
                    "movieId": r.movie_id,
                    "songId": None,
                }
            )

        elif r.song_id is not None and r.song is not None:
            out.append(
                {
                    "reviewId": r.review_id,
                    "review": r.review,
                    "reviewRating": r.review_rating,
                    "reviewRatingCount": r.review_rating_count,
                    "kind": "song",
                    "title": r.song.song_name,
                    "cover": r.song.cover,
                    "movieId": None,
                    "songId": r.song_id,
                }
            )

    return out


@router.get("/public/users/{user_id}")
def get_user_profile(
    user_id: int,
    session: SessionDep,
):
    row = session.exec(
        select(User, Profile)
        .join(Profile, Profile.user_id == User.user_id, isouter=True)
        .where(User.user_id == user_id)
    ).first()

    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    u, p = row

    friend_count = session.exec(
        select(func.count(Friendship.id)).where(
            Friendship.status == "accepted",
            (Friendship.requester_id == user_id) | (Friendship.addressee_id == user_id),
        )
    ).one()

    return {
        "userId": u.user_id,
        "username": u.username,
        "firstName": (p.first_name if p else ""),
        "lastName": (p.last_name if p else ""),
        "avatar": (p.avatar if p else None),
        "friendCount": friend_count,
    }


@router.get("/users/by-username/search")
def search_users(
    username: str,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    q = username.strip()
    if not q:
        return []

    # "contains" search (case-insensitive)
    rows = session.exec(
        select(User, Profile)
        .join(Profile, Profile.user_id == User.user_id, isouter=True)
        .where(User.username.ilike(f"%{q}%"))
        .limit(20)
    ).all()

    out = []
    for u, p in rows:
        # prevent returning yourself
        if u.user_id == current_user.user_id:
            continue

        out.append(
            {
                "userId": u.user_id,
                "username": u.username,
                "firstName": (p.first_name if p else ""),
                "lastName": (p.last_name if p else ""),
                "avatar": (p.avatar if p else None),
            }
        )

    out.sort(key=lambda x: (x["username"].lower() != q.lower(), x["username"].lower()))
    return out
