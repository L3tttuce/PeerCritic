from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from enum import Enum

from sqlmodel import Field
from sqlalchemy import UniqueConstraint, Index

from model.BaseTable import BaseTable


class FriendStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"
    blocked = "blocked"


class Friendship(BaseTable, table=True):
    __tablename__ = "friendship"

    id: Optional[int] = Field(default=None, primary_key=True)

    requester_id: int = Field(foreign_key="user.user_id", index=True)
    addressee_id: int = Field(foreign_key="user.user_id", index=True)

    # Prevent duplicate entries: For any two users, there is only one ordered pair (low, high)
    user_low_id: int = Field(index=True)
    user_high_id: int = Field(index=True)

    status: FriendStatus = Field(default=FriendStatus.pending, index=True)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("user_low_id", "user_high_id", name="uq_friend_pair"),
        Index("ix_friendship_status_pair", "status", "user_low_id", "user_high_id"),
    )
