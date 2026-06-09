def canonical_pair(a: int, b: int) -> tuple[int, int]:
    return (a, b) if a < b else (b, a)
