// src/SuccessPage.jsx
// Show this after Stripe redirects back with ?session_id=...

import { useEffect, useState } from "react";

const T = {
  bg: "#0f1117", bgCard: "#1a1d27", border: "#2a2d3e",
  teal: "#00c9a7", tealGlow: "rgba(0,201,167,0.12)",
  text: "#e8eaf0", textMuted: "#8b8fa8", gold: "#f4c542",
  grad: "linear-gradient(135deg, #00c9a7, #6c63ff)",
};

export default function SuccessPage({ onGoToApp }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Give Supabase a moment to update after webhook fires
    const t = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: T.bgCard, border: `2px solid ${T.teal}`, borderRadius: 24, padding: "48px 52px", maxWidth: 500, width: "100%", textAlign: "center" }}>
        {/* Animated checkmark */}
        <div style={{ width: 80, height: 80, background: T.tealGlow, border: `2px solid ${T.teal}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 36 }}>
          {loading ? "⏳" : "🎉"}
        </div>

        <h1 style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 28, color: T.text, marginBottom: 10 }}>
          {loading ? "Activating your Pro access..." : "Welcome to Pro! 🎓"}
        </h1>

        <p style={{ color: T.textMuted, fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
          {loading
            ? "We're setting up your account. This takes just a moment..."
            : "Your Pro access is now active. Enjoy unlimited searches, AI chat, full NCES data, and everything else Pro has to offer."
          }
        </p>

        {!loading && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
              {["Unlimited searches", "AI Chat unlocked", "Full NCES data", "Compare tool", "Writing requirements", "Export PDF"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: T.tealGlow, borderRadius: 10, border: `1px solid ${T.teal}33` }}>
                  <span style={{ color: T.teal, fontWeight: 800, fontSize: 14 }}>✓</span>
                  <span style={{ color: T.text, fontSize: 12, fontWeight: 600 }}>{f}</span>
                </div>
              ))}
            </div>

            <button onClick={onGoToApp} style={{
              width: "100%", padding: "14px", background: T.grad, border: "none",
              borderRadius: 12, color: "#0f1117", fontFamily: "Sora", fontWeight: 800,
              fontSize: 15, cursor: "pointer", boxShadow: "0 4px 20px rgba(0,201,167,0.35)",
            }}>
              Start Searching →
            </button>

            <p style={{ color: T.textMuted, fontSize: 12, marginTop: 14 }}>
              A receipt has been sent to your email. Cancel anytime in your account settings.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
