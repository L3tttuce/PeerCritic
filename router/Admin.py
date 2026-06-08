# Create admin
import os

from dotenv import load_dotenv
from starlette.middleware import Middleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette_admin.auth import AuthProvider, AdminConfig, AdminUser
from starlette_admin.contrib.sqlmodel import Admin, ModelView
from starlette_admin.exceptions import FormValidationError, LoginFailed

from model.Actor import Actor
from model.Artist import Artist
from model.Director import Director
from model.Episode import Episode
from model.Genre import Genre
from model.Movie import Movie
from model.Post import Post
from model.Profile import Profile
from model.Review import Review
from model.Song import Song
from model.Thread import Thread
from model.TVShow import TVShow
from model.TVShowActor import TVShowActor
from model.TVShowDirector import TVShowDirector
from model.TVShowGenre import TVShowGenre
from model.TVShowWriter import TVShowWriter
from model.User import User
from model.Writer import Writer
from model.database import engine

# Load environment variables from the .env file into the process environment
load_dotenv()
# Get the secret key used to sign and encrypt session cookies
SECRET_KEY = os.getenv("SECRET_KEY")
# Get the admin password used to authenticate admin users at login
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

# Define a dictionary of valid admin users and their associated roles
users = {
    "admin": {
        "name": "Admin",
        "roles": ["read", "create", "edit", "delete", "action_make_published"],
    },
    "viewer": {"name": "Viewer", "avatar": "guest.png", "roles": ["read"]},
}


# Define a authentication provider
class UsernameAndPasswordProvider(AuthProvider):
    """
    This is only for demo purpose, it's not a better
    way to save and validate user credentials
    """
    # Define the async login method called when a user submits the login form
    async def login(
            self,
            username: str,
            password: str,
            remember_me: bool,
            request: Request,
            response: Response,
    ) -> Response:
        if len(username) < 3:
            """Form data validation"""
            # Raise a form validation error if the username is shorter than 3 characters
            raise FormValidationError(
                {"username": "Ensure username has at least 03 characters"}
            )

        if username in users and password == ADMIN_PASSWORD:
            """Save `username` in session"""
            # If credentials are valid, store the username in the session to persist login state
            request.session.update({"username": username})
            # Return the response to complete the login flow
            return response
        # If credentials don't match, raise a loginfailed exception with an error message
        raise LoginFailed("Invalid username or password")
    
    # The async function checks if the current request is from an authentication user
    async def is_authenticated(self, request) -> bool:
        if request.session.get("username", None) in users:
            """
            Save current `user` object in the request state. Can be used later
            to restrict access to connected user.
            """
            request.state.user = users.get(request.session["username"])
            return True

        return False
    
    # The function returns a customized admin panel configuration for the current user
    def get_admin_config(self, request: Request) -> AdminConfig:
        user = request.state.user  # Retrieve current user
        # Update app title according to current_user
        custom_app_title = "Hello, " + user["name"] + "!"
        return AdminConfig(
            app_title=custom_app_title,
        )
    
    # The function returns an AdminUser object representing the login user
    def get_admin_user(self, request: Request) -> AdminUser:
        user = request.state.user  # Retrieve current user
        return AdminUser(username=user["name"])

    # The async logout function clear the session and log the user out  
    async def logout(self, request: Request, response: Response) -> Response:
        request.session.clear()
        return response

# Create Admin dashboard setting with the database engine and configuration options
admin = Admin(engine,                   # The database engine used to query and manage model data
              title="PeerCritic",       # The title displayed in the admin panel header
              base_url="/admin",        # The custom authentication provider defined above
              auth_provider=UsernameAndPasswordProvider(),
              middlewares=[Middleware(SessionMiddleware, secret_key=SECRET_KEY)], # Apply session middleware with the secret key for cookie signing
              )

# Add view for each table
# Register the User model in the admin dashboard
admin.add_view(ModelView(User))
# Register the Profile model in the admin dashboard
admin.add_view(ModelView(Profile))
# Register the Artist model in the admin dashboard
admin.add_view(ModelView(Artist))
# Register the Song model in the admin dashboard
admin.add_view(ModelView(Song))
# Register the Director model in the admin dashboard
admin.add_view(ModelView(Director))
# Register the Writer model in the admin dashboard
admin.add_view(ModelView(Writer))
# Register the Actor model in the admin dashboard
admin.add_view(ModelView(Actor))
# Register the Genre model in the admin dashboard
admin.add_view(ModelView(Genre))
# Register the Episode model in the admin dashboard
admin.add_view(ModelView(Episode))
# Register the Movie model in the admin dashboard
admin.add_view(ModelView(Movie))
# Register the TVShow model in the admin dashboard
admin.add_view(ModelView(TVShow))
admin.add_view(ModelView(TVShowActor))
admin.add_view(ModelView(TVShowDirector))
admin.add_view(ModelView(TVShowWriter))
admin.add_view(ModelView(TVShowGenre))
# Register the Review model in the admin dashboard
admin.add_view(ModelView(Review))
# Register the Thread model in the admin dashboard
admin.add_view(ModelView(Thread))
# Register the Post model in the admin dashboard
admin.add_view(ModelView(Post))



