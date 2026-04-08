"""
/api/analyze — Core deepfake & NCEI analysis endpoints
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from pydantic import BaseModel, HttpUrl
from typing import Optional
import hashlib, uuid, time, os, logging, json
import anthropic
import groq

from db import get_db, save_analysis
from services.detection import run_detection
from services.metadata import extract_metadata
from services.enrichment import enrich_threat
from telemetry import log_event

router = APIRouter()
logger = logging.getLogger("sentinel.analyze")

def get_anthropic_client():
    return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def get_groq_client():
    return groq.Groq(api_key=os.getenv("GROQ_API_KEY"))

# Available AI models for taxonomy classification
AI_MODELS = {
    "claude": {
        "name": "Claude (Anthropic)",
        "model_id": "claude-sonnet-4-20250514",
        "provider": "anthropic",
    },
    "llama": {
        "name": "Llama 3 (Groq)",
        "model_id": "llama-3.3-70b-versatile",
        "provider": "groq",
    },
}

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
    ai_model: Optional[str] = "claude"     # claude | llama


class TaxonomyResult(BaseModel):
    entity: str               # AI | Human | Other
    intent: str               # Intentional | Unintentional | Other
    timing: str               # Pre-deployment | Post-deployment | Other
    confidence: float         # 0-1
    rationale: str
    model_used: str = ""      # which AI model performed the classification


class AnalysisResult(BaseModel):
    analysis_id: str
    verdict: str                  # authentic | deepfake | suspected_deepfake | inconclusive
    confidence: float
    threat_level: str             # low | medium | high | critical
    metadata: dict
    enrichment: dict
    narrative: str
    processing_time_ms: int
    taxonomy: TaxonomyResult


@router.post("/file", response_model=AnalysisResult)
async def analyze_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    context: Optional[str] = None,
    ai_model: Optional[str] = "claude",
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

    # Generate analyst narrative and taxonomy classification
    narrative = await generate_narrative(detection, metadata, enrichment, context, ai_model)
    taxonomy = await classify_taxonomy(detection, metadata, enrichment, context, ai_model)

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
        taxonomy=taxonomy,
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

    narrative = await generate_narrative(detection, metadata, enrichment, req.context, req.ai_model)
    taxonomy = await classify_taxonomy(detection, metadata, enrichment, req.context, req.ai_model)
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
        taxonomy=taxonomy,
    )

    background_tasks.add_task(save_analysis, result.dict(), None)
    return result


@router.get("/models")
async def list_models():
    """List available AI models for taxonomy classification."""
    models = []
    for key, info in AI_MODELS.items():
        available = False
        if info["provider"] == "anthropic":
            available = bool(os.getenv("ANTHROPIC_API_KEY"))
        elif info["provider"] == "groq":
            available = bool(os.getenv("GROQ_API_KEY"))
        models.append({"id": key, "name": info["name"], "provider": info["provider"], "available": available})
    return {"models": models}


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


TAXONOMY_SYSTEM_PROMPT = """You are a threat intelligence analyst classifying AI safety incidents using the MIT AI Risk Repository's Causal Taxonomy.

Classify the incident along exactly 3 dimensions:

1. ENTITY — Who/what is the primary causal agent of the risk?
   - "AI": The risk arises primarily from an AI system's decision or action
   - "Human": The risk arises primarily from a human decision or action involving AI
   - "Other": The causal agent is ambiguous or involves both equally

2. INTENT — Was the outcome intended by the causal agent?
   - "Intentional": The harmful outcome was an expected result of pursuing a goal (e.g., adversarial attack, deliberate misuse)
   - "Unintentional": The harmful outcome was unexpected or a side effect (e.g., bias, hallucination, unintended capability)
   - "Other": Intent is unspecified or unclear from the available information

3. TIMING — When does the risk manifest relative to the AI system's lifecycle?
   - "Pre-deployment": Before the AI system is deployed (e.g., training data poisoning, development flaws)
   - "Post-deployment": After the AI model is trained and deployed (e.g., prompt injection, runtime exploit)
   - "Other": Timing is unspecified or spans both phases

Respond with ONLY valid JSON:
{"entity": "AI"|"Human"|"Other", "intent": "Intentional"|"Unintentional"|"Other", "timing": "Pre-deployment"|"Post-deployment"|"Other", "confidence": <0-1>, "rationale": "<1-2 sentences>"}"""

VALID_ENTITY = {"AI", "Human", "Other"}
VALID_INTENT = {"Intentional", "Unintentional", "Other"}
VALID_TIMING = {"Pre-deployment", "Post-deployment", "Other"}

FALLBACK_TAXONOMY = TaxonomyResult(
    entity="Other", intent="Other", timing="Other",
    confidence=0.0, rationale="Automatic classification unavailable.",
    model_used="none",
)


def _call_claude(system_prompt: str, user_message: str, max_tokens: int = 256) -> str:
    """Call Claude API and return text response."""
    response = get_anthropic_client().messages.create(
        model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),
        max_tokens=max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}]
    )
    return response.content[0].text


def _call_groq(system_prompt: str, user_message: str, max_tokens: int = 256) -> str:
    """Call Groq (Llama) API and return text response."""
    response = get_groq_client().chat.completions.create(
        model=AI_MODELS["llama"]["model_id"],
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ]
    )
    return response.choices[0].message.content


def _call_llm(provider: str, system_prompt: str, user_message: str, max_tokens: int = 256) -> str:
    """Route to the correct LLM provider."""
    if provider == "groq":
        return _call_groq(system_prompt, user_message, max_tokens)
    else:
        return _call_claude(system_prompt, user_message, max_tokens)


async def classify_taxonomy(detection: dict, metadata: dict, enrichment: dict, context: str = None, ai_model: str = "claude") -> TaxonomyResult:
    """Classify incident using MIT Causal Taxonomy via the selected AI model."""
    model_info = AI_MODELS.get(ai_model, AI_MODELS["claude"])
    provider = model_info["provider"]
    model_name = model_info["name"]

    user_message = f"""Classify this deepfake/synthetic media incident:

Detection: Verdict={detection.get('verdict')}, Confidence={detection.get('confidence')}, Threat Level={detection.get('threat_level')}
Metadata: {metadata}
Enrichment: {enrichment}
Context: {context or 'None provided'}"""

    try:
        text = _call_llm(provider, TAXONOMY_SYSTEM_PROMPT, user_message)
        parsed = json.loads(text)

        if (parsed.get("entity") not in VALID_ENTITY or
            parsed.get("intent") not in VALID_INTENT or
            parsed.get("timing") not in VALID_TIMING):
            raise ValueError("Invalid taxonomy values")

        return TaxonomyResult(
            entity=parsed["entity"],
            intent=parsed["intent"],
            timing=parsed["timing"],
            confidence=max(0.0, min(1.0, float(parsed.get("confidence", 0.5)))),
            rationale=str(parsed.get("rationale", "")),
            model_used=model_name,
        )
    except Exception as e:
        logger.warning(f"Taxonomy classification failed ({model_name}): {e}")
        return FALLBACK_TAXONOMY


async def generate_narrative(detection: dict, metadata: dict, enrichment: dict, context: str = None, ai_model: str = "claude") -> str:
    """Generate a structured analyst narrative using the selected AI model."""
    system_prompt = load_system_prompt()
    model_info = AI_MODELS.get(ai_model, AI_MODELS["claude"])
    provider = model_info["provider"]

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
        return _call_llm(provider, system_prompt, user_message, max_tokens=512)
    except Exception as e:
        logger.warning(f"Narrative generation failed: {e}")
        return f"Detection complete. Verdict: {detection.get('verdict')} with {detection.get('confidence', 0)*100:.0f}% confidence. Manual review recommended."
