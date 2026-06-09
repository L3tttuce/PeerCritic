from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship

from model.BaseTable import BaseTable
from model.User import UserPublic
from model.Profile import ProfilePublic

# Condition to break circular import
if TYPE_CHECKING:
    from model.Profile import Profile, ProfilePublic
    from model.Post import Post

# Create Thread database table
class Thread(BaseTable, table=True):
    thread_id: int | None = Field(default=None, primary_key=True)
    thread_name: str
    timestamp: datetime = Field(nullable=True)
    thread_content: str = Field(nullable=True)
    like: int | None = 0
    
    # Create foreign key
    profile_id: int | None = Field(default=None, foreign_key="profile.profile_id", index=True)
    # Create many-to-one relationship between Thread and Profile
    profile: Optional["Profile"] = Relationship(back_populates="threads")
    # Create one-to-many relationship between Thread and Post
    posts: list["Post"] = Relationship(back_populates="thread")

    
# Create Data Transfer Object (DTO) for thread view
class ThreadPublic(BaseTable):
    thread_id: int | None
    profile: ProfilePublic | None
    thread_name: str
    timestamp: datetime | None
    thread_content: str | None
    like: int | None

# Create Data Transfer Object (DTO) for thread creation
class ThreadCreateRequest(BaseTable):
    thread_name: str
    thread_content: str | None
