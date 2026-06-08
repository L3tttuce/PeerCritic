import re

CANONICAL_SONG_GENRES: tuple[str, ...] = (
    "Pop",
    "Rock",
    "Metal",
    "Punk",
    "Alternative",
    "Indie",
    "Hip-Hop / Rap",
    "R&B / Soul",
    "Funk",
    "Jazz",
    "Blues",
    "Country",
    "Folk",
    "Electronic",
    "Dance",
    "House",
    "Techno",
    "Trance",
    "Dubstep",
    "Drum & Bass",
    "Ambient",
    "Classical",
    "Opera",
    "Soundtrack",
    "World",
    "Latin",
    "Reggae",
    "Ska",
    "Gospel",
    "Christian",
    "Children's",
    "Comedy",
    "Spoken Word",
)

_CANONICAL_BY_KEY = {name.lower(): name for name in CANONICAL_SONG_GENRES}

_BLOCKED_TAGS = {
    "seen live",
    "favorites",
    "favourite",
    "favorite",
    "fav",
    "spotify",
    "lastfm",
    "importado do spotify",
    "albums i own",
    "songs",
    "song",
    "music",
    "track",
    "tracks",
    "beautiful",
    "awesome",
    "love",
    "loved",
    "lovesong",
    "sad",
    "romantic",
    "guilty pleasure",
    "cover",
    "ballad",
    "acoustic",
    "oldies",
    "cult",
    "home",
    "kick",
    "batch test",
    "test tag",
    "my top songs",
    "classic tracks",
    "female vocalists",
    "male vocalists",
    "love at first listen",
    "favorite track right now",
    "pop perfection",
    "haters gonna hate",
    "i fucking love this song",
    "i want drake to murder my vagina",
    "i want to have sex with this song",
    "music to chase squirrels by",
    "best of 2014",
    "best of 2017",
    "wsum 91.7 fm madison",
    "...and justice for all is the better album",
}

_BLOCKED_PREFIXES = (
    "best of ",
)

_GENRE_ALIASES: dict[str, str] = {
    "pop": "Pop",
    "electropop": "Pop",
    "synthpop": "Pop",
    "synth pop": "Pop",
    "dance pop": "Pop",
    "dance-pop": "Pop",
    "baroque pop": "Pop",
    "chamber pop": "Pop",
    "bedroom pop": "Pop",
    "folk pop": "Pop",
    "industrial pop": "Pop",
    "dream pop": "Pop",
    "pop rock": "Pop",
    "pop rap": "Hip-Hop / Rap",
    "pop punk": "Punk",
    "teen pop": "Pop",
    "art pop": "Pop",
    "power pop": "Pop",
    "rock": "Rock",
    "classic rock": "Rock",
    "hard rock": "Rock",
    "soft rock": "Rock",
    "rock and roll": "Rock",
    "rock and roll over": "Rock",
    "glam rock": "Rock",
    "progressive rock": "Rock",
    "psychedelic rock": "Rock",
    "blues rock": "Rock",
    "folk rock": "Rock",
    "art rock": "Rock",
    "garage rock revival": "Rock",
    "southern rock": "Rock",
    "piano rock": "Rock",
    "yacht rock": "Rock",
    "grunge": "Rock",
    "britpop": "Rock",
    "aor": "Rock",
    "late 70s rock": "Rock",
    "arena rock": "Rock",
    "album rock": "Rock",
    "metal": "Metal",
    "heavy metal": "Metal",
    "thrash metal": "Metal",
    "progressive metal": "Metal",
    "death metal": "Metal",
    "black metal": "Metal",
    "nu metal": "Metal",
    "punk": "Punk",
    "punk rock": "Punk",
    "post punk": "Punk",
    "alternative": "Alternative",
    "alternative rock": "Alternative",
    "alt rock": "Alternative",
    "new wave": "Alternative",
    "indie": "Indie",
    "indie rock": "Indie",
    "indie pop": "Indie",
    "indie folk": "Indie",
    "indietronica": "Indie",
    "hip hop": "Hip-Hop / Rap",
    "hip-hop": "Hip-Hop / Rap",
    "rap": "Hip-Hop / Rap",
    "trap": "Hip-Hop / Rap",
    "east coast rap": "Hip-Hop / Rap",
    "west coast hip hop": "Hip-Hop / Rap",
    "gangsta rap": "Hip-Hop / Rap",
    "conscious hip hop": "Hip-Hop / Rap",
    "political hip hop": "Hip-Hop / Rap",
    "southern hip hop": "Hip-Hop / Rap",
    "jazz rap": "Hip-Hop / Rap",
    "crunk": "Hip-Hop / Rap",
    "country rap": "Hip-Hop / Rap",
    "rnb": "R&B / Soul",
    "r&b": "R&B / Soul",
    "soul": "R&B / Soul",
    "neo soul": "R&B / Soul",
    "contemporary rnb": "R&B / Soul",
    "alternative rnb": "R&B / Soul",
    "funk": "Funk",
    "nu disco": "Funk",
    "nu-disco": "Funk",
    "jazz": "Jazz",
    "blues": "Blues",
    "country": "Country",
    "classic country": "Country",
    "modern country": "Country",
    "country pop": "Country",
    "country rock": "Country",
    "outlaw country": "Country",
    "folk": "Folk",
    "singer songwriter": "Folk",
    "singer-songwriter": "Folk",
    "christian folk": "Folk",
    "folky": "Folk",
    "electronic": "Electronic",
    "electronica": "Electronic",
    "electro": "Electronic",
    "synthwave": "Electronic",
    "french touch": "Electronic",
    "funktronica": "Electronic",
    "dance": "Dance",
    "disco": "Dance",
    "dancehall": "Reggae",
    "moombahton": "Dance",
    "house": "House",
    "electro house": "House",
    "progressive house": "House",
    "tropical house": "House",
    "deep house": "House",
    "techno": "Techno",
    "trance": "Trance",
    "dubstep": "Dubstep",
    "drum and bass": "Drum & Bass",
    "drum & bass": "Drum & Bass",
    "dnb": "Drum & Bass",
    "ambient": "Ambient",
    "classical": "Classical",
    "piano": "Classical",
    "opera": "Opera",
    "rock opera": "Opera",
    "soundtrack": "Soundtrack",
    "score": "Soundtrack",
    "film score": "Soundtrack",
    "world": "World",
    "world music": "World",
    "latin": "Latin",
    "reggaeton": "Latin",
    "latin pop": "Latin",
    "reggae": "Reggae",
    "ska": "Ska",
    "gospel": "Gospel",
    "christian": "Christian",
    "christian rock": "Christian",
    "worship": "Christian",
    "children's": "Children's",
    "childrens": "Children's",
    "kids": "Children's",
    "comedy": "Comedy",
    "spoken word": "Spoken Word",
}

_KEYWORD_RULES: tuple[tuple[str, str], ...] = (
    ("drum and bass", "Drum & Bass"),
    ("drum & bass", "Drum & Bass"),
    ("hip hop", "Hip-Hop / Rap"),
    ("hip-hop", "Hip-Hop / Rap"),
    ("spoken word", "Spoken Word"),
    ("r&b", "R&B / Soul"),
    ("soundtrack", "Soundtrack"),
    ("children", "Children's"),
    ("reggaeton", "Latin"),
    ("dubstep", "Dubstep"),
    ("techno", "Techno"),
    ("trance", "Trance"),
    ("ambient", "Ambient"),
    ("classical", "Classical"),
    ("gospel", "Gospel"),
    ("christian", "Christian"),
    ("reggae", "Reggae"),
    ("country", "Country"),
    ("alternative", "Alternative"),
    ("electronic", "Electronic"),
    ("electronica", "Electronic"),
    ("metal", "Metal"),
    ("punk", "Punk"),
    ("indie", "Indie"),
    ("funk", "Funk"),
    ("blues", "Blues"),
    ("jazz", "Jazz"),
    ("folk", "Folk"),
    ("house", "House"),
    ("dance", "Dance"),
    ("opera", "Opera"),
    ("soundtrack", "Soundtrack"),
    ("ska", "Ska"),
    ("latin", "Latin"),
    ("world", "World"),
    ("comedy", "Comedy"),
    ("soul", "R&B / Soul"),
    ("rap", "Hip-Hop / Rap"),
    ("rock", "Rock"),
    ("pop", "Pop"),
)

_DECADE_PATTERN = re.compile(r"^\d{2}s$")
_YEAR_PATTERN = re.compile(r"^\d{4}s?$")


def normalize_genre_tag(tag_name: str) -> str:
    tag = tag_name.strip().lower()
    tag = tag.replace("-", " ")
    tag = tag.replace("_", " ")
    tag = re.sub(r"\s+", " ", tag)
    return tag


def is_blocked_genre_tag(tag_name: str) -> bool:
    normalized = normalize_genre_tag(tag_name)

    if not normalized:
        return True

    if normalized in _BLOCKED_TAGS:
        return True

    if any(normalized.startswith(prefix) for prefix in _BLOCKED_PREFIXES):
        return True

    if _DECADE_PATTERN.match(normalized):
        return True

    if _YEAR_PATTERN.match(normalized):
        return True

    if normalized.isdigit():
        return True

    return False


def map_to_canonical_song_genre(tag_name: str) -> str | None:
    if is_blocked_genre_tag(tag_name):
        return None

    normalized = normalize_genre_tag(tag_name)

    if normalized in _CANONICAL_BY_KEY:
        return _CANONICAL_BY_KEY[normalized]

    if normalized in _GENRE_ALIASES:
        return _GENRE_ALIASES[normalized]

    for keyword, canonical in _KEYWORD_RULES:
        if keyword in normalized:
            return canonical

    return None


MANUAL_SONG_GENRE_OVERRIDES: dict[str, tuple[str, ...]] = {
    "Breathe": ("Pop",),
    "Empire State Of Mind": ("Hip-Hop / Rap",),
    "Friends in Low Places": ("Country",),
    "Like a Prayer": ("Pop",),
    "Take Me Home, Country Roads - Original Version": ("Country", "Folk"),
}


def manual_genres_for_song(song_name: str) -> set[str]:
    overrides = MANUAL_SONG_GENRE_OVERRIDES.get(song_name)

    if overrides:
        return set(overrides)

    return set()


def map_raw_genres_to_canonical(raw_genres: set[str] | list[str]) -> set[str]:
    canonical_genres: set[str] = set()

    for raw_genre in raw_genres:
        mapped = map_to_canonical_song_genre(raw_genre)

        if mapped:
            canonical_genres.add(mapped)

    return canonical_genres
