"""
Unit tests for Sentinel backend — critical paths
Run: pytest tests/ -v
"""

import pytest
import asyncio
from unittest.mock import patch, AsyncMock, MagicMock
import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../app/backend"))

from services.detection import _score_to_verdict, _verdict_to_threat, _heuristic_fallback
from services.metadata import _extract_image_meta
from services.enrichment import _calculate_threat_level


# ─── Detection Service Tests ──────────────────────────────

class TestDetectionScoring:
    def test_score_to_verdict_deepfake(self):
        assert _score_to_verdict(0.90) == "deepfake"
        assert _score_to_verdict(0.99) == "deepfake"

    def test_score_to_verdict_suspected(self):
        assert _score_to_verdict(0.80) == "suspected_deepfake"
        assert _score_to_verdict(0.75) == "suspected_deepfake"

    def test_score_to_verdict_inconclusive(self):
        assert _score_to_verdict(0.50) == "inconclusive"
        assert _score_to_verdict(0.30) == "inconclusive"

    def test_score_to_verdict_authentic(self):
        assert _score_to_verdict(0.10) == "authentic"
        assert _score_to_verdict(0.0) == "authentic"

    def test_verdict_to_threat_critical(self):
        assert _verdict_to_threat("deepfake", 0.95) == "critical"

    def test_verdict_to_threat_high(self):
        assert _verdict_to_threat("deepfake", 0.80) == "high"

    def test_verdict_to_threat_medium(self):
        assert _verdict_to_threat("suspected_deepfake", 0.80) == "medium"

    def test_verdict_to_threat_low(self):
        assert _verdict_to_threat("authentic", 0.10) == "low"

    def test_heuristic_fallback_returns_valid_structure(self):
        content = b"fake image data"
        result = _heuristic_fallback(content, "abc123deadbeef" * 4)
        assert "verdict" in result
        assert "confidence" in result
        assert "threat_level" in result
        assert result["source"] == "heuristic_fallback"
        assert 0.0 <= result["confidence"] <= 1.0


# ─── Metadata Extraction Tests ────────────────────────────

class TestMetadataExtraction:
    def test_extract_image_meta_returns_required_fields(self):
        """Test with a minimal valid PNG."""
        import io
        from PIL import Image

        img = Image.new("RGB", (100, 100), color=(255, 0, 0))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        content = buf.getvalue()

        meta = _extract_image_meta(content)

        assert meta["width"] == 100
        assert meta["height"] == 100
        assert meta["mode"] == "RGB"
        assert meta["exif_pii_stripped"] is True

    def test_extract_image_meta_no_gps_in_exif(self):
        """Ensure GPS data is never present in extracted metadata."""
        import io
        from PIL import Image

        img = Image.new("RGB", (50, 50))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        content = buf.getvalue()

        meta = _extract_image_meta(content)

        exif = meta.get("exif", {})
        for key in exif:
            assert "gps" not in key.lower(), f"GPS data found in exif key: {key}"


# ─── Enrichment Tests ─────────────────────────────────────

class TestEnrichment:
    def test_calculate_threat_level_critical_vt(self):
        enrichment = {"virustotal": {"malicious_votes": 10}}
        assert _calculate_threat_level(enrichment) == "critical"

    def test_calculate_threat_level_high_vt(self):
        enrichment = {"virustotal": {"malicious_votes": 2}}
        assert _calculate_threat_level(enrichment) == "high"

    def test_calculate_threat_level_high_url(self):
        enrichment = {"url_reputation": "malicious", "virustotal": {"malicious_votes": 0}}
        assert _calculate_threat_level(enrichment) == "high"

    def test_calculate_threat_level_medium(self):
        enrichment = {"reputation_score": 0.8, "virustotal": {"malicious_votes": 0}}
        assert _calculate_threat_level(enrichment) == "medium"

    def test_calculate_threat_level_low(self):
        enrichment = {"virustotal": {"malicious_votes": 0}, "reputation_score": 0.1}
        assert _calculate_threat_level(enrichment) == "low"

    @pytest.mark.asyncio
    async def test_enrich_threat_no_api_keys(self):
        """Enrichment should return gracefully when no API keys configured."""
        from services.enrichment import enrich_threat
        result = await enrich_threat("abc123", {"content_type": "image/jpeg"})
        assert "mitre_tactics" in result
        assert isinstance(result["mitre_tactics"], list)
        assert len(result["mitre_tactics"]) > 0


# ─── API Integration Tests ────────────────────────────────

class TestAnalyzeAPI:
    @pytest.fixture
    def client(self):
        from fastapi.testclient import TestClient
        # Set dummy env vars before importing app
        os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")
        os.environ.setdefault("DATABASE_URL", "sqlite:///./data/test_sentinel.db")
        from main import app
        from db import init_db
        init_db()
        return TestClient(app)

    def test_health_endpoint(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    def test_analyze_file_invalid_type(self, client):
        resp = client.post(
            "/api/analyze/file",
            files={"file": ("test.exe", b"MZ fake exe", "application/octet-stream")},
        )
        assert resp.status_code == 415

    def test_analyze_file_too_large(self, client):
        large_content = b"x" * (51 * 1024 * 1024)  # 51 MB
        resp = client.post(
            "/api/analyze/file",
            files={"file": ("big.jpg", large_content, "image/jpeg")},
        )
        assert resp.status_code == 413

    def test_reports_stats_returns_counts(self, client):
        resp = client.get("/api/reports/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "verdict_counts" in data
        assert "threat_level_counts" in data

    def test_search_returns_list(self, client):
        resp = client.get("/api/search/?q=deepfake")
        assert resp.status_code == 200
        assert "results" in resp.json()
