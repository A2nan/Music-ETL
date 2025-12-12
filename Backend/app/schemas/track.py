from pydantic import BaseModel
from typing import Optional

class TrackBase(BaseModel):
    title: str
    artist: str
    artist_id: str
    album: str
    duration: int
    popularity: int
    explicit: bool
    release_year: Optional[int] = None
    decade: Optional[int] = None
    genre: str

class TrackCreate(TrackBase):
    deezer_id: Optional[str] = None

class Track(TrackBase):
    id: int          # 👈 clé technique SID
    deezer_id: Optional[str] = None

    class Config:
        orm_mode = True
