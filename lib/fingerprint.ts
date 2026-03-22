"use client";

// Generate a stable device fingerprint from browser signals
// Not 100% foolproof but stops casual incognito abuse
export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === "undefined") return "server";

  const signals: string[] = [
    navigator.userAgent,
    navigator.language,
    String(screen.width) + "x" + String(screen.height),
    String(screen.colorDepth),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(navigator.hardwareConcurrency || 0),
    String((navigator as any).deviceMemory || 0),
  ];

  // Canvas fingerprint
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("Studiengine🎓", 2, 2);
    signals.push(canvas.toDataURL().slice(-50));
  } catch (_) {}

  const combined = signals.join("|");
  // Simple hash
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i);
    hash |= 0;
  }
  return "fp_" + Math.abs(hash).toString(36);
}

// Get or create a guest ID that is tied to device fingerprint
export async function getTrackedGuestId(): Promise<string> {
  const fp = await getDeviceFingerprint();
  
  // Use fingerprint as the base — same device always gets same guest ID
  // This means incognito tabs on same device share quota
  const stored = localStorage.getItem("studiengine_guest_id");
  
  if (stored && stored.includes(fp)) return stored;
  
  // Either no stored ID or it was from a different device fingerprint
  const newId = `guest_${fp}`;
  localStorage.setItem("studiengine_guest_id", newId);
  return newId;
}
