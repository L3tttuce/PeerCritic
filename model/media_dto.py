from model.BaseTable import BaseTable


class MediaCardPublic(BaseTable):
    id: int | None
    title: str
    description: str | None = None
    year: int | None
    length: str | None
    cover: str | None
    back_drop: str | None = None
    rating: float | None
    rating_count: int | None


class MediaDetailPublic(MediaCardPublic):
    video: str | None = None
    genres: list[str] = []
    reviews: list[str] = []


class MovieDetailPublic(MediaDetailPublic):
    writers: list[str] = []
    actors: list[str] = []
    directors: list[str] = []


class TVShowDetailPublic(MovieDetailPublic):
    episode_count: int = 0
    season_count: int = 0


class SongCardPublic(MediaCardPublic):
    artists: list[str] = []


class SongDetailPublic(MediaDetailPublic):
    artists: list[str] = []
