import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Link, FileImage, ChevronDown, ChevronUp } from "lucide-react";
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

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    if (context) formData.append("context", context);

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
      const res = await api.post("/analyze/url", { url, context });
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
          />
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
