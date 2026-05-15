"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

/* ─────────────────────────────────────────────
   LOGO
───────────────────────────────────────────── */
function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: size * 0.22, display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id="abg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d0f1a"/><stop offset="100%" stopColor="#111827"/>
        </linearGradient>
        <linearGradient id="astr" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8"/><stop offset="60%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#38bdf8"/>
        </linearGradient>
        <linearGradient id="aln" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e2440"/><stop offset="100%" stopColor="#252b50"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#abg)"/>
      <rect x="1" y="1" width="510" height="510" rx="111" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2"/>
      <rect x="160" y="96"  width="260" height="52" rx="26" fill="url(#aln)" opacity="0.9"/>
      <rect x="96"  y="166" width="320" height="52" rx="26" fill="url(#aln)" opacity="0.78"/>
      <rect x="96"  y="236" width="330" height="52" rx="26" fill="url(#aln)" opacity="0.62"/>
      <rect x="96"  y="306" width="320" height="52" rx="26" fill="url(#aln)" opacity="0.46"/>
      <rect x="96"  y="376" width="220" height="52" rx="26" fill="url(#aln)" opacity="0.30"/>
      <path d="M330 130 C330 130 330 86 256 86 C182 86 158 130 158 174 C158 218 194 238 256 256 C318 274 354 294 354 338 C354 382 330 426 256 426 C182 426 158 382 158 382"
        fill="none" stroke="url(#astr)" strokeWidth="42" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   INPUT
───────────────────────────────────────────── */
function Input({ type, placeholder, value, onChange, label }: {
  type: string; placeholder: string; value: string;
  onChange: (v: string) => void; label?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", letterSpacing: "0.04em" }}>{label}</label>}
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%", background: focused ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${focused ? "rgba(99,102,241,0.55)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 10, color: "#f1f5f9", padding: "12px 14px", fontSize: 14,
          outline: "none", fontFamily: "var(--font-body)", boxSizing: "border-box",
          transition: "all 0.2s",
          boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.1)" : "none",
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   INNER (needs useSearchParams)
───────────────────────────────────────────── */
function AuthInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signUp, continueAsGuest, user, isGuest, loading } = useAuth();

  const initMode = searchParams.get("mode") === "signin" ? "signin" : "signup";
  const initRef  = searchParams.get("ref") || "";

  const [mode, setMode]           = useState<"signup" | "signin" | "forgot">(initMode);
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [referral, setReferral]   = useState(initRef);
  const [showRef, setShowRef]     = useState(!!initRef);
  const [error, setError]         = useState("");
  const [info, setInfo]           = useState("");
  const [success, setSuccess]     = useState(false);  // signup success
  const [submitting, setSubmitting] = useState(false);

  /* redirect if already logged in */
  useEffect(() => {
    if (!loading && (user || isGuest)) router.replace("/app");
  }, [loading, user, isGuest, router]);

  /* clean URL params */
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/auth" + (mode === "signin" ? "?mode=signin" : ""));
    }
  }, [mode]);

  function reset() { setError(""); setInfo(""); }
  function switchMode(m: "signup" | "signin" | "forgot") { setMode(m); reset(); setSuccess(false); }

  async function handleSubmit() {
    if (!email)    { setError("Enter your email."); return; }
    if (mode !== "forgot" && !password) { setError("Enter your password."); return; }
    if (mode !== "forgot" && password.length < 6) { setError("Password must be at least 6 characters."); return; }
    reset(); setSubmitting(true);

    try {
      if (mode === "signin") {
        await signIn(email, password);
        router.replace("/app");
      } else if (mode === "signup") {
        await signUp(email, password, referral || undefined);
        setSuccess(true);
        setPassword("");
      }
    } catch (e: any) {
      setError(
        e.code === "auth/user-not-found"      ? "No account with that email." :
        e.code === "auth/wrong-password"       ? "Wrong password." :
        e.code === "auth/invalid-credential"   ? "Wrong email or password." :
        e.code === "auth/email-already-in-use" ? "Email already in use — sign in instead." :
        e.code === "auth/invalid-email"        ? "Invalid email address." :
        e.message || "Something went wrong."
      );
    }
    setSubmitting(false);
  }

  async function handleForgot() {
    if (!email) { setError("Enter your email first."); return; }
    reset(); setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo("Reset link sent! Check your inbox.");
    } catch (e: any) {
      setError(e.code === "auth/user-not-found" ? "No account with that email." : "Failed to send. Try again.");
    }
    setSubmitting(false);
  }

  function handleGuest() { continueAsGuest(); router.replace("/app"); }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#818cf8", borderRadius: "50%", animation: "spin 0.65s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", fontFamily: "var(--font-body)", color: "#f1f5f9", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes spin       { to{transform:rotate(360deg)} }
        @keyframes page-in    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes success-in { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        .auth-link { background:none; border:none; cursor:pointer; font-family:var(--font-body); font-size:13px; transition:color 0.15s; padding:0; }
        .auth-link:hover { text-decoration:underline; }
        .ref-toggle { background:none; border:none; cursor:pointer; font-family:var(--font-body); font-size:12px; color:#6366f1; padding:0; transition:color 0.15s; }
        .ref-toggle:hover { color:#818cf8; }
        .guest-btn:hover { background:rgba(255,255,255,0.06) !important; border-color:rgba(255,255,255,0.14) !important; }
        .mode-tab { background:none; border:none; cursor:pointer; font-family:var(--font-body); font-weight:700; font-size:15px; padding:10px 0; border-bottom:2px solid transparent; transition:all 0.2s; }
        .mode-tab-active { color:#f1f5f9 !important; border-bottom-color:#6366f1 !important; }
        .mode-tab-inactive { color:#334155 !important; }
        .mode-tab-inactive:hover { color:#64748b !important; }
        .submit-btn { transition:all 0.2s; }
        .submit-btn:not(:disabled):hover { box-shadow:0 8px 32px rgba(99,102,241,0.5) !important; transform:translateY(-1px); }
        .submit-btn:active { transform:translateY(0) !important; }
      `}</style>

      {/* Background orbs */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
        <div style={{ position:"absolute", top:"-10%", left:"-5%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.09) 0%,transparent 65%)", filter:"blur(80px)" }} />
        <div style={{ position:"absolute", bottom:"-5%", right:"-5%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(56,189,248,0.07) 0%,transparent 65%)", filter:"blur(80px)" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(99,102,241,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.02) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />
      </div>

      {/* Top nav */}
      <nav style={{ position:"relative", zIndex:10, padding:"0 24px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <button onClick={() => router.push("/landing")} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}>
          <Logo size={28} />
          <span style={{ fontSize:16, fontWeight:800, fontFamily:"var(--font-display)", letterSpacing:"-0.02em", background:"linear-gradient(135deg,#f1f5f9,#818cf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Studiengine</span>
        </button>
        <button onClick={handleGuest} style={{ fontSize:13, color:"#334155", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--font-body)", transition:"color 0.2s" }}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color="#64748b";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color="#334155";}}>
          Continue as guest →
        </button>
      </nav>

      {/* Main */}
      <div style={{ flex:1, position:"relative", zIndex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 16px" }}>
        <div style={{ width:"100%", maxWidth:420, animation:"page-in 0.4s cubic-bezier(0.4,0,0.2,1)" }}>

          {/* Card */}
          <div style={{ background:"rgba(10,13,22,0.97)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:22, overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
            {/* Top glow line */}
            <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(129,140,248,0.5),transparent)" }} />

            {/* SUCCESS STATE */}
            {success && (
              <div style={{ padding:"32px 28px", animation:"success-in 0.3s ease" }}>
                <div style={{ textAlign:"center", marginBottom:24 }}>
                  <div style={{ width:56, height:56, borderRadius:16, background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.25)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:26 }}>✓</div>
                  <h2 style={{ fontSize:20, fontWeight:800, fontFamily:"var(--font-display)", color:"#f1f5f9", margin:"0 0 6px", letterSpacing:"-0.02em" }}>Account created!</h2>
                  <p style={{ fontSize:13.5, color:"#475569", margin:0, lineHeight:1.65 }}>
                    You've successfully signed up. Sign in below to start studying.
                  </p>
                </div>
                <div style={{ padding:"11px 14px", background:"rgba(52,211,153,0.06)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:10, fontSize:12.5, color:"#6ee7b7", marginBottom:20, lineHeight:1.6 }}>
                  <strong>📧 {email}</strong> — your account is ready.
                </div>
                <button onClick={() => { switchMode("signin"); setSuccess(false); }} className="submit-btn" style={{ width:"100%", padding:"13px 0", background:"linear-gradient(135deg,#6366f1,#4f46e5,#4338ca)", border:"1px solid rgba(129,140,248,0.35)", borderRadius:11, color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"var(--font-body)", boxShadow:"0 4px 20px rgba(99,102,241,0.3)" }}>
                  Sign In to Continue →
                </button>
              </div>
            )}

            {/* AUTH FORMS */}
            {!success && (
              <>
                {/* Mode tabs — only for signin/signup */}
                {mode !== "forgot" && (
                  <div style={{ display:"flex", padding:"20px 28px 0", gap:24, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                    {(["signup","signin"] as const).map(m => (
                      <button key={m} onClick={() => switchMode(m)} className={`mode-tab ${mode===m ? "mode-tab-active" : "mode-tab-inactive"}`}>
                        {m === "signup" ? "Create account" : "Sign in"}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ padding:"24px 28px 28px", display:"flex", flexDirection:"column", gap:14 }}>

                  {/* ══ SIGNUP ══ */}
                  {mode === "signup" && (
                    <>
                      {/* Benefits */}
                      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px", background:"rgba(52,211,153,0.05)", border:"1px solid rgba(52,211,153,0.14)", borderRadius:10 }}>
                        <span style={{ fontSize:15 }}>🎓</span>
                        <span style={{ fontSize:12, color:"#6ee7b7" }}>4 CBTs/day · PQ analytics · AI explanations · Free forever</span>
                      </div>

                      <Input type="email"    placeholder="you@example.com"          label="Email address" value={email}    onChange={setEmail} />
                      <Input type="password" placeholder="Minimum 6 characters"     label="Password"      value={password} onChange={setPassword} />

                      {/* Referral toggle */}
                      <div>
                        {!showRef ? (
                          <button className="ref-toggle" onClick={() => setShowRef(true)}>+ Have a referral code?</button>
                        ) : (
                          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                            <label style={{ fontSize:12, fontWeight:600, color:"#475569", letterSpacing:"0.04em", display:"flex", justifyContent:"space-between" }}>
                              Referral code <span style={{ fontWeight:400, color:"#334155" }}>(optional)</span>
                            </label>
                            <input
                              type="text" placeholder="e.g. STU-ABC123" value={referral}
                              onChange={e => setReferral(e.target.value.toUpperCase())}
                              style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(99,102,241,0.25)", borderRadius:10, color:"#a5b4fc", padding:"11px 14px", fontSize:13, outline:"none", fontFamily:"var(--font-body)", letterSpacing:"0.05em", boxSizing:"border-box" }}
                            />
                          </div>
                        )}
                      </div>

                      {error && <ErrorMsg msg={error} />}

                      <PrimaryBtn onClick={handleSubmit} loading={submitting} label="Create Account →" loadingLabel="Creating account…" />

                      <Divider />

                      <GuestBtn onClick={handleGuest} />

                      <p style={{ textAlign:"center", fontSize:12.5, color:"#334155", margin:0 }}>
                        Already have an account?{" "}
                        <button className="auth-link" onClick={() => switchMode("signin")} style={{ color:"#818cf8" }}>Sign in</button>
                      </p>
                    </>
                  )}

                  {/* ══ SIGNIN ══ */}
                  {mode === "signin" && (
                    <>
                      <Input type="email"    placeholder="you@example.com" label="Email address" value={email}    onChange={setEmail} />
                      <Input type="password" placeholder="Your password"   label="Password"      value={password} onChange={setPassword} />

                      {error && <ErrorMsg msg={error} />}

                      <PrimaryBtn onClick={handleSubmit} loading={submitting} label="Sign In →" loadingLabel="Signing in…" />

                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <button className="auth-link" onClick={() => switchMode("forgot")} style={{ color:"#475569" }}>Forgot password?</button>
                        <button className="auth-link" onClick={() => switchMode("signup")} style={{ color:"#818cf8" }}>Create account</button>
                      </div>

                      <Divider />
                      <GuestBtn onClick={handleGuest} />
                    </>
                  )}

                  {/* ══ FORGOT ══ */}
                  {mode === "forgot" && (
                    <>
                      <div style={{ marginBottom:4 }}>
                        <h2 style={{ fontSize:19, fontWeight:800, fontFamily:"var(--font-display)", color:"#f1f5f9", margin:"0 0 5px", letterSpacing:"-0.02em" }}>Reset password</h2>
                        <p style={{ fontSize:13, color:"#475569", margin:0 }}>We'll send a reset link to your email</p>
                      </div>

                      <Input type="email" placeholder="you@example.com" label="Email address" value={email} onChange={setEmail} />

                      {error && <ErrorMsg msg={error} />}
                      {info  && <InfoMsg  msg={info}  />}

                      <PrimaryBtn onClick={handleForgot} loading={submitting} label="Send Reset Link" loadingLabel="Sending…" />

                      <button className="auth-link" onClick={() => switchMode("signin")} style={{ color:"#475569", textAlign:"center" }}>
                        ← Back to Sign In
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer note */}
          <p style={{ textAlign:"center", fontSize:11, color:"#1e293b", marginTop:16 }}>
            By continuing you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHARED SUB-COMPONENTS
───────────────────────────────────────────── */
function PrimaryBtn({ onClick, loading, label, loadingLabel }: { onClick:()=>void; loading:boolean; label:string; loadingLabel:string }) {
  return (
    <button onClick={onClick} disabled={loading} className="submit-btn" style={{ width:"100%", padding:"13px 0", background:loading ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg,#6366f1,#4f46e5,#4338ca)", border:"1px solid rgba(129,140,248,0.35)", borderRadius:11, color:"#fff", fontSize:14, fontWeight:800, cursor:loading?"not-allowed":"pointer", fontFamily:"var(--font-body)", letterSpacing:"0.01em", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:loading?"none":"0 4px 20px rgba(99,102,241,0.3)" }}>
      {loading ? <><Spinner />{loadingLabel}</> : label}
    </button>
  );
}

function GuestBtn({ onClick }: { onClick:()=>void }) {
  return (
    <button onClick={onClick} className="guest-btn" style={{ width:"100%", padding:"12px 0", borderRadius:10, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", color:"#64748b", fontSize:13, cursor:"pointer", fontFamily:"var(--font-body)", fontWeight:500, transition:"all 0.2s" }}>
      Continue as Guest <span style={{ fontSize:11, color:"#334155", marginLeft:4 }}>(2 CBTs/day)</span>
    </button>
  );
}

function Divider() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }} />
      <span style={{ fontSize:11, color:"#334155" }}>or</span>
      <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }} />
    </div>
  );
}

function ErrorMsg({ msg }: { msg:string }) {
  return (
    <div style={{ display:"flex", gap:8, padding:"10px 12px", background:"rgba(36,10,10,0.7)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:9, fontSize:12.5, color:"#fca5a5" }}>
      <span style={{ flexShrink:0 }}>⚠</span>{msg}
    </div>
  );
}

function InfoMsg({ msg }: { msg:string }) {
  return (
    <div style={{ display:"flex", gap:8, padding:"10px 12px", background:"rgba(4,47,29,0.6)", border:"1px solid rgba(52,211,153,0.25)", borderRadius:9, fontSize:12.5, color:"#6ee7b7" }}>
      <span style={{ flexShrink:0 }}>✓</span>{msg}
    </div>
  );
}

function Spinner() {
  return <span style={{ width:13, height:13, border:"2px solid rgba(255,255,255,0.2)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.65s linear infinite", display:"inline-block" }} />;
}

/* ─────────────────────────────────────────────
   EXPORT
───────────────────────────────────────────── */
export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:"100vh", background:"#080c14", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:20, height:20, border:"2px solid rgba(255,255,255,0.1)", borderTopColor:"#818cf8", borderRadius:"50%", animation:"spin 0.65s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <AuthInner />
    </Suspense>
  );
}
