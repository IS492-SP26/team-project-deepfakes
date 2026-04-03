"""
/api/analyze — Core deepfake & NCEI analysis endpoints
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from pydantic import BaseModel, HttpUrl
from typing import Optional
import hashlib, uuid, time, os, logging
import anthropic

from db import get_db, save_analysis
from services.detection import run_detection
from services.metadata import extract_metadata
from services.enrichment import enrich_threat
from telemetry import log_event

router = APIRouter()
logger = logging.getLogger("sentinel.analyze")

ANTHROPIC_CLIENT = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
SYSTEM_PROMPT_PATH = os.path.join(os.path.dirname(__file__), "../../prompts/analyst.txt")

def load_system_prompt():
    try:
        with open(SYSTEM_PROMPT_PATH) as f:
            return f.read()
    except FileNotFoundError:
        return "You are Sentinel, a deepfake threat intelligence analyst. Provide structured, factual threat metadata."


class URLAnalysisRequest(BaseModel):
    url: str
    context: Optional[str] = None
    reporter_type: Optional[str] = "user"  # user | automated | partner


class AnalysisResult(BaseModel):
    analysis_id: str
    verdict: str                  # authentic | deepfake | suspected_deepfake | inconclusive
    confidence: float
    threat_level: str             # low | medium | high | critical
    metadata: dict
    enrichment: dict
    narrative: str
    processing_time_ms: int


@router.post("/file", response_model=AnalysisResult)
async def analyze_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    context: Optional[str] = None
):
    """
    Upload a media file for deepfake analysis.
    Returns structured threat metadata.
    """
    # Validate file
    max_mb = int(os.getenv("MAX_FILE_SIZE_MB", 50))
    contents = await file.read()
    if len(contents) > max_mb * 1024 * 1024:
        raise HTTPException(413, f"File too large. Max {max_mb}MB.")

    allowed_types = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "audio/mpeg", "audio/wav"]
    if file.content_type not in allowed_types:
        raise HTTPException(415, f"Unsupported file type: {file.content_type}")

    start = time.time()
    analysis_id = str(uuid.uuid4())

    # Hash for deduplication (no PII stored)
    file_hash = hashlib.sha256(contents).hexdigest()

    log_event("analysis_started", {
        "analysis_id": analysis_id,
        "type": "file",
        "file_type": file.content_type,
        "file_hash": file_hash,
        "size_bytes": len(contents),
    })

    # Run detection pipeline
    detection = await run_detection(contents, file.content_type, file_hash)
    metadata = await extract_metadata(contents, file.content_type)
    enrichment = await enrich_threat(file_hash, metadata)

    # Generate analyst narrative via Claude
    narrative = await generate_narrative(detection, metadata, enrichment, context)

    processing_time = round((time.time() - start) * 1000)

    result = AnalysisResult(
        analysis_id=analysis_id,
        verdict=detection["verdict"],
        confidence=detection["confidence"],
        threat_level=detection["threat_level"],
        metadata=metadata,
        enrichment=enrichment,
        narrative=narrative,
        processing_time_ms=processing_time,
    )

    # Persist asynchronously
    background_tasks.add_task(save_analysis, result.dict(), file_hash)

    log_event("analysis_complete", {
        "analysis_id": analysis_id,
        "verdict": detection["verdict"],
        "confidence": detection["confidence"],
        "processing_time_ms": processing_time,
    })

    return result


@router.post("/url", response_model=AnalysisResult)
async def analyze_url(req: URLAnalysisRequest, background_tasks: BackgroundTasks):
    """
    Submit a URL for deepfake content analysis.
    """
    start = time.time()
    analysis_id = str(uuid.uuid4())

    log_event("analysis_started", {
        "analysis_id": analysis_id,
        "type": "url",
        "reporter_type": req.reporter_type,
    })

    # URL-based metadata & enrichment
    metadata = {"source_url": req.url, "submitted_context": req.context}
    enrichment = await enrich_threat(None, metadata, url=req.url)

    detection = {
        "verdict": "suspected_deepfake" if enrichment.get("url_reputation") == "malicious" else "inconclusive",
        "confidence": enrichment.get("reputation_score", 0.5),
        "threat_level": enrichment.get("threat_level", "medium"),
    }

    narrative = await generate_narrative(detection, metadata, enrichment, req.context)
    processing_time = round((time.time() - start) * 1000)

    result = AnalysisResult(
        analysis_id=analysis_id,
        verdict=detection["verdict"],
        confidence=detection["confidence"],
        threat_level=detection["threat_level"],
        metadata=metadata,
        enrichment=enrichment,
        narrative=narrative,
        processing_time_ms=processing_time,
    )

    background_tasks.add_task(save_analysis, result.dict(), None)
    return result


@router.get("/{analysis_id}")
async def get_analysis(analysis_id: str):
    """Retrieve a previously run analysis by ID."""
    db = get_db()
    record = db.execute(
        "SELECT * FROM analyses WHERE analysis_id = ?", (analysis_id,)
    ).fetchone()
    if not record:
        raise HTTPException(404, "Analysis not found")
    return dict(record)


async def generate_narrative(detection: dict, metadata: dict, enrichment: dict, context: str = None) -> str:
    """Use Claude to generate a structured analyst narrative."""
    system_prompt = load_system_prompt()

    user_message = f"""
Analyze the following deepfake detection results and produce a concise threat intelligence narrative.

Detection Results:
- Verdict: {detection.get('verdict')}
- Confidence: {detection.get('confidence')}
- Threat Level: {detection.get('threat_level')}

Technical Metadata:
{metadata}

Enrichment Data:
{enrichment}

Additional Context: {context or 'None provided'}

Respond with a 2-3 sentence structured analyst summary. Include: (1) what was detected, (2) key technical indicators, (3) recommended action.
"""

    try:
        response = ANTHROPIC_CLIENT.messages.create(
            model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),
            max_tokens=512,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}]
        )
        return response.content[0].text
    except Exception as e:
        logger.warning(f"Narrative generation failed: {e}")
        return f"Detection complete. Verdict: {detection.get('verdict')} with {detection.get('confidence', 0)*100:.0f}% confidence. Manual review recommended."
