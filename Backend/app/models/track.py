from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.database import Base

class Track(Base):
    __tablename__ = "tracks"

    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    artist = Column(String)
    artist_id = Column(String)
    album = Column(String)
    duration = Column(Integer)
    popularity = Column(Integer)
    explicit = Column(Boolean)
    release_year = Column(Integer)
    decade = Column(Integer)
    genre = Column(String)
    created_at = Column(DateTime, server_default="now()")
    updated_at = Column(DateTime, onupdate="now()")
