from model.Profile import Profile
from model.User import User


def user_card(user: User, profile: Profile | None = None) -> dict:
    p = profile if profile is not None else user.profile
    return {
        "userId": user.user_id,
        "username": user.username,
        "firstName": (p.first_name if p else ""),
        "lastName": (p.last_name if p else ""),
        "avatar": (p.avatar if p else None),
    }
