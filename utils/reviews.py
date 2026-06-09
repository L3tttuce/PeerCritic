from model.Review import Review
from schemas.reviews import MyReviewOut, ReviewWithUserOut


def _media_kind_and_entity(review: Review):
    if review.tvshow_id is not None and review.tvshow is not None:
        return "tv", review.tvshow, review.tvshow_id
    if review.movie_id is not None and review.movie is not None:
        return "movie", review.movie, review.movie_id
    if review.song_id is not None and review.song is not None:
        return "song", review.song, review.song_id
    return None, None, None


def review_to_my_out(review: Review) -> MyReviewOut | None:
    kind, entity, media_id = _media_kind_and_entity(review)
    if kind is None or entity is None:
        return None
    return MyReviewOut(
        reviewId=review.review_id,
        review=review.review,
        reviewRating=review.review_rating,
        reviewRatingCount=review.review_rating_count,
        kind=kind,
        title=entity.title,
        cover=entity.cover,
        mediaId=media_id,
    )


def review_to_shared_out(review: Review) -> dict | None:
    kind, entity, media_id = _media_kind_and_entity(review)
    if kind is None or entity is None:
        return None
    return {
        "reviewId": review.review_id,
        "review": review.review,
        "reviewRating": review.review_rating,
        "reviewRatingCount": review.review_rating_count,
        "kind": kind,
        "title": entity.title,
        "cover": entity.cover,
        "year": entity.year,
        "mediaId": media_id,
    }


def review_to_user_out(
    review: Review,
    *,
    kind: str,
    title: str,
    cover: str | None,
    media_id: int,
) -> ReviewWithUserOut | None:
    if review.user is None:
        return None

    profile = review.user.profile

    return ReviewWithUserOut(
        reviewId=review.review_id,
        review=review.review,
        reviewRating=review.review_rating,
        reviewRatingCount=review.review_rating_count,
        userId=review.user.user_id,
        username=review.user.username,
        firstName=profile.first_name if profile else None,
        lastName=profile.last_name if profile else None,
        avatar=profile.avatar if profile else None,
        kind=kind,
        title=title,
        cover=cover,
        mediaId=media_id,
    )
