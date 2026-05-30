from __future__ import annotations

from typing import Annotated, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from model.database import SessionDep
from model.User import User
from model.Profile import Profile
from model.Friendship import Friendship
from model.Messages import Conversation, ConversationMember, Message
from model.Review import Review
from model.Movie import Movie
from model.Song import Song
from router.Authentication import get_current_user
from ws_manager import manager


def hard_delete_conversation(session: Session, conversation_id: int) -> None:
    """
    Fully delete a conversation and all dependent rows in FK-safe order.
    """

    members = session.exec(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id
        )
    ).all()

    for member in members:
        if member.last_read_message_id is not None:
            member.last_read_message_id = None
            session.add(member)

    session.commit()

    messages = session.exec(
        select(Message).where(Message.conversation_id == conversation_id)
    ).all()
    for msg in messages:
        session.delete(msg)

    session.commit()

    members = session.exec(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id
        )
    ).all()
    for member in members:
        session.delete(member)

    session.commit()

    conv = session.get(Conversation, conversation_id)
    if conv:
        session.delete(conv)
        session.commit()


def canonical_pair(a: int, b: int) -> tuple[int, int]:
    return (a, b) if a < b else (b, a)


router = APIRouter(prefix="/messages", tags=["messages"])


def build_shared_review(session: Session, review_id: int | None):
    if review_id is None:
        return None

    review = session.exec(
        select(Review)
        .where(Review.review_id == review_id)
        .options(
            selectinload(Review.movie).selectinload(Movie.episodes),
            selectinload(Review.song),
        )
    ).first()

    if not review:
        return None

    if review.movie_id is not None and review.movie is not None:
        return {
            "reviewId": review.review_id,
            "review": review.review,
            "reviewRating": review.review_rating,
            "reviewRatingCount": review.review_rating_count,
            "kind": "tv" if review.movie.episodes else "movie",
            "title": review.movie.movie_name,
            "cover": review.movie.cover,
            "year": review.movie.year,
            "movieId": review.movie_id,
            "songId": None,
        }

    if review.song_id is not None and review.song is not None:
        return {
            "reviewId": review.review_id,
            "review": review.review,
            "reviewRating": review.review_rating,
            "reviewRatingCount": review.review_rating_count,
            "kind": "song",
            "title": review.song.song_name,
            "cover": review.song.cover,
            "year": review.song.year,
            "movieId": None,
            "songId": review.song_id,
        }

    return None


def build_shared_media(
    session: Session,
    movie_id: int | None,
    song_id: int | None,
):
    if movie_id is not None:
        movie = session.exec(
            select(Movie)
            .where(Movie.movie_id == movie_id)
            .options(selectinload(Movie.episodes))
        ).first()

        if not movie:
            return None

        return {
            "kind": "tv" if movie.episodes else "movie",
            "id": movie.movie_id,
            "title": movie.movie_name,
            "cover": movie.cover,
            "year": movie.year,
            "rating": movie.movie_rating,
            "href": f"/movies/{movie.movie_id}",
        }

    if song_id is not None:
        song = session.exec(select(Song).where(Song.song_id == song_id)).first()

        if not song:
            return None

        return {
            "kind": "song",
            "id": song.song_id,
            "title": song.song_name,
            "cover": song.cover,
            "year": song.year,
            "rating": song.song_rating,
            "href": f"/songs/{song.song_id}",
        }

    return None


@router.get("/conversations")
def list_conversations(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
    limit: int = Query(50, ge=1, le=200),
):
    """
    List conversations for the current user.
      - conversation info
      - unread_count for current user
      - last message preview fields
      - DM other user's profile info (for is_group = false)
    """
    memberships = session.exec(
        select(ConversationMember, Conversation)
        .join(
            Conversation,
            Conversation.conversation_id == ConversationMember.conversation_id,
        )
        .where(
            ConversationMember.user_id == current_user.user_id,
            ConversationMember.left_datetime.is_(None),
        )
        .order_by(
            Conversation.last_message_at.desc().nullslast(),
            Conversation.updated_at.desc(),
        )
        .limit(limit)
    ).all()

    if not memberships:
        return []

    out = []

    for member, conv in memberships:
        dm_other_user_id: Optional[int] = None
        other_user = None
        other_profile = None

        if not conv.is_group and conv.dm_user_low_id and conv.dm_user_high_id:
            dm_other_user_id = (
                conv.dm_user_high_id
                if conv.dm_user_low_id == current_user.user_id
                else conv.dm_user_low_id
            )

            row = session.exec(
                select(User, Profile)
                .join(Profile, Profile.user_id == User.user_id, isouter=True)
                .where(User.user_id == dm_other_user_id)
            ).first()
            if row:
                other_user, other_profile = row

        out.append(
            {
                "conversationId": conv.conversation_id,
                "isGroup": conv.is_group,
                "conversationName": conv.conversation_name,
                "otherUser": (
                    {
                        "userId": other_user.user_id,
                        "username": other_user.username,
                        "firstName": (
                            other_profile.first_name if other_profile else ""
                        ),
                        "lastName": (other_profile.last_name if other_profile else ""),
                        "avatar": (other_profile.avatar if other_profile else None),
                    }
                    if other_user
                    else None
                ),
                "unreadCount": member.unread_count,
                "lastMessageText": conv.last_message_text,
                "lastMessageAt": conv.last_message_at,
                "lastMessageFromUserId": conv.last_message_from_user_id,
            }
        )

    return out


@router.post("/dm/{other_user_id}")
def create_or_get_dm(
    other_user_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    """
    Create or return a DM conversation between current_user and other_user_id.
    If both users previously deleted the DM, create a fresh conversation.
    """
    if other_user_id == current_user.user_id:
        raise HTTPException(400, "Cannot DM yourself")

    low, high = canonical_pair(current_user.user_id, other_user_id)
    fr = session.exec(
        select(Friendship).where(
            Friendship.user_low_id == low,
            Friendship.user_high_id == high,
            Friendship.status == "accepted",
        )
    ).first()
    if not fr:
        raise HTTPException(403, "You can only DM accepted friends")

    conv = session.exec(
        select(Conversation).where(
            Conversation.is_group == False,
            Conversation.dm_user_low_id == low,
            Conversation.dm_user_high_id == high,
        )
    ).first()

    if conv:
        members = session.exec(
            select(ConversationMember).where(
                ConversationMember.conversation_id == conv.conversation_id
            )
        ).all()

        all_hidden = len(members) > 0 and all(
            m.left_datetime is not None for m in members
        )

        if all_hidden:
            old_conversation_id = conv.conversation_id
            hard_delete_conversation(session, old_conversation_id)
            conv = None
        else:
            now = datetime.now(timezone.utc)

            my_member = session.exec(
                select(ConversationMember).where(
                    ConversationMember.conversation_id == conv.conversation_id,
                    ConversationMember.user_id == current_user.user_id,
                )
            ).first()

            if my_member:
                if my_member.left_datetime is not None:
                    my_member.left_datetime = None
                    my_member.joined_datetime = now
                    my_member.unread_count = 0
                    session.add(my_member)
            else:
                my_member = ConversationMember(
                    conversation_id=conv.conversation_id,
                    user_id=current_user.user_id,
                    joined_datetime=now,
                )
                session.add(my_member)

            other_member = session.exec(
                select(ConversationMember).where(
                    ConversationMember.conversation_id == conv.conversation_id,
                    ConversationMember.user_id == other_user_id,
                )
            ).first()

            if not other_member:
                other_member = ConversationMember(
                    conversation_id=conv.conversation_id,
                    user_id=other_user_id,
                    joined_datetime=now,
                )
                session.add(other_member)

            conv.updated_at = now
            session.add(conv)
            session.commit()

            return {"conversationId": conv.conversation_id}

    conv = Conversation(
        is_group=False,
        conversation_name=None,
        dm_user_low_id=low,
        dm_user_high_id=high,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    session.add(conv)
    session.commit()
    session.refresh(conv)

    now = datetime.now(timezone.utc)
    m1 = ConversationMember(
        conversation_id=conv.conversation_id,
        user_id=current_user.user_id,
        joined_datetime=now,
    )
    m2 = ConversationMember(
        conversation_id=conv.conversation_id,
        user_id=other_user_id,
        joined_datetime=now,
    )
    session.add(m1)
    session.add(m2)
    session.commit()

    return {"conversationId": conv.conversation_id}


# Messages
@router.get("/conversations/{conversation_id}/members")
def list_members(
    conversation_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    member = session.exec(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.user_id,
        )
    ).first()
    if not member:
        raise HTTPException(403, "Not a member of this conversation")

    rows = session.exec(
        select(User, Profile, ConversationMember)
        .join(ConversationMember, ConversationMember.user_id == User.user_id)
        .join(Profile, Profile.user_id == User.user_id, isouter=True)
        .where(
            ConversationMember.conversation_id == conversation_id,
        )
        .order_by(User.username.asc())
    ).all()

    out = []
    for u, p, cm in rows:
        out.append(
            {
                "userId": u.user_id,
                "username": u.username,
                "firstName": (p.first_name if p else ""),
                "lastName": (p.last_name if p else ""),
                "avatar": (p.avatar if p else None),
                "unreadCount": cm.unread_count,
            }
        )

    return out


@router.get("/conversations/{conversation_id}/messages")
def list_messages(
    conversation_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
    limit: int = Query(50, ge=1, le=200),
    before_message_id: Optional[int] = Query(None, ge=1),
):
    member = session.exec(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.user_id,
            ConversationMember.left_datetime.is_(None),
        )
    ).first()

    if not member:
        raise HTTPException(403, "Not a member of this conversation")

    stmt = select(Message).where(Message.conversation_id == conversation_id)

    if before_message_id is not None:
        stmt = stmt.where(Message.message_id < before_message_id)

    msgs = session.exec(stmt.order_by(Message.message_id.desc()).limit(limit)).all()

    msgs.reverse()

    return [
        {
            "messageId": m.message_id,
            "conversationId": m.conversation_id,
            "fromUserId": m.from_user_id,
            "messageText": m.message_text,
            "messageType": m.message_type,
            "sharedReviewId": m.shared_review_id,
            "sharedMovieId": m.shared_movie_id,
            "sharedSongId": m.shared_song_id,
            "sharedReview": (
                build_shared_review(session, m.shared_review_id)
                if m.message_type == "review_share"
                else None
            ),
            "sharedMedia": (
                build_shared_media(session, m.shared_movie_id, m.shared_song_id)
                if m.message_type == "media_share"
                else None
            ),
            "sentDatetime": m.sent_datetime,
        }
        for m in msgs
    ]


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: int,
    payload: dict,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    MAX_MESSAGE_LENGTH = 2000

    message_text = (payload.get("messageText") or "").strip()
    message_type = payload.get("messageType") or "text"
    shared_review_id = payload.get("sharedReviewId")
    shared_movie_id = payload.get("sharedMovieId")
    shared_song_id = payload.get("sharedSongId")

    if message_type not in ["text", "review_share", "media_share"]:
        raise HTTPException(400, "Invalid messageType")

    if message_type == "text" and not message_text:
        raise HTTPException(400, "messageText is required")

    if message_type == "review_share":
        if shared_review_id is None:
            raise HTTPException(400, "sharedReviewId is required")

        if not message_text:
            message_text = "Shared a review"

    if message_type == "media_share":
        if shared_movie_id is None and shared_song_id is None:
            raise HTTPException(400, "sharedMovieId or sharedSongId is required")

        if shared_movie_id is not None and shared_song_id is not None:
            raise HTTPException(400, "Share either a movie or a song, not both")

        if not message_text:
            message_text = "Shared media"

    if len(message_text) > MAX_MESSAGE_LENGTH:
        raise HTTPException(
            400, f"Message too long (max {MAX_MESSAGE_LENGTH} characters)"
        )

    member = session.exec(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.user_id,
            ConversationMember.left_datetime.is_(None),
        )
    ).first()
    if not member:
        raise HTTPException(403, "Not a member of this conversation")

    conv = session.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(404, "Conversation not found")

    now = datetime.now(timezone.utc)

    msg = Message(
        conversation_id=conversation_id,
        from_user_id=current_user.user_id,
        message_text=message_text,
        message_type=message_type,
        shared_review_id=shared_review_id,
        shared_movie_id=shared_movie_id,
        shared_song_id=shared_song_id,
        sent_datetime=now,
    )

    session.add(msg)
    session.commit()
    session.refresh(msg)

    conv.last_message_at = msg.sent_datetime
    conv.last_message_text = msg.message_text[:200]
    conv.last_message_from_user_id = msg.from_user_id
    conv.updated_at = now
    session.add(conv)

    others = session.exec(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id != current_user.user_id,
        )
    ).all()

    recipient_ids = []

    for m in others:
        if conv.is_group is False and m.left_datetime is not None:
            m.left_datetime = None
            m.joined_datetime = now

        m.unread_count = (m.unread_count or 0) + 1
        session.add(m)
        recipient_ids.append(m.user_id)

    member.unread_count = 0
    member.last_read_message_id = msg.message_id
    session.add(member)

    session.commit()

    response_payload = {
        "messageId": msg.message_id,
        "conversationId": msg.conversation_id,
        "fromUserId": msg.from_user_id,
        "messageText": msg.message_text,
        "messageType": msg.message_type,
        "sharedReviewId": msg.shared_review_id,
        "sharedMovieId": msg.shared_movie_id,
        "sharedSongId": msg.shared_song_id,
        "sharedReview": (
            build_shared_review(session, msg.shared_review_id)
            if msg.message_type == "review_share"
            else None
        ),
        "sharedMedia": (
            build_shared_media(session, msg.shared_movie_id, msg.shared_song_id)
            if msg.message_type == "media_share"
            else None
        ),
        "sentDatetime": msg.sent_datetime.isoformat(),
    }

    await manager.broadcast_to_conversation(
        conversation_id,
        {
            "type": "message",
            "message": response_payload,
        },
    )

    for uid in recipient_ids:
        await manager.broadcast_to_user(
            uid,
            {
                "type": "inbox_update",
                "conversationId": conversation_id,
            },
        )

    await manager.broadcast_to_user(
        current_user.user_id,
        {
            "type": "inbox_update",
            "conversationId": conversation_id,
        },
    )

    return response_payload


@router.post("/conversations/{conversation_id}/read")
def mark_conversation_read(
    conversation_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    """
    Mark the conversation read for the current user:
      unread_count -> 0
      last_read_message_id -> conversation.last_message_id
    """
    member = session.exec(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.user_id,
            ConversationMember.left_datetime.is_(None),
        )
    ).first()
    if not member:
        raise HTTPException(403, "Not a member of this conversation")

    conv = session.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(404, "Conversation not found")

    member.unread_count = 0
    session.add(member)
    session.commit()

    return {"ok": True}


@router.delete("/conversations/{conversation_id}")
async def delete_conversation_for_me(
    conversation_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    """
    Hide this conversation from the current user's inbox.
    Does not delete it for other users.
    """
    member = session.exec(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.user_id,
            ConversationMember.left_datetime.is_(None),
        )
    ).first()

    if not member:
        raise HTTPException(404, "Conversation not found")

    conv = session.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(404, "Conversation not found")

    now = datetime.now(timezone.utc)

    member.left_datetime = now
    member.unread_count = 0
    session.add(member)

    conv.updated_at = now
    session.add(conv)

    session.commit()

    await manager.broadcast_to_user(
        current_user.user_id,
        {
            "type": "inbox_update",
            "conversationId": conversation_id,
        },
    )

    return {"ok": True, "conversationId": conversation_id}

@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    msg = session.get(Message, message_id)

    if not msg:
        raise HTTPException(404, "Message not found")

    if msg.from_user_id != current_user.user_id:
        raise HTTPException(403, "You can only delete your own messages")

    conversation_id = msg.conversation_id

    member = session.exec(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.user_id,
            ConversationMember.left_datetime.is_(None),
        )
    ).first()

    if not member:
        raise HTTPException(403, "Not a member of this conversation")

    members_pointing_to_message = session.exec(
        select(ConversationMember).where(
            ConversationMember.last_read_message_id == message_id
        )
    ).all()

    for m in members_pointing_to_message:
        m.last_read_message_id = None
        session.add(m)

    session.commit()

    session.delete(msg)
    session.commit()

    await manager.broadcast_to_conversation(
        conversation_id,
        {
            "type": "message_deleted",
            "messageId": message_id,
            "conversationId": conversation_id,
        },
    )

    await manager.broadcast_to_user(
        current_user.user_id,
        {
            "type": "inbox_update",
            "conversationId": conversation_id,
        },
    )

    return {"ok": True, "messageId": message_id}