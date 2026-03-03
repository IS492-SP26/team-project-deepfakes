# 🛡️ Sentinel: NCEI Threat Intelligence Platform
### Checkpoint 2: Validation & Concept Feedback

Sentinel is a dynamic archive and intelligence layer designed to track and categorize Non-Consensual Explicit Imagery (NCEI) incidents. This repository contains the validation materials and a functional sandbox demo for the project.

---

## 📂 Validation Folder Structure

The `/validation/` folder contains the following core components required for Checkpoint 2:

* **`protocol.md`**: A systematic study across ChatGPT, Perplexity, and Copilot covering typical, edge, and failure cases.
* **`gap_analysis.md`**: Speed dating interview summaries and opportunity framing (identifying where current tools fail in safety and UX).
* **`DESIGN_SPEC.md`**: Detailed user journeys, task flows, and UI/UX interactions based on Google's Material Design 3.
* **`app.py`**: A minimal Streamlit sandbox demo showing the "Critical Flow" (Raw News → Structured JSON).

---

## 🚀 Running the Sandbox Demo

This demo illustrates the intelligence layer: extracting structured metadata from unstructured threat reports.

### 1. Prerequisites
* **Python 3.8+**
* **Git** (properly configured)

### 2. Environment Setup
It is recommended to use a virtual environment to keep dependencies isolated:

```bash
# Create the environment in the project folder
python3 -m venv venv

# Activate the environment (macOS/Linux)
source venv/bin/activate

# Activate the environment (Windows)
.\venv\Scripts\activate
```

### Install Dependencies

```bash
pip install -r requirements.txt

```

### Launch App

```bash
streamlit run app.py
