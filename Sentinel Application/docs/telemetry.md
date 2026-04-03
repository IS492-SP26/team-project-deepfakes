# Sentinel — Telemetry & Observability Plan

## What We Log

### 1. HTTP Request Log (every request)
```json
{
  "timestamp": "2026-04-01T12:00:00Z",
  "level": "INFO",
  "logger": "sentinel.events",
  "event_type": "http_request",
  "payload": {
    "request_id": "a3f9c1b2",
    "method": "POST",
    "path": "/api/analyze/file",
    "status": 200,
    "duration_ms": 1847
  }
}
```

### 2. Analysis Started Event
```json
{
  "event_type": "analysis_started",
  "payload": {
    "analysis_id": "uuid-here",
    "type": "file",
    "file_type": "image/jpeg",
    "file_hash": "sha256:abc123...",
    "size_bytes": 204800
  }
}
```
> **Note**: No filename, no raw content, no PII is ever logged.

### 3. Analysis Complete Event
```json
{
  "event_type": "analysis_complete",
  "payload": {
    "analysis_id": "uuid-here",
    "verdict": "deepfake",
    "confidence": 0.912,
    "processing_time_ms": 2341
  }
}
```

### 4. External API Call Events
```json
{
  "event_type": "external_api_call",
  "payload": {
    "service": "hive_moderation",
    "status": "success",
    "latency_ms": 890,
    "cached": false
  }
}
```

### 5. Error Events
```json
{
  "event_type": "error",
  "payload": {
    "error_type": "DetectionAPIError",
    "message": "Request timeout after 30s",
    "fallback_used": true,
    "analysis_id": "uuid-here"
  }
}
```

### 6. Rate Limit Events
```json
{
  "event_type": "rate_limit_hit",
  "payload": {
    "ip_hash": "sha256:...",
    "endpoint": "/api/analyze/file",
    "limit": "30/min",
    "retry_after_seconds": 42
  }
}
```
> **Note**: IP addresses are SHA-256 hashed before logging.

---

## Database Tables

### `analyses` table
Stores every completed analysis result for report history and audit.

| Column | Type | Notes |
|--------|------|-------|
| analysis_id | TEXT | UUID primary key |
| verdict | TEXT | deepfake / suspected / inconclusive / authentic |
| confidence | REAL | 0.0–1.0 |
| threat_level | TEXT | critical / high / medium / low |
| metadata | TEXT | JSON blob (PII-stripped EXIF) |
| enrichment | TEXT | JSON blob (VT, GSB results) |
| narrative | TEXT | Claude-generated summary |
| file_hash | TEXT | SHA-256 of file (no filename) |
| processing_time_ms | INTEGER | End-to-end latency |
| created_at | TEXT | UTC timestamp |

### `events` table
Raw structured event log for debugging and audit.

| Column | Type | Notes |
|--------|------|-------|
| event_type | TEXT | Category of event |
| payload | TEXT | JSON blob |
| created_at | TEXT | UTC timestamp |

### `rate_limits` table
Tracks per-IP sliding window for rate enforcement.

---

## How to Debug Test Cases

### 1. Check logs
```bash
tail -f logs/sentinel.log | python -m json.tool
```

### 2. Query events DB
```bash
sqlite3 data/sentinel.db "SELECT event_type, payload, created_at FROM events ORDER BY created_at DESC LIMIT 50;"
```

### 3. Find slow analyses
```bash
sqlite3 data/sentinel.db "SELECT analysis_id, verdict, processing_time_ms FROM analyses ORDER BY processing_time_ms DESC LIMIT 10;"
```

### 4. Check error rate
```bash
sqlite3 data/sentinel.db "SELECT COUNT(*) FROM events WHERE event_type = 'error';"
```

### 5. Run with verbose logging
```bash
LOG_LEVEL=DEBUG uvicorn main:app --reload
```

---

## Key Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| API p95 latency | < 3s | > 5s |
| Detection API success rate | > 99% | < 95% |
| Analysis per hour | — | > 200 (rate limit) |
| Error rate | < 1% | > 5% |
| DB size | — | > 1GB |

---

## Future: Production Observability

For production deployments, export logs to:
- **Datadog** or **Grafana + Loki** for log aggregation
- **Sentry** for error tracking and alerting
- **Prometheus** for metrics scraping (`/metrics` endpoint)
