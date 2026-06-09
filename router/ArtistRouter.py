from model.Artist import Artist, ArtistCardPublic
from router._list import build_list_router

router = build_list_router(Artist, ArtistCardPublic, "/artists", lambda: Artist.artist_id)
