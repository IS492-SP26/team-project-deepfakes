# Gap Analysis & Opportunity Framing

## Speed Dating Interviews (Internal Discussions)

### Interview 1 - Sammy: Reliability & Safety (w/ Sage)
* **Focus:** Can current tools support clinical cybersecurity research?
* **Feedback:** "Every time I try to document how an NCEI bot works, the AI shuts down the conversation. It treats researchers like bad actors."
* **Identified Gap:** **Safety Over-Correction.** General AI tools are too sanitized for threat intelligence work.

### Interview 2 - Sammy: UX Friction & Latency (w/ Will)
* **Focus:** The workflow of manual data entry.
* **Feedback:** "Converting a 1,000-word news article into a structured SQL entry manually takes forever. I have to verify the model, the date, and the platform myself."
* **Identified Gap:** **High Latency/Friction.** There is no automated pipeline that turns "News" into "Structured Intelligence."

---

## Opportunity Framing
Sentinel fills the gaps left by general-purpose AIs by meeting these specific requirements:

1.  **Research-Grade Access:** Unlike Copilot/ChatGPT, Sentinel provides a clinical environment for documenting threat vectors without triggering moralizing safety blocks.
2.  **Schema-First Design:** While others provide prose, Sentinel uses Llama 3 to output **Structured Metadata** (JSON) designed for database ingestion.
3.  **Technical Taxonomy:** Sentinel focuses on the *how* (LoRA, Fine-tuning, API) rather than just the *what* (The news story).
