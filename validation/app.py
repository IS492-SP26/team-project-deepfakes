# Run: "pip install streamlit" and then "streamlit run validation/app.py"

import streamlit as st
import json
import time

# Page Config (Material Design inspired layout)
st.set_page_config(page_title="Sentinel Sandbox", layout="wide")

st.title("🛡️ Sentinel: Threat Intelligence Sandbox")
st.markdown("### Critical Flow: Raw Text to Structured Metadata")

# Setup two columns
col1, col2 = st.columns(2)

with col1:
    st.subheader("Input: Raw Incident Data")
    raw_text = st.text_area(
        "Paste news article or incident report here:",
        height=300,
        placeholder="e.g., Reports indicate a new surge of deepfake imagery on Telegram using a custom Flux.1 LoRA fine-tuned for high realism..."
    )
    process_btn = st.button("Extract Intelligence (Llama 3)")

with col2:
    st.subheader("Output: Structured Intelligence")
    if process_btn and raw_text:
        with st.spinner("Llama 3 parsing technical vectors..."):
            time.sleep(1.5)  # Simulate API latency
            
            # Mocking the LLM extraction logic
            mock_metadata = {
                "incident_id": "STNL-2024-001",
                "detected_model": "Flux.1",
                "method": "LoRA Fine-tuning",
                "platform_vector": "Telegram",
                "taxonomy_category": "NCEI / Targeted Extortion",
                "severity_score": 8.5
            }
            
            st.success("Extraction Complete")
            st.json(mock_metadata)
            
            st.info("Verification: Model version confirmed via technical vector analysis.")
    else:
        st.info("Awaiting input to generate metadata schema...")

# Bottom Section: Database Preview
st.divider()
st.subheader("Database Preview (PostgreSQL Mock)")
st.table([
    {"Date": "2024-01-15", "Model": "SDXL", "Vector": "Discord", "Severity": "High"},
    {"Date": "2024-02-01", "Model": "Llama 3 (Voice)", "Vector": "WhatsApp", "Severity": "Critical"}
])
