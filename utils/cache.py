import time
from typing import Any, Callable, Hashable


class TTLCache:
    def __init__(self, ttl_seconds: float = 300, max_size: int = 256):
        self._ttl = ttl_seconds
        self._max_size = max_size
        self._store: dict[Hashable, tuple[float, Any]] = {}

    def get(self, key: Hashable) -> Any | None:
        entry = self._store.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if time.monotonic() > expires_at:
            del self._store[key]
            return None
        return value

    def set(self, key: Hashable, value: Any) -> None:
        if len(self._store) >= self._max_size:
            oldest_key = min(self._store, key=lambda k: self._store[k][0])
            del self._store[oldest_key]
        self._store[key] = (time.monotonic() + self._ttl, value)

    def invalidate(self, key: Hashable | None = None) -> None:
        if key is None:
            self._store.clear()
        elif key in self._store:
            del self._store[key]

    def get_or_set(self, key: Hashable, factory: Callable[[], Any]) -> Any:
        cached = self.get(key)
        if cached is not None:
            return cached
        value = factory()
        self.set(key, value)
        return value


genre_list_cache = TTLCache(ttl_seconds=600)
friend_ids_cache = TTLCache(ttl_seconds=120)
similar_media_cache = TTLCache(ttl_seconds=60)
