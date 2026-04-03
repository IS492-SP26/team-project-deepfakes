"""
/api/reports — Retrieve, list, and export analysis reports
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import json
from db import get_db

router = APIRouter()


@router.get("/")
async def list_reports(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    verdict: Optional[str] = None,
    threat_level: Optional[str] = None,
):
    """List all analysis reports with optional filtering."""
    db = get_db()
    query = "SELECT analysis_id, verdict, confidence, threat_level, created_at FROM analyses WHERE 1=1"
    params = []

    if verdict:
        query += " AND verdict = ?"
        params.append(verdict)
    if threat_level:
        query += " AND threat_level = ?"
        params.append(threat_level)

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = db.execute(query, params).fetchall()
    total = db.execute("SELECT COUNT(*) FROM analyses").fetchone()[0]

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "reports": [dict(r) for r in rows],
    }


@router.get("/stats")
async def get_stats():
    """Dashboard statistics."""
    db = get_db()
    stats = {}

    for verdict in ["deepfake", "suspected_deepfake", "inconclusive", "authentic"]:
        count = db.execute("SELECT COUNT(*) FROM analyses WHERE verdict = ?", (verdict,)).fetchone()[0]
        stats[verdict] = count

    stats["total"] = sum(stats.values())

    threat_counts = {}
    for level in ["critical", "high", "medium", "low"]:
        threat_counts[level] = db.execute(
            "SELECT COUNT(*) FROM analyses WHERE threat_level = ?", (level,)
        ).fetchone()[0]

    return {"verdict_counts": stats, "threat_level_counts": threat_counts}


@router.get("/{analysis_id}/export")
async def export_report(analysis_id: str, format: str = "json"):
    """Export a full analysis report."""
    db = get_db()
    row = db.execute("SELECT * FROM analyses WHERE analysis_id = ?", (analysis_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Analysis not found")

    report = dict(row)
    report["metadata"] = json.loads(report.get("metadata") or "{}")
    report["enrichment"] = json.loads(report.get("enrichment") or "{}")

    if format == "json":
        return report

    raise HTTPException(400, "Only JSON export supported currently")
