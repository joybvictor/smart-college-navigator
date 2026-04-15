import { useState } from "react";

// ─── Match your existing dark teal theme ─────────────────────────────────────
const T = {
  bg: "#0f1117", bgCard: "#1a1d27", bgHov: "#1e2235",
  border: "#2a2d3e", teal: "#00c9a7", tealDark: "#00a88a",
  tealGlow: "rgba(0,201,167,0.12)", purple: "#6c63ff",
  text: "#e8eaf0", textMuted: "#8b8fa8", textDim: "#5a5e7a",
  gold: "#f4c542", danger: "#ff4d6d",
  grad: "linear-gradient(135deg, #00c9a7, #6c63ff)",
};

const FREE_FEATURES = [
  { text: "5 college searches per day", included: true },
  { text: "Basic college stats", included: true },
  { text: "3 saved colleges", included: true },
  { text: "Basic application tracker", included: true },
  { text: "AI Fit Score (preview)", included: true },
  { text: "AI Chat", included: false },
  { text: "Side-by-side compare", included: false },
  { text: "Majors & programs data", included: false },
  { text: "Writing requirements", included: false },
  { text: "Unlimited saved colleges", included: false },
  { text: "Export PDF reports", included: false },
];

const PRO_FEATURES = [
  { text: "Unlimited college searches", included: true },
  { text: "Full NCES data & stats", included: true },
  { text: "Unlimited saved colleges", included: true },
  { text: "Full application tracker", included: true },
  { text: "AI Fit Score (full)", included: true },
  { text: "AI Chat — unlimited", included: true },
  { text: "Side-by-side compare", included: true },
  { text: "Majors & programs data", included: true },
  { text: "Writing requirements", included: true },
  { text: "Export PDF reports", included: true },
  { text: "Priority support", included: true },
];

export default function PricingPage({ onClose, userEmail }) {
  const [billing, setBilling] = useState("yearly"); // 'monthly' | 'yearly'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const MONTHLY_PRICE = 7.99;
  const YEARLY_PRICE = 59.99;
  const YEARLY_MONTHLY_EQUIV = (YEARLY_PRICE / 12).toFixed(2);
  const SAVINGS = Math.round(100 - (YEARLY_PRICE / (MONTHLY_PRICE * 12)) * 100);

  const handleSubscribe = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billing, email: userEmail }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (e) {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(8px)" }}>
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 24, maxWidth: 860, width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>

        {/* Close button */}
        {onClose && (
          <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, padding: "6px 12px", cursor: "pointer", fontSize: 14, zIndex: 10 }}>✕</button>
        )}

        {/* Header */}
        <div style={{ padding: "40px 40px 28px", textAlign: "center", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.tealGlow, border: `1px solid ${T.teal}33`, borderRadius: 20, padding: "4px 14px", marginBottom: 16 }}>
            <span style={{ color: T.teal, fontSize: 12, fontFamily: "Sora", fontWeight: 700 }}>✦ Simple, transparent pricing</span>
          </div>
          <h1 style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 32, color: T.text, marginBottom: 10 }}>
            Find your perfect college.<br/>Pay less than a coffee a week.
          </h1>
          <p style={{ color: T.textMuted, fontSize: 15 }}>Cancel anytime. No hidden fees. Backed by official NCES data.</p>

          {/* Billing toggle */}
          <div style={{ display: "inline-flex", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: 4, marginTop: 24, gap: 4 }}>
            {["monthly", "yearly"].map(b => (
              <button key={b} onClick={() => setBilling(b)} style={{
                padding: "8px 22px", borderRadius: 9, border: "none", cursor: "pointer",
                fontFamily: "Sora", fontWeight: 700, fontSize: 13, transition: "all 0.2s",
                background: billing === b ? T.teal : "transparent",
                color: billing === b ? "#0f1117" : T.textMuted,
              }}>
                {b === "monthly" ? "Monthly" : "Yearly"}
                {b === "yearly" && <span style={{ marginLeft: 6, background: billing === "yearly" ? "#0f1117" : T.tealGlow, color: billing === "yearly" ? T.teal : T.teal, borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>SAVE {SAVINGS}%</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, padding: "28px 40px 40px" }}>

          {/* Free Plan */}
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 18, padding: 28 }}>
            <div style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 13, color: T.textMuted, letterSpacing: "0.07em", marginBottom: 8 }}>FREE</div>
            <div style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 42, color: T.text, lineHeight: 1, marginBottom: 4 }}>$0</div>
            <div style={{ color: T.textDim, fontSize: 13, marginBottom: 24 }}>Forever free · No credit card needed</div>

            <div style={{ marginBottom: 24 }}>
              {FREE_FEATURES.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 14, color: f.included ? T.teal : T.textDim, flexShrink: 0 }}>{f.included ? "✓" : "✕"}</span>
                  <span style={{ fontSize: 13, color: f.included ? T.text : T.textDim, textDecoration: f.included ? "none" : "none" }}>{f.text}</span>
                </div>
              ))}
            </div>

            <button style={{ width: "100%", padding: "12px", background: "transparent", border: `1.5px solid ${T.border}`, borderRadius: 10, color: T.textMuted, fontFamily: "Sora", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div style={{ background: `linear-gradient(160deg, #1a1d27, #14172a)`, border: `2px solid ${T.teal}`, borderRadius: 18, padding: 28, position: "relative", overflow: "hidden" }}>
            {/* Glow effect */}
            <div style={{ position: "absolute", top: -60, right: -60, width: 180, height: 180, background: T.tealGlow, borderRadius: "50%", filter: "blur(40px)" }}/>

            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 13, color: T.teal, letterSpacing: "0.07em" }}>PRO</span>
                <span style={{ background: T.tealGlow, color: T.teal, border: `1px solid ${T.teal}33`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>⭐ Most Popular</span>
              </div>

              {billing === "yearly" ? (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 42, color: T.teal, lineHeight: 1 }}>${YEARLY_MONTHLY_EQUIV}</span>
                    <span style={{ color: T.textMuted, fontSize: 14 }}>/mo</span>
                  </div>
                  <div style={{ color: T.textDim, fontSize: 13, marginBottom: 4 }}>
                    Billed as <span style={{ color: T.teal, fontWeight: 700 }}>${YEARLY_PRICE}/year</span>
                  </div>
                  <div style={{ color: T.textDim, fontSize: 12, marginBottom: 20 }}>
                    <span style={{ color: T.gold }}>✦ You save ${(MONTHLY_PRICE * 12 - YEARLY_PRICE).toFixed(2)}/year</span> vs monthly
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 42, color: T.teal, lineHeight: 1 }}>${MONTHLY_PRICE}</span>
                    <span style={{ color: T.textMuted, fontSize: 14 }}>/mo</span>
                  </div>
                  <div style={{ color: T.textDim, fontSize: 13, marginBottom: 20 }}>Billed monthly · Cancel anytime</div>
                </>
              )}

              <div style={{ marginBottom: 24 }}>
                {PRO_FEATURES.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 14, color: T.teal, flexShrink: 0, fontWeight: 800 }}>✓</span>
                    <span style={{ fontSize: 13, color: T.text }}>{f.text}</span>
                  </div>
                ))}
              </div>

              {error && <div style={{ color: T.danger, fontSize: 12, marginBottom: 12, padding: "8px 12px", background: "rgba(255,77,109,0.1)", borderRadius: 8, border: `1px solid ${T.danger}33` }}>{error}</div>}

              <button onClick={handleSubscribe} disabled={loading} style={{
                width: "100%", padding: "14px", background: loading ? T.tealDark : T.grad,
                border: "none", borderRadius: 12, color: "#0f1117",
                fontFamily: "Sora", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 20px rgba(0,201,167,0.35)", transition: "all 0.2s",
                opacity: loading ? 0.7 : 1,
              }}>
                {loading ? "Redirecting to checkout..." : `Get Pro — ${billing === "yearly" ? `$${YEARLY_PRICE}/yr` : `$${MONTHLY_PRICE}/mo`}`}
              </button>

              <div style={{ textAlign: "center", marginTop: 12, color: T.textDim, fontSize: 12 }}>
                🔒 Secure checkout via Stripe · Cancel anytime
              </div>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div style={{ padding: "0 40px 36px", display: "flex", justifyContent: "center", gap: 32 }}>
          {[["🎓", "Official NCES Data"], ["🤖", "AI-Powered Matching"], ["🔒", "Secure Payments"], ["↩️", "Cancel Anytime"]].map(([icon, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
              <div style={{ color: T.textMuted, fontSize: 11, fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
