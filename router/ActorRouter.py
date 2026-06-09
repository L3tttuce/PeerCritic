from model.Actor import Actor, ActorCardPublic
from router._list import build_list_router

router = build_list_router(Actor, ActorCardPublic, "/actors", lambda: Actor.actor_id)
