import { getApprovedIncidents } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive, ShieldOff, ChevronRight } from "lucide-react";
import Link from "next/link";

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

export const dynamic = "force-dynamic";

export default function ArchivePage() {
  const incidents = getApprovedIncidents();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">
            Incident Archive
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Approved threat intelligence entries committed to the database.
        </p>
      </div>

      {incidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-20 text-center">
          <ShieldOff className="h-12 w-12 text-muted-foreground/30" />
          <div>
            <h2 className="text-lg font-semibold text-muted-foreground">
              No archived incidents
            </h2>
            <p className="mt-1 text-sm text-muted-foreground/70">
              Approved incidents from the Clinical View will appear here.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            Start an extraction
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {incidents.length} incident{incidents.length !== 1 && "s"} archived
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-6 py-3 font-medium text-muted-foreground">
                      Incident ID
                    </th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">
                      Detected Model
                    </th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">
                      Platform
                    </th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">
                      Severity
                    </th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">
                      Score
                    </th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((incident) => (
                    <tr
                      key={incident.id}
                      className="border-b border-border/50 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-6 py-3">
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary">
                          {incident.id}
                        </code>
                      </td>
                      <td className="px-6 py-3">{incident.detectedModel}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {incident.platform}
                      </td>
                      <td className="px-6 py-3">
                        <SeverityBadge label={incident.severityLabel} />
                      </td>
                      <td className="px-6 py-3 font-mono">
                        {incident.severityScore}/100
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {new Date(incident.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
