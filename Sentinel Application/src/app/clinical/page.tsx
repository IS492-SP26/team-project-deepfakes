import { notFound } from "next/navigation";
import { getPendingIncident } from "@/lib/store";
import { approveToDatabase } from "@/lib/actions";
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
} from "lucide-react";

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
