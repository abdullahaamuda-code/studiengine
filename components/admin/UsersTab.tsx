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
} from "firebase/firestore";

interface UserRow {
  id: string;
  quizCount: number;
  scanCount: number;
  isPremium: boolean;
  lastReset: string;
  email?: string;
}

export default function UsersTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [resettingAll, setResettingAll] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const snap = await getDocs(query(collection(db, "usage"), limit(100)));
      setUsers(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as UserRow[]);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function toast(msg: string) {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(""), 3000);
  }

  async function setPremium(userId: string, value: boolean) {
    await setDoc(doc(db, "usage", userId), { isPremium: value }, { merge: true });
    toast(value ? "Premium granted ✓" : "Premium removed ✓");
    load();
  }

  async function resetLimits(userId: string) {
    const today = new Date().toISOString().split("T")[0];
    await updateDoc(doc(db, "usage", userId), {
      quizCount: 0,
      scanCount: 0,
      lastReset: today,
    });
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
    snap.docs.forEach(d =>
      batch.update(d.ref, { quizCount: 0, scanCount: 0, lastReset: today })
    );
    await batch.commit();
    toast(`Reset ${snap.size} users ✓`);
    setResettingAll(false);
    load();
  }

  const filtered = users.filter(
    u =>
      u.id.toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const btn = (color: string, label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      style={{
        fontSize: 11,
        padding: "5px 11px",
        borderRadius: 8,
        border: `1px solid ${color}35`,
        background: `${color}15`,
        color,
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap" as const,
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      {actionMsg && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 14px",
            background: "rgba(5,150,105,0.12)",
            border: "1px solid rgba(16,185,129,0.25)",
            borderRadius: 8,
            color: "#4ade80",
            fontSize: 13,
          }}
        >
          {actionMsg}
        </div>
      )}
      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 14px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 8,
            color: "#f87171",
            fontSize: 13,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by email or ID..."
          style={{
            flex: 1,
            background: "rgba(8,20,40,0.8)",
            border: "1px solid rgba(56,139,253,0.2)",
            borderRadius: 10,
            color: "#e2e8f0",
            padding: "10px 14px",
            fontSize: 13,
            outline: "none",
          }}
        />
        <button
          onClick={resetAll}
          disabled={resettingAll}
          style={{
            padding: "10px 16px",
            background: "rgba(251,191,36,0.1)",
            border: "1px solid rgba(251,191,36,0.25)",
            borderRadius: 10,
            color: "#fbbf24",
            fontSize: 12,
            cursor: "pointer",
            whiteSpace: "nowrap",
            fontFamily: "inherit",
          }}
        >
          {resettingAll ? "Resetting..." : "🔄 Reset All"}
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#475569", fontSize: 13 }}>Loading users...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(u => {
            const isGuest = u.id.startsWith("guest_");
            return (
              <div
                key={u.id}
                style={{
                  background: "rgba(8,20,40,0.6)",
                  border: "1px solid rgba(56,139,253,0.12)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap" as const,
                }}
              >
                {/* User info */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#e2e8f0",
                      margin: "0 0 3px",
                      fontWeight: 500,
                    }}
                  >
                    {u.email ||
                      (isGuest ? "Guest user" : "No email yet")}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      color: "#64748b",
                      margin: "0 0 2px",
                    }}
                  >
                    {isGuest ? "👤 Guest ID:" : "🔐 User ID:"}{" "}
                    <span style={{ color: "#60a5fa" }}>{u.id}</span>
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      color: "#334155",
                      margin: 0,
                    }}
                  >
                    Last reset: {u.lastReset || "-"}
                  </p>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <p
                      style={{
                        fontSize: 10,
                        color: "#334155",
                        margin: "0 0 2px",
                      }}
                    >
                      CBTs
                    </p>
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color:
                          u.quizCount >= 3 ? "#f87171" : "#4ade80",
                        margin: 0,
                      }}
                    >
                      {u.quizCount}
                    </p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p
                      style={{
                        fontSize: 10,
                        color: "#334155",
                        margin: "0 0 2px",
                      }}
                    >
                      Scans
                    </p>
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#94a3b8",
                        margin: 0,
                      }}
                    >
                      {u.scanCount}
                    </p>
                  </div>
                </div>

                {/* Plan */}
                <span
                  style={{
                    fontSize: 11,
                    padding: "4px 12px",
                    borderRadius: 20,
                    background: u.isPremium
                      ? "rgba(251,191,36,0.12)"
                      : "rgba(30,41,59,0.6)",
                    color: u.isPremium ? "#fbbf24" : "#475569",
                    border: `1px solid ${
                      u.isPremium
                        ? "rgba(251,191,36,0.25)"
                        : "rgba(255,255,255,0.06)"
                    }`,
                  }}
                >
                  {u.isPremium ? "⚡ Premium" : "Free"}
                </span>

                {/* Actions */}
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap" as const,
                  }}
                >
                  {btn(
                    u.isPremium ? "#f87171" : "#fbbf24",
                    u.isPremium ? "Remove ⚡" : "Grant ⚡",
                    () => setPremium(u.id, !u.isPremium)
                  )}
                  {btn("#60a5fa", "Reset", () => resetLimits(u.id))}
                  {btn("#f87171", "Delete", () => {
                    if (confirm(`Delete ${u.email || u.id}?`)) deleteUser(u.id);
                  })}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p
              style={{
                color: "#334155",
                fontSize: 13,
                textAlign: "center",
                padding: 24,
              }}
            >
              No users found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
