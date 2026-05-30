from sqlmodel import SQLModel, Field, Relationship
from typing import TYPE_CHECKING

from model.BaseTable import BaseTable
from model.User import User, UserPublic

# Condition to break circular import
if TYPE_CHECKING:
    from model.Thread import Thread
    from model.Post import Post

# Create Profile database table
class Profile(BaseTable, table=True):
    profile_id: int | None = Field(default=None, primary_key=True)  # Create id
    first_name: str = Field(nullable=False)                         # Required field
    last_name: str = Field(nullable=False)                          # Required field
    email: str | None = Field(nullable=True)                        # Optional field
    avatar: str | None = Field(nullable=True)                       # Optional field
    
    # Create foreign key
    user_id: int | None = Field(default=None, foreign_key="user.user_id")
    # Create one-to-one relationship between Profile and User
    user: User | None = Relationship()
    
    # Create one-to-many relationship between Profile and Thread
    threads: list["Thread"] = Relationship(back_populates="profile")
    # Create one-to-many relationship between Profile and Post
    posts: list["Post"] = Relationship(back_populates="profile")

    
# Create data transfer object (DTO) to update profile with only 4 fields
class ProfileUpdate(BaseTable):
    first_name: str
    last_name: str
    email: str | None
    avatar: str | None
    
# Create data transfer object (DTO) to get profile for the discussion forum
class ProfilePublic(BaseTable):
    user: UserPublic | None
    avatar: str | None
    first_name: str | None
    last_name: str
    
    