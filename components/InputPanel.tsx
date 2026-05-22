"use client";
import LoadingBar from "./LoadingBar";
import { useState, useRef, DragEvent } from "react";
import { extractTextFromPDF, formatFileSize, isVisionPayload, parseVisionPayload } from "@/lib/pdf";

interface InputPanelProps {
  onSubmit:    (content: string, images?: string[]) => void;
  loading:     boolean;
  progress?:   number;
  placeholder: string;
  buttonLabel: string;
  hint?:       string;
}

export default function InputPanel({
  onSubmit, loading, progress = 0, placeholder, buttonLabel, hint,
}: InputPanelProps) {
  const [text, setText]                   = useState("");
  const [file, setFile]                   = useState<File | null>(null);
  const [extracting, setExtracting]       = useState(false);
  const [extractError, setExtractError]   = useState("");
  const [dragOver, setDragOver]           = useState(false);
  const [mode, setMode]                   = useState<"paste" | "upload">("paste");
  const [isScanned, setIsScanned]         = useState(false);
  const [visionImages, setVisionImages]   = useState<string[] | null>(null);
  const [qualityWarning, setQualityWarning] = useState<"good" | "medium" | "low">("good");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    if (f.type !== "application/pdf") { setExtractError("Only PDF files are supported."); return; }
    if (f.size > 30 * 1024 * 1024)    { setExtractError("File too large. Max 30MB."); return; }
    setFile(f); setExtractError(""); setIsScanned(false); setVisionImages(null);
    setExtracting(true); setQualityWarning("good");
    try {
      const result = await extractTextFromPDF(f);
      if (isVisionPayload(result)) {
        const { images, qualityWarning: qw } = parseVisionPayload(result);
        setVisionImages(images); setIsScanned(true);
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

  function clearFile() {
    setFile(null); setText(""); setVisionImages(null);
    setIsScanned(false); setQualityWarning("good");
  }

  const canSubmit = (isScanned ? !!visionImages : text.trim().length > 20) && !loading && !extracting;

  return (
    <>
      <style>{`
        @keyframes ip-spin { to{transform:rotate(360deg)} }
        .ip-mode-btn { flex:1; padding:9px 0; border-radius:8px; border:none; cursor:pointer; font-family:var(--font-body); font-size:13px; font-weight:500; transition:all 0.2s; }
        .ip-mode-active { background:linear-gradient(135deg,rgba(99,102,241,0.25),rgba(56,189,248,0.15)) !important; color:#c7d2fe !important; font-weight:700 !important; box-shadow:inset 0 1px 0 rgba(255,255,255,0.07); }
        .ip-mode-inactive { background:transparent !important; color:var(--text-muted) !important; }
        .ip-mode-inactive:hover { background:rgba(255,255,255,0.04) !important; color:var(--text-secondary) !important; }
        .ip-drop:hover { border-color:rgba(99,102,241,0.45) !important; background:rgba(99,102,241,0.05) !important; }
        .ip-drop.drag-active { border-color:rgba(99,102,241,0.6) !important; background:rgba(99,102,241,0.08) !important; box-shadow:0 0 30px rgba(99,102,241,0.1), inset 0 0 30px rgba(99,102,241,0.04) !important; }
        .ip-remove:hover { color:var(--text-secondary) !important; }
        .ip-submit { transition:all 0.2s; }
        .ip-submit:not(:disabled):hover { box-shadow:0 8px 28px rgba(99,102,241,0.45) !important; transform:translateY(-1px); }
        .ip-submit:active { transform:translateY(0) !important; }
      `}</style>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

        {/* ── Mode toggle ── */}
        <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.03)", padding:4, borderRadius:11, border:"1px solid rgba(255,255,255,0.07)" }}>
          {(["paste","upload"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} className={`ip-mode-btn ${mode===m ? "ip-mode-active" : "ip-mode-inactive"}`}>
              {m === "paste" ? "✏️  Paste Text" : "📄  Upload PDF"}
            </button>
          ))}
        </div>

        {/* ── UPLOAD MODE ── */}
        {mode === "upload" && (
          <>
            {/* Beta notice */}
            {!isScanned && (
              <div style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"9px 12px", background:"rgba(251,191,36,0.05)", border:"1px solid rgba(251,191,36,0.14)", borderRadius:10, fontSize:12 }}>
                <span style={{ flexShrink:0, fontSize:14 }}>📷</span>
                <span style={{ color:"#92400e", lineHeight:1.6 }}>
                  <strong style={{ color:"#fbbf24" }}>Text PDFs</strong> work great.{" "}
                  <strong style={{ color:"#fbbf24" }}>Scanned PDFs</strong> are in beta — best on clear pages up to 5 pages. For better results, copy-paste the text instead.
                </span>
              </div>
            )}

            {/* Drop zone */}
            <div
              className={`ip-drop${dragOver ? " drag-active" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{ borderRadius:14, padding:"32px 20px", textAlign:"center", border:"2px dashed rgba(255,255,255,0.09)", background:"rgba(255,255,255,0.02)", cursor:"pointer", transition:"all 0.25s" }}
            >
              <input ref={fileRef} type="file" accept=".pdf" style={{ display:"none" }}
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />

              {extracting ? (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                  <div style={{ width:28, height:28, border:"2.5px solid rgba(255,255,255,0.1)", borderTopColor:"#818cf8", borderRadius:"50%", animation:"ip-spin 0.65s linear infinite" }} />
                  <p style={{ color:"var(--text-secondary)", fontSize:13, margin:0 }}>Reading PDF pages…</p>
                </div>
              ) : file && (text || visionImages) ? (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <div style={{ width:46, height:46, borderRadius:13, background: isScanned ? "rgba(251,191,36,0.1)" : "rgba(52,211,153,0.1)", border:`1px solid ${isScanned ? "rgba(251,191,36,0.3)" : "rgba(52,211,153,0.3)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
                    {isScanned ? "🖼️" : "✅"}
                  </div>
                  <p style={{ color: isScanned ? "#fbbf24" : "#34d399", fontSize:13, fontWeight:700, margin:0 }}>{file.name}</p>
                  <p style={{ color:"var(--text-muted)", fontSize:12, margin:0 }}>
                    {formatFileSize(file.size)} · {isScanned ? `${visionImages?.length} page(s) — scanned (beta)` : "Text extracted ✓"}
                  </p>

                  {isScanned && qualityWarning === "low" && (
                    <div style={{ marginTop:4, padding:"8px 12px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:9, fontSize:12, color:"#fca5a5" }}>
                      ⚠️ Scan quality looks low — try a clearer scan for better results.
                    </div>
                  )}
                  {isScanned && qualityWarning === "medium" && (
                    <div style={{ marginTop:4, padding:"8px 12px", background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:9, fontSize:12, color:"#fde68a" }}>
                      ⚡ Moderate scan quality — AI will do its best.
                    </div>
                  )}

                  <button className="ip-remove" onClick={e => { e.stopPropagation(); clearFile(); }}
                    style={{ marginTop:4, fontSize:12, color:"var(--text-muted)", background:"none", border:"none", cursor:"pointer", textDecoration:"underline", fontFamily:"var(--font-body)", transition:"color 0.15s" }}>
                    Remove file
                  </button>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <div style={{ width:46, height:46, borderRadius:13, background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.18)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>📄</div>
                  <p style={{ color:"var(--text-secondary)", fontSize:14, margin:0, fontWeight:500 }}>Drop your PDF here or click to browse</p>
                  <p style={{ color:"var(--text-muted)", fontSize:12, margin:0 }}>Text or scanned · Max 30MB</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── PASTE MODE ── */}
        {mode === "paste" && (
          <textarea
            className="input-glass"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={placeholder}
            rows={9}
            style={{ borderRadius:12, padding:"14px 16px", lineHeight:1.65, width:"100%", minHeight:200, resize:"vertical" }}
          />
        )}

        {/* ── Errors / hints ── */}
        {extractError && (
          <div style={{ display:"flex", gap:8, padding:"9px 12px", background:"rgba(36,10,10,0.7)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:9, fontSize:12.5, color:"#fca5a5" }}>
            <span style={{ flexShrink:0 }}>⚠</span>{extractError}
          </div>
        )}
        {hint && !text && !visionImages && (
          <div style={{ display:"flex", gap:7, alignItems:"flex-start", fontSize:12.5, color:"var(--text-muted)", lineHeight:1.6 }}>
            <span style={{ flexShrink:0, opacity:0.7 }}>💡</span>{hint}
          </div>
        )}

        {/* ── Loading bar ── */}
        <LoadingBar active={loading} isVision={mode === "upload"} />

        {/* ── Submit button ── */}
        <button
          className="btn-primary ip-submit"
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{ padding:"14px 0", borderRadius:12, fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:8, position:"relative", overflow:"hidden", boxShadow: canSubmit ? "0 4px 20px rgba(99,102,241,0.3)" : "none" }}
        >
          {loading ? (
            <>
              {/* progress fill */}
              <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${progress}%`, background:"rgba(255,255,255,0.12)", transition:"width 0.5s ease", borderRadius:12 }} />
              <div style={{ display:"flex", alignItems:"center", gap:8, position:"relative" }}>
                <div style={{ width:14, height:14, border:"2px solid rgba(255,255,255,0.2)", borderTopColor:"#fff", borderRadius:"50%", animation:"ip-spin 0.65s linear infinite" }} />
                <span>{progress > 0 ? `Processing… ${progress}%` : "Starting…"}</span>
              </div>
            </>
          ) : extracting ? (
            <><div style={{ width:14, height:14, border:"2px solid rgba(255,255,255,0.2)", borderTopColor:"#fff", borderRadius:"50%", animation:"ip-spin 0.65s linear infinite" }} /> Reading PDF…</>
          ) : buttonLabel}
        </button>
      </div>
    </>
  );
}
