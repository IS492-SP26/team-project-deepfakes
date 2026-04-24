# Sentinel — Use Cases

## Overview

Sentinel serves journalists, trust & safety teams, law enforcement, and researchers who need to rapidly assess whether media is synthetically generated or manipulated.

---

## UC-01: Deepfake Image Analysis

**Actor**: Trust & Safety Analyst  
**Goal**: Determine if an uploaded image is AI-generated or manipulated  
**Precondition**: User has a suspected deepfake image file  

**Flow**:
1. Analyst uploads image (JPG/PNG/WEBP) via drag-and-drop
2. System hashes file and runs detection pipeline
3. Detection API returns confidence score
4. EXIF metadata is extracted and PII-stripped
5. Claude generates analyst narrative
6. UI displays: verdict badge, confidence ring, metadata panel, narrative

**Success**: Verdict returned with ≥0.75 confidence in < 5 seconds  
**Edge Case**: File too large → 413 error with clear message  
**Test**: `tests/e2e/test_image_upload.spec.ts`

---

## UC-02: URL-Based Threat Submission

**Actor**: Journalist / Researcher  
**Goal**: Report a URL hosting suspected NCEI or deepfake content  
**Precondition**: User has a URL to a media file or hosting page  

**Flow**:
1. User submits URL with optional context note
2. System checks URL against Google Safe Browsing
3. Domain reputation assessed
4. MITRE ATT&CK tactic mapped (T1566 phishing, T1565 manipulation)
5. Analyst narrative generated based on enrichment data
6. Report saved and returnable by ID

**Success**: URL enrichment complete, verdict returned  
**Edge Case**: Safe Browsing API down → graceful fallback with "unknown" reputation  
**Test**: `tests/unit/test_enrichment.py::test_url_fallback`

---

## UC-03: Dashboard Monitoring

**Actor**: Security Operations Analyst  
**Goal**: Monitor aggregate threat landscape across all submitted media  

**Flow**:
1. Analyst opens Dashboard
2. System fetches `/api/reports/stats`
3. Charts render: verdict breakdown donut, threat level bar chart, submission timeline
4. Recent analyses table shows last 20 entries
5. Analyst clicks any entry to view full report

**Success**: Dashboard loads in < 2 seconds with accurate counts  
**Test**: `tests/unit/test_reports.py::test_get_stats`

---

## UC-04: Report Search & Export

**Actor**: Legal / Compliance Team  
**Goal**: Retrieve historical analyses for a case file  

**Flow**:
1. User navigates to Reports page
2. Enters search term (hash fragment, verdict, date range)
3. System queries SQLite full-text on narrative + verdict + hash
4. Results table rendered with pagination
5. User clicks "Export JSON" on a specific report
6. Full structured report (metadata + enrichment + narrative) downloaded

**Success**: Search returns results in < 1 second; export generates valid JSON  
**Test**: `tests/unit/test_reports.py::test_search` and `test_export`

---

## UC-05: Audio Deepfake Detection

**Actor**: Journalist verifying a leaked audio clip  
**Goal**: Assess whether an audio file is AI-generated voice cloning  

**Flow**:
1. User uploads MP3/WAV file
2. Metadata extracted (bitrate, sample rate, channels, duration)
3. Detection API analyzes audio for synthesis artifacts
4. Narrative highlights specific audio-domain indicators (spectral inconsistencies, clipping patterns)
5. Result archived with file hash

**Success**: Audio processed, verdict returned with audio-specific metadata  
**Edge Case**: No detection API key → heuristic fallback with clear dev-mode warning

---

## UC-06: Batch / Automated Submission (API)

**Actor**: Platform integration (partner API)  
**Goal**: Programmatically submit media and receive structured JSON responses  

**Flow**:
1. Partner sends POST `/api/analyze/file` with API key in header
2. Rate limiting applied (30 req/min, 200 req/hr per key)
3. Response includes full `AnalysisResult` JSON
4. Partner stores `analysis_id` for future retrieval

**Success**: API responds with valid JSON under rate limits
**Test**: `tests/unit/test_analyze.py::test_api_rate_limit`

---

## UC-07: MIT Causal Taxonomy Classification

**Actor**: Trust & Safety Analyst / Researcher
**Goal**: Classify an incident using the MIT AI Risk Repository's Causal Taxonomy to understand the cause, intent, and timing of the threat
**Precondition**: User has media or a URL to analyze

**Flow**:
1. Analyst navigates to Analyze page
2. Selects AI model for classification: **Claude (Anthropic)** or **Llama 3 (Groq)**
3. Uploads file or submits URL with optional context
4. System runs detection pipeline, then sends detection results to the selected AI model
5. AI classifies the incident across 3 MIT taxonomy dimensions:
   - **Entity**: AI / Human / Other (who caused the risk)
   - **Intent**: Intentional / Unintentional / Other (was the outcome expected)
   - **Timing**: Pre-deployment / Post-deployment / Other (when did the risk manifest)
6. AI returns classification with confidence score (0-1) and rationale (1-2 sentences)
7. UI displays taxonomy panel with colored badges, confidence bar, rationale text, and model attribution
8. Taxonomy data is persisted alongside the analysis in the database
9. Taxonomy columns appear in Dashboard recent analyses and Reports table

**Success**: Taxonomy classification returned with ≥0.7 confidence, matching expected dimensions
**Edge Case**: AI API unavailable → fallback to "Other/Other/Other" with 0% confidence and "Automatic classification unavailable" message
**Edge Case**: User switches between Claude and Llama → different models may produce different classifications for the same input
**Test**: Verify `/api/analyze/models` returns available models; verify taxonomy fields in API response
