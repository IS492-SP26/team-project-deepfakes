"""
/api/search — Search analyses by hash, metadata, or date range
"""

from fastapi import APIRouter, Query
from typing import Optional
from db import get_db

router = APIRouter()


@router.get("/")
async def search_analyses(
    q: Optional[str] = Query(None, description="Search term (hash, verdict, narrative)"),
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
):
    db = get_db()
    query = "SELECT analysis_id, verdict, confidence, threat_level, narrative, created_at FROM analyses WHERE 1=1"
    params = []

    if q:
        query += " AND (file_hash LIKE ? OR verdict LIKE ? OR narrative LIKE ?)"
        like = f"%{q}%"
        params.extend([like, like, like])
    if from_date:
        query += " AND created_at >= ?"
        params.append(from_date)
    if to_date:
        query += " AND created_at <= ?"
        params.append(to_date)

    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)

    rows = db.execute(query, params).fetchall()
    return {"results": [dict(r) for r in rows], "count": len(rows)}
