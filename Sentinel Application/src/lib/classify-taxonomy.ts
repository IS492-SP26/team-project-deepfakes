import { getAnthropicClient } from "./claude";
import type { CausalTaxonomy } from "./store";

const TAXONOMY_SYSTEM_PROMPT = `You are a threat intelligence analyst classifying AI safety incidents using the MIT AI Risk Repository's Causal Taxonomy.

You must classify each incident along exactly 3 dimensions:

1. ENTITY — Who/what is the primary causal agent of the risk?
   - "AI": The risk arises primarily from an AI system's decision or action
   - "Human": The risk arises primarily from a human decision or action involving AI
   - "Other": The causal agent is ambiguous or involves both equally

2. INTENT — Was the outcome intended by the causal agent?
   - "Intentional": The harmful outcome was an expected result of pursuing a goal (e.g., adversarial attack, deliberate misuse)
   - "Unintentional": The harmful outcome was unexpected or a side effect (e.g., bias, hallucination, unintended capability)
   - "Other": Intent is unspecified or unclear from the available information

3. TIMING — When does the risk manifest relative to the AI system's lifecycle?
   - "Pre-deployment": Before the AI system is deployed (e.g., training data poisoning, development flaws)
   - "Post-deployment": After the AI model is trained and deployed (e.g., prompt injection, runtime exploit)
   - "Other": Timing is unspecified or spans both phases

Respond with ONLY valid JSON in this exact format:
{
  "entity": "AI" | "Human" | "Other",
  "intent": "Intentional" | "Unintentional" | "Other",
  "timing": "Pre-deployment" | "Post-deployment" | "Other",
  "confidence": <number between 0 and 1>,
  "rationale": "<1-2 sentence explanation of your classification>"
}`;

const VALID_ENTITY = ["AI", "Human", "Other"] as const;
const VALID_INTENT = ["Intentional", "Unintentional", "Other"] as const;
const VALID_TIMING = ["Pre-deployment", "Post-deployment", "Other"] as const;

export async function classifyTaxonomy(rawText: string): Promise<CausalTaxonomy | null> {
  const client = getAnthropicClient();
  if (!client) return null;

  try {
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 256,
      system: TAXONOMY_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Classify this threat intelligence incident:\n\n${rawText.slice(0, 4000)}`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text);

    if (
      !VALID_ENTITY.includes(parsed.entity) ||
      !VALID_INTENT.includes(parsed.intent) ||
      !VALID_TIMING.includes(parsed.timing)
    ) {
      throw new Error("Invalid taxonomy values in response");
    }

    return {
      entity: parsed.entity,
      intent: parsed.intent,
      timing: parsed.timing,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
      rationale: String(parsed.rationale || ""),
      source: "ai",
    };
  } catch (error) {
    console.error("Taxonomy classification failed:", error);
    return null;
  }
}
