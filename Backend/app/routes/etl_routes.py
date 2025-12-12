from fastapi import APIRouter, HTTPException
from app.services.etl_service import run_etl

router = APIRouter()

@router.get("/etl/{genre}")
async def trigger_etl(genre: str):
    try:
        result = run_etl(genre)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
