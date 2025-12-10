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
    pass

class Track(TrackBase):
    id: str

    class Config:
        orm_mode = True
