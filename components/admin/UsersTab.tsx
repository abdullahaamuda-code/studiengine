"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  limit,
  Timestamp,
} from "firebase/firestore";

interface UserRow {
  id: string;
  quizCount: number;
  scanCount: number;
  isPremium: boolean;
  lastReset: string;
  email?: string;
  premiumExpiry?: any;
}

export default function UsersTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [resettingAll, setResettingAll] = useState(false);
  const [expiryInputs, setExpiryInputs] = useState<Record<string, string>>({});

  // Bulk premium state
  const [bulkExpiry, setBulkExpiry] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [expandBulk, setExpandBulk] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const snap = await getDocs(query(collection(db, "usage"), limit(200)));
      const data = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as UserRow[];
      setUsers(data);
      const next: Record<string, string> = {};
      data.forEach(u => {
        if (u.premiumExpiry?.toDate) {
          const d = u.premiumExpiry.toDate() as Date;
          next[u.id] = d.toISOString().slice(0, 10);
        }
      });
      setExpiryInputs(next);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function toast(msg: string) {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(""), 3500);
  }

  async function setPremiumFlag(userId: string, value: boolean) {
    await setDoc(doc(db, "usage", userId), { isPremium: value }, { merge: true });
    toast(value ? "Premium granted ✓" : "Premium removed ✓");
    load();
  }

  async function setPremiumUntil(userId: string) {
    const dateStr = expiryInputs[userId];
    if (!dateStr) { alert("Pick a date first"); return; }
    const date = new Date(dateStr + "T23:59:59");
    await setDoc(doc(db, "usage", userId), { isPremium: true, premiumExpiry: Timestamp.fromDate(date) }, { merge: true });
    toast(`Premium until ${dateStr} ✓`);
    load();
  }

  async function resetLimits(userId: string) {
    const today = new Date().toISOString().split("T")[0];
    await updateDoc(doc(db, "usage", userId), { quizCount: 0, scanCount: 0, lastReset: today });
    toast("Limits reset ✓");
    load();
  }

  async function deleteUser(userId: string) {
    await deleteDoc(doc(db, "usage", userId));
    toast("User deleted ✓");
    load();
  }

  async function resetAll() {
    if (!confirm("Reset ALL user limits?")) return;
    setResettingAll(true);
    const today = new Date().toISOString().split("T")[0];
    const snap = await getDocs(collection(db, "usage"));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { quizCount: 0, scanCount: 0, lastReset: today }));
    await batch.commit();
    toast(`Reset ${snap.size} users ✓`);
    setResettingAll(false);
    load();
  }

  // Grant ALL users premium (with optional expiry date)
  async function grantAllPremium() {
    if (!confirm(`Grant Premium to ALL ${users.length} users? ${bulkExpiry ? `Expires: ${bulkExpiry}` : "No expiry date set"}`)) return;
    setBulkLoading(true);
    try {
      const snap = await getDocs(collection(db, "usage"));
      const batch = writeBatch(db);
      const payload: any = { isPremium: true };
      if (bulkExpiry) {
        payload.premiumExpiry = Timestamp.fromDate(new Date(bulkExpiry + "T23:59:59"));
      }
      snap.docs.forEach(d => batch.set(d.ref, payload, { merge: true }));
      await batch.commit();
      toast(`⚡ Premium granted to ${snap.size} users ✓`);
      load();
    } catch (e: any) {
      setError(e.message);
    }
    setBulkLoading(false);
  }

  // Remove ALL users premium
  async function revokeAllPremium() {
    if (!confirm(`Remove Premium from ALL ${users.filter(u => u.isPremium).length} premium users?`)) return;
    setRevokeLoading(true);
    try {
      const snap = await getDocs(collection(db, "usage"));
      const batch = writeBatch(db);
      snap.docs.forEach(d => {
        batch.set(d.ref, { isPremium: false, premiumExpiry: null }, { merge: true });
      });
      await batch.commit();
      toast(`Premium removed from all users ✓`);
      load();
    } catch (e: any) {
      setError(e.message);
    }
    setRevokeLoading(false);
  }

  const filtered = users.filter(u =>
    u.id.toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const premiumCount = users.filter(u => u.isPremium).length;
  const freeCount = users.length - premiumCount;

  return (
    <div>
      <style>{`
        .users-input { background: rgba(8,20,40,0.8); border: 1px solid rgba(56,139,253,0.2); border-radius: 10px; color: #e2e8f0; padding: 10px 14px; font-size: 13px; outline: none; font-family: inherit; }
        .users-input:focus { border-color: rgba(96,165,250,0.5); }
        .action-btn { font-size: 11px; padding: 5px 11px; border-radius: 8px; cursor: pointer; font-family: inherit; white-space: nowrap; transition: opacity 0.15s; }
        .action-btn:hover { opacity: 0.8; }
        .bulk-panel { background: rgba(8,20,40,0.7); border: 1px solid rgba(251,191,36,0.2); border-radius: 14px; padding: 16px 18px; margin-bottom: 20px; }
        @media (max-width: 640px) {
          .user-row { flex-direction: column !important; align-items: flex-start !important; }
          .user-actions { width: 100%; justify-content: flex-start !important; }
          .user-stats { width: 100%; }
          .bulk-row { flex-direction: column !important; }
        }
      `}</style>

      {/* Toast */}
      {actionMsg && (
        <div style={{ marginBottom: 12, padding: "9px 14px", background: "rgba(5,150,105,0.12)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, color: "#4ade80", fontSize: 13 }}>
          {actionMsg}
        </div>
      )}
      {error && (
        <div style={{ marginBottom: 12, padding: "9px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Summary pills */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ padding: "6px 14px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 20, fontSize: 12, color: "#fbbf24" }}>
          ⚡ {premiumCount} Premium
        </div>
        <div style={{ padding: "6px 14px", background: "rgba(100,116,139,0.1)", border: "1px solid rgba(100,116,139,0.2)", borderRadius: 20, fontSize: 12, color: "#94a3b8" }}>
          🆓 {freeCount} Free
        </div>
        <div style={{ padding: "6px 14px", background: "rgba(56,139,253,0.1)", border: "1px solid rgba(56,139,253,0.2)", borderRadius: 20, fontSize: 12, color: "#60a5fa" }}>
          👥 {users.length} Total
        </div>
      </div>

      {/* Bulk Premium Panel */}
      <div className="bulk-panel">
        <button
          onClick={() => setExpandBulk(v => !v)}
          style={{ background: "none", border: "none", color: "#fbbf24", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", padding: 0, display: "flex", alignItems: "center", gap: 8, width: "100%" }}
        >
          <span style={{ fontSize: 16 }}>⚡</span>
          Bulk Premium Controls
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#475569" }}>{expandBulk ? "▲ collapse" : "▼ expand"}</span>
        </button>

        {expandBulk && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 11, color: "#64748b", marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Optional: set expiry date for bulk grant
            </p>
            <div className="bulk-row" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
              <input
                type="date"
                value={bulkExpiry}
                onChange={e => setBulkExpiry(e.target.value)}
                className="users-input"
                style={{ flex: "0 0 auto" }}
              />
              <span style={{ fontSize: 12, color: "#334155" }}>
                {bulkExpiry ? `All users will expire on ${bulkExpiry}` : "No date = permanent premium"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={grantAllPremium}
                disabled={bulkLoading}
                style={{
                  padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(251,191,36,0.35)",
                  background: bulkLoading ? "rgba(251,191,36,0.05)" : "rgba(251,191,36,0.12)",
                  color: "#fbbf24", fontSize: 13, fontWeight: 600, cursor: bulkLoading ? "not-allowed" : "pointer",
                  fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {bulkLoading ? "Granting..." : `⚡ Grant All ${users.length} Users Premium`}
              </button>
              <button
                onClick={revokeAllPremium}
                disabled={revokeLoading}
                style={{
                  padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)",
                  background: revokeLoading ? "rgba(239,68,68,0.05)" : "rgba(239,68,68,0.1)",
                  color: "#f87171", fontSize: 13, fontWeight: 600, cursor: revokeLoading ? "not-allowed" : "pointer",
                  fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {revokeLoading ? "Revoking..." : `✕ Remove All Premium (${premiumCount} users)`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search + Reset All row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by email or ID..."
          className="users-input"
          style={{ flex: 1, minWidth: 180 }}
        />
        <button
          onClick={resetAll}
          disabled={resettingAll}
          style={{
            padding: "10px 16px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)",
            borderRadius: 10, color: "#fbbf24", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
          }}
        >
          {resettingAll ? "Resetting..." : "🔄 Reset All Limits"}
        </button>
      </div>

      {/* User list */}
      {loading ? (
        <p style={{ color: "#475569", fontSize: 13 }}>Loading users...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(u => {
            const isGuest = u.id.startsWith("guest_");
            const now = new Date();
            const expDate: Date | null = u.premiumExpiry?.toDate ? u.premiumExpiry.toDate() : null;
            const isActivePremium = u.isPremium && expDate && expDate.getTime() > now.getTime();
            const statusLabel = isActivePremium
              ? `⚡ Until ${expDate!.toISOString().slice(0, 10)}`
              : u.isPremium && expDate
              ? "⚠️ Expired"
              : u.isPremium
              ? "⚡ Premium"
              : "Free";

            return (
              <div
                key={u.id}
                className="user-row"
                style={{
                  background: "rgba(8,20,40,0.6)",
                  border: `1px solid ${isActivePremium ? "rgba(251,191,36,0.15)" : "rgba(56,139,253,0.12)"}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                {/* User info */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ fontSize: 13, color: "#e2e8f0", margin: "0 0 2px", fontWeight: 500 }}>
                    {u.email || (isGuest ? "Guest user" : "No email")}
                  </p>
                  <p style={{ fontSize: 10, color: "#64748b", margin: "0 0 2px" }}>
                    {isGuest ? "👤" : "🔐"} <span style={{ color: "#60a5fa" }}>{u.id}</span>
                  </p>
                  <p style={{ fontSize: 10, color: "#334155", margin: 0 }}>Last reset: {u.lastReset || "—"}</p>
                </div>

                {/* Stats */}
                <div className="user-stats" style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 10, color: "#334155", margin: "0 0 2px" }}>CBTs</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: u.quizCount >= 3 ? "#f87171" : "#4ade80", margin: 0 }}>{u.quizCount}</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 10, color: "#334155", margin: "0 0 2px" }}>Scans</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#94a3b8", margin: 0 }}>{u.scanCount}</p>
                  </div>
                </div>

                {/* Plan + expiry date */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 160 }}>
                  <span style={{
                    fontSize: 11, padding: "4px 12px", borderRadius: 20, width: "fit-content",
                    background: isActivePremium ? "rgba(251,191,36,0.12)" : u.isPremium && expDate ? "rgba(239,68,68,0.1)" : "rgba(30,41,59,0.6)",
                    color: isActivePremium ? "#fbbf24" : u.isPremium && expDate ? "#f87171" : "#475569",
                    border: `1px solid ${isActivePremium ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.06)"}`,
                  }}>
                    {statusLabel}
                  </span>
                  {/* Date picker — always visible when premium, also shown for free to set + grant */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      type="date"
                      value={expiryInputs[u.id] || ""}
                      onChange={e => setExpiryInputs(prev => ({ ...prev, [u.id]: e.target.value }))}
                      style={{
                        fontSize: 11, padding: "4px 8px", borderRadius: 8,
                        border: "1px solid rgba(148,163,184,0.25)", background: "rgba(15,23,42,0.9)", color: "#e5e7eb",
                        fontFamily: "inherit", outline: "none",
                      }}
                    />
                    <button
                      onClick={() => setPremiumUntil(u.id)}
                      style={{
                        fontSize: 11, padding: "5px 9px", borderRadius: 8,
                        border: "1px solid rgba(59,130,246,0.4)", background: "rgba(37,99,235,0.15)",
                        color: "#93c5fd", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
                      }}
                    >
                      {u.isPremium ? "Update" : "Grant ⚡"}
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="user-actions" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    className="action-btn"
                    onClick={() => setPremiumFlag(u.id, !u.isPremium)}
                    style={{
                      border: `1px solid ${u.isPremium ? "#f8717135" : "#fbbf2435"}`,
                      background: `${u.isPremium ? "#f87171" : "#fbbf24"}15`,
                      color: u.isPremium ? "#f87171" : "#fbbf24",
                    }}
                  >
                    {u.isPremium ? "Remove ⚡" : "Grant ⚡"}
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => resetLimits(u.id)}
                    style={{ border: "1px solid #60a5fa35", background: "#60a5fa15", color: "#60a5fa" }}
                  >
                    Reset
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => { if (confirm(`Delete ${u.email || u.id}?`)) deleteUser(u.id); }}
                    style={{ border: "1px solid #f8717135", background: "#f8717110", color: "#f87171" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p style={{ color: "#334155", fontSize: 13, textAlign: "center", padding: 32 }}>No users found</p>
          )}
        </div>
      )}
    </div>
  );
}
