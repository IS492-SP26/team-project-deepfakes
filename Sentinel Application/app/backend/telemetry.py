"""
Telemetry & Observability
- Structured JSON logging
- Event tracking to DB
- Performance metrics
"""

import logging, json, os
from datetime import datetime

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_TO_FILE = os.getenv("LOG_TO_FILE", "true").lower() == "true"
LOG_FILE_PATH = os.getenv("LOG_FILE_PATH", "./logs/sentinel.log")


class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "event_type"):
            log_entry["event_type"] = record.event_type
        if hasattr(record, "payload"):
            log_entry["payload"] = record.payload
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)


def setup_logging():
    os.makedirs(os.path.dirname(LOG_FILE_PATH) if "/" in LOG_FILE_PATH else ".", exist_ok=True)

    handlers = [logging.StreamHandler()]
    if LOG_TO_FILE:
        handlers.append(logging.FileHandler(LOG_FILE_PATH))

    formatter = JSONFormatter()
    root_logger = logging.getLogger("sentinel")
    root_logger.setLevel(getattr(logging, LOG_LEVEL, logging.INFO))

    for h in handlers:
        h.setFormatter(formatter)
        root_logger.addHandler(h)


def log_event(event_type: str, payload: dict = None):
    """Log a structured telemetry event."""
    logger = logging.getLogger("sentinel.events")
    record = logging.makeLogRecord({
        "msg": f"event:{event_type}",
        "levelno": logging.INFO,
        "levelname": "INFO",
    })
    record.event_type = event_type
    record.payload = payload or {}
    logger.handle(record)

    # Persist to DB asynchronously (best-effort)
    try:
        from db import get_db
        conn = get_db()
        conn.execute(
            "INSERT INTO events (event_type, payload) VALUES (?, ?)",
            (event_type, json.dumps(payload or {}))
        )
        conn.commit()
    except Exception:
        pass  # Non-blocking: telemetry must not crash the app
