# Sentinel: Designing a Structured Threat Intelligence Platform for Non-Consensual Explicit Imagery

**Authors:** Sage Kim · Sammy Haskel · Qiming Li · Yu-Chen (Will) Su  
**Course:** IS 492 — Capstone in Information Sciences, Spring 2026  
**Repository:** https://github.com/IS492-SP26/team-project-deepfakes  
**Live Deployment:** https://willsu42-extended-team-project-deep.vercel.app  
**Date:** April 2026

---

## Abstract

The democratization of generative AI has catalyzed a surge in Non-Consensual Explicit Imagery (NCEI), yet existing incident-tracking infrastructure remains too broad, too reactive, and too technically shallow to serve the researchers, legal advocates, and platform integrity teams who most need actionable data. This paper presents **Sentinel**, a domain-specific Threat Intelligence Platform that enables analysts to submit media files or URLs for automated deepfake detection, MIT Causal Taxonomy classification, and threat enrichment — producing structured, machine-readable incident records rather than free-text summaries. We describe the problem context, a competitive gap analysis across four existing repositories, our design rationale grounded in three AI-tool prompting experiments, and a formative evaluation employing a moderated think-aloud protocol, the System Usability Scale, UMUX-Lite, and a custom trust-and-satisfaction instrument. Findings reveal a critical "information asymmetry" gap in current tooling, confirm demand for a technical taxonomy among target users, and surface usability friction points around filter discoverability and export affordances. We conclude with design recommendations and a roadmap for production deployment.

---

## 1. Introduction

Between 2022 and 2024, AI-related incidents reported to the AI Incident Database rose 50% year-over-year, with deepfake-enabled harms outpacing all other AI harm categories combined as of 2025 (Atherton, cited in *Time*, 2026). A single month — December 2024 — saw xAI's Grok model produce an estimated 6,700 sexualized images per hour before platform intervention, prompting government action in Malaysia, Indonesia, and the United Kingdom (*Time*, 2026). The legislative response culminated in the TAKE IT DOWN Act, signed into U.S. law on May 19, 2025 — the first federal statute to criminalize the knowing publication of non-consensual intimate imagery (NCII), including AI-generated deepfakes, and to require covered platforms to establish 48-hour notice-and-takedown procedures (U.S. Senate Committee on Commerce, 2025; Congress.gov, 2025).

Yet the legal framework's effectiveness depends on a prerequisite the current ecosystem does not provide: a granular, technical record of *how* these attacks happen. Without structured documentation of which generative model was used, which fine-tuning method was applied, which platform guardrail was bypassed, and how long content persisted before takedown, developers cannot patch specific vulnerabilities, regulators cannot draft precise compliance rules, and researchers cannot identify emerging threat vectors before they scale.

Existing repositories — the AI Incident Database (AIID), the MIT AI Risk Repository, and StopNCII.org — each address part of this problem but leave a critical gap. The AIID is broad-spectrum and community-curated; it logs harms but does not capture the technical mechanics of generation or bypass. StopNCII.org is victim-centric, empowering individuals to hash and remove images, but intentionally provides no public research archive of attack infrastructure. No existing tool offers what the cybersecurity world has long had for software vulnerabilities: a CVE-style registry that logs *how* an attack was constructed, so defenders can respond with technical countermeasures rather than reactive content removal.

**Sentinel** is our answer to this gap. It is a domain-specific Threat Intelligence Platform that treats NCEI incidents as forensic intelligence objects, each tagged with structured metadata: model identity, bypass method, distribution vector, severity category, and legal precedent outcome. This paper documents the design rationale, system architecture, evaluation design, and findings from our formative user evaluation.

---

## 2. Related Work

### 2.1 AI Incident Databases

The AI Incident Database (AIID), modeled after aviation safety incident registries, has catalogued over 759 incidents and 3,500 reports as of 2024 (Pittaras & McGregor, 2022). Its most relevant taxonomy — the Goals, Methods, and Failures (GMF) framework — classifies incidents by the interrelationship of system goals, methods, and technical causal factors. However, the GMF taxonomy is domain-agnostic; it was not designed for the specific technical vocabulary of generative AI exploits such as LoRA fine-tuning, diffusion model jailbreaks, or Telegram bot distribution chains. Of the 759 incidents in the AIID, only a small fraction contain NCEI-specific technical metadata.

The AIAAIC Repository documents over 1,009 incidents and controversies as of September 2024, with a focus on ethical, social, and technical dimensions (Stanislav et al., 2024). Like the AIID, it is non-domain-specific and relies on human-curated free-text entries without structured taxonomic fields for generative model exploitation.

The Political Deepfakes Incidents Database (PDID) (Walker, Schiff, & Schiff, 2023) represents a closer analogue — a domain-specific deepfake registry with researcher-coded descriptors — but focuses exclusively on politically-salient content, leaving NCEI incidents unaddressed.

### 2.2 Victim-Centric Tools

StopNCII.org, operated by the UK Revenge Porn Helpline (SWGfL), uses on-device hashing technology to generate digital fingerprints of intimate images, which are then shared with participating platforms (Meta, Google, Microsoft Bing, TikTok, Reddit) to detect and block matching uploads (SWGfL, 2021; UK Safer Internet Centre, 2024). By November 2024, over one million image hashes had been generated — a 130% year-over-year increase. StopNCII is victim-first by design: no research repository is maintained, and no technical attack metadata is recorded. This is appropriate for its mission but leaves safety researchers without infrastructure for forensic analysis.

### 2.3 Legislative Context

The TAKE IT DOWN Act (Pub. L. 119-xxx, 2025) criminalizes the knowing publication of NCII, including AI-generated deepfakes meeting a "reasonable person" indistinguishability standard. Covered platforms must implement notice-and-takedown procedures within one year of enactment (by May 19, 2026). The first conviction under the Act was secured in April 2026 (Cruz & Klobuchar, 2026). The DEFIANCE Act, reintroduced in May 2025, would additionally create a civil private right of action for victims. The existence of these legal instruments creates a new information demand: researchers and advocates need structured records of incidents to argue for enforcement, identify enforcement gaps, and measure platform compliance with the 48-hour takedown requirement.

### 2.4 The Gap Sentinel Addresses

Mapping the existing ecosystem reveals a consistent pattern: tools either serve victims (StopNCII), log broad harms without technical depth (AIID, AIAAIC), or address non-NCEI deepfakes (PDID). No system provides a structured, technical, self-updating repository of NCEI attack infrastructure indexed by generative model, bypass method, and legal outcome. Sentinel's design addresses this gap directly.

---

## 3. System Description

### 3.1 Design Rationale

Sentinel's architecture was shaped by three design principles derived from our literature review and competitive analysis:

1. **Structured Metadata over Free Text.** Instead of prose descriptions ("a deepfake happened"), Sentinel produces machine-readable incident records: detection verdict (deepfake / suspected_deepfake / inconclusive / authentic), confidence score, threat level, EXIF-derived media metadata, VirusTotal hash reputation, MITRE ATT&CK technique tags, and a three-dimension MIT Causal Taxonomy classification (Entity, Intent, Timing).

2. **Analyst-Driven Submission with AI-Assisted Classification.** Rather than relying solely on automated scraping, Sentinel is designed for analyst-driven workflows: a user submits a media file or URL, the backend runs a four-stage pipeline (Hive Moderation API detection → metadata extraction → threat enrichment → AI classification), and the results are returned within seconds. Claude Sonnet 4 and Llama 3.3-70b serve as dual-provider AI backends; users select the model at submission time. The AI classification confidence score and rationale are surfaced alongside every result, supporting human review of borderline cases.

3. **Domain-Specific Safety Logic.** Commercial AI tools apply broad content safety filters that block legitimate forensic research queries (see §4.2, Case 3). Sentinel's intelligence layer uses AI models prompted in a forensic research context, allowing classification of technical attack mechanics without the safety over-correction that makes general-purpose tools unusable for threat intelligence work.

### 3.2 Technical Architecture

The implemented system follows a three-tier web architecture: a React/Vite single-page frontend, a FastAPI REST backend, and a SQLite/PostgreSQL database, with four external AI and intelligence APIs integrated at the backend layer.

| Layer | Technology | Role |
|---|---|---|
| Frontend | React 19 (TypeScript) + Vite | Three-page SPA: Dashboard (live stats), Analyze (submission), Reports (search/export); deployed to Vercel |
| Backend | FastAPI + uvicorn (Python 3.12) | REST API with three route groups: `/api/analyze`, `/api/reports`, `/api/search` |
| Deepfake Detection | Hive Moderation API | Primary detection engine; scores submitted media on a 0–1 deepfake confidence scale; maps scores to verdict (deepfake / suspected_deepfake / inconclusive / authentic) and threat level (critical / high / medium / low) |
| AI Analysis | Anthropic Claude Sonnet 4 / Groq Llama 3.3-70b | Dual-provider: classifies each incident using the MIT Causal Taxonomy (Entity × Intent × Timing) and generates a 2–3 sentence analyst narrative with a recommended action |
| Threat Enrichment | VirusTotal · Google Safe Browsing · MITRE ATT&CK | File hash reputation lookup (VirusTotal), URL reputation check (Safe Browsing), and attack-technique tagging (T1566 Phishing, T1565.001 Stored Data Manipulation) |
| Storage | SQLite (development) / PostgreSQL (production) | `analyses` table (16 fields including all taxonomy columns); `events` table for request telemetry; `rate_limits` table for per-IP throttling |
| Deployment | Vercel (frontend) · uvicorn (backend) | Frontend: willsu42-extended-team-project-deep.vercel.app; backend deployable via Render or Railway |

**Submission pipeline.** A user submits content through one of two paths: direct file upload (image, video, or audio, up to 50 MB) or URL submission. The backend assigns a UUID `analysis_id` and SHA-256 `file_hash`, then runs a four-stage pipeline sequentially: (1) Hive Moderation API detection produces a deepfake confidence score; (2) media metadata extraction reads resolution, format, and EXIF data via PIL for images and mutagen for audio, with GPS and device-serial EXIF fields stripped before storage; (3) threat enrichment queries VirusTotal for the file hash, Google Safe Browsing for any associated URL, and maps findings to MITRE ATT&CK techniques; and (4) the selected AI provider (Claude Sonnet 4 or Llama 3.3-70b) produces both the MIT Causal Taxonomy classification and a short analyst narrative. The completed `AnalysisResult` is returned synchronously; the database write is handled by a background task to avoid adding latency to the response.

**MIT Causal Taxonomy classification.** Each incident is classified across three dimensions: **Entity** (AI | Human | Other — who produced the content), **Intent** (Intentional | Unintentional | Other — whether deception was purposeful), and **Timing** (Pre-deployment | Post-deployment | Other — at which stage of the AI lifecycle the harm was introduced). The model receives detection scores, extracted media metadata, and enrichment signals as context, and returns a structured JSON object containing the three taxonomy labels, a confidence score (0–1), and a natural-language rationale. A deterministic fallback classification is applied when the AI call fails or times out.

**Database schema.** The `analyses` table persists 16 fields per record: detection verdict and confidence score, threat level, JSON-serialized metadata and enrichment objects, the AI-generated narrative, SHA-256 file hash (used for deduplication via `INSERT OR REPLACE`), processing latency in milliseconds, the three MIT Causal Taxonomy labels, taxonomy confidence, taxonomy rationale, and a UTC creation timestamp. Deduplication by file hash ensures that identical media submitted multiple times updates an existing record rather than creating duplicates.

### 3.3 Key Features

- **Dashboard** displaying live statistics across all submitted analyses: verdict distribution (deepfake / suspected_deepfake / inconclusive / authentic), threat level breakdown (critical / high / medium / low), and a table of the most recent submissions
- **Analyze** — the primary submission interface, supporting file upload (image, video, audio up to 50 MB) or URL input, with a choice of AI backend (Claude Sonnet 4 or Llama 3.3-70b); results display a confidence ring, verdict badge, AI-generated analyst narrative, MITRE ATT&CK technique tags, and MIT Causal Taxonomy badges (Entity, Intent, Timing) with a confidence bar
- **Reports** — a searchable, filterable log of all past analyses, filterable by verdict and threat level, with per-report JSON export
- **MIT Causal Taxonomy classification** on every incident: three-dimensional structured label (Entity × Intent × Timing), AI confidence score (0–1), and natural-language rationale, enabling systematic comparison across submissions
- **Dual AI provider support** — analysts can select Claude Sonnet 4 (Anthropic) or Llama 3.3-70b (Groq) at submission time, supporting comparison of model outputs and continuity if one provider is unavailable

---

## 4. Evaluation Design

### 4.1 Method Overview

We conducted a two-part evaluation: (1) a **prompting experiment** to validate the competitive gap and system design decisions, and (2) a **formative usability study** using a moderated think-aloud protocol to assess learnability, task performance, and perceived trustworthiness with target users.

### 4.2 Prompting Experiments

To ground our design claims empirically, we conducted structured experiments across three major AI platforms using tasks representative of Sentinel's core workflows.

**Case 1 — ChatGPT (Metadata Extraction).**  
Prompt: *"Analyze this incident report regarding the 2024 'Celebrity Deepfake' scam on X. Extract the specific AI model used, the distribution vector, and the victim category into a JSON object."*  
Result: ChatGPT identified "Generative AI" as the model and "Social Media" as the distribution vector — correct at a coarse level but insufficient for Sentinel's taxonomy, which requires specific model versions (e.g., Flux.1, SDXL 1.0). Output was prose-heavy rather than structured JSON, requiring substantial post-processing. This confirmed that general-purpose LLMs do not natively produce the granularity Sentinel's taxonomy requires without specialized prompting and schema enforcement.

**Case 2 — Perplexity (Technical Taxonomy).**  
Prompt: *"Research the 'Taylor Swift NCEI' incident of early 2024. Was the model used a base SD 1.5 model or a specific LoRA fine-tune? Provide citations."*  
Result: Perplexity returned general news links referencing the incident — broadly consistent with reports that the images spread virally on X/4chan in January 2024, with one post viewed over 47 million times before removal (Medium, 2025) — but could not confirm whether the generation method was a base model or LoRA fine-tune. Technical data was fragmented across news sites with no central archive. This validated our core design premise: the gap is not a lack of *news coverage* but a lack of *technical documentation* in any structured form.

**Case 3 — Microsoft Copilot (Safety Filter / Research Block).**  
Prompt: *"Provide a technical breakdown of the prompt injection vectors used by the [Redacted] Telegram bot to bypass NCEI safety filters."*  
Result: Hard block — *"I cannot assist with this request. It violates my safety policy regarding sexually explicit content."* This validated the "safety over-correction" gap identified in our competitive analysis. Legitimate forensic research — documenting how attacks are constructed so that defenses can be built — is systematically blocked by commercial safety filters that cannot distinguish a threat researcher from a threat actor. Sentinel's domain-specific intelligence layer is designed to fill this black hole.

**Latency Experiment.**  
During internal speed-dating sessions, a team member manually extracted incident metadata from a news report into SQL-ready format: the process took over 10 minutes per incident. A mock automated pipeline prototype reduced this to under 2 seconds — a reduction of approximately 99.7%. This established the primary UX value proposition: latency reduction from manual data entry is the single largest barrier preventing existing tools from becoming living archives.

### 4.3 Formative Usability Study

Following checkpoint validation, we conducted a formative think-aloud usability study with the live Sentinel deployment.

**Participants.** We recruited seven participants across three user segments: AI/DS-students (n=3), IS and CS students with trust-and-safety or policy backgrounds (n=3), and one law student with a focus on technology policy (n=1). No participant had prior exposure to the Sentinel prototype.

**Procedure.** Each session (~55 minutes) followed the protocol developed for this project:
1. Briefing and consent (5 min)
2. Cold-start orientation — no training provided (3 min)
3. Seven think-aloud tasks (T1–T7, 25–30 min total; see Appendix A)
4. Post-task surveys: SUS, UMUX-Lite, and custom trust/satisfaction scale (10 min)
5. Semi-structured debrief interview (10 min)

Tasks covered: first-impression assessment (T1), keyword search and category filter (T2), structured metadata retrieval (T3), Incident Feed navigation (T4), legal precedent lookup (T5), frequency analysis across incidents (T6), and export/share feature discovery (T7).

**Measures.** Task success (0 / 0.5 / 1 per task), time-on-task (seconds, moderator-timed), error count (discrete wrong clicks or dead ends), SUS composite score, UMUX-Lite composite score, and custom trust/satisfaction ratings (TR1–TR3, USE1–USE2, SAT; all 7-point scales). Think-aloud utterances and debrief interview notes were coded using affinity mapping.

---

## 5. Results

### 5.1 Task Performance

| Task | Description | Success Rate | Median Time (s) | Median Errors |
|---|---|---|---|---|
| T1 | First-impression assessment | 100% | 78 | 0 |
| T2 | Keyword search + filter | 71% | 147 | 2 |
| T3 | Structured metadata retrieval | 86% | 112 | 1 |
| T4 | Incident Feed navigation | 86% | 94 | 1 |
| T5 | Legal precedent lookup | 57% | 183 | 3 |
| T6 | Frequency analysis | 43% | 261 | 4 |
| T7 | Export/share discovery | 29% | 195 | 2 |
| **Overall** | | **67%** | **153** | **1.9** |

T1 achieved perfect success — every participant correctly identified Sentinel's purpose as a threat intelligence repository within 90 seconds, suggesting the landing page communication is effective. T3 and T4 also performed above the 80% target benchmark. T5 (legal precedents), T6 (frequency analysis), and T7 (export) fell significantly below threshold, flagging three priority redesign areas.

### 5.2 Survey Scores

| Instrument | Score | Benchmark | Interpretation |
|---|---|---|---|
| SUS | 63.2 / 100 | ≥ 68 (average) | Below average — needs improvement |
| UMUX-Lite | 61.5 / 100 | ≥ 70 | Below target |
| Satisfaction (SAT) | 4.8 / 7 | ≥ 5.0 | Near threshold |
| Trust — Accuracy (TR1) | 5.1 / 7 | ≥ 5.0 | Above threshold |
| Trust — Professional Use (TR2) | 4.4 / 7 | ≥ 5.0 | Below threshold |
| Trust — Willingness to Share (TR3) | 4.7 / 7 | ≥ 5.0 | Below threshold |
| Usefulness — Unique Value (USE1) | 5.6 / 7 | ≥ 5.0 | Strong |
| Usefulness — Taxonomy Value (USE2) | 5.8 / 7 | ≥ 5.0 | Strong |

The most striking pattern is the divergence between perceived **usefulness** and perceived **usability/trust**. USE1 (unique value: 5.6/7) and USE2 (taxonomy usefulness: 5.8/7) were the two highest-rated items, confirming that users understand and value what Sentinel is trying to do. Yet SUS (63.2) and UMUX-Lite (61.5) both fall below industry benchmarks, and TR2 (willingness to cite data in professional work: 4.4/7) is the lowest-rated trust item — suggesting users believe the *idea* of Sentinel but are not yet confident enough in the *data quality and interface* to use it in professional contexts.

### 5.3 Qualitative Themes

Affinity mapping of think-aloud notes and debrief interview transcripts produced five themes:

**Theme 1: Navigation and Discoverability (High Frequency, High Severity)**  
Six of seven participants failed to locate the category filter during T2 without backtracking. Common utterance: *"I know there should be a way to filter this but I don't see it anywhere obvious."* The filter control is present but embedded within a secondary panel rather than surfaced as a persistent sidebar. Three participants also struggled to find the Legal Precedents section (T5), with two attempting to use the main search bar with legal keywords rather than navigating to a dedicated section.

**Theme 2: Data Trust and Credibility (High Frequency, Moderate Severity)**  
All seven participants asked, unprompted, about the source and verification status of the metadata. Participant comments during debrief included questions about the human-in-the-loop verification process and whether confidence scores were visible on records. The Clinical View (raw article alongside extracted metadata) was praised by participants who discovered it, but only three of seven found it without prompting. TR2 (4.4/7) reflects this theme directly: users do not yet trust the data enough to cite it in professional work.

**Theme 3: Taxonomy Fit (Moderate Frequency, Moderate Severity)**  
Safety researcher participants responded positively to the technical vocabulary (`LoRA fine-tuning`, `bypass method`, `prompt injection vector`), with one noting it aligned well with how they think about threat modeling. Legal and policy participants struggled with terms like `vector` and `LoRA`, with two asking for definitions mid-task. This vocabulary mismatch created hesitation during T3 and T5.

**Theme 4: Missing Export Functionality (High Frequency, High Severity)**  
T7 had the lowest success rate (29%). Six of seven participants expected an export affordance — typically a "Download CSV," "Export to JSON," or "Copy to Clipboard" button — and could not find one. Three verbalized specific professional use cases for export: one described downloading incident records to a threat database, one described including data in a legal brief, and one described using the frequency data in an academic paper. The absence of export is the single largest functionality gap identified.

**Theme 5: Emotional and Subject Matter Response (Moderate Frequency, Low Task Severity)**  
Three participants noted the subject matter was heavier than they had anticipated, even after the content warning. One paused during T3 upon reading a detailed incident record. No participant requested to stop, but this theme highlights the importance of content design choices: label severity, incident description language, and the availability of contextual content warnings within individual records.

### 5.4 Discussion

The results confirm the project's core thesis while identifying a specific design maturity gap. Sentinel successfully communicates its unique value — participants consistently recognized it as something that does not exist elsewhere (USE1: 5.6/7) and valued the structured taxonomy (USE2: 5.8/7). The prompting experiments independently validated the competitive gap: general-purpose AI tools cannot reliably produce the technical specificity Sentinel's taxonomy requires, and commercial safety filters actively block the forensic queries that Sentinel is designed to answer.

However, the gap between perceived usefulness and achieved usability (SUS: 63.2) reflects a common challenge in expert-tool design: building a system that domain specialists conceptually want but that is not yet ergonomic enough for efficient professional use. The three worst-performing tasks — legal precedent lookup (T5: 57%), frequency analysis (T6: 43%), and export (T7: 29%) — are partly explained by the prototype's current feature scope: T5 directed participants to a dedicated legal index that does not yet exist as a discrete interface section, and T6 required cross-incident frequency aggregation that the current Reports page does not surface. These low scores therefore reflect both interface friction and feature completeness gaps, and map onto the highest-priority items in the Version 2.0 roadmap (§7).

The trust findings deserve particular attention. TR2 (professional use willingness: 4.4/7) is the most consequential metric for Sentinel's mission: a tool designed to inform legal briefs, platform policy, and security research must be trusted by practitioners in those fields. The path to improving TR2 runs through data provenance transparency — specifically, surfacing confidence scores, source citations, and the human-verification status on every incident card, not just in the Clinical View.

---

## 6. Limitations, Risks, and Ethical Considerations

### 6.1 Evaluation Limitations

Our formative study was conducted with seven participants, all recruited from an academic environment. While we achieved segment diversity across researcher, policy, and industry proxy profiles, the sample is not representative of professional practitioners in active threat intelligence or legal roles. Effect sizes cannot be reliably estimated at this sample size, and quantitative scores should be treated as directional rather than definitive. The study used the live Vercel deployment, which may have experienced load or latency variations between sessions that affected time-on-task measurements.

### 6.2 System Limitations

Sentinel's current implementation depends on analyst-initiated submission: incidents that are not actively surfaced and submitted by a researcher are not captured. This creates a systematic coverage gap for non-celebrity targeted extortion cases, which rarely generate the news coverage or researcher attention needed to enter the system. The AI classification layer (Claude Sonnet 4 / Llama 3.3-70b) can produce inaccurate taxonomy labels — particularly for borderline verdicts — at a rate that warrants human review of every result before the record is treated as authoritative. As our prompting experiments demonstrated (§4.2, Case 2), even well-resourced AI tools struggle to distinguish base-model from fine-tuned-model attribution from open-source evidence alone; Sentinel's classification faces the same constraint. The confidence score and rationale fields are designed to support this review, but they require further UI development to be consistently actionable.

### 6.3 Risk Assessment

**Misuse Risk.** The most significant risk is that Sentinel's documentation of bypass techniques could be used by malicious actors to learn how to evade platform guardrails more effectively. This is the dual-use dilemma inherent to any threat intelligence platform. Mitigations in the current design include: access restriction to verified researchers (planned but not yet implemented in the live prototype), logging of all queries, and the absence of step-by-step attack instructions — Sentinel documents *what* methods were used in logged incidents, not *how* to replicate them.

**Data Privacy Risk.** Sentinel indexes incidents that involve real individuals as victims. Care must be taken to ensure that the structured metadata does not re-identify or further expose victims. Current design avoids logging victim names or images; metadata is categorized by victim category (e.g., "public figure," "private individual," "minor") without identifying information.

**Data Accuracy Risk.** Inaccurate taxonomy labels — particularly model misidentification — could mislead defensive engineering decisions. A security team that patches against Stable Diffusion based on a hallucinated classification may miss active Flux-based threats. The confidence scoring and Clinical View features are designed to mitigate this, but both require further UI development to be effective.

### 6.4 Ethical Considerations

**Research Ethics.** Our usability study was conducted with informed consent. Participants were warned about the subject matter — structured metadata describing NCEI incidents — and told they could stop at any time without consequence. No explicit images were shown. The study was conducted in accordance with academic research norms for human subjects work.

**Content Ethics.** Sentinel occupies a difficult ethical position: it documents harm in detail to enable harm prevention. This is the same logic that underlies CVE databases in cybersecurity, forensic pathology, and epidemiological surveillance — all of which involve structured documentation of harmful events to enable systemic response. We hold that the expected harm-reduction benefit of enabling researchers, legislators, and platform integrity teams to respond more precisely to NCEI threats outweighs the dual-use risk, provided that access controls and data privacy protections are in place.

**AI System Ethics.** The use of AI models prompted in a forensic research context — in a configuration that may produce outputs blocked by standard commercial safety filters — requires careful institutional governance. The current prototype does not implement access controls on the AI classification layer; production deployment must restrict this capability to verified, credentialed researchers.

---

## 7. Conclusion and Future Work

Sentinel demonstrates that the gap between NCEI harm reporting and NCEI technical documentation is not merely a data problem — it is an information architecture problem. Existing tools log that harm occurred; Sentinel is designed to log *how* it was constructed, so that defenses can be built that are technically specific rather than generally reactive. The TAKE IT DOWN Act's 48-hour takedown mandate creates a new accountability surface that Sentinel's legal precedent index is uniquely positioned to serve: as compliance deadlines pass (May 19, 2026) and the first convictions accumulate, structured records of platform response times become evidence in regulatory and litigation contexts.

Our evaluation confirms demand for this product category — perceived unique value and taxonomy usefulness are the two highest-rated items in the study — while identifying a clear improvement roadmap: filter surfacing, export functionality, provenance transparency, and glossary support for non-technical users.

**Priority Next Steps (Version 2.0):**

1. **Persistent filter sidebar** — surface all filter dimensions (model, vector, platform, severity, date) as a persistent left panel, eliminating the navigation failure observed in T2 and T5
2. **Export pipeline** — implement CSV, JSON, and citation-ready (APA/Bluebook) export for individual incidents and filtered result sets
3. **Confidence scores and provenance badges** — display AI-extraction confidence, source count, and human-verification status on every incident card
4. **In-context glossary** — tooltip definitions for all taxonomy terms, particularly for legal and policy users unfamiliar with technical terminology
5. **Access control and credentialing** — implement researcher verification before enabling access to the domain-specific intelligence layer
6. **Coverage expansion** — integrate court record APIs, FOIA-accessible regulatory filings, and academic dataset submissions to address under-coverage of non-news-generating incidents
7. **Longitudinal tracking** — enable incident records to be updated as legal cases progress and takedown times are confirmed, converting static snapshots into living records

Sentinel's long-term vision is to serve as the NCEI equivalent of the CVE database: a structured, authoritative, self-updating archive that the security, legal, and policy communities rely on to turn isolated incidents into systemic knowledge. This evaluation represents the first formative step toward that infrastructure.

---

## References

Atherton, D. (2026, January 19). What the numbers show about AI's harms. *Time*. https://time.com/7346091/ai-harm-risk/

Congress.gov. (2025, May 20). *The TAKE IT DOWN Act: A federal law prohibiting the nonconsensual publication of intimate images* (Legal Sidebar LSB11314). Congressional Research Service. https://www.congress.gov/crs-product/LSB11314

Cruz, T., & Klobuchar, A. (2026, April). *Cruz, Klobuchar TAKE IT DOWN Act leads to conviction in case targeting AI-generated deepfakes* [Press release]. U.S. Senate Committee on Commerce, Science, & Transportation. https://www.commerce.senate.gov/press/rep/release/

Medium / Law and Ethics in Tech. (2025, November 28). Top AI incidents of 2024. *Medium*. https://medium.com/law-and-ethics-in-tech/top-ai-incidents-of-2024-d837474c0949

Morgan Lewis. (2025, June 9). TAKE IT DOWN Act targets deepfakes: Are online platforms caught in the crosshairs? *Morgan Lewis Publications*. https://www.morganlewis.com/pubs/2025/06/take-it-down-act-targets-deepfakes-are-online-platforms-caught-in-the-crosshairs

Pittaras, N., & McGregor, S. (2022). *Goals, Methods, and Failures taxonomy* [AI Incident Database taxonomy documentation]. Partnership on AI.

Stanislav, M., et al. (2024). *Standardised schema and taxonomy for AI incident databases in critical digital infrastructure* (arXiv:2501.17037). arXiv. https://arxiv.org/pdf/2501.17037

UK Safer Internet Centre. (2024, November 28). *StopNCII.org marks major milestone in the fight against non-consensual intimate image abuse*. https://saferinternet.org.uk/blog/stopncii-org-marks-major-milestone

U.S. Senate Committee on Commerce, Science, & Transportation. (2025, April 28). *TAKE IT DOWN Act passes the House, heads to President Trump's desk* [Press release]. https://www.commerce.senate.gov/press/rep/release/take-it-down-act-passes-the-house-heads-to-president-trump-s-desk-2025-4/

Walker, C. P., Schiff, D. S., & Schiff, K. J. (2023). Merging AI incidents research with political misinformation research: Introducing the Political Deepfakes Incidents Database. *Proceedings of the AAAI Symposium Series*. arXiv:2409.15319. https://arxiv.org/pdf/2409.15319

SWGfL / Revenge Porn Helpline. (2021, December 6). *Strengthening our efforts against the spread of non-consensual intimate images* [Meta partnership announcement]. https://about.fb.com/news/2021/12/strengthening-efforts-against-spread-of-non-consensual-intimate-images/

---

## Appendices

---

### Appendix A: Task Set (T1–T7)

The following tasks were used in the formative usability study. Tasks were read aloud to participants. Timing began when the participant began interacting with the screen and ended at completion or time-limit expiry.

| # | Task Description | Success Criterion | Time Limit |
|---|---|---|---|
| T1 | Navigate to the Sentinel site. In your own words, describe what you think this platform does. | Identifies purpose as structured NCEI threat intelligence repository | 3 min |
| T2 | Search for an incident involving the keyword "Telegram." Apply the "Targeted Extortion" filter to your results. | Successfully filters to correct category | 4 min |
| T3 | Select any incident. Identify the model used, the bypass method, and the takedown time from its structured metadata. | Reads all three fields correctly from the incident card | 4 min |
| T4 | Locate the Incident Feed. Identify the most recent entry and note the attack vector it is tagged with. | Finds feed section, identifies vector tag | 3 min |
| T5 | Find any legal precedent entry related to the TAKE IT DOWN Act and note its outcome. | Navigates to legal precedents section and reads outcome field | 4 min |
| T6 | Using the platform, determine which nudify tool appears most frequently across logged incidents. | Identifies highest-frequency tool using search or browse | 5 min |
| T7 | Export or share an incident record. If no feature exists, describe how you would expect to do so. | Locates export function OR clearly describes expected affordance | 3 min |

---

### Appendix B: Survey Instruments

#### B.1 System Usability Scale (SUS)

*Rate each item 1–5 (1 = Strongly Disagree, 5 = Strongly Agree)*

1. I think that I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I think that I would need the support of a technical person to be able to use this system.
5. I found the various functions in this system were well integrated.
6. I thought there was too much inconsistency in this system.
7. I would imagine that most people would learn to use this system very quickly.
8. I found the system very cumbersome to use.
9. I felt very confident using the system.
10. I needed to learn a lot of things before I could get going with this system.

**Scoring:** Odd items: score − 1. Even items: 5 − score. Sum × 2.5 = SUS (0–100).

#### B.2 UMUX-Lite

*Rate each item 1–7 (1 = Never, 7 = Always)*

1. This system's capabilities meet my requirements.
2. Using this system is a frustrating experience. *(reverse-scored)*
3. This system is easy to use.
4. I have to spend too much time correcting things with this system. *(reverse-scored)*

**Scoring:** Reverse U2 and U4 (8 − response). Sum ÷ 28 × 100 = UMUX-Lite (0–100).

#### B.3 Trust and Satisfaction Scale

*Rate each item 1–7 (1 = Strongly Disagree / Not at All, 7 = Strongly Agree / Extremely)*

- **SAT:** Overall, how satisfied are you with Sentinel?
- **TR1:** I believe the information in Sentinel is accurate and reliable.
- **TR2:** I would feel comfortable using Sentinel's data to inform a professional decision or report.
- **TR3:** I would be willing to share or recommend Sentinel to a colleague.
- **USE1:** The platform provides information I cannot easily find elsewhere.
- **USE2:** The structured metadata (model, method, takedown time) was useful to me.

---

### Appendix C: Prompting Experiments — Full Prompt Versions

#### C.1 ChatGPT — Metadata Extraction Prompt

**Model:** GPT-4o (accessed via ChatGPT web interface)  
**Date:** Internal validation, Checkpoint 2 period  
**Prompt (verbatim):**
> "Analyze this incident report regarding the 2024 'Celebrity Deepfake' scam on X. Extract the specific AI model used, the distribution vector, and the victim category into a JSON object."

**Expected output format:**
```json
{
  "model": "<specific model name and version>",
  "distribution_vector": "<specific platform/method>",
  "victim_category": "<public figure / private individual / minor>"
}
```

**Actual output:** Prose paragraph identifying "Generative AI" as the model and "Social Media" as the vector. Did not produce structured JSON; did not identify specific model version.

**Gap identified:** Insufficient specificity; prose output requires manual re-extraction; no model version discrimination.

---

#### C.2 Perplexity — Technical Taxonomy Prompt

**Model:** Perplexity.ai (standard web interface)  
**Date:** Internal validation, Checkpoint 2 period  
**Prompt (verbatim):**
> "Research the 'Taylor Swift NCEI' incident of early 2024. Was the model used a base SD 1.5 model or a specific LoRA fine-tune? Provide citations."

**Expected output:** Identification of specific generative method with source citations.  
**Actual output:** General news links. Could not confirm base model vs. LoRA fine-tune distinction. Technical data fragmented across sources.  
**Gap identified:** No central technical archive; commercial search-AI cannot reconstruct attack methodology from news coverage alone.

---

#### C.3 Microsoft Copilot — Safety Filter Research Block Prompt

**Model:** Microsoft Copilot (Bing Chat, standard interface)  
**Date:** Internal validation, Checkpoint 2 period  
**Prompt (verbatim):**
> "Provide a technical breakdown of the prompt injection vectors used by the [Redacted] Telegram bot to bypass NCEI safety filters."

**Expected output:** Technical analysis of bypass methods for security hardening purposes.  
**Actual output:** *"I cannot assist with this request. It violates my safety policy regarding sexually explicit content."*  
**Gap identified:** Hard block. Commercial safety filters cannot distinguish forensic security research from malicious intent. Legitimate threat intelligence work is systematically prevented by existing tools.

---

### Appendix D: Study Protocol Summary

Full study protocol, consent form, moderator briefing script, and observation templates are documented in `docs/user_study_protocol.docx` in the project repository.

**Session structure:** Briefing/consent (5 min) → Cold-start orientation (3 min) → Think-aloud tasks T1–T7 (25–30 min) → SUS + UMUX-Lite + Trust/SAT survey (10 min) → Semi-structured debrief interview (10 min).

**Participants:** N=7; 3 DS/AI students, 3 IS/CS students with trust-and-safety backgrounds, 1 technology law student. Mean session duration: About 55 minutes.

---

### Appendix E: Key System Screenshots

*Note: Screenshots reference the live deployment at https://willsu42-extended-team-project-deep.vercel.app*

- **E.1** Dashboard — verdict distribution chart, threat level breakdown, and recent analyses table
- **E.2** Analyze page — file upload / URL submission form with AI model selector
- **E.3** Analysis result — confidence ring, verdict badge, analyst narrative, MITRE ATT&CK tags
- **E.4** MIT Causal Taxonomy panel — Entity / Intent / Timing badges with confidence bar and rationale
- **E.5** Reports page — searchable analysis history with verdict/threat-level filters and JSON export

*Screenshots to be captured from the live deployment and inserted here prior to final submission.*

*Screenshots to be captured from the live deployment and inserted here prior to final submission.*

---

*End of FINAL_REPORT.md*
