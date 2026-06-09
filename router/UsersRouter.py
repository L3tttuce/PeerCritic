from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlmodel import select

from model.database import SessionDep
from model.User import User
from model.Profile import Profile
from router.Authentication import get_current_user
from fastapi import HTTPException
from model.Review import Review
from model.Movie import Movie
from model.Song import Song
from model.TVShow import TVShow
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from model.Friendship import Friendship
from utils.reviews import review_to_my_out
from utils.users import user_card

router = APIRouter(tags=["users"])


@router.get("/public/users/{user_id}/reviews")
def get_user_reviews(
    user_id: int,
    session: SessionDep,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    stmt = (
        select(Review)
        .where(Review.user_id == user_id)
        .options(
            selectinload(Review.movie),
            selectinload(Review.song),
            selectinload(Review.tvshow),
        )
        .order_by(Review.review_id.desc())
        .offset(offset)
        .limit(limit)
    )

    reviews = session.exec(stmt).all()
    out = []
    for r in reviews:
        item = review_to_my_out(r)
        if item:
            out.append(item.model_dump())
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

        out.append(user_card(u, p))

    out.sort(key=lambda x: (x["username"].lower() != q.lower(), x["username"].lower()))
    return out
