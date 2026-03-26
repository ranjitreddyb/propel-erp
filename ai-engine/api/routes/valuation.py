from fastapi import APIRouter, Depends
from utils.database import get_db
router = APIRouter()
@router.get("/{company_id}")
async def handler(company_id: str, db=Depends(get_db)):
    return {"company_id": company_id, "module": "valuation", "status": "ok"}
