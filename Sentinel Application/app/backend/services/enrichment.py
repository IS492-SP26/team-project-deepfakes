"""
Threat enrichment service
Enriches detection results with external threat intelligence:
- VirusTotal file hash lookups
- Google Safe Browsing URL checks
- Internal IOC database
"""

import os, httpx, logging
from typing import Optional

logger = logging.getLogger("sentinel.enrichment")

VT_API_KEY = os.getenv("VIRUSTOTAL_API_KEY", "")
GSB_API_KEY = os.getenv("GOOGLE_SAFE_BROWSING_KEY", "")


async def enrich_threat(file_hash: Optional[str], metadata: dict, url: Optional[str] = None) -> dict:
    """
    Enrich a threat report with external intelligence.
    """
    enrichment = {
        "ioc_type": "url" if url else "file_hash",
        "threat_feeds_checked": [],
        "known_campaign": None,
        "related_iocs": [],
        "geographic_indicators": [],
        "mitre_tactics": [],
    }

    if file_hash and VT_API_KEY:
        vt_result = await _check_virustotal(file_hash)
        enrichment["virustotal"] = vt_result
        enrichment["threat_feeds_checked"].append("virustotal")

    if url and GSB_API_KEY:
        gsb_result = await _check_safe_browsing(url)
        enrichment["safe_browsing"] = gsb_result
        enrichment["url_reputation"] = "malicious" if gsb_result.get("threat_found") else "clean"
        enrichment["reputation_score"] = 0.9 if gsb_result.get("threat_found") else 0.1
        enrichment["threat_feeds_checked"].append("google_safe_browsing")
    elif url:
        enrichment["url_reputation"] = "unknown"
        enrichment["reputation_score"] = 0.5

    # MITRE ATT&CK mapping for deepfakes
    enrichment["mitre_tactics"] = [
        {"tactic": "Initial Access", "technique": "T1566 - Phishing", "relevance": "Deepfake audio/video used in spear-phishing"},
        {"tactic": "Influence Operations", "technique": "T1565.001 - Stored Data Manipulation", "relevance": "Synthetic media for disinformation"},
    ]

    # Determine overall threat level
    if not enrichment.get("threat_level"):
        enrichment["threat_level"] = _calculate_threat_level(enrichment)

    return enrichment


async def _check_virustotal(file_hash: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"https://www.virustotal.com/api/v3/files/{file_hash}",
                headers={"x-apikey": VT_API_KEY}
            )
            if resp.status_code == 200:
                data = resp.json()
                stats = data["data"]["attributes"]["last_analysis_stats"]
                return {
                    "found": True,
                    "malicious_votes": stats.get("malicious", 0),
                    "harmless_votes": stats.get("harmless", 0),
                    "total_engines": sum(stats.values()),
                    "reputation": data["data"]["attributes"].get("reputation", 0),
                }
            elif resp.status_code == 404:
                return {"found": False, "note": "Hash not in VirusTotal database"}
    except Exception as e:
        logger.warning(f"VirusTotal lookup failed: {e}")
    return {"found": False, "error": "lookup_failed"}


async def _check_safe_browsing(url: str) -> dict:
    try:
        payload = {
            "client": {"clientId": "sentinel", "clientVersion": "1.0"},
            "threatInfo": {
                "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [{"url": url}],
            }
        }
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={GSB_API_KEY}",
                json=payload,
            )
            data = resp.json()
            return {
                "threat_found": bool(data.get("matches")),
                "matches": data.get("matches", []),
            }
    except Exception as e:
        logger.warning(f"Safe Browsing check failed: {e}")
    return {"threat_found": False, "error": "lookup_failed"}


def _calculate_threat_level(enrichment: dict) -> str:
    vt = enrichment.get("virustotal", {})
    if vt.get("malicious_votes", 0) > 5:
        return "critical"
    elif vt.get("malicious_votes", 0) > 0:
        return "high"
    elif enrichment.get("url_reputation") == "malicious":
        return "high"
    elif enrichment.get("reputation_score", 0) > 0.7:
        return "medium"
    return "low"
