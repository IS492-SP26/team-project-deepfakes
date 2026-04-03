export interface Incident {
  id: string;
  rawText: string;
  detectedModel: string;
  platform: string;
  severityScore: number;
  severityLabel: "Critical" | "High" | "Medium" | "Low";
  timestamp: string;
  indicators: string[];
  status: "pending" | "approved";
}

const incidents: Incident[] = [];

export function getApprovedIncidents(): Incident[] {
  return incidents.filter((i) => i.status === "approved");
}

export function getPendingIncident(id: string): Incident | undefined {
  return incidents.find((i) => i.id === id);
}

export function addIncident(incident: Incident): void {
  incidents.push(incident);
}

export function approveIncident(id: string): Incident | undefined {
  const incident = incidents.find((i) => i.id === id);
  if (incident) {
    incident.status = "approved";
  }
  return incident;
}
