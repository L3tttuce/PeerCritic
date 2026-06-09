import logging
import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from model.database import create_db_and_tables
from router import (
    Authentication,
    MovieRouter,
    TVShowRouter,
    ReviewsRouter,
    SongRouter,
    ArtistRouter,
    WriterRouter,
    ActorRouter,
    DirectorRouter,
    GenreRouter,
    FriendsRouter,
    UsersRouter,
    MessagesRouter,
    WsMessagesRouter, ThreadRouter,
)
from router.Admin import admin


# Application lifespan manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()      # Creates all SQLModel tables if they don't exist
    yield

# CORS configuration (comma-separated origins via env, localhost fallback for dev)
_cors_env = os.getenv("CORS_ORIGINS", "http://localhost:3000")
origins = [o.strip() for o in _cors_env.split(",") if o.strip()]


# Create FastAPI application instance
app = FastAPI(lifespan=lifespan)


@app.get("/health")
def health():
    return {"status": "ok"}

if os.getenv("DEBUG_TIMING"):
    @app.middleware("http")
    async def log_request_time(request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        logging.getLogger(__name__).debug(
            "%s %s took %.4fs", request.method, request.url.path, process_time
        )
        return response


# Add CORS Middleware
app.add_middleware(
    CORSMiddleware, 
    allow_origins=origins, 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"],)

# Mount admin to your app
admin.mount_to(app)

# Register Authentication routes 
app.include_router(Authentication.router)

# Register Movie routes
app.include_router(MovieRouter.router)

# Register TV Show routes
app.include_router(TVShowRouter.router)

# Register Song routes
app.include_router(SongRouter.router)

# Register Review routes
app.include_router(ReviewsRouter.router)

# Register Friends routes
app.include_router(FriendsRouter.router)

# Register Messages routes
app.include_router(MessagesRouter.router)

# Register Messages websocket router
app.include_router(WsMessagesRouter.router)

# Register Director routes
app.include_router(DirectorRouter.router)

# Register Genre routes
app.include_router(GenreRouter.router)

# Register Writer routes
app.include_router(WriterRouter.router)

# Register Actor routes
app.include_router(ActorRouter.router)

# Register Artist routes
app.include_router(ArtistRouter.router)

# Register Users routes
app.include_router(UsersRouter.router)

# Register Thread routes
app.include_router(ThreadRouter.router)
