Sentinel: NCEI Threat Intelligence Platform
Team Members: Sage Kim, Sammy Haskel, Qiming Li, Yu-Chen (Will) Su

🚨 Problem Statement
The democratization of generative AI has led to a surge in Non-Consensual Explicit Imagery (NCEI). Current safety frameworks are reactive, often failing to track the specific "how" behind these attacks. Victims and researchers lack a centralized, structured repository that logs how platform guardrails (like those of X/Grok) are bypassed, the specific "nudify" tools being used, and the legal precedents set in response.

Why it matters: Without a granular record of these incidents, developers cannot patch specific vulnerabilities, and lawmakers cannot draft precise regulations. We need a "CVE for Deepfakes" to move from general concern to technical defense.

👥 Target Users & Core Tasks
Safety Researchers: Analyze trends in model exploitation and platform-specific failure modes.

Legal Policy Advocates: Track the success of "Take It Down" acts and other legal precedents to argue for better protection.

Platform Integrity Teams: Use logged bypass techniques to improve red-teaming and prompt filtering.

Core Tasks:

Search/Filter incidents by attack vector (e.g., Targeted Extortion vs. Mass Scale).

Monitor a real-time "Incident Feed" for emerging "Undressing" apps.

Access structured metadata (model used, source platform, takedown time).

📊 Competitive Landscape
System: MIT AI Incident Database (extremely broad, lacks specific taxonomy for NCEI)
System: StopNCII.org (vital tool for victims to remove images, but does not provide a public research repository of how incidents occur)
Our Gap: Sentinel provides the specific technical taxonomy (model type, bypass method) and a dynamic, self-updating infrastructure focused exclusively on NCEI.

💡 Initial Concept & Value Proposition
"Sentinel" is a dynamic Threat Intelligence Platform that acts as a living archive for NCEI incidents.

Value Proposition:

Structured Metadata: Instead of "Deepfake happened," we log: Model: Stable Diffusion XL; Method: LoRA-based fine-tuning; Vector: Telegram Bot.

Dynamic Updating: Automating discovery through scrapers to ensure the database stays relevant as tech evolves.

Incident Taxonomy: A SQL database categorized by "Platform Failures," "Targeted Extortion," and "Legal Precedents."

🛠 Tech Stack
Data Acquisition: Python Scrapers (BeautifulSoup, Scrapy) monitoring news APIs and security blogs.

Intelligence Layer: Llama 3 (via local or API) to parse raw text and extract metadata into structured JSON.

Storage: SQL Database (PostgreSQL) organized by incident type, date, severity, etc

Frontend: A searchable dashboard (GitHub Pages or Streamlit).

📅 Milestones & Roles
Milestone 1: Data Pipeline (Week 3-4): Build Python scrapers and initial database schema.

Owner: Sage Kim (Scraper Lead) & Qiming Li (Database Architect)

Milestone 2: AI Parsing (Week 5-6): Integrate Llama 3 to classify incidents and extract taxonomy.

Owner: Sammy Haskel (AI Integration)

Milestone 3: Dashboard & Deployment (Week 7-8): Build the public-facing repository and automate the update loop.

Owner: Yu-Chen (Will) Su (Frontend/DevOps)

Milestone 4: Testing & Ethics Review (Week 9): Ensure data privacy and verify classification accuracy.

Owner: All (Collaborative Review)
