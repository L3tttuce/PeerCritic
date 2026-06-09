from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import selectinload
from sqlmodel import select

from model.Review import Review
from model.User import User
from model.database import SessionDep
from router.Authentication import get_current_user
from schemas.reviews import (
    MyReviewOut,
    ReviewCreateIn,
    ReviewOut,
    ReviewWithUserOut,
)
from services.reviews import MediaKind, create_or_update_review, delete_review, friend_reviews, media_reviews, update_rating
from utils.reviews import review_to_my_out

router = APIRouter(prefix="/my", tags=["reviews"])


@router.get("/reviews", response_model=list[MyReviewOut])
async def get_my_reviews(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    stmt = (
        select(Review)
        .where(Review.user_id == current_user.user_id)
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
    out: list[MyReviewOut] = []
    for r in reviews:
        item = review_to_my_out(r)
        if item:
            out.append(item)
    return out


@router.get("/reviews/{media_type}/{media_id}", response_model=MyReviewOut | None)
async def get_my_review_for_media(
    media_type: MediaKind,
    media_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    fk_map = {
        MediaKind.movie: Review.movie_id,
        MediaKind.tv: Review.tvshow_id,
        MediaKind.song: Review.song_id,
    }
    fk = fk_map[media_type]
    review = session.exec(
        select(Review)
        .where(Review.user_id == current_user.user_id, fk == media_id)
        .options(
            selectinload(Review.movie),
            selectinload(Review.song),
            selectinload(Review.tvshow),
        )
    ).first()
    if not review:
        return None
    return review_to_my_out(review)


@router.get(
    "/friends/reviews/{media_type}/{media_id}",
    response_model=list[ReviewWithUserOut],
)
async def get_friend_reviews(
    media_type: MediaKind,
    media_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
    page: int = 1,
    size: int = 8,
):
    return friend_reviews(session, media_type, media_id, current_user, page, size)


@router.get(
    "/media/reviews/{media_type}/{media_id}",
    response_model=list[ReviewWithUserOut],
)
async def get_media_reviews(
    media_type: MediaKind,
    media_id: int,
    session: SessionDep,
    page: int = 1,
    size: int = 8,
):
    return media_reviews(session, media_type, media_id, page, size)


@router.post("/reviews/{media_type}/{media_id}", response_model=ReviewOut)
async def create_or_update(
    media_type: MediaKind,
    media_id: int,
    payload: ReviewCreateIn,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    return create_or_update_review(session, media_type, media_id, payload, current_user)


@router.delete("/reviews/{review_id}")
async def delete_my_review(
    review_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    review = session.exec(
        select(Review).where(
            Review.review_id == review_id,
            Review.user_id == current_user.user_id,
        )
    ).first()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    delete_review(session, review, current_user)
    return {"message": "Review deleted"}
