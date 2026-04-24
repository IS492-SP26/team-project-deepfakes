import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Link, FileImage, ChevronDown, ChevronUp, Cpu } from "lucide-react";
import api from "../api/client";

const ACCEPTED_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
};

function ConfidenceRing({ value, color }: { value: number; color: string }) {
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="confidence-ring" style={{ width: 110, height: 110 }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={radius} fill="none" stroke="var(--border-bright)" strokeWidth="7" />
        <circle
          cx="55" cy="55" r={radius} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="confidence-label">
        <div style={{ fontSize: 18, color, fontWeight: 700 }}>{value}%</div>
        <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>CONF</div>
      </div>
    </div>
  );
}

function MetadataPanel({ metadata }: { metadata: Record<string, any> }) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(metadata).filter(([k, v]) => typeof v !== "object" && v !== null);
  return (
    <div className="metadata-panel">
      <button className="metadata-toggle" onClick={() => setOpen(!open)}>
        <span>Technical Metadata</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div className="metadata-grid">
              {entries.map(([k, v]) => (
                <div className="meta-item" key={k}>
                  <label>{k.replace(/_/g, " ")}</label>
                  <p>{String(v)}</p>
                </div>
              ))}
              {metadata.exif_pii_stripped && (
                <div className="meta-item" style={{ gridColumn: "1/-1" }}>
                  <label>Privacy</label>
                  <p style={{ color: "var(--green)", fontSize: 11 }}>✓ GPS & device serial stripped</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TAXONOMY_COLORS: Record<string, { bg: string; text: string }> = {
  AI: { bg: "rgba(0, 200, 255, 0.12)", text: "var(--accent)" },
  Human: { bg: "rgba(255, 159, 67, 0.12)", text: "var(--orange)" },
  Intentional: { bg: "rgba(255, 69, 96, 0.12)", text: "var(--red)" },
  Unintentional: { bg: "rgba(255, 211, 42, 0.12)", text: "var(--yellow)" },
  "Pre-deployment": { bg: "rgba(160, 120, 255, 0.12)", text: "#a078ff" },
  "Post-deployment": { bg: "rgba(38, 222, 129, 0.12)", text: "var(--green)" },
  Other: { bg: "rgba(65, 85, 103, 0.2)", text: "var(--text-secondary)" },
};

function TaxonomyBadge({ value }: { value: string }) {
  const colors = TAXONOMY_COLORS[value] ?? TAXONOMY_COLORS.Other;
  return (
    <span style={{
      display: "inline-block",
      padding: "4px 12px",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 600,
      background: colors.bg,
      color: colors.text,
      border: `1px solid ${colors.text}22`,
    }}>
      {value}
    </span>
  );
}

function TaxonomyPanel({ taxonomy }: { taxonomy: any }) {
  const conf = Math.round((taxonomy.confidence ?? 0) * 100);
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="stat-label">MIT Causal Taxonomy</div>
        {taxonomy.model_used && (
          <span style={{
            fontSize: 10, padding: "3px 8px", borderRadius: 4,
            background: "var(--accent-dim)", color: "var(--accent)",
            border: "1px solid var(--accent)33", fontFamily: "var(--font-mono)",
          }}>
            {taxonomy.model_used}
          </span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Entity</div>
          <TaxonomyBadge value={taxonomy.entity} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Intent</div>
          <TaxonomyBadge value={taxonomy.intent} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Timing</div>
          <TaxonomyBadge value={taxonomy.timing} />
        </div>
      </div>
      {taxonomy.confidence > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>
            <span>CLASSIFICATION CONFIDENCE</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>{conf}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2,
              background: conf >= 75 ? "var(--accent)" : conf >= 50 ? "var(--orange)" : "var(--text-muted)",
              width: `${conf}%`, transition: "width 0.6s ease",
            }} />
          </div>
        </div>
      )}
      {taxonomy.rationale && (
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          {taxonomy.rationale}
        </div>
      )}
    </div>
  );
}

function VerdictDisplay({ result }: { result: any }) {
  const VERDICT_COLORS: Record<string, string> = {
    deepfake: "var(--red)",
    suspected_deepfake: "var(--orange)",
    inconclusive: "var(--text-secondary)",
    authentic: "var(--green)",
  };
  const color = VERDICT_COLORS[result.verdict] ?? "var(--accent)";
  const conf = Math.round((result.confidence ?? 0) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="verdict-card" data-testid="verdict-card" style={{ marginBottom: 16 }}>
        <div className="verdict-header">
          <div>
            <div className="verdict-title">Analysis Result</div>
            <div style={{ marginTop: 8 }}>
              <span className={`badge badge-${result.verdict}`} style={{ fontSize: 13, padding: "6px 14px" }}>
                {result.verdict?.replace(/_/g, " ").toUpperCase()}
              </span>
            </div>
            <div style={{ marginTop: 12 }}>
              <span className={`badge badge-${result.threat_level}`}>
                {result.threat_level?.toUpperCase()} THREAT
              </span>
            </div>
          </div>
          <ConfidenceRing value={conf} color={color} />
        </div>
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
          ID: {result.analysis_id} · {result.processing_time_ms}ms
        </div>
      </div>

      {result.narrative && (
        <div className="narrative-panel" style={{ marginBottom: 16 }} data-testid="analyst-narrative">
          <div className="narrative-label">// AI Analyst Narrative</div>
          <div className="narrative-text">{result.narrative}</div>
        </div>
      )}

      {result.metadata && Object.keys(result.metadata).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <MetadataPanel metadata={result.metadata} />
        </div>
      )}

      {result.enrichment?.mitre_tactics?.length > 0 && (
        <div className="card">
          <div className="stat-label" style={{ marginBottom: 10 }}>MITRE ATT&CK Mapping</div>
          {result.enrichment.mitre_tactics.map((t: any, i: number) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <span className="mitre-tag">{t.technique}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>{t.relevance}</span>
            </div>
          ))}
        </div>
      )}

      {result.taxonomy && (
        <TaxonomyPanel taxonomy={result.taxonomy} />
      )}
    </motion.div>
  );
}

export default function Analyze() {
  const [tab, setTab] = useState<"file" | "url">("file");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [context, setContext] = useState("");
  const [aiModel, setAiModel] = useState("claude");
  const [availableModels, setAvailableModels] = useState<any[]>([]);

  useEffect(() => {
    api.get("/analyze/models").then((res) => {
      setAvailableModels(res.data.models || []);
    }).catch(() => {
      setAvailableModels([
        { id: "claude", name: "Claude (Anthropic)", available: true },
        { id: "llama", name: "Llama 3 (Groq)", available: false },
      ]);
    });
  }, []);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    if (context) formData.append("context", context);
    formData.append("ai_model", aiModel);

    try {
      const res = await api.post("/analyze/file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (e: any) {
      const msg = e.response?.data?.detail ?? e.message ?? "Analysis failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [context]);

  const handleUrlSubmit = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.post("/analyze/url", { url, context, ai_model: aiModel });
      setResult(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail ?? e.message ?? "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
    onDropRejected: (files) => {
      const err = files[0]?.errors[0];
      if (err?.code === "file-invalid-type") setError("Unsupported file type. Accepted: JPG, PNG, WEBP, MP4, MP3, WAV");
      else if (err?.code === "file-too-large") setError("File too large. Maximum size is 50MB.");
      else setError("File rejected. Check type and size.");
    },
  });

  return (
    <div>
      <motion.div className="page-header" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1>// ANALYZE MEDIA</h1>
        <p>Submit media files or URLs for deepfake & synthetic content analysis</p>
      </motion.div>

      <div style={{ maxWidth: 720 }}>
        <div className="tabs">
          <button className={`tab-btn ${tab === "file" ? "active" : ""}`} onClick={() => setTab("file")} data-testid="file-tab">
            <Upload size={13} style={{ marginRight: 6, verticalAlign: -2 }} />File Upload
          </button>
          <button className={`tab-btn ${tab === "url" ? "active" : ""}`} onClick={() => setTab("url")} data-testid="url-tab">
            <Link size={13} style={{ marginRight: 6, verticalAlign: -2 }} />URL Submission
          </button>
        </div>

        {tab === "file" ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="file">
            <div
              {...getRootProps()}
              className={`upload-zone ${isDragActive ? "drag-active" : ""}`}
            >
              <input {...getInputProps()} data-testid="file-input" />
              <div className="upload-zone-icon"><FileImage size={40} strokeWidth={1} /></div>
              <h3>{isDragActive ? "Drop to analyze" : "Drop media here or click to upload"}</h3>
              <p>JPG, PNG, WEBP, MP4, WEBM, MP3, WAV · Max 50MB</p>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="url" style={{ display: "flex", gap: 10 }}>
            <input
              className="input-field"
              placeholder="https://example.com/media.jpg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              data-testid="url-input"
              onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
            />
            <button className="btn-primary" onClick={handleUrlSubmit} disabled={!url || loading} data-testid="url-submit-btn">
              Analyze
            </button>
          </motion.div>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
          <input
            className="input-field"
            placeholder="Optional context (e.g. 'received via email')"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            maxLength={500}
            style={{ flex: 1 }}
          />
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
          <Cpu size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>AI Model:</span>
          <div style={{ display: "flex", gap: 6 }}>
            {availableModels.map((m) => (
              <button
                key={m.id}
                onClick={() => m.available && setAiModel(m.id)}
                disabled={!m.available}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  border: aiModel === m.id ? "1px solid var(--accent)" : "1px solid var(--border)",
                  background: aiModel === m.id ? "var(--accent-dim)" : "transparent",
                  color: !m.available ? "var(--text-muted)" : aiModel === m.id ? "var(--accent)" : "var(--text-secondary)",
                  cursor: m.available ? "pointer" : "not-allowed",
                  opacity: m.available ? 1 : 0.5,
                  transition: "all 0.2s ease",
                }}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div style={{ margin: "24px 0", display: "flex", alignItems: "center", gap: 12 }}>
            <div className="spinner" />
            <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
              Running analysis pipeline...
            </span>
          </div>
        )}

        {error && (
          <div className="error-box" data-testid="error-message">{error}</div>
        )}

        {result && (
          <div style={{ marginTop: 24 }}>
            <VerdictDisplay result={result} />
          </div>
        )}
      </div>
    </div>
  );
}
