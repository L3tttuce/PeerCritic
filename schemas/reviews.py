from typing import Literal, Optional

from pydantic import BaseModel


class MyReviewOut(BaseModel):
    reviewId: int
    review: Optional[str]
    reviewRating: float
    reviewRatingCount: Optional[int]
    kind: Literal["movie", "song", "tv"]
    title: str
    cover: Optional[str] = None
    mediaId: int


class ReviewWithUserOut(BaseModel):
    reviewId: int
    review: Optional[str]
    reviewRating: float
    reviewRatingCount: Optional[int]
    userId: int
    username: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    avatar: Optional[str] = None
    kind: Literal["movie", "song", "tv"]
    title: str
    cover: Optional[str] = None
    mediaId: int


class ReviewCreateIn(BaseModel):
    review: Optional[str] = None
    reviewRating: float


class ReviewOut(BaseModel):
    reviewId: int
    review: Optional[str]
    reviewRating: float
    reviewRatingCount: Optional[int]
    mediaId: int
    kind: Literal["movie", "song", "tv"]
