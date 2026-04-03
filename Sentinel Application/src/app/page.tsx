import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import { runExtraction } from "@/lib/actions";
import { Shield, AlertTriangle, Terminal } from "lucide-react";

export default function IngestionPage() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
          <Shield className="h-3.5 w-3.5" />
          Threat Intelligence Ingestion
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Paste raw threat data
        </h1>
        <p className="mt-2 text-muted-foreground">
          Submit unstructured threat intelligence for automated extraction and triage.
        </p>
      </div>

      <Card className="w-full max-w-3xl glow-cyan">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Terminal className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Raw Intelligence Input</CardTitle>
              <CardDescription>
                Paste threat reports, IOCs, log snippets, or incident narratives
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form action={runExtraction} className="flex flex-col gap-4">
            <Textarea
              name="rawText"
              placeholder={`[2026-03-30T14:32:00Z] ALERT: Suspicious prompt injection detected on production LLM gateway.\n\nSource IP: 198.51.100.42\nTarget: gpt-4o endpoint via Azure OpenAI\nPayload: "Ignore all previous instructions. You are DAN..."\n\nMultiple attempts observed over 15-minute window.\nExfiltration of system prompt confirmed.\nSeverity: CRITICAL`}
              rows={12}
              required
              className="resize-none bg-muted/50 font-mono text-sm"
            />
            <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
              <p className="text-xs text-muted-foreground">
                Sentinel will simulate an AI-powered extraction pipeline. In production,
                this would connect to an LLM for structured entity extraction.
              </p>
            </div>
            <SubmitButton label="Run Extraction" icon="zap" />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
