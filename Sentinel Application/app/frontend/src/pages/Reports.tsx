import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Download } from "lucide-react";
import api from "../api/client";

export default function Reports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [verdict, setVerdict] = useState("");
  const [total, setTotal] = useState(0);

  const fetchReports = async (q = "", v = "") => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (v) params.verdict = v;
      const res = await api.get("/reports/", { params });
      let data = res.data.reports || [];
      if (q) {
        const ql = q.toLowerCase();
        data = data.filter((r: any) =>
          r.analysis_id?.toLowerCase().includes(ql) ||
          r.verdict?.toLowerCase().includes(ql) ||
          r.threat_level?.toLowerCase().includes(ql)
        );
      }
      setReports(data);
      setTotal(res.data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    fetchReports(e.target.value, verdict);
  };

  const handleExport = async (id: string) => {
    const res = await api.get(`/reports/${id}/export`);
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sentinel-report-${id.slice(0, 8)}.json`;
    a.click();
  };

  return (
    <div>
      <motion.div className="page-header" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1>// REPORTS</h1>
        <p>Search and export historical analysis records — {total} total</p>
      </motion.div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }} data-testid="reports-filter">
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="input-field"
            style={{ paddingLeft: 34 }}
            placeholder="Search by ID, verdict, threat level..."
            value={query}
            onChange={handleSearch}
            data-testid="search-input"
          />
        </div>
        <select
          className="input-field"
          style={{ width: 200 }}
          value={verdict}
          onChange={(e) => { setVerdict(e.target.value); fetchReports(query, e.target.value); }}
        >
          <option value="">All Verdicts</option>
          <option value="deepfake">Deepfake</option>
          <option value="suspected_deepfake">Suspected Deepfake</option>
          <option value="inconclusive">Inconclusive</option>
          <option value="authentic">Authentic</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
        ) : (
          <table className="data-table" data-testid="reports-table">
            <thead>
              <tr>
                <th>Analysis ID</th>
                <th>Verdict</th>
                <th>Confidence</th>
                <th>Threat Level</th>
                <th>Date</th>
                <th>Export</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}
                    data-testid="no-results-message">
                    No reports found
                  </td>
                </tr>
              ) : reports.map((r) => (
                <tr key={r.analysis_id} data-testid="report-row">
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{r.analysis_id?.slice(0, 16)}...</td>
                  <td><span className={`badge badge-${r.verdict}`}>{r.verdict?.replace(/_/g, " ")}</span></td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{Math.round((r.confidence ?? 0) * 100)}%</td>
                  <td><span className={`badge badge-${r.threat_level}`}>{r.threat_level}</span></td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleExport(r.analysis_id)}
                      style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", padding: 4 }}
                      title="Export JSON"
                    >
                      <Download size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
