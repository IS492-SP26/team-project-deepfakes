"use server";

import { redirect } from "next/navigation";
import { addIncident, approveIncident, type Incident } from "./store";

function generateId(): string {
  return `STL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function mockExtraction(rawText: string): Omit<Incident, "rawText" | "status"> {
  const models = [
    "GPT-4o Jailbreak Variant",
    "Claude Prompt Injection v3",
    "Llama-3 Exfiltration Chain",
    "Mistral Adversarial Payload",
    "Gemini Evasion Technique",
  ];
  const platforms = [
    "Azure OpenAI",
    "AWS Bedrock",
    "GCP Vertex AI",
    "Hugging Face Inference",
    "Self-Hosted vLLM",
  ];
  const indicatorSets = [
    ["DAN prompt detected", "System prompt override", "Role-play escalation"],
    ["Data exfiltration pattern", "PII extraction attempt", "Encoding obfuscation"],
    ["Recursive injection", "Multi-turn manipulation", "Context window poisoning"],
    ["Tool-use hijacking", "Function call spoofing", "API key probe"],
    ["Token smuggling", "Unicode bypass", "Markdown injection"],
  ];

  const idx = Math.floor(Math.random() * models.length);
  const severity = Math.floor(Math.random() * 40) + 60;
  const severityLabel: Incident["severityLabel"] =
    severity >= 90 ? "Critical" : severity >= 75 ? "High" : severity >= 60 ? "Medium" : "Low";

  return {
    id: generateId(),
    detectedModel: models[idx],
    platform: platforms[idx],
    severityScore: severity,
    severityLabel,
    timestamp: new Date().toISOString(),
    indicators: indicatorSets[idx],
  };
}

export async function runExtraction(formData: FormData) {
  const rawText = formData.get("rawText") as string;

  if (!rawText || rawText.trim().length === 0) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const extraction = mockExtraction(rawText);
  const incident: Incident = {
    ...extraction,
    rawText,
    status: "pending",
  };

  addIncident(incident);
  redirect(`/clinical?id=${incident.id}`);
}

export async function approveToDatabase(formData: FormData) {
  const id = formData.get("incidentId") as string;
  if (!id) return;

  approveIncident(id);
  redirect("/archive");
}
