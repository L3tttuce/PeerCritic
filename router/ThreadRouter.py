from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Path, Depends
from fastapi_pagination import Page, set_page, set_params, Params
from fastapi_pagination.ext.sqlmodel import paginate
from sqlalchemy.orm import joinedload, selectinload
from sqlmodel import select

from model.Post import PostPublic, Post, PostCreateRequest, OriginalPostPublic
from model.Profile import Profile, ProfilePublic
from model.Thread import Thread, ThreadPublic, ThreadCreateRequest
from model.User import User, UserPublic
from model.database import SessionDep
from router.Authentication import get_current_user

# Create a router instance
router = APIRouter()

# Define routes for getting a thread detail
@router.get("/threads/{thread_id}", response_model=ThreadPublic)
async def get_thread(
        thread_id: Annotated[int, Path(title = "id of thread")],
        session: SessionDep
) -> ThreadPublic:
    thread = session.exec(
        select(Thread)
        .where(Thread.thread_id == thread_id)
        .options(joinedload(Thread.profile).joinedload(Profile.user))
    ).first()

    profile = thread.profile
    user = profile.user

    return ThreadPublic(
        thread_id=thread.thread_id,
        profile=ProfilePublic(
            user=UserPublic(user_id=user.user_id, username=user.username),
            avatar=profile.avatar,
            first_name=profile.first_name,
            last_name=profile.last_name,
        ),
        thread_name=thread.thread_name,
        timestamp=thread.timestamp,
        thread_content=thread.thread_content,
        like=thread.like,
    )

# Define a GET route for finding posts of thread
@router.get("/threads/{thread_id}/posts", response_model=Page[PostPublic])
async def get_posts(
        thread_id: Annotated[int, Path(title = "id of thread")],
        session: SessionDep,
        page: int = 1,
        size: int = 20
) -> Page[PostPublic]:
    # Set the pagination response type for the current request
    set_page(Page[PostPublic])
    
    set_params(Params(size=size, page=page))
    
    result = paginate(session, select(Post)
                      .where(Post.thread_id == thread_id)
                      .options(joinedload(Post.profile).joinedload(Profile.user))
                      .order_by(Post.post_id))
    return result


# Define a GET route for searching a list of threads
@router.get("/threads", response_model=Page[ThreadPublic])
async def search_threads(
        session: SessionDep,
        page: int = 1,
        size: int = 20
) -> Page[ThreadPublic]:
    
    set_page(Page[ThreadPublic])
    
    set_params(Params(size=size, page=page))
    
    result = paginate(session, select(Thread).options(joinedload(Thread.profile).joinedload(Profile.user)))
    return result
    

# Define a Post route for thread
@router.post("/threads", response_model=ThreadPublic)
async def create_thread(
        session: SessionDep,
        thread_create_request: ThreadCreateRequest,
        current_user: Annotated[User, Depends(get_current_user)]
) -> ThreadPublic:    
    thread = Thread(
        thread_name=thread_create_request.thread_name,
        thread_content=thread_create_request.thread_content,
        profile=current_user.profile,
        timestamp=datetime.now()
    )
    session.add(thread)
    session.commit()
    session.refresh(thread)

    profile = current_user.profile
    return ThreadPublic(
        thread_id=thread.thread_id,
        profile=ProfilePublic(
            user=UserPublic(user_id=current_user.user_id, username=current_user.username),
            avatar=profile.avatar,
            first_name=profile.first_name,
            last_name=profile.last_name,
        ),
        thread_name=thread.thread_name,
        timestamp=thread.timestamp,
        thread_content=thread.thread_content,
        like=thread.like,
    )

# Define a Post route for post
@router.post("/threads/{thread_id}/posts", response_model=PostPublic)
async def create_post(
        session: SessionDep,
        thread_id: Annotated[int, Path(title = "id of thread")],
        post_create_request: PostCreateRequest,
        current_user: Annotated[User, Depends(get_current_user)]
) -> PostPublic:
    thread = session.exec(select(Thread).where(Thread.thread_id == thread_id)).first()
    original_post = None
    if post_create_request.original_post_id is not None:
        original_post = session.exec(select(Post).where(Post.post_id == post_create_request.original_post_id)).first()
    post = Post(
        post_content=post_create_request.post_content,
        profile=current_user.profile,
        thread=thread,
        timestamp=datetime.now(),
        original_post=original_post
    )
    session.add(post)
    session.commit()
    session.refresh(post)
    
    profile_public = ProfilePublic(user=UserPublic(user_id=current_user.user_id, username=current_user.username),
                                   avatar=current_user.profile.avatar,
                                   first_name=current_user.profile.first_name,
                                   last_name=current_user.profile.last_name)
    return PostPublic(
        post_id=post.post_id,
        profile=profile_public,
        post_content=post.post_content,
        timestamp=post.timestamp,
        like=post.like,
        original_post=None
    )