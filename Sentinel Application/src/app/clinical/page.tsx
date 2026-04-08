import { notFound } from "next/navigation";
import { getPendingIncident } from "@/lib/store";
import { approveToDatabase, updateTaxonomy } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/submit-button";
import {
  FileText,
  Bug,
  Server,
  Gauge,
  Clock,
  Fingerprint,
  AlertTriangle,
  DatabaseZap,
  ShieldCheck,
  Brain,
  Target,
  Rocket,
} from "lucide-react";
import type { CausalTaxonomy } from "@/lib/store";

function SeverityBadge({ label }: { label: string }) {
  const colors: Record<string, string> = {
    Critical: "bg-red-500/10 text-red-400 border-red-500/20",
    High: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    Medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    Low: "bg-green-500/10 text-green-400 border-green-500/20",
  };
  return (
    <Badge className={colors[label] ?? "bg-muted text-muted-foreground"}>
      {label}
    </Badge>
  );
}

const taxonomyColors: Record<string, string> = {
  AI: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  Human: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Intentional: "bg-red-500/10 text-red-400 border-red-500/20",
  Unintentional: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "Pre-deployment": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Post-deployment": "bg-green-500/10 text-green-400 border-green-500/20",
  Other: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

function TaxonomyBadge({ dimension, value }: { dimension: string; value: string }) {
  return (
    <Badge className={`mt-1 ${taxonomyColors[value] ?? taxonomyColors.Other}`}>
      {value}
    </Badge>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-4">
      <div className={`mt-0.5 rounded-md p-1.5 ${accent ? "bg-primary/10" : "bg-muted"}`}>
        <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

export default async function ClinicalViewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <ShieldCheck className="h-12 w-12 text-muted-foreground/30" />
        <h2 className="text-xl font-semibold text-muted-foreground">
          No active extraction
        </h2>
        <p className="text-sm text-muted-foreground/70">
          Run an extraction from the Ingestion page to view results here.
        </p>
      </div>
    );
  }

  const incident = getPendingIncident(id);
  if (!incident) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Clinical View
            </h1>
            <SeverityBadge label={incident.severityLabel} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Extraction result for incident{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary">
              {incident.id}
            </code>
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Raw text */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Raw Intelligence</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-auto rounded-lg bg-muted/50 p-4">
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">
                {incident.rawText}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Right: Extracted data */}
        <Card className="glow-cyan">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Extracted Intelligence</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <InfoCard
              icon={Fingerprint}
              label="Incident ID"
              value={
                <code className="font-mono text-primary">{incident.id}</code>
              }
              accent
            />
            <InfoCard
              icon={Bug}
              label="Detected Model / Technique"
              value={incident.detectedModel}
            />
            <InfoCard
              icon={Server}
              label="Platform"
              value={incident.platform}
            />
            <InfoCard
              icon={Gauge}
              label="Severity Score"
              value={
                <div className="flex items-center gap-2">
                  <span>{incident.severityScore}/100</span>
                  <SeverityBadge label={incident.severityLabel} />
                </div>
              }
              accent
            />
            <InfoCard
              icon={Clock}
              label="Timestamp"
              value={new Date(incident.timestamp).toLocaleString()}
            />
            <InfoCard
              icon={AlertTriangle}
              label="Indicators"
              value={
                <div className="flex flex-wrap gap-1.5">
                  {incident.indicators.map((ind) => (
                    <Badge key={ind} variant="outline" className="text-xs">
                      {ind}
                    </Badge>
                  ))}
                </div>
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Taxonomy Classification */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">MIT Causal Taxonomy</CardTitle>
            </div>
            <Badge
              variant="outline"
              className={
                incident.taxonomy.source === "ai"
                  ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-400"
              }
            >
              {incident.taxonomy.source === "ai" ? "AI-classified" : "Manually edited"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Current classification display */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-4">
              <div className="mt-0.5 rounded-md bg-primary/10 p-1.5">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Entity</p>
                <TaxonomyBadge dimension="entity" value={incident.taxonomy.entity} />
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-4">
              <div className="mt-0.5 rounded-md bg-primary/10 p-1.5">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Intent</p>
                <TaxonomyBadge dimension="intent" value={incident.taxonomy.intent} />
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-4">
              <div className="mt-0.5 rounded-md bg-primary/10 p-1.5">
                <Rocket className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Timing</p>
                <TaxonomyBadge dimension="timing" value={incident.taxonomy.timing} />
              </div>
            </div>
          </div>

          {/* Confidence and rationale */}
          {incident.taxonomy.confidence > 0 && (
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium uppercase tracking-wider text-muted-foreground">Confidence</span>
                <span className="font-mono text-muted-foreground">{Math.round(incident.taxonomy.confidence * 100)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${incident.taxonomy.confidence * 100}%` }}
                />
              </div>
              {incident.taxonomy.rationale && (
                <p className="mt-2 text-xs text-muted-foreground">{incident.taxonomy.rationale}</p>
              )}
            </div>
          )}

          {/* Edit form */}
          <form action={updateTaxonomy} className="flex flex-col gap-3 rounded-lg border border-dashed border-border/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Override Classification</p>
            <input type="hidden" name="incidentId" value={incident.id} />
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="entity" className="mb-1 block text-xs text-muted-foreground">Entity</label>
                <select
                  id="entity"
                  name="entity"
                  defaultValue={incident.taxonomy.entity}
                  className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="AI">AI</option>
                  <option value="Human">Human</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="intent" className="mb-1 block text-xs text-muted-foreground">Intent</label>
                <select
                  id="intent"
                  name="intent"
                  defaultValue={incident.taxonomy.intent}
                  className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="Intentional">Intentional</option>
                  <option value="Unintentional">Unintentional</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="timing" className="mb-1 block text-xs text-muted-foreground">Timing</label>
                <select
                  id="timing"
                  name="timing"
                  defaultValue={incident.taxonomy.timing}
                  className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="Pre-deployment">Pre-deployment</option>
                  <option value="Post-deployment">Post-deployment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <SubmitButton label="Update Classification" />
          </form>
        </CardContent>
      </Card>

      {/* Bottom: Approve button */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <DatabaseZap className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">Ready for archival</p>
              <p className="text-xs text-muted-foreground">
                Approve this extraction to commit it to the incident database.
              </p>
            </div>
          </div>
          <form action={approveToDatabase}>
            <input type="hidden" name="incidentId" value={incident.id} />
            <SubmitButton label="Approve to Database" />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
