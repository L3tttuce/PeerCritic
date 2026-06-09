from model.Director import Director, DirectorCardPublic
from router._list import build_list_router

router = build_list_router(Director, DirectorCardPublic, "/directors", lambda: Director.director_id)
