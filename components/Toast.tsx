"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface Toast { id: number; msg: string; type: "success" | "error" | "info"; }
interface ToastCtx { show: (msg: string, type?: Toast["type"]) => void; }

const ToastContext = createContext<ToastCtx>({ show: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((msg: string, type: Toast["type"] = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <style>{`
        @keyframes toast-in  { from{opacity:0;transform:translateX(-50%) translateY(10px) scale(0.95)} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
        @keyframes toast-out { from{opacity:1;transform:translateX(-50%) scale(1)} to{opacity:0;transform:translateX(-50%) scale(0.95)} }
        .toast-base {
          position:fixed; left:50%; transform:translateX(-50%);
          z-index:300; padding:10px 20px; border-radius:99px;
          font-size:13px; font-weight:700; font-family:var(--font-body);
          white-space:nowrap; pointer-events:none;
          backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
          letter-spacing:0.01em;
          animation:toast-in 0.25s cubic-bezier(0.4,0,0.2,1);
          display:flex; align-items:center; gap:7px;
        }
        .toast-success { background:rgba(4,47,29,0.92); color:#6ee7b7; border:1px solid rgba(52,211,153,0.35); box-shadow:0 8px 24px rgba(0,0,0,0.5),0 0 16px rgba(52,211,153,0.15); }
        .toast-error   { background:rgba(36,10,10,0.92); color:#fca5a5; border:1px solid rgba(248,113,113,0.35); box-shadow:0 8px 24px rgba(0,0,0,0.5),0 0 16px rgba(239,68,68,0.15); }
        .toast-info    { background:rgba(30,27,75,0.92); color:#c7d2fe; border:1px solid rgba(99,102,241,0.35); box-shadow:0 8px 24px rgba(0,0,0,0.5),0 0 16px rgba(99,102,241,0.15); }
      `}</style>

      {/* Toast stack */}
      <div style={{ position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)", zIndex:300, display:"flex", flexDirection:"column-reverse", gap:8, alignItems:"center", pointerEvents:"none" }}>
        {toasts.map((t, i) => (
          <div key={t.id} className={`toast-base toast-${t.type}`} style={{ bottom: i * 0 }}>
            <span style={{ fontSize:14 }}>{t.type === "success" ? "✓" : t.type === "error" ? "⚠" : "ℹ"}</span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() { return useContext(ToastContext); }
