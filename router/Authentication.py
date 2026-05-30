# to get a string like this run:
# openssl rand -hex 32
import os
import secrets
from typing import Annotated

import secrets
from dns.message import AUTHORITY
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Path
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi_another_jwt_auth import AuthJWT
from fastapi_another_jwt_auth.exceptions import AuthJWTException
from pwdlib import PasswordHash
from pydantic import BaseModel
from sqlmodel import select
from starlette import status

from model.Profile import Profile, ProfileUpdate
from model.User import User, UserPublic, UserCreate, UserProfilePublic
from model.database import SessionDep
from model.Review import Review

# Get secret passwords from environment
load_dotenv()
SECRET_KEY = os.getenv(
    "SECRET_KEY"
)  # The secret string used to sign JWT tokens - must be kept private
ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv(
    "ACCESS_TOKEN_EXPIRE_MINUTES"
)  # How long tokens are valid, read as a string


# Setting for authentication
class Settings(BaseModel):
    authjwt_secret_key: str = SECRET_KEY  # secret key used to sign and verify all JWTs
    authjwt_access_token_expire: int = (
        int(ACCESS_TOKEN_EXPIRE_MINUTES) * 60
    )  # expire in seconds


# Register get_config as the configuration provider for the AuthJWT library.
# The function is called automatically at start up
@AuthJWT.load_config
def get_config():
    return Settings()


# Setting for hashing password
password_hash = PasswordHash.recommended()

# Setting for OAuth2 authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Create the modular router that all auth routes are registered on
router = APIRouter()

AuthJWTDep = Annotated[
    AuthJWT, Depends()
]  # inject an AuthJWT instance via FastAPI dependency injection
TokenDep = Annotated[
    str, Depends(oauth2_scheme)
]  # extracts the token string from Authorization header


def decode_access_token(token: str) -> dict:
    """
    Returns the raw JWT dict as an access token.
    """
    try:
        authorize = AuthJWT()
        return authorize.get_raw_jwt(token)
    except AuthJWTException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# The function return true if the plain password matches the stored hash password
def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)


# The function return a hashed password
def get_password_hash(password):
    return password_hash.hash(password)


# Queries the database for a User row where the username matches
def get_user(username: str, session: SessionDep) -> User | None:
    return session.exec(select(User).where(User.username == username)).first()


# Combines get user and verify password into a single authentication check
def authenticate_user(username: str, password: str, session: SessionDep):
    user = get_user(username, session)
    if not user:
        return False
    if not verify_password(password, user.password):
        return False
    return user


# The class return token response to the client after a successful login or signup
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class SignupResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    recovery_code: str


class ForgotPasswordRequest(BaseModel):
    username: str
    recovery_code: str
    new_password: str


# Create both a JWT access token and a refresh token with the username
def create_access_token(username: str):
    access_token = AuthJWT.create_access_token(self=AuthJWT(), subject=username)
    refresh_token = AuthJWT.create_refresh_token(self=AuthJWT(), subject=username)
    return Token(
        access_token=access_token, refresh_token=refresh_token, token_type="Bearer"
    )


# The reusable 401 exception raised whenever a token is missing, expired or user no longer exists
credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,  # raised when a token is missing, invalid, or expired
    detail="Please sign in to continue.",
    headers={"WWW-Authenticate": "Bearer"},
)

# The reusable 403 exception raised when an authenticated user tries to access or modify a resource that belongs to a different user
access_denied_exception = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,  # raised when a user tries to access another user's resource
    detail="You don't have access to this resource",
    headers={"WWW-Authenticate": "Bearer"},
)


# The function identifies the current user who is making the request
async def get_current_user(
    token: TokenDep, session: SessionDep, authorize: AuthJWTDep
) -> User:
    try:
        username = authorize.get_raw_jwt(token)["sub"]
        if not username:
            raise credentials_exception
    except AuthJWTException:
        raise credentials_exception

    user = get_user(username, session)
    if not user:
        raise credentials_exception
    return user


# The function allow the current user access their own data but not someone else's data
async def does_user_have_access(
    user_id: Annotated[int, Path(title="id of user")],
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if current_user.user_id != user_id:
        raise access_denied_exception
    return current_user


# Route handlers
# post /signup - registers a new user account and returns a JWT token
@router.post("/signup", operation_id="signup")
async def signup(user_create: UserCreate, session: SessionDep) -> SignupResponse:
    # Check for duplicate username before creating the account
    user = get_user(user_create.username, session)
    if user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken."
        )

    recovery_code = secrets.token_urlsafe(12)

    # Create the User record with a hashed password - never store plain text passwords
    user = User(
        username=user_create.username,
        password=get_password_hash(user_create.password),
        recovery_code_hash=get_password_hash(recovery_code),
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    # Create the associated Profile record for the new user
    profile = Profile(
        first_name=user_create.first_name,
        last_name=user_create.last_name,
        avatar=user_create.avatar,
        user_id=user.user_id,
    )

    session.add(profile)
    session.commit()

    token = create_access_token(user.username)

    return SignupResponse(
        access_token=token.access_token,
        refresh_token=token.refresh_token,
        token_type=token.token_type,
        recovery_code=recovery_code,
    )


# post /login - authenticates an existing user and return a JWT token
@router.post("/login")
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], session: SessionDep
) -> Token:
    user = authenticate_user(form_data.username, form_data.password, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return create_access_token(form_data.username)


@router.post("/recovery-code")
async def generate_recovery_code(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    recovery_code = secrets.token_urlsafe(12)

    current_user.recovery_code_hash = get_password_hash(recovery_code)
    session.add(current_user)
    session.commit()

    return {"recovery_code": recovery_code}


@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest,
    session: SessionDep,
):
    user = get_user(data.username, session)

    if not user or not user.recovery_code_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid username or recovery code.",
        )

    if not verify_password(data.recovery_code, user.recovery_code_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid username or recovery code.",
        )

    user.password = get_password_hash(data.new_password)
    session.add(user)
    session.commit()

    return {"message": "Password reset successfully."}


# get /current user - returns the full profile of the current authenticated user
@router.get("/current_user", response_model=UserProfilePublic)
async def current_user(current_user: Annotated[User, Depends(get_current_user)]):
    profile = current_user.profile
    return UserProfilePublic(
        user_id=current_user.user_id,
        username=current_user.username,
        first_name=profile.first_name,
        last_name=profile.last_name,
        email=profile.email,
        avatar=profile.avatar,
    )


# get /users/{user_id} - returns basic public information for a specific user
@router.get("/users/{user_id}", response_model=UserPublic)
async def read_user(
    current_user: Annotated[User, Depends(does_user_have_access)],
) -> UserPublic:
    return UserPublic(user_id=current_user.user_id, username=current_user.username)


# put /users/{user_id} - updates the profile of the current authenticated user
@router.put("/users/{user_id}", response_model=UserProfilePublic)
async def update_user(
    profile_update: ProfileUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
) -> UserProfilePublic:
    profile = current_user.profile
    profile.first_name = profile_update.first_name
    profile.last_name = profile_update.last_name
    profile.email = profile_update.email
    profile.avatar = profile_update.avatar
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return UserProfilePublic(
        user_id=current_user.user_id,
        username=current_user.username,
        first_name=profile.first_name,
        last_name=profile.last_name,
        email=profile.email,
        avatar=profile.avatar,
    )


@router.post("/refresh")
async def refresh_token(
    token: TokenDep,
    authorize: AuthJWTDep,
) -> Token:
    try:
        username = authorize.get_raw_jwt(token)["sub"]
        if not username:
            raise credentials_exception
    except AuthJWTException:
        raise credentials_exception

    return create_access_token(username)
