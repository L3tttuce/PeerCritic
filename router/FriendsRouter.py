from typing import Annotated
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select

from model.database import SessionDep
from model.Friendship import Friendship
from model.User import User
from model.Profile import Profile
from router.Authentication import get_current_user


def canonical_pair(a: int, b: int) -> tuple[int, int]:
    return (a, b) if a < b else (b, a)


router = APIRouter(prefix="/my", tags=["friends"])


@router.get("/friends")
def my_friends(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    friendships = session.exec(
        select(Friendship).where(
            Friendship.status == "accepted",
            (Friendship.requester_id == current_user.user_id)
            | (Friendship.addressee_id == current_user.user_id),
        )
    ).all()

    friend_ids: list[int] = []
    for fr in friendships:
        friend_ids.append(
            fr.addressee_id
            if fr.requester_id == current_user.user_id
            else fr.requester_id
        )

    if not friend_ids:
        return []

    rows = session.exec(
        select(User, Profile)
        .join(Profile, Profile.user_id == User.user_id, isouter=True)
        .where(User.user_id.in_(friend_ids))
    ).all()

    out = []
    for u, p in rows:
        out.append(
            {
                "userId": u.user_id,
                "username": u.username,
                "firstName": (p.first_name if p else ""),
                "lastName": (p.last_name if p else ""),
                "avatar": (p.avatar if p else None),
            }
        )

    out.sort(key=lambda x: x["username"].lower())
    return out


@router.post("/friends/request/{addressee_id}")
def send_friend_request(
    addressee_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    if addressee_id == current_user.user_id:
        raise HTTPException(400, "You can't friend yourself")

    low, high = canonical_pair(current_user.user_id, addressee_id)

    existing = session.exec(
        select(Friendship).where(
            Friendship.user_low_id == low,
            Friendship.user_high_id == high,
        )
    ).first()

    if existing:
        if existing.status == "accepted":
            return {"ok": True, "status": "accepted"}
        if existing.status == "pending":
            return {"ok": True, "status": "pending"}
        if existing.status == "blocked":
            raise HTTPException(403, "Friendship is blocked")

        # declined but can re-request
        existing.status = "pending"
        existing.requester_id = current_user.user_id
        existing.addressee_id = addressee_id
        existing.updated_at = datetime.now(timezone.utc)
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return {"ok": True, "status": "pending"}

    fr = Friendship(
        requester_id=current_user.user_id,
        addressee_id=addressee_id,
        user_low_id=low,
        user_high_id=high,
        status="pending",
    )
    session.add(fr)
    session.commit()
    session.refresh(fr)
    return {"ok": True, "status": "pending"}


@router.post("/friends/accept/{requester_id}")
def accept_friend_request(
    requester_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    low, high = canonical_pair(current_user.user_id, requester_id)

    fr = session.exec(
        select(Friendship).where(
            Friendship.user_low_id == low,
            Friendship.user_high_id == high,
            Friendship.status == "pending",
            Friendship.addressee_id
            == current_user.user_id,  # addressee's approval is required
        )
    ).first()

    if not fr:
        raise HTTPException(404, "No pending request found")

    fr.status = "accepted"
    fr.updated_at = datetime.now(timezone.utc)
    session.add(fr)
    session.commit()
    session.refresh(fr)
    return {"ok": True, "status": "accepted"}


@router.post("/friends/decline/{requester_id}")
def decline_friend_request(
    requester_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    low, high = canonical_pair(current_user.user_id, requester_id)

    fr = session.exec(
        select(Friendship).where(
            Friendship.user_low_id == low,
            Friendship.user_high_id == high,
            Friendship.status == "pending",
            Friendship.addressee_id == current_user.user_id,
        )
    ).first()

    if not fr:
        raise HTTPException(404, "No pending request found")

    fr.status = "declined"
    fr.updated_at = datetime.now(timezone.utc)
    session.add(fr)
    session.commit()
    session.refresh(fr)
    return {"ok": True, "status": "declined"}


@router.delete("/friends/{other_user_id}")
def remove_friend(
    other_user_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    if other_user_id == current_user.user_id:
        raise HTTPException(400, "You can't remove yourself")

    low, high = canonical_pair(current_user.user_id, other_user_id)

    fr = session.exec(
        select(Friendship).where(
            Friendship.user_low_id == low,
            Friendship.user_high_id == high,
        )
    ).first()

    if not fr:
        raise HTTPException(404, "Friendship not found")

    session.delete(fr)
    session.commit()
    return {"ok": True}


@router.get("/friend_requests/received")
def friend_requests_received(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    friendships = session.exec(
        select(Friendship).where(
            Friendship.status == "pending",
            Friendship.addressee_id == current_user.user_id,
        )
    ).all()

    requester_ids = [fr.requester_id for fr in friendships]
    if not requester_ids:
        return []

    rows = session.exec(
        select(User, Profile)
        .join(Profile, Profile.user_id == User.user_id, isouter=True)
        .where(User.user_id.in_(requester_ids))
    ).all()

    out = []
    for u, p in rows:
        out.append(
            {
                "userId": u.user_id,
                "username": u.username,
                "firstName": (p.first_name if p else ""),
                "lastName": (p.last_name if p else ""),
                "avatar": (p.avatar if p else None),
            }
        )

    out.sort(key=lambda x: x["username"].lower())
    return out


@router.get("/friend_requests/sent")
def friend_requests_sent(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    friendships = session.exec(
        select(Friendship).where(
            Friendship.status == "pending",
            Friendship.requester_id == current_user.user_id,
        )
    ).all()

    addressee_ids = [fr.addressee_id for fr in friendships]
    if not addressee_ids:
        return []

    rows = session.exec(
        select(User, Profile)
        .join(Profile, Profile.user_id == User.user_id, isouter=True)
        .where(User.user_id.in_(addressee_ids))
    ).all()

    out = []
    for u, p in rows:
        out.append(
            {
                "userId": u.user_id,
                "username": u.username,
                "firstName": (p.first_name if p else ""),
                "lastName": (p.last_name if p else ""),
                "avatar": (p.avatar if p else None),
            }
        )

    out.sort(key=lambda x: x["username"].lower())
    return out


@router.delete("/friends/request/{addressee_id}")
def cancel_friend_request(
    addressee_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    if addressee_id == current_user.user_id:
        raise HTTPException(400, "request to yourself error")

    low, high = canonical_pair(current_user.user_id, addressee_id)

    fr = session.exec(
        select(Friendship).where(
            Friendship.user_low_id == low,
            Friendship.user_high_id == high,
            Friendship.status == "pending",
        )
    ).first()

    if not fr:
        raise HTTPException(404, "No pending request found")

    if fr.requester_id != current_user.user_id:
        raise HTTPException(403, "Only the requester can cancel this request")

    session.delete(fr)
    session.commit()
    return {"ok": True}


@router.get("/friends/status/{other_user_id}")
def get_friend_status(
    other_user_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    if other_user_id == current_user.user_id:
        return {"status": "self"}

    low, high = canonical_pair(current_user.user_id, other_user_id)

    fr = session.exec(
        select(Friendship).where(
            Friendship.user_low_id == low,
            Friendship.user_high_id == high,
        )
    ).first()

    if not fr:
        return {"status": "none"}

    if fr.status == "accepted":
        return {"status": "accepted"}

    if fr.status == "pending":
        if fr.requester_id == current_user.user_id:
            return {"status": "pending_sent"}
        return {"status": "pending_received"}

    return {"status": fr.status}
