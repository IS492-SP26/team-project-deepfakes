"""
Detection service — wraps deepfake detection API calls
Supports: Hive Moderation API (primary), local fallback scoring
"""

import os, httpx, logging, hashlib, base64
from typing import Optional

logger = logging.getLogger("sentinel.detection")


def _get_detection_api_url() -> str:
    return os.getenv("DETECTION_API_URL", "https://api.thehive.ai/api/v2/task/sync")


def _get_detection_api_key() -> str:
    return os.getenv("DETECTION_API_KEY", "")


def _get_confidence_threshold() -> float:
    return float(os.getenv("DETECTION_CONFIDENCE_THRESHOLD", 0.75))


async def run_detection(content: bytes, content_type: str, file_hash: str) -> dict:
    """
    Run deepfake detection on raw file bytes.
    Returns: verdict, confidence score, threat level, raw_scores
    """
    detection_api_key = _get_detection_api_key()
    if not detection_api_key:
        logger.warning("No DETECTION_API_KEY set — using heuristic fallback")
        return _heuristic_fallback(content, file_hash)

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            detection_api_url = _get_detection_api_url()
            if "/api/v3/" in detection_api_url:
                encoded_media = base64.b64encode(content).decode("ascii")
                payload = {
                    "media_metadata": True,
                    "input": [
                        {
                            "media_base64": f"data:{content_type};base64,{encoded_media}",
                        }
                    ],
                }
                headers = {
                    "Authorization": f"Bearer {detection_api_key}",
                    "Content-Type": "application/json",
                }
                resp = await client.post(detection_api_url, json=payload, headers=headers)
            else:
                files = {"media": (file_hash, content, content_type)}
                headers = {"Authorization": f"Token {detection_api_key}"}
                resp = await client.post(detection_api_url, files=files, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return _parse_hive_response(data)
    except httpx.HTTPError as e:
        logger.error(f"Detection API error: {e}")
        return _heuristic_fallback(content, file_hash)


def _parse_hive_response(data: dict) -> dict:
    """Parse Hive Moderation API response into Sentinel format."""
    try:
        classes = _extract_hive_classes(data)
        deepfake_score = next(
            (_class_score(c) for c in classes if "deepfake" in c["class"].lower()),
            0.0,
        )
        verdict = _score_to_verdict(deepfake_score)
        return {
            "verdict": verdict,
            "confidence": round(deepfake_score, 4),
            "threat_level": _verdict_to_threat(verdict, deepfake_score),
            "raw_scores": classes,
            "source": "hive_detection_api",
        }
    except (KeyError, IndexError) as e:
        logger.error(f"Failed to parse detection response: {e}")
        return {"verdict": "inconclusive", "confidence": 0.0, "threat_level": "low", "raw_scores": [], "source": "parse_error"}


def _extract_hive_classes(data: dict) -> list[dict]:
    if "status" in data:
        return data["status"][0]["response"]["output"][0]["classes"]
    return data["output"][0]["classes"]


def _class_score(entry: dict) -> float:
    if "score" in entry:
        return float(entry["score"])
    return float(entry.get("value", 0.0))


def _heuristic_fallback(content: bytes, file_hash: str) -> dict:
    """
    Simple hash-based heuristic for demo/dev mode.
    NOT for production — replace with real model.
    """
    entropy = int(file_hash[:4], 16) / 65535
    verdict = _score_to_verdict(entropy)
    return {
        "verdict": verdict,
        "confidence": round(entropy, 4),
        "threat_level": _verdict_to_threat(verdict, entropy),
        "raw_scores": [],
        "source": "heuristic_fallback",
        "note": "Demo mode — connect DETECTION_API_KEY for real analysis",
    }


def _score_to_verdict(score: float) -> str:
    confidence_threshold = _get_confidence_threshold()
    if score >= 0.85:
        return "deepfake"
    elif score >= confidence_threshold:
        return "suspected_deepfake"
    elif score >= 0.3:
        return "inconclusive"
    return "authentic"


def _verdict_to_threat(verdict: str, score: float) -> str:
    if verdict == "deepfake" and score >= 0.9:
        return "critical"
    elif verdict == "deepfake":
        return "high"
    elif verdict == "suspected_deepfake":
        return "medium"
    return "low"
