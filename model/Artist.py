from typing import TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

from model.BaseTable import BaseTable

# Condition to break circular import
if TYPE_CHECKING:
    from model.Song import Song
    
from model.links import SongArtist

# Create Artist database table
class Artist(BaseTable, table=True):
    artist_id: int | None = Field(default=None, primary_key=True)   # Create id
    artist_name: str = Field(index=True)
    
    # Create many-to-many relationship between Artist and Song
    songs: list["Song"] = Relationship(back_populates="artists", link_model=SongArtist)

# Create Data Transfer Object (DTO) for showing Artist information public
class ArtistCardPublic(BaseTable):
    artist_id: int | None
    artist_name: str
