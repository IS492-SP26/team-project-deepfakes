# Sentinel Design Specification

## Product Overview
Sentinel is a high-density Threat Intelligence Dashboard for NCEI incidents, following **IBM Carbon** and **Material Design 3** principles for data-heavy interfaces.

## User Journey
1.  **Discovery:** Researcher opens the "Global Incident Archive."
2.  **Filtering:** User filters by `Threat Vector` (e.g., "Telegram Bot") and `Model` (e.g., "Llama 3").
3.  **Inspection:** User selects an incident to see the "Clinical View"—a side-by-side comparison of raw news text and the Llama 3-extracted JSON metadata.
4.  **Export:** User clicks "Export to SQL" to update their local security database.



## Task Flows
* **Automated Ingestion:** Scraper (Python) → Metadata Extraction (Llama 3) → Validation (Human-in-the-loop) → Database (PostgreSQL).
* **Incident Query:** Search Bar → Category Filter → Severity Sorting → Detail View.

## Key Screens & Interactions
* **The Archive (Main):** Uses a data table (Carbon Design System) with high-density rows for quick scanning.
* **Metadata Editor:** A code-editor-style interface for researchers to correct AI-extracted tags.
* **Severity Heatmap:** A visual distribution of incident types over time to show method evolution.

## Minimal Sandbox Demo
(IN PROGRESS) The critical flow (News to JSON) is demonstrated via a Streamlit prototype in the `/demo` folder, which mocks the Llama 3 extraction layer.
