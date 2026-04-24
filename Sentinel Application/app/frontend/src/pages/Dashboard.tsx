import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import { AlertTriangle, Shield, CheckCircle, HelpCircle } from "lucide-react";
import api from "../api/client";

const VERDICT_COLORS: Record<string, string> = {
  deepfake: "#ff4560",
  suspected_deepfake: "#ff9f43",
  inconclusive: "#7a92ab",
  authentic: "#26de81",
};

const THREAT_COLORS: Record<string, string> = {
  critical: "#ff4560",
  high: "#ff9f43",
  medium: "#ffd32a",
  low: "#26de81",
};

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/reports/stats"),
      api.get("/reports/?limit=8"),
    ]).then(([statsRes, reportsRes]) => {
      setStats(statsRes.data);
      setReports(reportsRes.data.reports || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <div className="loading-bar" />
      <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
        Loading intelligence data...
      </div>
    </div>
  );

  const verdictData = stats ? Object.entries(stats.verdict_counts)
    .filter(([k]) => k !== "total")
    .map(([name, value]) => ({ name, value })) : [];

  const threatData = stats ? Object.entries(stats.threat_level_counts)
    .map(([name, value]) => ({ name, value })) : [];

  const total = stats?.verdict_counts?.total ?? 0;
  const deepfakes = (stats?.verdict_counts?.deepfake ?? 0) + (stats?.verdict_counts?.suspected_deepfake ?? 0);
  const criticalHigh = (stats?.threat_level_counts?.critical ?? 0) + (stats?.threat_level_counts?.high ?? 0);

  return (
    <div>
      <motion.div className="page-header" {...fadeIn} transition={{ duration: 0.3 }}>
        <h1>// THREAT DASHBOARD</h1>
        <p>Real-time deepfake & NCEI intelligence overview</p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div className="card-grid card-grid-4" style={{ marginBottom: 24 }}
        {...fadeIn} transition={{ duration: 0.3, delay: 0.05 }}>
        {[
          { label: "Total Analyzed", value: total, icon: Shield, color: "var(--accent)", testId: "stat-total" },
          { label: "Deepfakes Found", value: deepfakes, icon: AlertTriangle, color: "var(--red)", testId: "stat-deepfakes" },
          { label: "Authentic Media", value: stats?.verdict_counts?.authentic ?? 0, icon: CheckCircle, color: "var(--green)", testId: "stat-authentic" },
          { label: "Critical / High", value: criticalHigh, icon: AlertTriangle, color: "var(--orange)", testId: "stat-threat-level" },
        ].map(({ label, value, icon: Icon, color, testId }) => (
          <div className="stat-card" key={label} data-testid={testId}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div className="stat-label">{label}</div>
              <Icon size={16} color={color} strokeWidth={1.5} />
            </div>
            <div className="stat-value" style={{ color }}>{value}</div>
          </div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <motion.div className="card-grid card-grid-2" style={{ marginBottom: 24 }}
        {...fadeIn} transition={{ duration: 0.3, delay: 0.1 }}>
        {/* Verdict Donut */}
        <div className="card">
          <div className="stat-label" style={{ marginBottom: 20 }}>Verdict Breakdown</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={verdictData} innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                {verdictData.map((entry) => (
                  <Cell key={entry.name} fill={VERDICT_COLORS[entry.name] ?? "#415567"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: "var(--text-secondary)" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
            {verdictData.map(({ name }) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: VERDICT_COLORS[name] }} />
                <span style={{ color: "var(--text-muted)", textTransform: "capitalize" }}>{name.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Threat Level Bar */}
        <div className="card">
          <div className="stat-label" style={{ marginBottom: 20 }}>Threat Level Distribution</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={threatData} barSize={28}>
              <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {threatData.map(({ name }) => (
                  <Cell key={name} fill={THREAT_COLORS[name] ?? "var(--accent)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Reports */}
      <motion.div className="card" {...fadeIn} transition={{ duration: 0.3, delay: 0.15 }}>
        <div className="stat-label" style={{ marginBottom: 16 }}>Recent Analyses</div>
        <table className="data-table" data-testid="recent-reports-table">
          <thead>
            <tr>
              <th>Analysis ID</th>
              <th>Verdict</th>
              <th>Confidence</th>
              <th>Threat Level</th>
              <th>Entity</th>
              <th>Intent</th>
              <th>Timing</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px 0" }}>
                No analyses yet — upload a file to get started
              </td></tr>
            ) : reports.map((r) => (
              <tr key={r.analysis_id}>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{r.analysis_id?.slice(0, 12)}...</td>
                <td><span className={`badge badge-${r.verdict}`}>{r.verdict?.replace(/_/g, " ")}</span></td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{Math.round((r.confidence ?? 0) * 100)}%</td>
                <td><span className={`badge badge-${r.threat_level}`}>{r.threat_level}</span></td>
                <td style={{ fontSize: 11 }}>{r.taxonomy_entity || "—"}</td>
                <td style={{ fontSize: 11 }}>{r.taxonomy_intent || "—"}</td>
                <td style={{ fontSize: 11 }}>{r.taxonomy_timing || "—"}</td>
                <td>{new Date(r.created_at).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
