from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship

from model.BaseTable import BaseTable
from model.Profile import ProfilePublic

# Condition to break circular import
if TYPE_CHECKING:
    from model.Thread import Thread
    from model.Profile import Profile


# Create Post database table:
class Post(BaseTable, table=True):
    post_id: int | None = Field(default=None, primary_key=True)
    post_content: str = Field(nullable=False)
    timestamp: datetime = Field(nullable=False)
    like: int | None = 0
    
    # Create foreign key
    thread_id: int | None = Field(default=None, foreign_key="thread.thread_id", index=True)
    # Create many-to-one relationship between Thread and Post
    thread: Optional["Thread"] = Relationship(back_populates="posts")

    # Create foreign key
    profile_id: int | None = Field(default=None, foreign_key="profile.profile_id")
    # Create many-to-one relationship between Thread and Post
    profile: Optional["Profile"] = Relationship(back_populates="posts")

    # Create foreign key
    original_post_id: int | None = Field(default=None, foreign_key="post.post_id")
    # Create many-to-one relationship between Reply and Post
    original_post: Optional["Post"] = Relationship(back_populates="replies",
                                                   sa_relationship_kwargs=dict(
                                                       remote_side="Post.post_id"
                                                   ))
    # Create one-to-many relationship between Post and Reply
    replies: list["Post"] = Relationship(back_populates="original_post")
  

# Create Data Transfer Object (DTO) for reply view
class OriginalPostPublic(BaseTable):
    post_id: int | None
    profile: ProfilePublic | None
    post_content: str | None
    timestamp: datetime | None


# Create Data Transfer Object (DTO) for post view
class PostPublic(BaseTable):
    post_id: int | None
    profile: ProfilePublic | None
    post_content: str | None
    timestamp: datetime | None
    like: int | None
    original_post: OriginalPostPublic | None


# Create Data Transfer Object (DTO) for post creation
class PostCreateRequest(BaseTable):
    post_content: str | None
    original_post_id: int | None
    