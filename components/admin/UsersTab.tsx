"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface UserRow {
  id: string;
  quizCount: number;
  scanCount: number;
  isPremium: boolean;
  lastReset: string;
  email?: string;
}

export default function UsersTab() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [resettingAll, setResettingAll] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/users", { headers: { "x-admin-uid": user?.uid || "" } });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUsers(data.users);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }

  useEffect(() => { if (user) load(); }, [user]);

  async function doAction(action: string, userId: string, value?: any) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-uid": user?.uid || "" },
        body: JSON.stringify({ action, userId, value }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setActionMsg(action === "delete_user" ? "User deleted ✓" : action === "set_premium" ? `Premium ${value ? "granted ✓" : "removed ✓"}` : "Limits reset ✓");
      setTimeout(() => setActionMsg(""), 3000);
      load();
    } catch (e: any) { setError(e.message); }
  }

  async function resetAll() {
    if (!confirm("Reset ALL user limits?")) return;
    setResettingAll(true);
    await doAction("reset_all_limits", "");
    setResettingAll(false);
  }

  const filtered = users.filter(u =>
    u.id.toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const S = {
    card: { background: "rgba(8,20,40,0.6)", border: "1px solid rgba(56,139,253,0.12)", borderRadius: 12, padding: "14px 16px", marginBottom: 8 } as any,
    label: { fontSize: 10, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 2 },
    val: { fontSize: 13, color: "#e2e8f0", margin: 0 },
    btn: (color: string) => ({ fontSize: 11, padding: "5px 12px", borderRadius: 8, border: `1px solid ${color}40`, background: `${color}18`, color, cursor: "pointer" as const, fontFamily: "inherit" }),
  };

  return (
    <div>
      {actionMsg && <div style={{ marginBottom: 12, padding: "8px 14px", background: "rgba(5,150,105,0.12)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, color: "#4ade80", fontSize: 13 }}>{actionMsg}</div>}
      {error && <div style={{ marginBottom: 12, padding: "8px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13 }}>⚠️ {error}</div>}

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email or ID..."
          style={{ flex: 1, background: "rgba(8,20,40,0.8)", border: "1px solid rgba(56,139,253,0.2)", borderRadius: 10, color: "#e2e8f0", padding: "10px 14px", fontSize: 13, outline: "none" }} />
        <button onClick={resetAll} disabled={resettingAll}
          style={{ padding: "10px 16px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 10, color: "#fbbf24", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
          {resettingAll ? "Resetting..." : "🔄 Reset All"}
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#475569", fontSize: 13 }}>Loading users...</p>
      ) : (
        <div>
          <div style={{ fontSize: 10, color: "#334155", padding: "0 16px 8px", display: "grid", gridTemplateColumns: "1fr 60px 60px 100px auto", gap: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            <span>User</span><span>CBTs</span><span>Scans</span><span>Plan</span><span>Actions</span>
          </div>
          {filtered.map(u => (
            <div key={u.id} style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 60px 60px 100px auto", gap: 12, alignItems: "center" }}>
              {/* User info */}
              <div>
                <p style={{ fontSize: 13, color: "#e2e8f0", margin: "0 0 2px", fontWeight: 500 }}>
                  {u.email || (u.id.startsWith("guest_") ? "Guest user" : "No email")}
                </p>
                <p style={{ fontSize: 10, color: "#334155", margin: 0 }}>
                  {u.id.startsWith("guest_") ? "👤 Guest" : "🔐 Registered"} · {u.lastReset}
                </p>
              </div>

              {/* CBTs */}
              <span style={{ fontSize: 14, fontWeight: 600, color: u.quizCount >= 3 ? "#f87171" : "#4ade80", textAlign: "center" }}>
                {u.quizCount}
              </span>

              {/* Scans */}
              <span style={{ fontSize: 14, color: "#94a3b8", textAlign: "center" }}>{u.scanCount}</span>

              {/* Plan badge */}
              <div>
                <span style={{
                  fontSize: 11, padding: "4px 10px", borderRadius: 20, display: "inline-block",
                  background: u.isPremium ? "rgba(251,191,36,0.12)" : "rgba(30,41,59,0.6)",
                  color: u.isPremium ? "#fbbf24" : "#475569",
                  border: `1px solid ${u.isPremium ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.06)"}`,
                }}>
                  {u.isPremium ? "⚡ Premium" : "Free"}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={() => doAction("set_premium", u.id, !u.isPremium)}
                  style={S.btn(u.isPremium ? "#f87171" : "#fbbf24")}>
                  {u.isPremium ? "Remove ⚡" : "Grant ⚡"}
                </button>
                <button onClick={() => doAction("reset_limits", u.id)} style={S.btn("#60a5fa")}>Reset</button>
                <button onClick={() => { if (confirm(`Delete ${u.email || u.id}?`)) doAction("delete_user", u.id); }} style={S.btn("#f87171")}>Delete</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p style={{ color: "#334155", fontSize: 13, textAlign: "center", padding: 24 }}>No users found</p>}
        </div>
      )}
    </div>
  );
}
