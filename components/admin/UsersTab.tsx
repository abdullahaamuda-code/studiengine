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
    setLoading(true);
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
      setActionMsg(action === "delete_user" ? "User deleted" : action === "set_premium" ? `Premium ${value ? "granted" : "removed"}` : "Limits reset");
      setTimeout(() => setActionMsg(""), 3000);
      load();
    } catch (e: any) { setError(e.message); }
  }

  async function resetAll() {
    if (!confirm("Reset ALL user limits? This clears today's CBT counts for everyone.")) return;
    setResettingAll(true);
    await doAction("reset_all_limits", "");
    setResettingAll(false);
  }

  const filtered = users.filter(u =>
    u.id.toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {actionMsg && <div style={{ marginBottom: 12, padding: "8px 14px", background: "rgba(5,150,105,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, color: "#4ade80", fontSize: 13 }}>✓ {actionMsg}</div>}
      {error && <div style={{ marginBottom: 12, padding: "8px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13 }}>⚠️ {error} — Firebase Admin SDK may need service account setup</div>}

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by ID or email..."
          style={{ flex: 1, background: "rgba(8,20,40,0.8)", border: "1px solid rgba(56,139,253,0.2)", borderRadius: 8, color: "#e2e8f0", padding: "9px 12px", fontSize: 13, outline: "none" }} />
        <button onClick={resetAll} disabled={resettingAll} style={{ padding: "9px 14px", background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 8, color: "#fbbf24", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
          {resettingAll ? "Resetting..." : "Reset All Limits"}
        </button>
      </div>

      {loading ? <p style={{ color: "#64748b", fontSize: 13 }}>Loading users...</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 11, color: "#475569", padding: "0 12px", display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 120px", gap: 8 }}>
            <span>USER ID</span><span>CBTs</span><span>SCANS</span><span>PLAN</span><span>ACTIONS</span>
          </div>
          {filtered.map(u => (
            <div key={u.id} style={{ background: "rgba(8,20,40,0.6)", border: "1px solid rgba(56,139,253,0.12)", borderRadius: 10, padding: "12px", display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 120px", gap: 8, alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 12, color: "#e2e8f0", margin: 0, wordBreak: "break-all" }}>{u.id.startsWith("guest_") ? "👤 Guest" : "🔐 " + u.id.slice(0, 16) + "..."}</p>
                <p style={{ fontSize: 10, color: "#475569", margin: 0 }}>{u.lastReset}</p>
              </div>
              <span style={{ fontSize: 13, color: u.quizCount >= 3 ? "#f87171" : "#4ade80" }}>{u.quizCount}</span>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>{u.scanCount}</span>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, background: u.isPremium ? "rgba(251,191,36,0.15)" : "rgba(30,41,59,0.5)", color: u.isPremium ? "#fbbf24" : "#64748b", border: `1px solid ${u.isPremium ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.06)"}` }}>
                {u.isPremium ? "⚡ Premium" : "Free"}
              </span>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                <button onClick={() => doAction("set_premium", u.id, !u.isPremium)} style={{ fontSize: 10, padding: "3px 8px", background: u.isPremium ? "rgba(239,68,68,0.15)" : "rgba(251,191,36,0.15)", border: `1px solid ${u.isPremium ? "rgba(239,68,68,0.3)" : "rgba(251,191,36,0.3)"}`, borderRadius: 6, color: u.isPremium ? "#f87171" : "#fbbf24", cursor: "pointer" }}>
                  {u.isPremium ? "Remove ⚡" : "Grant ⚡"}
                </button>
                <button onClick={() => doAction("reset_limits", u.id)} style={{ fontSize: 10, padding: "3px 8px", background: "rgba(37,99,235,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 6, color: "#60a5fa", cursor: "pointer" }}>Reset</button>
                <button onClick={() => { if (confirm("Delete this user?")) doAction("delete_user", u.id); }} style={{ fontSize: 10, padding: "3px 8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, color: "#f87171", cursor: "pointer" }}>Del</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p style={{ color: "#475569", fontSize: 13 }}>No users found</p>}
        </div>
      )}
    </div>
  );
}
