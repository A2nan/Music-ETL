from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # ✅ IMPORT MANQUANT
from app.routes.etl_routes import router as etl_router
from app.database import engine, Base

# Crée les tables si elles n'existent pas
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(etl_router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite
    ],
    allow_credentials=True,
    allow_methods=["*"],        # GET, POST, etc.
    allow_headers=["*"],        # Content-Type, Authorization, etc.
)

@app.get("/")
def read_root():
    return {"message": "Backend OpenSound SID"}
