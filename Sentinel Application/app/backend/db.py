"""
Database layer — SQLite (dev) / PostgreSQL (prod)
"""

import sqlite3, os, json, logging
from datetime import datetime

logger = logging.getLogger("sentinel.db")

DB_PATH = os.getenv("DATABASE_URL", "sqlite:///./data/sentinel.db").replace("sqlite:///", "")
REQUIRED_ANALYSIS_COLUMNS = {
    "taxonomy_entity": "TEXT",
    "taxonomy_intent": "TEXT",
    "taxonomy_timing": "TEXT",
    "taxonomy_confidence": "REAL",
    "taxonomy_rationale": "TEXT",
}


def init_db():
    os.makedirs(os.path.dirname(DB_PATH) if "/" in DB_PATH else ".", exist_ok=True)
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            analysis_id TEXT UNIQUE NOT NULL,
            verdict TEXT NOT NULL,
            confidence REAL,
            threat_level TEXT,
            metadata TEXT,
            enrichment TEXT,
            narrative TEXT,
            file_hash TEXT,
            processing_time_ms INTEGER,
            taxonomy_entity TEXT,
            taxonomy_intent TEXT,
            taxonomy_timing TEXT,
            taxonomy_confidence REAL,
            taxonomy_rationale TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            payload TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS rate_limits (
            ip_address TEXT NOT NULL,
            endpoint TEXT NOT NULL,
            request_count INTEGER DEFAULT 1,
            window_start TEXT NOT NULL,
            PRIMARY KEY (ip_address, endpoint, window_start)
        );
    """)
    _migrate_analyses_schema(conn)
    conn.commit()
    logger.info(f"Database initialized at {DB_PATH}")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _migrate_analyses_schema(conn: sqlite3.Connection):
    existing_columns = {
        row["name"]
        for row in conn.execute("PRAGMA table_info(analyses)").fetchall()
    }
    for column_name, column_type in REQUIRED_ANALYSIS_COLUMNS.items():
        if column_name not in existing_columns:
            conn.execute(f"ALTER TABLE analyses ADD COLUMN {column_name} {column_type}")
            logger.info(f"Added missing analyses column: {column_name}")


def save_analysis(result: dict, file_hash: str = None):
    try:
        conn = get_db()
        taxonomy = result.get("taxonomy", {})
        conn.execute("""
            INSERT OR REPLACE INTO analyses
            (analysis_id, verdict, confidence, threat_level, metadata, enrichment, narrative, file_hash, processing_time_ms,
             taxonomy_entity, taxonomy_intent, taxonomy_timing, taxonomy_confidence, taxonomy_rationale)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            result["analysis_id"],
            result["verdict"],
            result["confidence"],
            result["threat_level"],
            json.dumps(result.get("metadata", {})),
            json.dumps(result.get("enrichment", {})),
            result.get("narrative", ""),
            file_hash,
            result.get("processing_time_ms", 0),
            taxonomy.get("entity"),
            taxonomy.get("intent"),
            taxonomy.get("timing"),
            taxonomy.get("confidence"),
            taxonomy.get("rationale"),
        ))
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to save analysis: {e}")
