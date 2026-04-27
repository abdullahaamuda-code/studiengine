"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, limit } from "firebase/firestore";

interface UserOption {
  id: string;
  email?: string;
  isPremium?: boolean;
}

export default function EmailTab() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipientMode, setRecipientMode] = useState<"all" | "free" | "premium" | "specific" | "select">("all");
  const [specificEmail, setSpecificEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  // User selector state
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    if (recipientMode === "select") loadUsers();
  }, [recipientMode]);

  async function loadUsers() {
    setUsersLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "usage"), limit(200)));
      const data = snap.docs
        .map(d => ({ id: d.id, ...(d.data() as any) } as UserOption))
        .filter(u => u.email); // only users with emails
      setAllUsers(data);
    } catch (e: any) {
      setError(e.message);
    }
    setUsersLoading(false);
  }

  function toggleUser(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    const visible = filteredUsers.map(u => u.id);
    setSelectedIds(prev => {
      const next = new Set(prev);
      visible.forEach(id => next.add(id));
      return next;
    });
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  const filteredUsers = allUsers.filter(u =>
    (u.email || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    u.id.toLowerCase().includes(userSearch.toLowerCase())
  );

  async function send() {
    if (!subject || !body) { setError("Fill in subject and message."); return; }
    if (recipientMode === "select" && selectedIds.size === 0) {
      setError("Select at least one user.");
      return;
    }
    setLoading(true); setError(""); setResult("");
    try {
      const payload: any = { subject, body, recipients: recipientMode };
      if (recipientMode === "specific") payload.specificEmail = specificEmail;
      if (recipientMode === "select") payload.selectedEmails = allUsers.filter(u => selectedIds.has(u.id)).map(u => u.email);

      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-uid": user?.uid || "" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(`✓ Sent to ${data.sent} recipient(s)`);
      setSubject(""); setBody(""); setSelectedIds(new Set());
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  const templates = [
    { label: "🚀 New Feature", subject: "New on Studiengine!", body: "Hi,\n\nWe just launched something new on Studiengine that you'll love.\n\nBest,\nStudiengine" },
    { label: "⚙️ Maintenance", subject: "Scheduled maintenance", body: "Hi,\n\nWe will be performing maintenance on [DATE] from [TIME].\n\nSorry for any inconvenience.\n\nStudiengine" },
    { label: "⚡ Premium Launch", subject: "Premium is now available!", body: "Hi,\n\nStudiengine Premium is now available! Get unlimited CBTs, up to 30 questions, full review, and more.\n\nStudiengine" },
    { label: "🎓 Study Tip", subject: "Your weekly study tip", body: "Hi,\n\nHere's your weekly study tip from Studiengine:\n\n[TIP HERE]\n\nKeep studying smart!\nStudiengine" },
  ];

  const recipientOptions = [
    { value: "all", label: "All Users" },
    { value: "free", label: "Free Users" },
    { value: "premium", label: "Premium" },
    { value: "specific", label: "Specific Email" },
    { value: "select", label: "🎯 Pick Users" },
  ];

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(8,20,40,0.8)", border: "1px solid rgba(56,139,253,0.15)",
    borderRadius: 10, color: "#e2e8f0", padding: "11px 14px", fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  return (
    <div style={{ maxWidth: 620 }}>
      <style>{`
        .email-input:focus { border-color: rgba(96,165,250,0.5) !important; }
        .user-pick-row { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; border: 1px solid rgba(56,139,253,0.1); background: rgba(8,20,40,0.5); cursor: pointer; transition: background 0.15s; margin-bottom: 6px; }
        .user-pick-row:hover { background: rgba(37,99,235,0.1); }
        .user-pick-row.selected { background: rgba(37,99,235,0.15); border-color: rgba(59,130,246,0.35); }
        @media (max-width: 600px) {
          .recipient-opts { flex-direction: column !important; }
          .recipient-opts button { width: 100%; text-align: left; }
          .template-btns { flex-direction: column !important; }
        }
      `}</style>

      {result && (
        <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(5,150,105,0.12)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10, color: "#4ade80", fontSize: 13 }}>
          {result}
        </div>
      )}
      {error && (
        <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#f87171", fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Templates */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, color: "#475569", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Templates</p>
        <div className="template-btns" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {templates.map(t => (
            <button
              key={t.label}
              onClick={() => { setSubject(t.subject); setBody(t.body); }}
              style={{
                fontSize: 12, padding: "7px 14px", background: "rgba(37,99,235,0.12)",
                border: "1px solid rgba(59,130,246,0.2)", borderRadius: 20,
                color: "#60a5fa", cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Send To */}
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 11, color: "#475569", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Send To</p>
        <div className="recipient-opts" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {recipientOptions.map(o => (
            <button
              key={o.value}
              onClick={() => { setRecipientMode(o.value as any); setSelectedIds(new Set()); }}
              style={{
                padding: "8px 16px", borderRadius: 10, border: "1px solid",
                borderColor: recipientMode === o.value ? "rgba(59,130,246,0.5)" : "rgba(56,139,253,0.15)",
                background: recipientMode === o.value ? "rgba(37,99,235,0.2)" : "transparent",
                color: recipientMode === o.value ? "#93c5fd" : "#475569",
                fontSize: 12, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Specific email input */}
        {recipientMode === "specific" && (
          <input
            value={specificEmail}
            onChange={e => setSpecificEmail(e.target.value)}
            placeholder="email@example.com"
            className="email-input"
            style={inputStyle}
          />
        )}

        {/* User selector */}
        {recipientMode === "select" && (
          <div style={{ background: "rgba(8,20,40,0.6)", border: "1px solid rgba(56,139,253,0.15)", borderRadius: 12, padding: "14px", marginTop: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>
                {selectedIds.size} selected · {allUsers.length} total with emails
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={selectAll}
                  style={{ fontSize: 11, padding: "4px 10px", background: "rgba(37,99,235,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, color: "#93c5fd", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Select all
                </button>
                <button
                  onClick={deselectAll}
                  style={{ fontSize: 11, padding: "4px 10px", background: "rgba(100,116,139,0.1)", border: "1px solid rgba(100,116,139,0.2)", borderRadius: 8, color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Clear
                </button>
              </div>
            </div>

            <input
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              placeholder="Filter users..."
              className="email-input"
              style={{ ...inputStyle, marginBottom: 10, fontSize: 12, padding: "8px 12px" }}
            />

            <div style={{ maxHeight: 260, overflowY: "auto", paddingRight: 2 }}>
              {usersLoading ? (
                <p style={{ color: "#475569", fontSize: 12, textAlign: "center", padding: 16 }}>Loading users...</p>
              ) : filteredUsers.length === 0 ? (
                <p style={{ color: "#334155", fontSize: 12, textAlign: "center", padding: 16 }}>No users with emails found</p>
              ) : (
                filteredUsers.map(u => {
                  const isSelected = selectedIds.has(u.id);
                  return (
                    <div
                      key={u.id}
                      className={`user-pick-row${isSelected ? " selected" : ""}`}
                      onClick={() => toggleUser(u.id)}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: 16, height: 16, borderRadius: 5, flexShrink: 0,
                        border: `1.5px solid ${isSelected ? "#3b82f6" : "rgba(100,116,139,0.4)"}`,
                        background: isSelected ? "#3b82f6" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {isSelected && <span style={{ fontSize: 9, color: "#fff", fontWeight: 800 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, color: "#e2e8f0", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {u.email}
                        </p>
                        <p style={{ fontSize: 10, color: "#475569", margin: 0 }}>
                          {u.isPremium ? "⚡ Premium" : "Free"} · {u.id.slice(0, 14)}…
                        </p>
                      </div>
                      {u.isPremium && (
                        <span style={{ fontSize: 10, color: "#fbbf24", flexShrink: 0 }}>⚡</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {selectedIds.size > 0 && (
              <div style={{ marginTop: 10, padding: "7px 12px", background: "rgba(37,99,235,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, fontSize: 11, color: "#93c5fd" }}>
                Will send to {selectedIds.size} user{selectedIds.size !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subject */}
      <input
        value={subject}
        onChange={e => setSubject(e.target.value)}
        placeholder="Subject line..."
        className="email-input"
        style={{ ...inputStyle, marginBottom: 10 }}
      />

      {/* Body */}
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Write your email here..."
        rows={7}
        className="email-input"
        style={{
          ...inputStyle, resize: "vertical", lineHeight: 1.6, marginBottom: 18,
        }}
      />

      <button
        onClick={send}
        disabled={loading}
        style={{
          padding: "13px 30px",
          background: loading ? "rgba(37,99,235,0.3)" : "linear-gradient(135deg,#2563eb,#0891b2)",
          border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: 8,
        }}
      >
        {loading ? (
          <>
            <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            Sending...
          </>
        ) : (
          `Send Email →`
        )}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
