from typing import TYPE_CHECKING, Optional

from sqlmodel import SQLModel, Field, Relationship

# Condition to break circular import
if TYPE_CHECKING:
    from model.Profile import Profile

from model.BaseTable import BaseTable

# Condition to break circular import
if TYPE_CHECKING:
    from model.Review import Review


# Create User database table
class User(BaseTable, table=True):
    user_id: int | None = Field(default=None, primary_key=True)  # Create id
    username: str  # required field
    password: str
    recovery_code_hash: str | None = None

    # Create one-to-many relationship between User and Review
    reviews: list["Review"] = Relationship(back_populates="user")
    # Create one-to-one relationship between User and Profile
    profile: Optional["Profile"] = Relationship(back_populates="user")


# Create Data transfer object (DTO) for showing User information public
class UserPublic(BaseTable):
    user_id: int
    username: str


# Create Data transfer object (DTO) for creating User information public
class UserCreate(BaseTable):
    username: str
    password: str
    first_name: str
    last_name: str
    avatar: str | None = None


# Create Data transfer object (DTO) for showing Profile information public
class UserProfilePublic(BaseTable):
    user_id: int
    username: str
    first_name: str
    last_name: str
    email: str | None
    avatar: str | None
