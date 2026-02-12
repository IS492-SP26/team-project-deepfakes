# Project Proposal

**Project Title:** Sentinel — NCEI Threat Intelligence Platform

---

## Problem & Importance

The rapid democratization of generative AI has significantly accelerated the creation of Non-Consensual Explicit Imagery (NCEI). While advances in AI safety and content moderation have improved detection and removal mechanisms, existing approaches largely operate in a reactive manner, addressing harmful outputs after dissemination rather than systematically analyzing how such abuses are produced.

As NCEI incidents increase in scale and technical sophistication, stakeholders — including researchers, policymakers, and platform integrity teams — face growing challenges in understanding emerging attack patterns, guardrail failures, and adversarial strategies. Developing more effective defenses therefore requires moving beyond isolated incident responses toward structured, evidence-driven analysis of model exploitation behaviors.

---

## Prior Systems & Gaps

Prior research on synthetic and harmful AI-generated imagery has largely followed two directions: detection-based approaches and generative model safety mechanisms. Deepfake detection studies emphasize classifier-based techniques for identifying synthetic media, supporting mitigation and forensic analysis but offering limited insight into how abusive content is generated.

Generative AI safety research, in contrast, focuses on preventive mechanisms such as prompt filtering, RLHF, output classifiers, and guardrails. Complementary work has applied machine learning models to detect harmful or policy-violating outputs. However, adversarial prompting and jailbreak studies have shown that these protections can often be circumvented, while documentation of failures remains fragmented and informal.

A critical gap therefore remains: the absence of a structured framework that systematically captures guardrail failures, adversarial strategies, and emerging misuse patterns as reusable knowledge.

---

## Proposed Approach & Expected Improvements

To address the identified gap, we propose **Sentinel**, a taxonomy-driven threat intelligence platform designed specifically for generative AI-enabled NCEI incidents. Rather than focusing on detection or content moderation, Sentinel operates as safety-oriented intelligence infrastructure that systematically captures guardrail failures, adversarial prompting strategies, and emerging misuse techniques.

The platform integrates automated data acquisition pipelines with a large language model-assisted intelligence layer to transform unstructured incident reports into standardized, queryable metadata. By introducing a dedicated incident taxonomy and knowledge representation framework — encompassing model characteristics, attack vectors, bypass mechanisms, and platform failure patterns — Sentinel enables cross-incident analysis and knowledge reuse.

This approach improves upon prior work by shifting from reactive mitigation toward intelligence-driven understanding, allowing developers, researchers, and policymakers to identify recurring vulnerabilities, model evolving adversarial behaviors, and design more targeted safety interventions.

---

## Checkpoint 2 Validation Plan (Prompting-Based)

For Checkpoint 2, we will conduct a taxonomy-constrained prompting evaluation to examine whether existing generative AI tools can function as reliable intelligence systems for NCEI-related incidents. Rather than evaluating general output quality, this validation focuses on Sentinel’s core premise: transforming unstructured incident narratives into consistent, taxonomy-aligned threat intelligence.

We will design controlled prompting scenarios across at least three tools (e.g., ChatGPT, Perplexity, Copilot), simulating realistic analytical tasks such as extracting structured metadata, classifying attack vectors, and identifying guardrail failure patterns. Special attention will be given to edge cases involving ambiguous or incomplete incident descriptions.

Outputs will be evaluated for schema consistency, reasoning stability, and hallucination behavior. The study aims to expose systematic limitations in current tools and validate the need for a dedicated taxonomy-driven intelligence platform.

---

## Initial Risks & Mitigation Strategies

Several risks must be considered in the design of Sentinel. Privacy concerns arise from the sensitive nature of NCEI-related incidents, including the potential exposure of victim-identifiable information or misuse of stored records. To mitigate these risks, Sentinel will rely exclusively on publicly available, non-sensitive sources, apply strict data minimization principles, and prioritize structured metadata rather than storing explicit media. Bias and representation risks may emerge due to uneven reporting patterns across platforms and regions; this will be addressed by documenting source provenance, incorporating diverse data channels, and explicitly acknowledging dataset limitations. Safety risks also exist, as structured intelligence systems may be misused; Sentinel therefore avoids operationally sensitive details and emphasizes defensive, research-oriented abstraction. Finally, reliability challenges associated with LLM-assisted extraction, such as hallucination and inconsistency, will be mitigated through schema-constrained prompting, deterministic schema validation, and confidence scoring.
