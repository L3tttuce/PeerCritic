from sqlmodel import Session, select

from model.Friendship import Friendship
from utils.cache import friend_ids_cache


def invalidate_friend_ids_cache(user_id: int) -> None:
    friend_ids_cache.invalidate(user_id)


def get_accepted_friend_ids(current_user_id: int, session: Session) -> set[int]:
    cached = friend_ids_cache.get(current_user_id)
    if cached is not None:
        return cached

    friendships = session.exec(
        select(Friendship).where(
            Friendship.status == "accepted",
            (Friendship.requester_id == current_user_id)
            | (Friendship.addressee_id == current_user_id),
        )
    ).all()

    friend_ids: set[int] = set()
    for fr in friendships:
        friend_ids.add(
            fr.addressee_id if fr.requester_id == current_user_id else fr.requester_id
        )

    friend_ids_cache.set(current_user_id, friend_ids)
    return friend_ids
