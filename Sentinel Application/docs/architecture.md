# Sentinel — System Architecture

## Overview

Sentinel is a **Deepfake & NCEI Threat Intelligence Platform** that provides structured metadata, threat scoring, and analyst narratives for synthetic media. It is designed as a modular, API-first application with a React frontend and FastAPI backend.

---

## Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["🖥️ Frontend (React + Vite)"]
        UI[Dashboard / Upload UI]
        Reports[Reports & Search]
        Charts[Threat Charts]
    end

    subgraph API["⚙️ Backend (FastAPI)"]
        Router[API Router]
        AnalyzeEndpoint["/api/analyze/file\n/api/analyze/url"]
        ReportsEndpoint["/api/reports"]
        SearchEndpoint["/api/search"]
    end

    subgraph Pipeline["🔬 Analysis Pipeline"]
        Detection[Detection Service\nHive Moderation API]
        Metadata[Metadata Extractor\nEXIF / ffprobe]
        Enrichment[Threat Enrichment\nVirusTotal + Safe Browsing]
        Narrative[Claude Analyst\nNarrative Generator]
    end

    subgraph Storage["💾 Storage"]
        SQLite[(SQLite DB\nanalyses + events)]
        Logs[JSON Log Files]
    end

    subgraph External["🌐 External APIs"]
        HiveAPI[Hive Moderation API]
        VT[VirusTotal]
        GSB[Google Safe Browsing]
        Anthropic[Anthropic Claude API]
    end

    UI -->|Upload file / URL| Router
    Reports -->|GET /reports| Router
    Charts -->|GET /reports/stats| Router

    Router --> AnalyzeEndpoint
    Router --> ReportsEndpoint
    Router --> SearchEndpoint

    AnalyzeEndpoint --> Detection
    AnalyzeEndpoint --> Metadata
    AnalyzeEndpoint --> Enrichment
    AnalyzeEndpoint --> Narrative

    Detection -->|API call| HiveAPI
    Enrichment -->|Hash lookup| VT
    Enrichment -->|URL check| GSB
    Narrative -->|Prompt + results| Anthropic

    AnalyzeEndpoint -->|Save result| SQLite
    Router -->|Log events| Logs
    Router -->|Log events| SQLite
```

---

## Component Breakdown

### Frontend (React + Vite)
- **UploadZone** — Drag-and-drop or click-to-upload for images, video, audio
- **URLSubmit** — URL-based submission form
- **ThreatCard** — Verdict display with confidence ring and threat level badge
- **MetadataPanel** — Collapsible EXIF/technical metadata viewer
- **NarrativePanel** — Claude-generated analyst summary
- **Dashboard** — Aggregate stats, recent reports, threat level chart
- **ReportsTable** — Searchable/filterable history of all analyses

### Backend (FastAPI)
| Route | Method | Description |
|-------|--------|-------------|
| `/api/analyze/file` | POST | Upload & analyze media file |
| `/api/analyze/url` | POST | Submit URL for analysis |
| `/api/analyze/{id}` | GET | Retrieve analysis by ID |
| `/api/reports/` | GET | List all reports (paginated) |
| `/api/reports/stats` | GET | Dashboard statistics |
| `/api/reports/{id}/export` | GET | Export full report |
| `/api/search/` | GET | Full-text search across analyses |
| `/health` | GET | Health check |

### Services
| Service | Purpose | External Dependency |
|---------|---------|-------------------|
| `detection.py` | Deepfake scoring | Hive Moderation API |
| `metadata.py` | Technical forensics | PIL, mutagen, ffprobe |
| `enrichment.py` | Threat intel | VirusTotal, Google Safe Browsing |
| `routers/analyze.py` | Orchestration + narrative | Anthropic Claude |

---

## Data Flow

```
User uploads file
    ↓
FastAPI validates type & size
    ↓
SHA-256 hash computed (no PII stored)
    ↓
[Parallel] Detection API → confidence score
[Parallel] Metadata extraction → EXIF/dims/format
    ↓
Enrichment (hash lookup, URL reputation)
    ↓
Claude generates analyst narrative
    ↓
Result saved to SQLite (async)
    ↓
JSON response returned to client
    ↓
UI renders ThreatCard + Metadata + Narrative
```

---

## Security Boundaries

- Files are **never persisted to disk** — processed in memory only
- File **SHA-256 hash** stored, never filename or file contents
- **EXIF GPS and device serial stripped** before storage
- All external API calls are **non-blocking** with timeouts
- Rate limiting enforced at middleware layer

---

## Deployment Topology

```
[User Browser]
      ↓ HTTPS
[Vercel / Netlify]   ← React Frontend (static)
      ↓ HTTPS API calls
[Railway / Render]   ← FastAPI Backend
      ↓
[SQLite / Postgres]  ← Persistent storage
```
