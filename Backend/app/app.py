from fastapi import FastAPI
from app.routes.etl_routes import router as etl_router
from app.database import engine, Base

# Crée les tables si elles n'existent pas
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(etl_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Backend OpenSound SID"}
