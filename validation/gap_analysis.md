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

### Interview 3 - Will: Accuracy & Reliability (w/ Sammy)
* **Focus:** The "Black Hole" effect of existing reporting tools.
* **Feedback:** "When I report an NCEI incident to a platform, I get a 'thank you' message and the image eventually vanishes, but I never learn how it was made. I'm left in the dark about whether it was a specific model exploit or a prompt injection bypass that might happen again tomorrow."
* **Identified Gap:** **Information Asymmetry.** Current tools are reactive and one-way; they remove content but fail to return structured technical intelligence to the researcher or victim.

### Interview 4 - Will: Latency & UX Friction (w/ Sage)
* **Focus:** The transition from "Incident Logging" to "Actionable Defense."
* **Feedback:** "I expect a 'result' to be a technical signature I can use to update my filters, but all I get is a confirmation of deletion. There is a massive delay between seeing an attack and actually having the data needed to block the method of that attack across the whole platform."
* **Identified Gap:** **Actionability Gap.** Existing platforms focus on content-takedown (reactive) rather than threat-modeling (proactive).
---

## Opportunity Framing
Sentinel fills the gaps left by general-purpose AIs by meeting these specific requirements:

1.  **Research-Grade Access:** Unlike Copilot/ChatGPT, Sentinel provides a clinical environment for documenting threat vectors without triggering moralizing safety blocks.
2.  **Schema-First Design:** While others provide prose, Sentinel uses Llama 3 to output **Structured Metadata** (JSON) designed for database ingestion.
3.  **Technical Taxonomy:** Sentinel focuses on the *how* (LoRA, Fine-tuning, API) rather than just the *what* (The news story).
