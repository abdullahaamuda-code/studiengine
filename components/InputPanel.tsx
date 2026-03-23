"use client";
import LoadingBar from "./LoadingBar";
import { useState, useRef, DragEvent } from "react";
import { extractTextFromPDF, formatFileSize, isVisionPayload, parseVisionPayload } from "@/lib/pdf";

interface InputPanelProps {
  onSubmit: (content: string, images?: string[]) => void;
  loading: boolean;
  progress?: number;
  placeholder: string;
  buttonLabel: string;
  hint?: string;
}

export default function InputPanel({ onSubmit, loading, progress = 0, placeholder, buttonLabel, hint }: InputPanelProps) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [isScanned, setIsScanned] = useState(false);
  const [visionImages, setVisionImages] = useState<string[] | null>(null);
  const [qualityWarning, setQualityWarning] = useState<"good" | "medium" | "low">("good");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    if (f.type !== "application/pdf") { setExtractError("Only PDF files are supported."); return; }
    if (f.size > 30 * 1024 * 1024) { setExtractError("File too large. Max 30MB."); return; }
    setFile(f); setExtractError(""); setIsScanned(false); setVisionImages(null); setExtracting(true); setQualityWarning("good");
    try {
      const result = await extractTextFromPDF(f);
      if (isVisionPayload(result)) {
        const { images, qualityWarning: qw } = parseVisionPayload(result);
        setVisionImages(images);
        setIsScanned(true);
        setQualityWarning(qw as any);
        setText(`[Scanned PDF: ${f.name} — ${images.length} page(s) ready]`);
      } else {
        setVisionImages(null); setIsScanned(false); setText(result);
      }
    } catch (e: any) { setExtractError(e.message || "Failed to read PDF."); setFile(null); }
    setExtracting(false);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function handleSubmit() {
    if (visionImages && isScanned) onSubmit("", visionImages);
    else { const c = text.trim(); if (!c) return; onSubmit(c); }
  }

  const canSubmit = (isScanned ? !!visionImages : text.trim().length > 20) && !loading && !extracting;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 6, background: "rgba(5,15,35,0.6)", padding: 4, borderRadius: 10, border: "1px solid rgba(56,139,253,0.1)" }}>
        {(["paste", "upload"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex: 1, padding: "8px 0", borderRadius: 7, border: "none",
            background: mode === m ? "linear-gradient(135deg,rgba(37,99,235,0.4),rgba(8,145,178,0.3))" : "transparent",
            color: mode === m ? "#93c5fd" : "var(--text-muted)",
            fontSize: 13, fontWeight: mode === m ? 600 : 400, cursor: "pointer",
            fontFamily: "var(--font-body)", transition: "all 0.2s",
          }}>
            {m === "paste" ? "✏️  Paste Text" : "📄  Upload PDF"}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <div className={`upload-zone${dragOver ? " drag-over" : ""}`}
          style={{ borderRadius: 12, padding: "32px 20px", textAlign: "center" }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }}
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          {extracting ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div className="spinner" style={{ width: 24, height: 24 }} />
              <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Reading PDF pages...</p>
            </div>
          ) : file && (text || visionImages) ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 28 }}>{isScanned ? "🖼️" : "✅"}</div>
              <p style={{ color: isScanned ? "#fbbf24" : "#4ade80", fontSize: 13, fontWeight: 600 }}>{file.name}</p>
              <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
                {formatFileSize(file.size)} • {isScanned ? `${visionImages?.length} pages — vision mode` : "Text extracted"}
              </p>

              {/* Quality warning */}
              {isScanned && qualityWarning === "low" && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "8px 14px", marginTop: 4 }}>
                  <p style={{ fontSize: 12, color: "#fca5a5", margin: 0 }}>
                    ⚠️ Scan quality looks low — results may be less accurate. Try a clearer scan if possible.
                  </p>
                </div>
              )}
              {isScanned && qualityWarning === "medium" && (
                <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 8, padding: "8px 14px", marginTop: 4 }}>
                  <p style={{ fontSize: 12, color: "#fde68a", margin: 0 }}>
                    ⚡ Moderate scan quality — AI will do its best but a clearer scan gives better results.
                  </p>
                </div>
              )}

              <button onClick={e => { e.stopPropagation(); setFile(null); setText(""); setVisionImages(null); setIsScanned(false); setQualityWarning("good"); }}
                style={{ marginTop: 4, fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                Remove
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 4 }}>Drop your PDF here or click to browse</p>
              <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Digital or scanned • Max 30MB</p>
            </div>
          )}
        </div>
      ) : (
        <textarea className="input-glass" value={text} onChange={e => setText(e.target.value)}
          placeholder={placeholder} rows={9}
          style={{ borderRadius: 12, padding: "14px 16px", lineHeight: 1.65, width: "100%", minHeight: 200 }} />
      )}

      {extractError && (
        <p style={{ color: "#f87171", fontSize: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px" }}>⚠️ {extractError}</p>
      )}
      {hint && !text && !visionImages && (
        <p style={{ color: "var(--text-muted)", fontSize: 12, lineHeight: 1.5 }}>💡 {hint}</p>
      )}

      <LoadingBar active={loading} isVision={mode === "upload" && !!visionImages?.length} />
      <button className="btn-primary" onClick={handleSubmit} disabled={!canSubmit}
        style={{ padding: "14px 0", borderRadius: 12, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, position: "relative", overflow: "hidden" }}>
        {loading ? (
          <>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${progress}%`, background: "rgba(255,255,255,0.15)", transition: "width 0.5s ease", borderRadius: 12 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
              <div className="spinner" />
              <span>{progress > 0 ? `Processing... ${progress}%` : "Starting..."}</span>
            </div>
          </>
        ) : extracting ? (
          <><div className="spinner" /> Reading PDF...</>
        ) : buttonLabel}
      </button>
    </div>
  );
}
