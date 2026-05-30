from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field
from sqlalchemy import Index, UniqueConstraint, CheckConstraint


class Conversation(SQLModel, table=True):
    __tablename__ = "conversation"

    conversation_id: Optional[int] = Field(default=None, primary_key=True)
    conversation_name: Optional[str] = Field(default=None, index=True)
    is_group: bool = Field(default=False, index=True)

    dm_user_low_id: Optional[int] = Field(
        default=None, foreign_key="user.user_id", index=True
    )
    dm_user_high_id: Optional[int] = Field(
        default=None, foreign_key="user.user_id", index=True
    )

    # last_message_id: Optional[int] = Field(
    #     default=None, foreign_key="message.message_id"
    # )
    last_message_at: Optional[datetime] = Field(default=None, index=True)
    last_message_text: Optional[str] = Field(default=None)
    last_message_from_user_id: Optional[int] = Field(
        default=None, foreign_key="user.user_id"
    )

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), index=True
    )

    __table_args__ = (
        UniqueConstraint(
            "dm_user_low_id", "dm_user_high_id", name="uq_conversation_dm_pair"
        ),
        CheckConstraint(
            "(is_group = TRUE AND dm_user_low_id IS NULL AND dm_user_high_id IS NULL) OR "
            "(is_group = FALSE AND dm_user_low_id IS NOT NULL AND dm_user_high_id IS NOT NULL AND dm_user_low_id < dm_user_high_id)",
            name="ck_conversation_dm_fields",
        ),
        Index(
            "ix_conversation_dm_pair_updated",
            "dm_user_low_id",
            "dm_user_high_id",
            "updated_at",
        ),
        # Index("ix_conversation_last_message_at", "last_message_at"),
    )


class ConversationMember(SQLModel, table=True):
    __tablename__ = "conversationmember"

    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversation.conversation_id", index=True)
    user_id: int = Field(foreign_key="user.user_id", index=True)

    joined_datetime: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), index=True
    )
    left_datetime: Optional[datetime] = Field(default=None, index=True)

    last_read_message_id: Optional[int] = Field(
        default=None, foreign_key="message.message_id"
    )
    unread_count: int = Field(default=0, index=True)

    __table_args__ = (
        UniqueConstraint("conversation_id", "user_id", name="uq_conversation_member"),
        Index("ix_member_conversation_active", "conversation_id", "left_datetime"),
        Index("ix_member_user_lookup", "user_id", "conversation_id"),
        Index("ix_member_unread", "user_id", "unread_count"),
    )


class Message(SQLModel, table=True):
    __tablename__ = "message"

    message_id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversation.conversation_id", index=True)
    from_user_id: int = Field(foreign_key="user.user_id", index=True)

    message_text: str = Field(nullable=False, max_length=2000)

    message_type: str = Field(default="text", index=True)

    shared_review_id: Optional[int] = Field(
        default=None,
        foreign_key="review.review_id",
        index=True,
    )

    shared_movie_id: Optional[int] = Field(
        default=None,
        foreign_key="movie.movie_id",
        index=True,
    )

    shared_song_id: Optional[int] = Field(
        default=None,
        foreign_key="song.song_id",
        index=True,
    )

    sent_datetime: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), index=True
    )

    __table_args__ = (
        Index("ix_message_conversation_time", "conversation_id", "sent_datetime"),
    )
