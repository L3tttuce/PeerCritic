import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

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

# CORS configuration
origins = ["http://localhost:3000", "http://169.254.244.127:3000"]


# Configure logging
logging.basicConfig(
    filename="app.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Define logging middleware
class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Log request details
        client_ip = request.client.host
        method = request.method
        url = request.url.path

        logger.info(f"Request: {method} {url} from {client_ip}")

        # Process the request
        response = await call_next(request)

        # Log response details
        status_code = response.status_code
        logger.info(f"Response: {method} {url} returned {status_code} to {client_ip}")

        return response



# Create FastAPI application instance
app = FastAPI(lifespan=lifespan)

@app.middleware("http")
async def log_request_time(request: Request, call_next):
    start_time = time.time()

    response = await call_next(request)

    process_time = time.time() - start_time
    print(f"{request.method} {request.url.path} took {process_time:.4f}s")

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
