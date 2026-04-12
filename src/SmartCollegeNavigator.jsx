import { useState, useEffect, useRef, useCallback } from "react";

// ─── Supabase ─────────────────────────────────────────────────────────────────
const SB_URL = "https://indksmocjyoqskokhvnz.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluZGtzbW9janlvcXNrb2todm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4OTk1MzQsImV4cCI6MjA4NzQ3NTUzNH0.7tOS61aPuFl0yDwk9UoBd86nAFEuIQITwNTHDqGAZek";
const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

const sbFetch = async (path) => {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: { ...H, "Range-Unit": "items", Prefer: "count=exact" } });
  const data = await res.json();
  const total = parseInt(res.headers.get("Content-Range")?.split("/")[1] || "0");
  return { data: Array.isArray(data) ? data : [], total };
};

// ─── Theme: Bright & Clean ────────────────────────────────────────────────────
const T = {
  bg:       "#f3f6ff",
  bgCard:   "#ffffff",
  bgHov:    "#f8faff",
  bgSide:   "#ffffff",
  border:   "#e2e8f8",
  borderHov:"#93aeff",
  blue:     "#2563eb",
  blueDark: "#1d4ed8",
  blueLight:"#eff4ff",
  purple:   "#7c3aed",
  text:     "#0f172a",
  textMid:  "#334155",
  textMuted:"#64748b",
  textDim:  "#94a3b8",
  gold:     "#d97706",
  goldBg:   "#fffbeb",
  danger:   "#dc2626",
  dangerBg: "#fff1f2",
  success:  "#16a34a",
  successBg:"#f0fdf4",
  accentBg: "#f5f3ff",
  grad:     "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
  gradSoft: "linear-gradient(135deg, #eff4ff 0%, #f5f3ff 100%)",
};

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:wght@600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${T.bg}; color: ${T.text}; font-family: 'Plus Jakarta Sans', sans-serif; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: ${T.bg}; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: ${T.blue}55; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .fu { animation: fadeUp 0.3s ease both; }
  .hov:hover { transform: translateY(-3px) !important; box-shadow: 0 12px 32px rgba(37,99,235,0.12) !important; border-color: ${T.borderHov} !important; }
  .hov { transition: all 0.2s ease !important; }
  input, select { outline: none; }
`;

// ─── Utils ────────────────────────────────────────────────────────────────────
const $ = {
  k: v => v ? `$${(v/1000).toFixed(0)}k` : "—",
  pct: v => v != null ? `${Math.round(v)}%` : "—",
  num: v => v ? (+v).toLocaleString() : "—",
};

const calcFit = (c, p) => {
  if (!p.sat && !p.gpa) return null;
  let s = 62;
  if (p.sat && c.sat_math_25 && c.sat_ebrw_25) {
    const mid = (c.sat_math_25+c.sat_math_75+c.sat_ebrw_25+c.sat_ebrw_75)/4;
    s += Math.min(18, Math.max(-18, (p.sat - mid) / 35));
  }
  if (p.gpa && c.avg_gpa) s += Math.min(12, Math.max(-12, (p.gpa - c.avg_gpa) * 10));
  if (c.graduation_rate_6yr) s += (c.graduation_rate_6yr - 50) * 0.08;
  return Math.min(99, Math.max(38, Math.round(s)));
};

const calcType = (c, p) => {
  if (!p.sat || !c.sat_math_25) return "match";
  const mid = (c.sat_math_25+c.sat_math_75+(c.sat_ebrw_25||0)+(c.sat_ebrw_75||0))/4;
  if (p.sat < mid - 60) return "reach";
  if (p.sat > mid + 90) return "safety";
  return "match";
};

// ─── Atoms ────────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ display:"flex", justifyContent:"center", padding:48 }}>
    <div style={{ width:32, height:32, border:`3px solid ${T.border}`, borderTopColor:T.blue, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
  </div>
);

const Badge = ({ children, type="default", sm }) => {
  const map = {
    default: { bg:T.blueLight, c:T.blue, b:`1px solid #bfdbfe` },
    reach:   { bg:T.dangerBg, c:T.danger, b:`1px solid #fecaca` },
    safety:  { bg:T.accentBg, c:T.purple, b:`1px solid #ddd6fe` },
    match:   { bg:T.successBg, c:T.success, b:`1px solid #bbf7d0` },
    gold:    { bg:T.goldBg, c:T.gold, b:`1px solid #fde68a` },
    pub:     { bg:T.accentBg, c:T.purple, b:`1px solid #ddd6fe` },
    priv:    { bg:T.goldBg, c:T.gold, b:`1px solid #fde68a` },
    hbcu:    { bg:"#fdf2f8", c:"#9d174d", b:`1px solid #fbcfe8` },
  };
  const s = map[type] || map.default;
  return (
    <span style={{ background:s.bg, color:s.c, border:s.b, borderRadius:20, padding:sm?"2px 8px":"4px 11px", fontSize:sm?10:11, fontWeight:700, display:"inline-block", whiteSpace:"nowrap" }}>
      {children}
    </span>
  );
};

const Btn = ({ children, onClick, variant="primary", size="md", disabled, full }) => {
  const [hov, setHov] = useState(false);
  const pads = { sm:"7px 14px", md:"10px 20px", lg:"14px 30px" };
  const fonts = { sm:12, md:13, lg:15 };
  const styles = {
    primary: { bg: hov ? T.blueDark : T.blue, c:"#fff", b:"none", shadow: hov ? "0 4px 14px rgba(37,99,235,0.4)" : "0 2px 8px rgba(37,99,235,0.25)" },
    secondary:{ bg: hov ? T.gradSoft : T.blueLight, c:T.blue, b:`1px solid #bfdbfe`, shadow:"none" },
    outline:  { bg:"transparent", c:T.blue, b:`1.5px solid ${T.blue}`, shadow:"none" },
    ghost:    { bg: hov ? T.blueLight : "transparent", c:T.textMid, b:`1px solid ${T.border}`, shadow:"none" },
    gold:     { bg: hov ? "#b45309" : T.gold, c:"#fff", b:"none", shadow:"0 2px 8px rgba(217,119,6,0.3)" },
    danger:   { bg: hov ? "#b91c1c" : T.danger, c:"#fff", b:"none", shadow:"none" },
    grad:     { bg: T.grad, c:"#fff", b:"none", shadow: hov ? "0 4px 18px rgba(37,99,235,0.4)" : "0 2px 10px rgba(37,99,235,0.3)" },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding:pads[size], fontSize:fonts[size], background:s.bg, color:s.c, border:s.b, boxShadow:s.shadow, borderRadius:10, fontFamily:"Plus Jakarta Sans", fontWeight:700, cursor:disabled?"not-allowed":"pointer", transition:"all 0.18s", display:"inline-flex", alignItems:"center", gap:6, whiteSpace:"nowrap", opacity:disabled?0.45:1, width:full?"100%":undefined, justifyContent:full?"center":undefined }}>
      {children}
    </button>
  );
};

const Card = ({ children, style, onClick, hover }) => (
  <div onClick={onClick} className={hover ? "hov" : ""}
    style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16, cursor:onClick?"pointer":"default", boxShadow:"0 1px 4px rgba(0,0,0,0.04)", ...style }}>
    {children}
  </div>
);

const Ring = ({ score, size=72, type }) => {
  const color = type==="reach" ? T.danger : type==="safety" ? T.purple : T.blue;
  const trackColor = type==="reach" ? "#fee2e2" : type==="safety" ? "#ede9fe" : "#dbeafe";
  const r=(size-8)/2, circ=2*Math.PI*r;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={6}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={circ} strokeDashoffset={circ-(score/100)*circ} strokeLinecap="round"/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:size*0.2, color, lineHeight:1 }}>{score}%</span>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, color, sub }) => (
  <div style={{ padding:"14px 16px", background:T.bg, borderRadius:12, border:`1px solid ${T.border}` }}>
    <div style={{ color:T.textDim, fontSize:10, fontWeight:700, letterSpacing:"0.07em", marginBottom:4, textTransform:"uppercase" }}>{label}</div>
    <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:22, color:color||T.blue }}>{value}</div>
    {sub && <div style={{ color:T.textDim, fontSize:11, marginTop:2 }}>{sub}</div>}
  </div>
);

const ProgBar = ({ val, max=100, color=T.blue, h=5 }) => (
  <div style={{ background:T.border, borderRadius:h, height:h, overflow:"hidden" }}>
    <div style={{ width:`${Math.min(100,(val/max)*100)}%`, height:"100%", background:color, borderRadius:h, transition:"width 0.5s ease" }}/>
  </div>
);

const InputField = ({ label, placeholder, value, onChange, type="text" }) => (
  <div>
    <label style={{ color:T.textMuted, fontSize:11, fontWeight:700, letterSpacing:"0.06em", display:"block", marginBottom:6 }}>{label}</label>
    <input type={type} placeholder={placeholder} value={value||""} onChange={onChange}
      style={{ width:"100%", padding:"10px 13px", background:T.bgCard, border:`1.5px solid ${T.border}`, borderRadius:10, color:T.text, fontSize:13, fontFamily:"Plus Jakarta Sans", transition:"border 0.2s" }}
      onFocus={e=>e.target.style.borderColor=T.blue} onBlur={e=>e.target.style.borderColor=T.border}/>
  </div>
);

// ─── Nav ──────────────────────────────────────────────────────────────────────
const Nav = ({ screen, setScreen }) => {
  const tabs = [
    {id:"search", l:"Search", i:"🔍"},
    {id:"matches", l:"My Matches", i:"🎯"},
    {id:"compare", l:"Compare", i:"⚖️"},
    {id:"tracker", l:"Tracker", i:"📋"},
    {id:"chat", l:"AI Chat", i:"💬"},
  ];
  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, height:60, background:"rgba(255,255,255,0.95)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 28px", gap:6, boxShadow:"0 1px 12px rgba(37,99,235,0.06)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:9, marginRight:20 }}>
        <div style={{ width:32, height:32, background:T.grad, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(37,99,235,0.3)" }}>
          <span style={{ color:"#fff", fontWeight:800, fontSize:15, fontFamily:"Fraunces" }}>S</span>
        </div>
        <span style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:16, color:T.text }}>Smart College Navigator</span>
      </div>
      <div style={{ display:"flex", gap:2, flex:1 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setScreen(t.id)} style={{
            padding:"7px 14px", borderRadius:9, fontFamily:"Plus Jakarta Sans", fontWeight:screen===t.id?700:500, fontSize:13,
            background: screen===t.id ? T.blueLight : "transparent",
            color: screen===t.id ? T.blue : T.textMuted,
            border: `1px solid ${screen===t.id ? "#bfdbfe" : "transparent"}`,
            cursor:"pointer", transition:"all 0.15s", display:"flex", alignItems:"center", gap:5,
          }}>
            <span style={{ fontSize:13 }}>{t.i}</span>{t.l}
          </button>
        ))}
      </div>
      <Btn variant="grad" size="sm">✦ Unlock Premium — $49.99</Btn>
    </nav>
  );
};

// ─── Search ───────────────────────────────────────────────────────────────────
const SearchScreen = ({ setScreen, setSelCollege, profile }) => {
  const [q, setQ] = useState("");
  const [stateF, setStateF] = useState("");
  const [ctrl, setCtrl] = useState("");
  const [maxTuit, setMaxTuit] = useState(70000);
  const [maxAcc, setMaxAcc] = useState(100);
  const [hbcu, setHbcu] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const tmr = useRef(null);

  const SEL = "id,name,city,state_abbr,control,is_public,tuition_in_state,tuition_out_state,graduation_rate_6yr,acceptance_rate,sat_math_25,sat_math_75,sat_ebrw_25,sat_ebrw_75,avg_gpa,total_enrollment,rank,room_board,retention_rate,hbcu";

  const doSearch = useCallback(async (q, st, ct, mt, ma, hb, pg) => {
    setLoading(true);
    try {
      let url = `${SB_URL}/rest/v1/colleges?select=${SEL}&order=rank.asc.nullslast,name.asc&limit=12&offset=${pg*12}`;
      if (q.trim().length > 1) url += `&name=ilike.*${encodeURIComponent(q.trim())}*`;
      if (st) url += `&state_abbr=eq.${st}`;
      if (ct) url += `&control=eq.${encodeURIComponent(ct)}`;
      if (mt < 70000) url += `&tuition_out_state=lte.${mt}`;
      if (ma < 100) url += `&acceptance_rate=lte.${ma}`;
      if (hb) url += `&hbcu=eq.true`;
      const { data, total } = await sbFetch(url.replace(SB_URL+"/rest/v1/",""));
      // direct fetch for count
      const res = await fetch(url, { headers: { ...H, "Range-Unit":"items", Prefer:"count=exact" } });
      const d = await res.json();
      const cnt = parseInt(res.headers.get("Content-Range")?.split("/")[1] || "0");
      setColleges(Array.isArray(d) ? d : []);
      setTotal(cnt);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    clearTimeout(tmr.current);
    tmr.current = setTimeout(() => { setPage(0); doSearch(q, stateF, ctrl, maxTuit, maxAcc, hbcu, 0); }, 320);
  }, [q, stateF, ctrl, maxTuit, maxAcc, hbcu]);

  useEffect(() => { doSearch(q, stateF, ctrl, maxTuit, maxAcc, hbcu, page); }, [page]);

  const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];
  const selSt = { width:"100%", background:T.bgCard, border:`1.5px solid ${T.border}`, borderRadius:10, color:T.text, padding:"9px 12px", fontSize:13, fontFamily:"Plus Jakarta Sans" };

  return (
    <div style={{ paddingTop:60, display:"grid", gridTemplateColumns:"270px 1fr", minHeight:"100vh" }}>
      {/* Sidebar */}
      <div style={{ padding:"28px 20px", borderRight:`1px solid ${T.border}`, position:"sticky", top:60, height:"calc(100vh - 60px)", overflowY:"auto", background:T.bgSide, boxShadow:"2px 0 12px rgba(0,0,0,0.03)" }}>
        <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:17, marginBottom:24, color:T.text }}>Advanced Filters</div>

        <div style={{ marginBottom:18 }}>
          <label style={{ color:T.textMuted, fontSize:11, fontWeight:700, letterSpacing:"0.07em", display:"block", marginBottom:7 }}>STATE</label>
          <select value={stateF} onChange={e=>setStateF(e.target.value)} style={selSt} onFocus={e=>e.target.style.borderColor=T.blue} onBlur={e=>e.target.style.borderColor=T.border}>
            <option value="">All States</option>
            {STATES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ marginBottom:18 }}>
          <label style={{ color:T.textMuted, fontSize:11, fontWeight:700, letterSpacing:"0.07em", display:"block", marginBottom:7 }}>INSTITUTION TYPE</label>
          <select value={ctrl} onChange={e=>setCtrl(e.target.value)} style={selSt} onFocus={e=>e.target.style.borderColor=T.blue} onBlur={e=>e.target.style.borderColor=T.border}>
            <option value="">All Types</option>
            <option value="Public">Public</option>
            <option value="Private nonprofit">Private Nonprofit</option>
            <option value="Private for-profit">Private For-Profit</option>
          </select>
        </div>

        <div style={{ marginBottom:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <label style={{ color:T.textMuted, fontSize:11, fontWeight:700, letterSpacing:"0.07em" }}>MAX TUITION</label>
            <span style={{ color:T.blue, fontSize:12, fontWeight:800 }}>{maxTuit>=70000?"Any":$.k(maxTuit)}</span>
          </div>
          <input type="range" min={5000} max={70000} step={1000} value={maxTuit} onChange={e=>setMaxTuit(+e.target.value)} style={{ width:"100%", accentColor:T.blue }}/>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.textDim, marginTop:4 }}><span>$5k</span><span>$70k+</span></div>
        </div>

        <div style={{ marginBottom:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <label style={{ color:T.textMuted, fontSize:11, fontWeight:700, letterSpacing:"0.07em" }}>MAX ACCEPTANCE RATE</label>
            <span style={{ color:T.blue, fontSize:12, fontWeight:800 }}>{maxAcc}%</span>
          </div>
          <input type="range" min={1} max={100} value={maxAcc} onChange={e=>setMaxAcc(+e.target.value)} style={{ width:"100%", accentColor:T.blue }}/>
        </div>

        <label style={{ display:"flex", alignItems:"center", gap:9, marginBottom:24, cursor:"pointer", fontSize:13, color:T.textMid, fontWeight:500 }}>
          <input type="checkbox" checked={hbcu} onChange={e=>setHbcu(e.target.checked)} style={{ accentColor:T.blue, width:16, height:16 }}/>
          HBCU Only
        </label>

        <div style={{ padding:18, background:T.gradSoft, borderRadius:14, border:`1px solid #dde8ff`, textAlign:"center" }}>
          <div style={{ color:T.textMuted, fontSize:10, fontWeight:700, letterSpacing:"0.07em", marginBottom:4 }}>RESULTS FOUND</div>
          <div style={{ fontFamily:"Fraunces", fontSize:40, fontWeight:700, color:T.blue, lineHeight:1 }}>{total.toLocaleString()}</div>
          <div style={{ color:T.textDim, fontSize:12, marginTop:3 }}>colleges</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ padding:"28px 32px" }}>
        {/* Hero search */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:30, color:T.text, marginBottom:6 }}>Find Your Perfect College</div>
          <p style={{ color:T.textMuted, fontSize:15, marginBottom:20 }}>Powered by official NCES data · AI matching · ROI calculator</p>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", fontSize:17, color:T.textDim }}>🔍</span>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search college name (e.g. MIT, Rutgers, Howard University...)"
              style={{ width:"100%", padding:"15px 18px 15px 48px", background:T.bgCard, border:`2px solid ${T.border}`, borderRadius:14, color:T.text, fontSize:15, fontFamily:"Plus Jakarta Sans", boxShadow:"0 2px 12px rgba(0,0,0,0.04)", transition:"border 0.2s, box-shadow 0.2s" }}
              onFocus={e=>{e.target.style.borderColor=T.blue;e.target.style.boxShadow=`0 0 0 4px rgba(37,99,235,0.1)`;}}
              onBlur={e=>{e.target.style.borderColor=T.border;e.target.style.boxShadow="0 2px 12px rgba(0,0,0,0.04)";}}/>
          </div>
        </div>

        {loading ? <Spinner/> : (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:18, marginBottom:28 }}>
              {colleges.map((c, i) => {
                const fit = calcFit(c, profile);
                const type = calcType(c, profile);
                const tuition = c.is_public ? c.tuition_in_state : c.tuition_out_state;
                return (
                  <div key={c.id} className="fu hov" style={{ animationDelay:`${i*0.04}s` }}>
                    <Card onClick={() => { setSelCollege(c); setScreen("detail"); }} style={{ overflow:"hidden", cursor:"pointer" }}>
                      {/* Color accent top bar */}
                      <div style={{ height:5, background: c.is_public ? `linear-gradient(90deg, ${T.blue}, ${T.purple})` : `linear-gradient(90deg, ${T.gold}, ${T.danger})` }}/>
                      <div style={{ padding:"18px 20px" }}>
                        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:14, lineHeight:1.35, marginBottom:4, color:T.text, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{c.name}</div>
                            <div style={{ color:T.textMuted, fontSize:12, fontWeight:500 }}>📍 {c.city}, {c.state_abbr}</div>
                          </div>
                          {fit && <Ring score={fit} size={52} type={type}/>}
                        </div>

                        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:14 }}>
                          <Badge type={c.is_public?"pub":"priv"} sm>{c.is_public?"Public":"Private"}</Badge>
                          {fit && <Badge type={type} sm>{type==="reach"?"🎯 Reach":type==="safety"?"✓ Safety":"✓ Match"}</Badge>}
                          {c.rank && <Badge type="gold" sm>#{c.rank}</Badge>}
                          {c.hbcu && <Badge type="hbcu" sm>HBCU</Badge>}
                        </div>

                        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                          {[["Tuition",$.k(tuition)],["Grad Rate",$.pct(c.graduation_rate_6yr)],["Accept",$.pct(c.acceptance_rate)]].map(([l,v])=>(
                            <div key={l} style={{ textAlign:"center", padding:"9px 6px", background:T.bg, borderRadius:10, border:`1px solid ${T.border}` }}>
                              <div style={{ color:T.textDim, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>{l}</div>
                              <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:14, color:T.blue }}>{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>

            {colleges.length === 0 && !loading && (
              <div style={{ textAlign:"center", padding:80, color:T.textMuted }}>
                <div style={{ fontSize:48, marginBottom:14 }}>🎓</div>
                <div style={{ fontFamily:"Fraunces", fontSize:22, color:T.text, marginBottom:6 }}>No colleges found</div>
                <div style={{ fontSize:14 }}>Try adjusting your filters or search terms</div>
              </div>
            )}

            {total > 12 && (
              <div style={{ display:"flex", justifyContent:"center", gap:10, alignItems:"center" }}>
                <Btn variant="ghost" size="sm" disabled={page===0} onClick={()=>setPage(p=>p-1)}>← Previous</Btn>
                <span style={{ color:T.textMuted, fontSize:13, fontWeight:600 }}>Page {page+1} of {Math.ceil(total/12)}</span>
                <Btn variant="ghost" size="sm" disabled={(page+1)*12>=total} onClick={()=>setPage(p=>p+1)}>Next →</Btn>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Detail ───────────────────────────────────────────────────────────────────
const DetailScreen = ({ college:c, setScreen, profile }) => {
  const [tab, setTab] = useState("Overview");
  const [majors, setMajors] = useState([]);
  const [mLoad, setMLoad] = useState(false);
  const tabs = ["Overview", "Majors & Programs", "Admissions", "Financials"];

  useEffect(() => {
    if (!c || tab !== "Majors & Programs") return;
    setMLoad(true);
    fetch(`${SB_URL}/rest/v1/college_majors?select=credential_level,total_degrees_awarded,is_premium,majors(cip_code,cip_title,cip_family_title)&college_id=eq.${c.id}&order=total_degrees_awarded.desc.nullslast&limit=40`, { headers: H })
      .then(r=>r.json()).then(d=>{setMajors(Array.isArray(d)?d:[]);setMLoad(false);}).catch(()=>setMLoad(false));
  }, [c, tab]);

  if (!c) return (
    <div style={{ padding:"120px 32px", textAlign:"center" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🎓</div>
      <div style={{ fontFamily:"Fraunces", fontSize:22, marginBottom:12 }}>No college selected</div>
      <Btn onClick={() => setScreen("search")}>Browse Colleges</Btn>
    </div>
  );

  const fit = calcFit(c, profile);
  const type = calcType(c, profile);
  const totalCost = (c.tuition_out_state||0) + (c.room_board||0) + (c.books_supplies||0);

  return (
    <div style={{ paddingTop:60 }}>
      {/* Hero */}
      <div style={{ background:`linear-gradient(135deg, #eff4ff 0%, #f5f3ff 100%)`, borderBottom:`1px solid ${T.border}`, padding:"28px 40px" }}>
        <button onClick={()=>setScreen("search")} style={{ background:"#fff", border:`1px solid ${T.border}`, borderRadius:9, color:T.textMid, padding:"7px 16px", cursor:"pointer", fontSize:13, marginBottom:18, fontFamily:"Plus Jakarta Sans", fontWeight:600, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>← Back to Search</button>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:24 }}>
          <div>
            <div style={{ display:"flex", gap:7, marginBottom:12, flexWrap:"wrap" }}>
              <Badge type={c.is_public?"pub":"priv"}>{c.is_public?"Public":"Private"}</Badge>
              {c.hbcu && <Badge type="hbcu">HBCU</Badge>}
              {c.rank && <Badge type="gold">Ranked #{c.rank}</Badge>}
              {fit && <Badge type={type}>{type==="reach"?"🎯 Reach":type==="safety"?"✓ Safety":"✓ Match"}</Badge>}
            </div>
            <h1 style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:34, color:T.text, marginBottom:8, lineHeight:1.2 }}>{c.name}</h1>
            <p style={{ color:T.textMuted, fontSize:15, fontWeight:500 }}>📍 {c.city}, {c.state} · {c.setting||"—"} · {$.num(c.total_enrollment)} enrolled</p>
            {c.website && <a href={c.website} target="_blank" rel="noreferrer" style={{ color:T.blue, fontSize:13, marginTop:10, display:"inline-flex", alignItems:"center", gap:4, fontWeight:600 }}>🔗 {c.website}</a>}
          </div>
          {fit && (
            <div style={{ textAlign:"center", flexShrink:0, background:"#fff", borderRadius:18, padding:"18px 22px", border:`1px solid ${T.border}`, boxShadow:"0 4px 16px rgba(37,99,235,0.08)" }}>
              <Ring score={fit} size={90} type={type}/>
              <div style={{ color:T.textMuted, fontSize:11, fontWeight:700, marginTop:8, letterSpacing:"0.05em" }}>AI FIT SCORE</div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:`1px solid ${T.border}`, padding:"0 40px", background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,0.03)" }}>
        {tabs.map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{ padding:"14px 20px", background:"transparent", border:"none", cursor:"pointer", color:tab===t?T.blue:T.textMuted, fontFamily:"Plus Jakarta Sans", fontWeight:tab===t?700:500, fontSize:13, borderBottom:`2.5px solid ${tab===t?T.blue:"transparent"}`, marginBottom:-1, transition:"all 0.15s" }}>{t}</button>
        ))}
      </div>

      <div style={{ padding:"32px 40px", maxWidth:1080 }}>
        {tab === "Overview" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 310px", gap:28 }}>
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
                <StatBox label="6-Yr Grad Rate" value={$.pct(c.graduation_rate_6yr)}/>
                <StatBox label="Retention Rate" value={$.pct(c.retention_rate)}/>
                <StatBox label="Acceptance Rate" value={$.pct(c.acceptance_rate)} color={T.danger}/>
              </div>
              <Card style={{ padding:24, marginBottom:20 }}>
                <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:18, marginBottom:18, color:T.text }}>Institution Profile</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[["Carnegie Classification",c.carnegie_classification],["Setting",c.setting],["Control",c.control],["Religious Affiliation",c.religious_affiliation||"None"],["HBCU",c.hbcu?"Yes":"No"],["Early Decision",c.has_early_decision?"Yes":"No"],["ED Deadline",c.ed_deadline||"—"],["Regular Deadline",c.regular_deadline||"—"]].filter(([,v])=>v).map(([k,v])=>(
                    <div key={k} style={{ padding:"12px 14px", background:T.bg, borderRadius:10, border:`1px solid ${T.border}` }}>
                      <div style={{ color:T.textDim, fontSize:11, fontWeight:600, marginBottom:3 }}>{k}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{v}</div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card style={{ padding:24 }}>
                <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:16, marginBottom:16, color:T.text }}>Enrollment Breakdown</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                  <StatBox label="Total" value={$.num(c.total_enrollment)}/>
                  <StatBox label="Undergrad" value={$.num(c.undergrad_enrollment)}/>
                  <StatBox label="Graduate" value={$.num(c.grad_enrollment)}/>
                </div>
              </Card>
            </div>
            <div>
              <Card style={{ padding:24, marginBottom:14 }}>
                <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:16, marginBottom:16, color:T.text }}>Annual Costs</div>
                {[["In-State Tuition",c.tuition_in_state,T.blue],["Out-of-State Tuition",c.tuition_out_state,T.purple],["Room & Board",c.room_board,T.textMuted],["Books & Supplies",c.books_supplies,T.textMuted]].map(([k,v,col])=>(
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom:`1px solid ${T.border}` }}>
                    <span style={{ color:T.textMuted, fontSize:13, fontWeight:500 }}>{k}</span>
                    <span style={{ fontFamily:"Fraunces", fontWeight:700, color:col||T.text, fontSize:16 }}>{$.k(v)}</span>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", padding:"14px 0", marginTop:4 }}>
                  <span style={{ fontWeight:700, fontSize:13 }}>Est. Total/Year</span>
                  <span style={{ fontFamily:"Fraunces", fontWeight:700, color:T.blue, fontSize:20 }}>{$.k(totalCost)}</span>
                </div>
              </Card>
              {c.net_price_calculator_url && (
                <a href={c.net_price_calculator_url} target="_blank" rel="noreferrer" style={{ display:"block", padding:"13px 16px", background:T.blueLight, border:`1px solid #bfdbfe`, borderRadius:12, color:T.blue, fontSize:13, textDecoration:"none", textAlign:"center", fontWeight:700, marginBottom:12 }}>
                  💰 Net Price Calculator →
                </a>
              )}
              {c.admissions_url && (
                <a href={c.admissions_url} target="_blank" rel="noreferrer" style={{ display:"block", padding:"13px 16px", background:T.accentBg, border:`1px solid #ddd6fe`, borderRadius:12, color:T.purple, fontSize:13, textDecoration:"none", textAlign:"center", fontWeight:700 }}>
                  📋 Apply Now →
                </a>
              )}
            </div>
          </div>
        )}

        {tab === "Majors & Programs" && (
          <div>
            <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:22, marginBottom:20, color:T.text }}>Programs at {c.name}</div>
            {mLoad ? <Spinner/> : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
                {majors.map((m,i)=>(
                  <Card key={i} style={{ padding:18 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:14, marginBottom:4, lineHeight:1.35, color:T.text }}>{m.majors?.cip_title||"—"}</div>
                        <div style={{ color:T.textMuted, fontSize:12, fontWeight:500 }}>{m.majors?.cip_family_title}</div>
                        <div style={{ color:T.textDim, fontSize:11, marginTop:3 }}>CIP {m.majors?.cip_code} · {m.credential_level}</div>
                        {m.is_premium && <div style={{ marginTop:8 }}><Badge type="gold" sm>Premium Data</Badge></div>}
                      </div>
                      {m.total_degrees_awarded && (
                        <div style={{ textAlign:"right", flexShrink:0, marginLeft:14, padding:"8px 12px", background:T.blueLight, borderRadius:10 }}>
                          <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:22, color:T.blue }}>{m.total_degrees_awarded}</div>
                          <div style={{ color:T.blue, fontSize:10, fontWeight:600 }}>degrees/yr</div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
                {majors.length===0 && <div style={{ color:T.textMuted, gridColumn:"1/-1", textAlign:"center", padding:48 }}>No program data available for this institution</div>}
              </div>
            )}
          </div>
        )}

        {tab === "Admissions" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
            <Card style={{ padding:24 }}>
              <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:18, marginBottom:20, color:T.text }}>Test Score Ranges (25th–75th %ile)</div>
              {[["SAT Math",c.sat_math_25,c.sat_math_75,800],["SAT EBRW",c.sat_ebrw_25,c.sat_ebrw_75,800],["ACT Composite",c.act_composite_25,c.act_composite_75,36]].map(([l,lo,hi,max])=>lo&&hi?(
                <div key={l} style={{ marginBottom:20 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <span style={{ color:T.textMuted, fontSize:13, fontWeight:600 }}>{l}</span>
                    <span style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:15, color:T.blue }}>{lo}–{hi}</span>
                  </div>
                  <div style={{ position:"relative", height:10, background:"#dbeafe", borderRadius:5 }}>
                    <div style={{ position:"absolute", left:`${(lo/max)*100}%`, width:`${((hi-lo)/max)*100}%`, height:"100%", background:T.blue, borderRadius:5 }}/>
                    {profile.sat && l.startsWith("SAT") && (
                      <div style={{ position:"absolute", left:`${(profile.sat/max/2)*100}%`, top:-3, width:16, height:16, background:T.gold, borderRadius:"50%", border:`2.5px solid #fff`, transform:"translateX(-50%)", boxShadow:"0 2px 6px rgba(0,0,0,0.15)" }}/>
                    )}
                  </div>
                </div>
              ):null)}
              {c.avg_gpa && (
                <div style={{ marginTop:12, padding:"14px 16px", background:T.bg, borderRadius:12, border:`1px solid ${T.border}` }}>
                  <span style={{ color:T.textMuted, fontSize:13, fontWeight:500 }}>Average GPA: </span>
                  <span style={{ fontFamily:"Fraunces", fontWeight:700, color:T.blue, fontSize:18 }}>{c.avg_gpa}</span>
                  {profile.gpa && <span style={{ color:T.textDim, fontSize:12, marginLeft:10 }}>(Your GPA: {profile.gpa})</span>}
                </div>
              )}
            </Card>
            <Card style={{ padding:24 }}>
              <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:18, marginBottom:20, color:T.text }}>Deadlines & Rates</div>
              {[["Acceptance Rate",$.pct(c.acceptance_rate)],["ED Acceptance Rate",$.pct(c.ed_acceptance_rate)],["Yield Rate",$.pct(c.yield_rate)],["ED Deadline",c.ed_deadline||"—"],["EA Deadline",c.ea_deadline||"—"],["Regular Deadline",c.regular_deadline||"—"]].map(([k,v])=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ color:T.textMuted, fontSize:13, fontWeight:500 }}>{k}</span>
                  <span style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:15, color:T.text }}>{v}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab === "Financials" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
            <Card style={{ padding:24 }}>
              <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:18, marginBottom:20, color:T.text }}>Cost Breakdown</div>
              {[["In-State Tuition",c.tuition_in_state,T.blue],["Out-of-State Tuition",c.tuition_out_state,T.purple],["Room & Board",c.room_board,T.success],["Books & Supplies",c.books_supplies,T.gold]].map(([k,v,col])=>v?(
                <div key={k} style={{ marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                    <span style={{ color:T.textMuted, fontSize:13, fontWeight:500 }}>{k}</span>
                    <span style={{ fontFamily:"Fraunces", fontWeight:700, color:col }}>{$.k(v)}</span>
                  </div>
                  <ProgBar val={v} max={75000} color={col}/>
                </div>
              ):null)}
            </Card>
            <Card style={{ padding:24 }}>
              <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:18, marginBottom:20, color:T.text }}>4-Year Projections</div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <StatBox label="In-State (4yr total)" value={$.k(((c.tuition_in_state||0)+(c.room_board||0)+(c.books_supplies||0))*4)} color={T.blue}/>
                <StatBox label="Out-of-State (4yr total)" value={$.k(((c.tuition_out_state||0)+(c.room_board||0)+(c.books_supplies||0))*4)} color={T.purple}/>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Matches ──────────────────────────────────────────────────────────────────
const MatchesScreen = ({ setScreen, setSelCollege, profile, setProfile, setCompList }) => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  const run = async () => {
    if (!profile.sat && !profile.gpa) return;
    setLoading(true);
    try {
      let url = `${SB_URL}/rest/v1/colleges?select=id,name,city,state_abbr,control,is_public,tuition_in_state,tuition_out_state,graduation_rate_6yr,acceptance_rate,sat_math_25,sat_math_75,sat_ebrw_25,sat_ebrw_75,avg_gpa,total_enrollment,rank,room_board,books_supplies,retention_rate,hbcu&order=rank.asc.nullslast&limit=80`;
      if (profile.state) url += `&state_abbr=eq.${profile.state}`;
      if (profile.budget) url += `&tuition_out_state=lte.${profile.budget}`;
      const res = await fetch(url, { headers: H });
      const data = await res.json();
      const scored = (Array.isArray(data)?data:[])
        .map(c => ({ ...c, _fit:calcFit(c,profile), _type:calcType(c,profile) }))
        .filter(c => c._fit !== null)
        .sort((a,b) => b._fit - a._fit)
        .slice(0, 12);
      setColleges(scored); setRan(true);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div style={{ padding:"76px 40px 40px", maxWidth:1100, margin:"0 auto" }}>
      {/* Profile card */}
      <Card style={{ padding:32, marginBottom:32, background:T.gradSoft, border:`1px solid #dde8ff` }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20 }}>
          <div>
            <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:26, color:T.text, marginBottom:4 }}>AI Personalized Matching</div>
            <div style={{ color:T.textMuted, fontSize:14 }}>Enter your profile — we'll rank colleges from the full NCES database by AI fit score</div>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:16, marginBottom:20 }}>
          {[{k:"gpa",l:"GPA",ph:"3.7"},{k:"sat",l:"SAT Total",ph:"1420"},{k:"act",l:"ACT",ph:"32"},{k:"budget",l:"Max Tuition ($)",ph:"35000"},{k:"state",l:"State Pref.",ph:"NJ"}].map(f=>(
            <InputField key={f.k} label={f.l} placeholder={f.ph} value={profile[f.k]}
              onChange={e=>setProfile(p=>({...p,[f.k]:f.k==="state"?e.target.value.toUpperCase().slice(0,2):e.target.value}))}/>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <Btn variant="grad" size="lg" onClick={run} disabled={loading||(!profile.sat&&!profile.gpa)}>
            {loading ? "⏳ Searching NCES database..." : "✦ Find My Matches"}
          </Btn>
          {!profile.sat && !profile.gpa && <span style={{ color:T.textDim, fontSize:13 }}>Enter GPA or SAT to get started</span>}
        </div>
      </Card>

      {loading && <Spinner/>}

      {ran && !loading && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
            <div>
              <h2 style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:26, color:T.text }}>Your Top Matches</h2>
              <p style={{ color:T.textMuted, fontSize:13, marginTop:4 }}>{colleges.length} colleges ranked from NCES data · AI fit score</p>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
            {colleges.map((c,i)=>(
              <div key={c.id} className="fu" style={{ animationDelay:`${i*0.05}s` }}>
                <Card hover style={{ padding:24, position:"relative", overflow:"hidden" }}>
                  {i < 3 && <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background:[T.grad,`linear-gradient(90deg,${T.blue},${T.success})`,`linear-gradient(90deg,${T.gold},${T.purple})`][i] }}/>}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {i===0 && <Badge type="gold">⭐ Best Fit</Badge>}
                      {i===1 && <Badge>✦ Top Pick</Badge>}
                    </div>
                    <Ring score={c._fit} size={64} type={c._type}/>
                  </div>
                  <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:15, marginBottom:3, lineHeight:1.3, color:T.text }}>{c.name}</div>
                  <div style={{ color:T.textMuted, fontSize:12, fontWeight:500, marginBottom:12 }}>📍 {c.city}, {c.state_abbr}</div>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:14 }}>
                    <Badge type={c._type} sm>{c._type==="reach"?"🎯 Reach":c._type==="safety"?"✓ Safety":"✓ Match"}</Badge>
                    <Badge type={c.is_public?"pub":"priv"} sm>{c.is_public?"Public":"Private"}</Badge>
                    {c.rank && <Badge type="gold" sm>#{c.rank}</Badge>}
                    {c.hbcu && <Badge type="hbcu" sm>HBCU</Badge>}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                    {[["Tuition",$.k(c.is_public?c.tuition_in_state:c.tuition_out_state)],["Grad Rate",$.pct(c.graduation_rate_6yr)]].map(([l,v])=>(
                      <div key={l} style={{ padding:"9px 10px", background:T.bg, borderRadius:10, border:`1px solid ${T.border}`, textAlign:"center" }}>
                        <div style={{ color:T.textDim, fontSize:10, fontWeight:700, textTransform:"uppercase", marginBottom:3 }}>{l}</div>
                        <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:15, color:T.blue }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <Btn variant="secondary" size="sm" full onClick={()=>{setSelCollege(c);setScreen("detail");}}>Details</Btn>
                    <Btn size="sm" full onClick={()=>{setCompList(p=>p.find(s=>s.id===c.id)?p:[...p.slice(0,2),c]);setScreen("compare");}}>Compare</Btn>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </>
      )}

      {!ran && !loading && (
        <div style={{ textAlign:"center", padding:80, color:T.textMuted }}>
          <div style={{ fontSize:56, marginBottom:18 }}>🎓</div>
          <div style={{ fontFamily:"Fraunces", fontSize:24, color:T.text, marginBottom:8 }}>Enter your profile above</div>
          <div style={{ fontSize:15 }}>We'll search the full NCES database and rank colleges by how well they fit you</div>
        </div>
      )}
    </div>
  );
};

// ─── Compare ──────────────────────────────────────────────────────────────────
const CompareScreen = ({ compList, setCompList, profile }) => {
  const [srch, setSrch] = useState("");
  const [res, setRes] = useState([]);
  const [loading, setLoading] = useState(false);
  const tmr = useRef(null);
  const SEL = "id,name,city,state_abbr,control,is_public,tuition_in_state,tuition_out_state,graduation_rate_6yr,acceptance_rate,sat_math_25,sat_math_75,sat_ebrw_25,sat_ebrw_75,avg_gpa,total_enrollment,rank,room_board,books_supplies,retention_rate";

  useEffect(() => {
    if (srch.length < 2) { setRes([]); return; }
    clearTimeout(tmr.current);
    setLoading(true);
    tmr.current = setTimeout(async () => {
      try {
        const r = await fetch(`${SB_URL}/rest/v1/colleges?select=${SEL}&name=ilike.*${encodeURIComponent(srch)}*&limit=6`, { headers: H });
        setRes(await r.json());
      } catch(e) {}
      setLoading(false);
    }, 300);
  }, [srch]);

  const rows = [
    { l:"Type", fn:c=>c.is_public?"Public":"Private" },
    { l:"Rank", fn:c=>c.rank?`#${c.rank}`:"—" },
    { l:"In-State Tuition", fn:c=>$.k(c.tuition_in_state), col:T.blue },
    { l:"Out-of-State Tuition", fn:c=>$.k(c.tuition_out_state), col:T.purple },
    { l:"Room & Board", fn:c=>$.k(c.room_board) },
    { l:"6-Year Grad Rate", fn:c=>$.pct(c.graduation_rate_6yr), bar:true, max:100 },
    { l:"Retention Rate", fn:c=>$.pct(c.retention_rate), bar:true, max:100 },
    { l:"Acceptance Rate", fn:c=>$.pct(c.acceptance_rate), bar:true, max:100, rev:true },
    { l:"SAT Math", fn:c=>c.sat_math_25?`${c.sat_math_25}–${c.sat_math_75}`:"—" },
    { l:"SAT EBRW", fn:c=>c.sat_ebrw_25?`${c.sat_ebrw_25}–${c.sat_ebrw_75}`:"—" },
    { l:"Avg GPA", fn:c=>c.avg_gpa||"—" },
    { l:"Enrollment", fn:c=>$.num(c.total_enrollment) },
    { l:"AI Fit Score", fn:c=>{const f=calcFit(c,profile);return f?`${f}%`:"—"}, col:T.gold },
  ];

  return (
    <div style={{ padding:"76px 40px 40px", maxWidth:1200, margin:"0 auto" }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:30, color:T.text, marginBottom:6 }}>Side-by-Side Comparison</h1>
        <p style={{ color:T.textMuted, fontSize:14 }}>Compare up to 3 colleges · Live NCES data</p>
      </div>

      {compList.length < 3 && (
        <Card style={{ padding:18, marginBottom:24, position:"relative" }}>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:17, color:T.textDim }}>🔍</span>
            <input value={srch} onChange={e=>setSrch(e.target.value)} placeholder="Search to add a college to compare..."
              style={{ flex:1, background:"transparent", border:"none", color:T.text, fontSize:14, fontFamily:"Plus Jakarta Sans", fontWeight:500 }}/>
            {loading && <div style={{ width:16, height:16, border:`2px solid ${T.border}`, borderTopColor:T.blue, borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>}
          </div>
          {res.length > 0 && (
            <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#fff", border:`1px solid ${T.border}`, borderRadius:14, marginTop:6, zIndex:50, overflow:"hidden", boxShadow:"0 8px 32px rgba(0,0,0,0.1)" }}>
              {res.map(r => (
                <div key={r.id} onClick={() => { setCompList(p=>p.find(s=>s.id===r.id)?p:[...p,r]); setSrch(""); setRes([]); }}
                  style={{ padding:"13px 20px", cursor:"pointer", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", transition:"background 0.15s" }}
                  onMouseEnter={e=>e.currentTarget.style.background=T.bg} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:T.text }}>{r.name}</div>
                    <div style={{ color:T.textMuted, fontSize:12, marginTop:2 }}>{r.city}, {r.state_abbr} · {r.control}</div>
                  </div>
                  <span style={{ color:T.blue, fontSize:13, fontWeight:700 }}>+ Add</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {compList.length === 0 ? (
        <div style={{ textAlign:"center", padding:80, color:T.textMuted }}>
          <div style={{ fontSize:48, marginBottom:14 }}>⚖️</div>
          <div style={{ fontFamily:"Fraunces", fontSize:22, color:T.text, marginBottom:6 }}>Search above to add colleges</div>
          <div style={{ fontSize:14 }}>Or go to My Matches and click Compare on any school</div>
        </div>
      ) : (
        <Card style={{ overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:T.bg }}>
                <th style={{ padding:"16px 22px", textAlign:"left", color:T.textMuted, fontSize:11, fontWeight:700, letterSpacing:"0.07em", width:190 }}>METRIC</th>
                {compList.map(c => (
                  <th key={c.id} style={{ padding:"16px 22px", textAlign:"center" }}>
                    <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:15, color:T.text, marginBottom:3 }}>{c.name}</div>
                    <div style={{ color:T.textMuted, fontSize:12, marginBottom:6 }}>{c.city}, {c.state_abbr}</div>
                    <button onClick={()=>setCompList(p=>p.filter(s=>s.id!==c.id))} style={{ background:"none", border:"none", color:T.danger, cursor:"pointer", fontSize:12, fontFamily:"Plus Jakarta Sans", fontWeight:600 }}>✕ Remove</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={row.l} style={{ borderTop:`1px solid ${T.border}`, background:ri%2===0?T.bgCard:T.bg }}>
                  <td style={{ padding:"13px 22px", color:T.textMuted, fontSize:12, fontWeight:700 }}>{row.l}</td>
                  {compList.map(c => {
                    const val = row.fn(c), nv = parseFloat(val);
                    return (
                      <td key={c.id} style={{ padding:"13px 22px", textAlign:"center" }}>
                        <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:16, color:row.col||T.text }}>{val}</div>
                        {row.bar && !isNaN(nv) && (
                          <div style={{ marginTop:6, maxWidth:120, margin:"6px auto 0" }}>
                            <ProgBar val={row.rev?100-nv:nv} max={row.max||100} color={row.rev?T.danger:T.blue} h={4}/>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

// ─── Tracker ──────────────────────────────────────────────────────────────────
const TrackerScreen = () => {
  const STAGES = ["Researching","Applied","In Progress","Accepted","Rejected"];
  const STAGE_COLORS = { Researching:T.textMuted, Applied:T.blue, "In Progress":T.purple, Accepted:T.success, Rejected:T.danger };
  const STAGE_BG = { Researching:T.bg, Applied:T.blueLight, "In Progress":T.accentBg, Accepted:T.successBg, Rejected:T.dangerBg };

  const [items, setItems] = useState([
    { id:1, school:"MIT", stage:"Researching", deadline:"2025-01-01", tasks:["Essays","Recommendations","Transcripts"], done:[false,false,false] },
    { id:2, school:"Stanford University", stage:"Applied", deadline:"2024-12-02", tasks:["Essays","Recommendations","Transcripts"], done:[true,true,true] },
    { id:3, school:"UC Berkeley", stage:"In Progress", deadline:"2025-01-15", tasks:["Essays","Recommendations","Transcripts","Portfolio"], done:[true,true,false,false] },
    { id:4, school:"Carnegie Mellon", stage:"Accepted", deadline:"2025-01-01", tasks:["Essays","Recommendations","Transcripts","Interview"], done:[true,true,true,true] },
  ]);
  const [adding, setAdding] = useState(false);
  const [newSchool, setNewSchool] = useState("");

  return (
    <div style={{ padding:"76px 32px 40px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
        <div>
          <h1 style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:28, color:T.text }}>Application Tracker</h1>
          <p style={{ color:T.textMuted, fontSize:14, marginTop:4 }}>{items.length} applications · {items.filter(i=>i.stage==="Accepted").length} accepted</p>
        </div>
        <Btn onClick={()=>setAdding(true)} variant="grad">+ Add Application</Btn>
      </div>

      {adding && (
        <Card style={{ padding:20, marginBottom:22, display:"flex", gap:12 }}>
          <input value={newSchool} onChange={e=>setNewSchool(e.target.value)} placeholder="College name..."
            style={{ flex:1, background:T.bg, border:`1.5px solid ${T.border}`, borderRadius:10, color:T.text, padding:"10px 14px", fontSize:13, fontFamily:"Plus Jakarta Sans" }}
            onFocus={e=>e.target.style.borderColor=T.blue} onBlur={e=>e.target.style.borderColor=T.border}/>
          <Btn onClick={()=>{if(newSchool.trim()){setItems(p=>[...p,{id:Date.now(),school:newSchool.trim(),stage:"Researching",deadline:"",tasks:["Essays","Recommendations","Transcripts"],done:[false,false,false]}]);setNewSchool("");setAdding(false);}}} variant="grad">Add</Btn>
          <Btn variant="ghost" onClick={()=>setAdding(false)}>Cancel</Btn>
        </Card>
      )}

      <div style={{ display:"grid", gridTemplateColumns:`repeat(${STAGES.length},1fr)`, gap:16, alignItems:"start" }}>
        {STAGES.map(stage => {
          const si = items.filter(i=>i.stage===stage);
          return (
            <div key={stage}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, padding:"8px 12px", background:STAGE_BG[stage], borderRadius:10, border:`1px solid ${T.border}` }}>
                <span style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:13, color:STAGE_COLORS[stage] }}>{stage}</span>
                <span style={{ background:"#fff", border:`1px solid ${T.border}`, borderRadius:10, padding:"1px 8px", fontSize:11, fontWeight:700, color:STAGE_COLORS[stage] }}>{si.length}</span>
              </div>
              {si.map(item => {
                const prog = item.done.filter(Boolean).length;
                return (
                  <Card key={item.id} style={{ padding:18, marginBottom:12 }}>
                    <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:14, color:T.blue, marginBottom:4 }}>{item.school}</div>
                    {item.deadline && <div style={{ color:T.textMuted, fontSize:12, fontWeight:500, marginBottom:11 }}>📅 {item.deadline}</div>}
                    <div style={{ marginBottom:11 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.textDim, fontWeight:600, marginBottom:5 }}>
                        <span>Progress</span><span style={{ color:prog===item.tasks.length?T.success:T.textMuted }}>{prog}/{item.tasks.length}</span>
                      </div>
                      <ProgBar val={prog} max={item.tasks.length} color={prog===item.tasks.length?T.success:T.blue}/>
                    </div>
                    {item.tasks.map((t,i) => (
                      <div key={i} onClick={()=>setItems(p=>p.map(it=>it.id===item.id?{...it,done:it.done.map((d,di)=>di===i?!d:d)}:it))} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6, cursor:"pointer" }}>
                        <div style={{ width:18, height:18, borderRadius:6, background:item.done[i]?T.success:T.border, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:`1.5px solid ${item.done[i]?T.success:T.border}` }}>
                          {item.done[i] && <span style={{ color:"#fff", fontSize:11, fontWeight:800 }}>✓</span>}
                        </div>
                        <span style={{ fontSize:12, fontWeight:500, color:item.done[i]?T.textDim:T.textMid, textDecoration:item.done[i]?"line-through":"none" }}>{t}</span>
                      </div>
                    ))}
                    <select value={stage} onChange={e=>setItems(p=>p.map(it=>it.id===item.id?{...it,stage:e.target.value}:it))} style={{ width:"100%", marginTop:12, background:T.bg, border:`1px solid ${T.border}`, borderRadius:8, color:T.textMid, padding:"7px 10px", fontSize:12, fontFamily:"Plus Jakarta Sans", fontWeight:600 }}>
                      {STAGES.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </Card>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── AI Chat ──────────────────────────────────────────────────────────────────
const ChatScreen = ({ profile }) => {
  const [msgs, setMsgs] = useState([{ role:"assistant", text:"Hi! I'm your Smart College Navigator AI — connected to the full NCES database. Ask me anything about colleges, writing requirements, financial aid, or application strategy!" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const btm = useRef(null);

  useEffect(() => { btm.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim(); setInput("");
    const history = [...msgs, { role:"user", text:txt }];
    setMsgs(history); setLoading(true);
    try {
      const pStr = Object.entries(profile).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join(", ");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:`You are a college admissions AI embedded in Smart College Navigator, which uses live NCES data. ${pStr?`Student profile: ${pStr}.`:""} Help with college selection, writing requirements, admissions strategy, financial aid, ROI, and major selection. Be warm, specific, and concise.`, messages:history.map(m=>({ role:m.role, content:m.text })) })
      });
      const data = await res.json();
      setMsgs(p=>[...p,{ role:"assistant", text:data.content?.[0]?.text||"Sorry, trouble responding." }]);
    } catch { setMsgs(p=>[...p,{ role:"assistant", text:"Connection error — please try again." }]); }
    setLoading(false);
  };

  const SUGGEST = ["Which schools have best CS programs under $20k tuition?","How do I evaluate a college's ROI?","What's the difference between reach, match, and safety schools?","What writing requirements should English majors look for?"];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", paddingTop:60 }}>
      {/* Header */}
      <div style={{ padding:"18px 32px", borderBottom:`1px solid ${T.border}`, background:"#fff", display:"flex", alignItems:"center", gap:14, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ width:44, height:44, background:T.grad, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:"0 3px 10px rgba(37,99,235,0.25)" }}>🤖</div>
        <div>
          <div style={{ fontFamily:"Fraunces", fontWeight:700, fontSize:17, color:T.text }}>AI College Assistant</div>
          <div style={{ color:T.textMuted, fontSize:12, fontWeight:500, marginTop:1 }}>Powered by Claude · NCES data · {Object.values(profile).filter(Boolean).length} profile fields</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"28px 0", background:T.bg }}>
        <div style={{ maxWidth:760, margin:"0 auto", padding:"0 28px" }}>
          {msgs.map((m, i) => (
            <div key={i} className="fu" style={{ display:"flex", gap:12, marginBottom:20, flexDirection:m.role==="user"?"row-reverse":"row", animationDelay:`${i*0.03}s` }}>
              {m.role==="assistant" && (
                <div style={{ width:38, height:38, background:T.grad, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:17, boxShadow:"0 2px 8px rgba(37,99,235,0.2)" }}>🤖</div>
              )}
              <div style={{ maxWidth:"76%", padding:"14px 18px", background:m.role==="user"?T.blue:"#fff", color:m.role==="user"?"#fff":T.text, borderRadius:m.role==="user"?"20px 20px 4px 20px":"20px 20px 20px 4px", border:m.role==="assistant"?`1px solid ${T.border}`:"none", fontSize:14, lineHeight:1.7, fontFamily:"Plus Jakarta Sans", boxShadow:m.role==="assistant"?"0 2px 8px rgba(0,0,0,0.05)":"0 2px 8px rgba(37,99,235,0.2)", whiteSpace:"pre-wrap" }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display:"flex", gap:12, marginBottom:20 }}>
              <div style={{ width:38, height:38, background:T.grad, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(37,99,235,0.2)" }}>🤖</div>
              <div style={{ padding:"14px 20px", background:"#fff", border:`1px solid ${T.border}`, borderRadius:"20px 20px 20px 4px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                  {[0,1,2].map(i=><div key={i} style={{ width:8, height:8, borderRadius:"50%", background:T.blue, animation:`pulse 1.2s ${i*0.2}s infinite` }}/>)}
                </div>
              </div>
            </div>
          )}
          <div ref={btm}/>
        </div>
      </div>

      {/* Suggestions */}
      {msgs.length === 1 && (
        <div style={{ background:T.bg, padding:"0 28px 16px", maxWidth:760, margin:"0 auto", width:"100%" }}>
          <div style={{ color:T.textDim, fontSize:11, fontWeight:700, marginBottom:8, letterSpacing:"0.07em" }}>SUGGESTED QUESTIONS</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {SUGGEST.map(s=>(
              <button key={s} onClick={()=>setInput(s)} style={{ background:"#fff", border:`1px solid ${T.border}`, borderRadius:22, color:T.textMid, padding:"8px 14px", fontSize:12, cursor:"pointer", fontFamily:"Plus Jakarta Sans", fontWeight:500, transition:"all 0.15s", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}
                onMouseEnter={e=>{e.target.style.borderColor=T.blue;e.target.style.color=T.blue;e.target.style.background=T.blueLight;}}
                onMouseLeave={e=>{e.target.style.borderColor=T.border;e.target.style.color=T.textMid;e.target.style.background="#fff";}}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ padding:"16px 28px 24px", borderTop:`1px solid ${T.border}`, background:"#fff", maxWidth:760, margin:"0 auto", width:"100%", boxShadow:"0 -2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ display:"flex", gap:10 }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
            placeholder="Ask about colleges, requirements, financial aid, ROI..."
            style={{ flex:1, background:T.bg, border:`2px solid ${T.border}`, borderRadius:14, color:T.text, padding:"13px 18px", fontSize:14, fontFamily:"Plus Jakarta Sans", fontWeight:500, transition:"border 0.2s, box-shadow 0.2s" }}
            onFocus={e=>{e.target.style.borderColor=T.blue;e.target.style.boxShadow=`0 0 0 4px rgba(37,99,235,0.1)`;}}
            onBlur={e=>{e.target.style.borderColor=T.border;e.target.style.boxShadow="none";}}/>
          <button onClick={send} disabled={loading||!input.trim()} style={{ background:input.trim()&&!loading?T.blue:T.border, border:"none", borderRadius:14, color:"#fff", padding:"13px 22px", cursor:input.trim()&&!loading?"pointer":"not-allowed", fontWeight:700, fontSize:18, transition:"all 0.15s", boxShadow:input.trim()&&!loading?"0 2px 10px rgba(37,99,235,0.3)":"none" }}>→</button>
        </div>
      </div>
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("search");
  const [selCollege, setSelCollege] = useState(null);
  const [compList, setCompList] = useState([]);
  const [profile, setProfile] = useState({ gpa:"", sat:"", act:"", budget:"", state:"" });

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight:"100vh", background:T.bg }}>
        <Nav screen={screen} setScreen={setScreen}/>
        {screen==="search"  && <SearchScreen  setScreen={setScreen} setSelCollege={setSelCollege} profile={profile}/>}
        {screen==="matches" && <MatchesScreen setScreen={setScreen} setSelCollege={setSelCollege} profile={profile} setProfile={setProfile} setCompList={setCompList}/>}
        {screen==="detail"  && <DetailScreen  college={selCollege} setScreen={setScreen} profile={profile}/>}
        {screen==="compare" && <CompareScreen compList={compList} setCompList={setCompList} profile={profile}/>}
        {screen==="tracker" && <TrackerScreen/>}
        {screen==="chat"    && <ChatScreen profile={profile}/>}
      </div>
    </>
  );
}
