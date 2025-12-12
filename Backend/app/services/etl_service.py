import requests
from app.models.track import Track
from app.schemas.track import TrackCreate
from app.database import SessionLocal

def extract_from_deezer(genre: str, limit: int = 50):
    """Extraction des données depuis l'API Deezer."""
    url = f"https://api.deezer.com/search?q={genre}&limit={limit}"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception("Erreur lors de la récupération des données depuis Deezer.")
    return response.json().get("data", [])

def transform_data(raw_tracks: list) -> list[TrackCreate]:
    """Transformation des données brutes en objets TrackCreate."""
    transformed_tracks = []
    for track in raw_tracks:
        release_year = None
        decade = None
        if track.get("album") and track["album"].get("release_date"):
            release_year = int(track["album"]["release_date"][:4])
            decade = (release_year // 10) * 10

        transformed_track = TrackCreate(
            title=track["title"],
            artist=track["artist"]["name"],
            artist_id=str(track["artist"]["id"]),
            album=track["album"]["title"],
            duration=track["duration"],
            popularity=track.get("rank", 0),
            explicit=track["explicit_lyrics"],
            release_year=release_year,
            decade=decade,
            genre="pop",  # À adapter selon la requête
        )
        transformed_tracks.append(transformed_track)
    return transformed_tracks

def load_to_database(tracks: list[TrackCreate]):
    """Chargement des données transformées dans la base de données."""
    db = SessionLocal()
    try:
        for track_data in tracks:
            # Vérifie si la piste existe déjà
            existing_track = db.query(Track).filter(Track.deezer_id == track_data.artist_id + track_data.title).first()
            if not existing_track:
                track = Track(**track_data.dict())
                db.add(track)
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def run_etl(genre: str):
    """Exécute le pipeline ETL complet."""
    raw_tracks = extract_from_deezer(genre)
    transformed_tracks = transform_data(raw_tracks)
    load_to_database(transformed_tracks)
    return transformed_tracks
