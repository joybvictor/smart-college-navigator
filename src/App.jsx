import { useState, useEffect, useRef, useCallback } from "react";

// ─── Supabase ─────────────────────────────────────────────────────────────────
const SB_URL = "https://indksmocjyoqskokhvnz.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluZGtzbW9janlvcXNrb2todm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4OTk1MzQsImV4cCI6MjA4NzQ3NTUzNH0.7tOS61aPuFl0yDwk9UoBd86nAFEuIQITwNTHDqGAZek";
const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

// ─── Theme: Dark Teal (matching original mockups) ─────────────────────────────
const T = {
  bg:       "#0f1117",
  bgCard:   "#1a1d27",
  bgHov:    "#1e2235",
  bgSide:   "#13151f",
  border:   "#2a2d3e",
  borderHov:"#00c9a7",
  teal:     "#00c9a7",
  tealDark: "#00a88a",
  tealGlow: "rgba(0,201,167,0.12)",
  purple:   "#6c63ff",
  text:     "#e8eaf0",
  textMid:  "#c0c4d8",
  textMuted:"#8b8fa8",
  textDim:  "#5a5e7a",
  gold:     "#f4c542",
  goldBg:   "rgba(244,197,66,0.1)",
  danger:   "#ff4d6d",
  dangerBg: "rgba(255,77,109,0.1)",
  success:  "#00c9a7",
  successBg:"rgba(0,201,167,0.1)",
  accentBg: "rgba(108,99,255,0.1)",
  grad:     "linear-gradient(135deg, #00c9a7, #6c63ff)",
  gradSoft: "linear-gradient(135deg, rgba(0,201,167,0.1), rgba(108,99,255,0.1))",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${T.bg}; color: ${T.text}; font-family: 'DM Sans', sans-serif; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: ${T.bg}; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: ${T.teal}55; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .fu { animation: fadeUp 0.3s ease both; }
  .hov { transition: all 0.2s ease !important; }
  .hov:hover { transform: translateY(-2px) !important; border-color: ${T.teal} !important; box-shadow: 0 8px 28px rgba(0,201,167,0.12) !important; }
  input, select { outline: none; }
`;

// ─── Utils ────────────────────────────────────────────────────────────────────
const $ = {
  k:   v => v ? `$${(v/1000).toFixed(0)}k` : "—",
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
    <div style={{ width:30, height:30, border:`3px solid ${T.border}`, borderTopColor:T.teal, borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
  </div>
);

const Badge = ({ children, type="default", sm }) => {
  const map = {
    default: { bg:T.tealGlow,   c:T.teal,   b:`1px solid ${T.teal}33` },
    reach:   { bg:T.dangerBg,   c:T.danger, b:`1px solid ${T.danger}44` },
    safety:  { bg:T.accentBg,   c:T.purple, b:`1px solid ${T.purple}44` },
    match:   { bg:T.tealGlow,   c:T.teal,   b:`1px solid ${T.teal}33` },
    gold:    { bg:T.goldBg,     c:T.gold,   b:`1px solid ${T.gold}44` },
    pub:     { bg:T.accentBg,   c:T.purple, b:`1px solid ${T.purple}44` },
    priv:    { bg:T.goldBg,     c:T.gold,   b:`1px solid ${T.gold}44` },
    hbcu:    { bg:"rgba(244,197,66,0.08)", c:T.gold, b:`1px solid ${T.gold}44` },
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
  const pads = { sm:"7px 14px", md:"10px 20px", lg:"13px 28px" };
  const fonts = { sm:12, md:13, lg:15 };
  const styles = {
    primary:   { bg:hov?T.tealDark:T.teal,  c:"#0f1117", b:"none", sh:`0 2px 10px rgba(0,201,167,0.3)` },
    secondary: { bg:hov?T.tealGlow:"transparent", c:T.teal, b:`1px solid ${T.teal}`, sh:"none" },
    outline:   { bg:"transparent", c:T.teal, b:`1.5px solid ${T.teal}`, sh:"none" },
    ghost:     { bg:hov?T.bgHov:"transparent", c:T.text, b:`1px solid ${T.border}`, sh:"none" },
    gold:      { bg:hov?"#c9a030":T.gold, c:"#0f1117", b:"none", sh:`0 2px 10px rgba(244,197,66,0.25)` },
    danger:    { bg:hov?"#cc3355":T.danger, c:"#fff", b:"none", sh:"none" },
    grad:      { bg:T.grad, c:"#fff", b:"none", sh:`0 2px 12px rgba(0,201,167,0.3)` },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding:pads[size], fontSize:fonts[size], background:s.bg, color:s.c, border:s.b, boxShadow:s.sh, borderRadius:10, fontFamily:"Sora", fontWeight:700, cursor:disabled?"not-allowed":"pointer", transition:"all 0.18s", display:"inline-flex", alignItems:"center", gap:6, whiteSpace:"nowrap", opacity:disabled?0.45:1, width:full?"100%":undefined, justifyContent:full?"center":undefined }}>
      {children}
    </button>
  );
};

const Card = ({ children, style, onClick, hover }) => (
  <div onClick={onClick} className={hover?"hov":""}
    style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16, cursor:onClick?"pointer":"default", ...style }}>
    {children}
  </div>
);

const Ring = ({ score, size=72, type }) => {
  const color = type==="reach"?T.danger:type==="safety"?T.purple:T.teal;
  const track = type==="reach"?T.dangerBg:type==="safety"?T.accentBg:T.tealGlow;
  const r=(size-8)/2, circ=2*Math.PI*r;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={6}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={circ} strokeDashoffset={circ-(score/100)*circ} strokeLinecap="round"/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontFamily:"Sora", fontWeight:800, fontSize:size*0.2, color, lineHeight:1 }}>{score}%</span>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, color }) => (
  <div style={{ padding:"14px 16px", background:T.bg, borderRadius:12, border:`1px solid ${T.border}` }}>
    <div style={{ color:T.textDim, fontSize:10, fontWeight:700, letterSpacing:"0.07em", marginBottom:5, textTransform:"uppercase" }}>{label}</div>
    <div style={{ fontFamily:"Sora", fontWeight:800, fontSize:22, color:color||T.teal }}>{value}</div>
  </div>
);

const ProgBar = ({ val, max=100, color=T.teal, h=5 }) => (
  <div style={{ background:T.border, borderRadius:h, height:h, overflow:"hidden" }}>
    <div style={{ width:`${Math.min(100,(val/max)*100)}%`, height:"100%", background:color, borderRadius:h, transition:"width 0.5s ease" }}/>
  </div>
);

// ─── Nav ──────────────────────────────────────────────────────────────────────
const Nav = ({ screen, setScreen }) => {
  const tabs = [
    {id:"search",  l:"Search",     i:"🔍"},
    {id:"matches", l:"My Matches", i:"🎯"},
    {id:"compare", l:"Compare",    i:"⚖️"},
    {id:"tracker", l:"Tracker",    i:"📋"},
    {id:"chat",    l:"AI Chat",    i:"💬"},
  ];
  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, height:58, background:`${T.bg}f0`, backdropFilter:"blur(20px)", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 28px", gap:4 }}>
      <div style={{ display:"flex", alignItems:"center", gap:9, marginRight:20 }}>
        <div style={{ width:30, height:30, background:T.grad, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ color:"#0f1117", fontWeight:800, fontSize:14, fontFamily:"Sora" }}>S</span>
        </div>
        <span style={{ fontFamily:"Sora", fontWeight:700, fontSize:15, color:T.text }}>Smart College Navigator</span>
      </div>
      <div style={{ display:"flex", gap:2, flex:1 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setScreen(t.id)} style={{
            padding:"7px 14px", borderRadius:9, fontFamily:"DM Sans", fontWeight:screen===t.id?700:400, fontSize:13,
            background:screen===t.id?T.tealGlow:"transparent",
            color:screen===t.id?T.teal:T.textMuted,
            border:`1px solid ${screen===t.id?T.teal+"44":"transparent"}`,
            cursor:"pointer", transition:"all 0.15s", display:"flex", alignItems:"center", gap:5,
          }}>
            <span>{t.i}</span>{t.l}
          </button>
        ))}
      </div>
      <Btn variant="gold" size="sm">✦ Premium — $49.99</Btn>
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

  const doSearch = useCallback(async (q,st,ct,mt,ma,hb,pg) => {
    setLoading(true);
    try {
      let url = `${SB_URL}/rest/v1/colleges?select=${SEL}&order=rank.asc.nullslast,name.asc&limit=12&offset=${pg*12}`;
      if (q.trim().length>1) url+=`&name=ilike.*${encodeURIComponent(q.trim())}*`;
      if (st) url+=`&state_abbr=eq.${st}`;
      if (ct) url+=`&control=eq.${encodeURIComponent(ct)}`;
      if (mt<70000) url+=`&tuition_out_state=lte.${mt}`;
      if (ma<100) url+=`&acceptance_rate=lte.${ma}`;
      if (hb) url+=`&hbcu=eq.true`;
      const res = await fetch(url, { headers:{ ...H, "Range-Unit":"items", Prefer:"count=exact" } });
      const data = await res.json();
      setColleges(Array.isArray(data)?data:[]);
      setTotal(parseInt(res.headers.get("Content-Range")?.split("/")[1]||"0"));
    } catch(e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    clearTimeout(tmr.current);
    tmr.current = setTimeout(() => { setPage(0); doSearch(q,stateF,ctrl,maxTuit,maxAcc,hbcu,0); }, 320);
  }, [q,stateF,ctrl,maxTuit,maxAcc,hbcu]);

  useEffect(() => { doSearch(q,stateF,ctrl,maxTuit,maxAcc,hbcu,page); }, [page]);

  const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];
  const selSt = { width:"100%", background:T.bg, border:`1px solid ${T.border}`, borderRadius:9, color:T.text, padding:"9px 12px", fontSize:13, fontFamily:"DM Sans" };

  return (
    <div style={{ paddingTop:58, display:"grid", gridTemplateColumns:"260px 1fr", minHeight:"100vh" }}>
      {/* Sidebar */}
      <div style={{ padding:"26px 18px", borderRight:`1px solid ${T.border}`, position:"sticky", top:58, height:"calc(100vh - 58px)", overflowY:"auto", background:T.bgSide }}>
        <div style={{ fontFamily:"Sora", fontWeight:700, fontSize:15, marginBottom:24, color:T.text }}>Advanced Filters</div>

        <div style={{ marginBottom:18 }}>
          <label style={{ color:T.textMuted, fontSize:11, fontWeight:700, letterSpacing:"0.07em", display:"block", marginBottom:7 }}>STATE</label>
          <select value={stateF} onChange={e=>setStateF(e.target.value)} style={selSt}>
            <option value="">All States</option>
            {STATES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ marginBottom:18 }}>
          <label style={{ color:T.textMuted, fontSize:11, fontWeight:700, letterSpacing:"0.07em", display:"block", marginBottom:7 }}>INSTITUTION TYPE</label>
          <select value={ctrl} onChange={e=>setCtrl(e.target.value)} style={selSt}>
            <option value="">All Types</option>
            <option value="Public">Public</option>
            <option value="Private nonprofit">Private Nonprofit</option>
            <option value="Private for-profit">Private For-Profit</option>
          </select>
        </div>

        <div style={{ marginBottom:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
            <label style={{ color:T.textMuted, fontSize:11, fontWeight:700, letterSpacing:"0.07em" }}>MAX TUITION</label>
            <span style={{ color:T.teal, fontSize:12, fontWeight:700 }}>{maxTuit>=70000?"Any":$.k(maxTuit)}</span>
          </div>
          <input type="range" min={5000} max={70000} step={1000} value={maxTuit} onChange={e=>setMaxTuit(+e.target.value)} style={{ width:"100%", accentColor:T.teal }}/>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.textDim, marginTop:4 }}><span>$5k</span><span>$70k+</span></div>
        </div>

        <div style={{ marginBottom:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
            <label style={{ color:T.textMuted, fontSize:11, fontWeight:700, letterSpacing:"0.07em" }}>MAX ACCEPTANCE RATE</label>
            <span style={{ color:T.teal, fontSize:12, fontWeight:700 }}>{maxAcc}%</span>
          </div>
          <input type="range" min={1} max={100} value={maxAcc} onChange={e=>setMaxAcc(+e.target.value)} style={{ width:"100%", accentColor:T.teal }}/>
        </div>

        <label style={{ display:"flex", alignItems:"center", gap:9, marginBottom:24, cursor:"pointer", fontSize:13, color:T.textMuted, fontWeight:500 }}>
          <input type="checkbox" checked={hbcu} onChange={e=>setHbcu(e.target.checked)} style={{ accentColor:T.teal, width:15, height:15 }}/>
          HBCU Only
        </label>

        <div style={{ padding:18, background:T.tealGlow, borderRadius:14, border:`1px solid ${T.teal}22`, textAlign:"center" }}>
          <div style={{ color:T.textDim, fontSize:10, fontWeight:700, letterSpacing:"0.07em", marginBottom:4 }}>RESULTS FOUND</div>
          <div style={{ fontFamily:"Sora", fontSize:38, fontWeight:800, color:T.teal, lineHeight:1 }}>{total.toLocaleString()}</div>
          <div style={{ color:T.textDim, fontSize:12, marginTop:3 }}>colleges</div>
        </div>
      </div>

      {/* Results */}
      <div style={{ padding:"26px 28px" }}>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontFamily:"Sora", fontWeight:800, fontSize:26, marginBottom:6 }}>Find Your Perfect College</h1>
          <p style={{ color:T.textMuted, fontSize:14, marginBottom:18 }}>Powered by official NCES data · AI matching · Writing requirements · ROI calculator</p>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", fontSize:16, color:T.textMuted }}>🔍</span>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search college name (e.g. MIT, Rutgers, Howard University...)"
              style={{ width:"100%", padding:"14px 16px 14px 46px", background:T.bgCard, border:`1.5px solid ${T.border}`, borderRadius:14, color:T.text, fontSize:14, fontFamily:"DM Sans", transition:"border 0.2s" }}
              onFocus={e=>e.target.style.borderColor=T.teal} onBlur={e=>e.target.style.borderColor=T.border}/>
          </div>
        </div>

        {loading ? <Spinner/> : (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
              {colleges.map((c,i) => {
                const fit = calcFit(c,profile), type = calcType(c,profile);
                return (
                  <div key={c.id} className="fu hov" style={{ animationDelay:`${i*0.04}s` }}>
                    <Card onClick={()=>{setSelCollege(c);setScreen("detail");}} style={{ overflow:"hidden", cursor:"pointer" }}>
                      <div style={{ height:4, background:c.is_public?`linear-gradient(90deg,${T.teal},${T.purple})`:`linear-gradient(90deg,${T.gold},${T.danger})` }}/>
                      <div style={{ padding:"16px 18px" }}>
                        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontFamily:"Sora", fontWeight:700, fontSize:13, lineHeight:1.35, marginBottom:3, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{c.name}</div>
                            <div style={{ color:T.textMuted, fontSize:11 }}>📍 {c.city}, {c.state_abbr}</div>
                          </div>
                          {fit && <Ring score={fit} size={52} type={type}/>}
                        </div>
                        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:12 }}>
                          <Badge type={c.is_public?"pub":"priv"} sm>{c.is_public?"Public":"Private"}</Badge>
                          {fit && <Badge type={type} sm>{type==="reach"?"🎯 Reach":type==="safety"?"✓ Safety":"✓ Match"}</Badge>}
                          {c.rank && <Badge type="gold" sm>#{c.rank}</Badge>}
                          {c.hbcu && <Badge type="hbcu" sm>HBCU</Badge>}
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                          {[["Tuition",$.k(c.is_public?c.tuition_in_state:c.tuition_out_state)],["Grad Rate",$.pct(c.graduation_rate_6yr)],["Accept",$.pct(c.acceptance_rate)]].map(([l,v])=>(
                            <div key={l} style={{ textAlign:"center", padding:"8px 4px", background:T.bg, borderRadius:9, border:`1px solid ${T.border}` }}>
                              <div style={{ color:T.textDim, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>{l}</div>
                              <div style={{ fontFamily:"Sora", fontWeight:700, fontSize:13, color:T.teal }}>{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
            {colleges.length===0 && <div style={{ textAlign:"center", padding:80, color:T.textMuted }}><div style={{ fontSize:48, marginBottom:14 }}>🎓</div><div style={{ fontFamily:"Sora", fontSize:20 }}>No colleges found</div><div style={{ fontSize:14, marginTop:6 }}>Try adjusting your filters</div></div>}
            {total>12 && (
              <div style={{ display:"flex", justifyContent:"center", gap:10, alignItems:"center" }}>
                <Btn variant="ghost" size="sm" disabled={page===0} onClick={()=>setPage(p=>p-1)}>← Prev</Btn>
                <span style={{ color:T.textMuted, fontSize:13 }}>Page {page+1} of {Math.ceil(total/12)}</span>
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
  const tabs = ["Overview","Majors & Programs","Admissions","Financials"];

  useEffect(() => {
    if (!c||tab!=="Majors & Programs") return;
    setMLoad(true);
    fetch(`${SB_URL}/rest/v1/college_majors?select=credential_level,total_degrees_awarded,is_premium,majors(cip_code,cip_title,cip_family_title)&college_id=eq.${c.id}&order=total_degrees_awarded.desc.nullslast&limit=40`,{headers:H})
      .then(r=>r.json()).then(d=>{setMajors(Array.isArray(d)?d:[]);setMLoad(false);}).catch(()=>setMLoad(false));
  },[c,tab]);

  if (!c) return (
    <div style={{ padding:"120px 32px", textAlign:"center" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🎓</div>
      <div style={{ fontFamily:"Sora", fontSize:20, marginBottom:14 }}>No college selected</div>
      <Btn onClick={()=>setScreen("search")}>Browse Colleges</Btn>
    </div>
  );

  const fit = calcFit(c,profile), type = calcType(c,profile);
  const totalCost = (c.tuition_out_state||0)+(c.room_board||0)+(c.books_supplies||0);

  return (
    <div style={{ paddingTop:58 }}>
      <div style={{ background:`linear-gradient(160deg,${T.bgCard},${T.bg})`, borderBottom:`1px solid ${T.border}`, padding:"26px 36px" }}>
        <button onClick={()=>setScreen("search")} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"6px 14px", cursor:"pointer", fontSize:13, marginBottom:16, fontFamily:"DM Sans" }}>← Back</button>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:24 }}>
          <div>
            <div style={{ display:"flex", gap:7, marginBottom:10, flexWrap:"wrap" }}>
              <Badge type={c.is_public?"pub":"priv"}>{c.is_public?"Public":"Private"}</Badge>
              {c.hbcu&&<Badge type="hbcu">HBCU</Badge>}
              {c.rank&&<Badge type="gold">Ranked #{c.rank}</Badge>}
              {fit&&<Badge type={type}>{type==="reach"?"🎯 Reach":type==="safety"?"✓ Safety":"✓ Match"}</Badge>}
            </div>
            <h1 style={{ fontFamily:"Sora", fontWeight:800, fontSize:30, marginBottom:7, lineHeight:1.2 }}>{c.name}</h1>
            <p style={{ color:T.textMuted, fontSize:14 }}>📍 {c.city}, {c.state} · {c.setting||"—"} · {$.num(c.total_enrollment)} enrolled</p>
            {c.website&&<a href={c.website} target="_blank" rel="noreferrer" style={{ color:T.teal, fontSize:12, marginTop:8, display:"inline-block", fontWeight:600 }}>🔗 {c.website}</a>}
          </div>
          {fit&&(
            <div style={{ textAlign:"center", flexShrink:0, background:T.bgCard, borderRadius:16, padding:"16px 20px", border:`1px solid ${T.border}` }}>
              <Ring score={fit} size={86} type={type}/>
              <div style={{ color:T.textMuted, fontSize:11, fontWeight:700, marginTop:7, letterSpacing:"0.05em" }}>AI FIT SCORE</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display:"flex", borderBottom:`1px solid ${T.border}`, padding:"0 36px", background:T.bgCard }}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:"13px 18px", background:"transparent", border:"none", cursor:"pointer", color:tab===t?T.teal:T.textMuted, fontFamily:"DM Sans", fontWeight:tab===t?700:400, fontSize:13, borderBottom:`2px solid ${tab===t?T.teal:"transparent"}`, marginBottom:-1, transition:"all 0.15s" }}>{t}</button>
        ))}
      </div>

      <div style={{ padding:"28px 36px", maxWidth:1060 }}>
        {tab==="Overview"&&(
          <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:24 }}>
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
                <StatBox label="6-Yr Grad Rate" value={$.pct(c.graduation_rate_6yr)}/>
                <StatBox label="Retention Rate" value={$.pct(c.retention_rate)}/>
                <StatBox label="Acceptance Rate" value={$.pct(c.acceptance_rate)} color={T.danger}/>
              </div>
              <Card style={{ padding:22, marginBottom:18 }}>
                <div style={{ fontFamily:"Sora", fontWeight:700, fontSize:16, marginBottom:16 }}>Institution Profile</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[["Carnegie Classification",c.carnegie_classification],["Setting",c.setting],["Control",c.control],["Religious Affiliation",c.religious_affiliation||"None"],["HBCU",c.hbcu?"Yes":"No"],["Early Decision",c.has_early_decision?"Yes":"No"],["ED Deadline",c.ed_deadline||"—"],["Regular Deadline",c.regular_deadline||"—"]].filter(([,v])=>v).map(([k,v])=>(
                    <div key={k} style={{ padding:"10px 12px", background:T.bg, borderRadius:10, border:`1px solid ${T.border}` }}>
                      <div style={{ color:T.textDim, fontSize:11, marginBottom:3 }}>{k}</div>
                      <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{v}</div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card style={{ padding:22 }}>
                <div style={{ fontFamily:"Sora", fontWeight:700, fontSize:15, marginBottom:14 }}>Enrollment</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                  <StatBox label="Total" value={$.num(c.total_enrollment)}/>
                  <StatBox label="Undergrad" value={$.num(c.undergrad_enrollment)}/>
                  <StatBox label="Graduate" value={$.num(c.grad_enrollment)}/>
                </div>
              </Card>
            </div>
            <div>
              <Card style={{ padding:22, marginBottom:14 }}>
                <div style={{ fontFamily:"Sora", fontWeight:700, fontSize:15, marginBottom:14 }}>Annual Costs</div>
                {[["In-State Tuition",c.tuition_in_state,T.teal],["Out-of-State Tuition",c.tuition_out_state,T.purple],["Room & Board",c.room_board,T.textMuted],["Books & Supplies",c.books_supplies,T.textMuted]].map(([k,v,col])=>(
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${T.border}` }}>
                    <span style={{ color:T.textMuted, fontSize:13 }}>{k}</span>
                    <span style={{ fontFamily:"Sora", fontWeight:700, color:col||T.text, fontSize:15 }}>{$.k(v)}</span>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 0" }}>
                  <span style={{ fontWeight:700, fontSize:13 }}>Est. Total/Year</span>
                  <span style={{ fontFamily:"Sora", fontWeight:800, color:T.teal, fontSize:18 }}>{$.k(totalCost)}</span>
                </div>
              </Card>
              {c.net_price_calculator_url&&<a href={c.net_price_calculator_url} target="_blank" rel="noreferrer" style={{ display:"block", padding:"12px 14px", background:T.tealGlow, border:`1px solid ${T.teal}30`, borderRadius:12, color:T.teal, fontSize:13, textDecoration:"none", textAlign:"center", fontWeight:700, marginBottom:12 }}>💰 Net Price Calculator →</a>}
              {c.admissions_url&&<a href={c.admissions_url} target="_blank" rel="noreferrer" style={{ display:"block", padding:"12px 14px", background:T.accentBg, border:`1px solid ${T.purple}30`, borderRadius:12, color:T.purple, fontSize:13, textDecoration:"none", textAlign:"center", fontWeight:700 }}>📋 Apply Now →</a>}
            </div>
          </div>
        )}

        {tab==="Majors & Programs"&&(
          <div>
            <div style={{ fontFamily:"Sora", fontWeight:700, fontSize:20, marginBottom:18 }}>Programs at {c.name}</div>
            {mLoad?<Spinner/>:(
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
                {majors.map((m,i)=>(
                  <Card key={i} style={{ padding:18 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:14, marginBottom:4, lineHeight:1.35 }}>{m.majors?.cip_title||"—"}</div>
                        <div style={{ color:T.textMuted, fontSize:12 }}>{m.majors?.cip_family_title}</div>
                        <div style={{ color:T.textDim, fontSize:11, marginTop:3 }}>CIP {m.majors?.cip_code} · {m.credential_level}</div>
                        {m.is_premium&&<div style={{ marginTop:8 }}><Badge type="gold" sm>Premium Data</Badge></div>}
                      </div>
                      {m.total_degrees_awarded&&(
                        <div style={{ textAlign:"right", flexShrink:0, marginLeft:14, padding:"8px 12px", background:T.tealGlow, borderRadius:10 }}>
                          <div style={{ fontFamily:"Sora", fontWeight:800, fontSize:22, color:T.teal }}>{m.total_degrees_awarded}</div>
                          <div style={{ color:T.teal, fontSize:10, fontWeight:600 }}>degrees/yr</div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
                {majors.length===0&&<div style={{ color:T.textMuted, gridColumn:"1/-1", textAlign:"center", padding:48 }}>No program data available</div>}
              </div>
            )}
          </div>
        )}

        {tab==="Admissions"&&(
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
            <Card style={{ padding:22 }}>
              <div style={{ fontFamily:"Sora", fontWeight:700, fontSize:16, marginBottom:18 }}>Test Score Ranges (25th–75th %ile)</div>
              {[["SAT Math",c.sat_math_25,c.sat_math_75,800],["SAT EBRW",c.sat_ebrw_25,c.sat_ebrw_75,800],["ACT Composite",c.act_composite_25,c.act_composite_75,36]].map(([l,lo,hi,max])=>lo&&hi?(
                <div key={l} style={{ marginBottom:18 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                    <span style={{ color:T.textMuted, fontSize:13 }}>{l}</span>
                    <span style={{ fontFamily:"Sora", fontWeight:700, fontSize:14, color:T.teal }}>{lo}–{hi}</span>
                  </div>
                  <div style={{ position:"relative", height:8, background:T.border, borderRadius:4 }}>
                    <div style={{ position:"absolute", left:`${(lo/max)*100}%`, width:`${((hi-lo)/max)*100}%`, height:"100%", background:T.teal, borderRadius:4 }}/>
                    {profile.sat&&l.startsWith("SAT")&&<div style={{ position:"absolute", left:`${(profile.sat/max/2)*100}%`, top:-4, width:16, height:16, background:T.gold, borderRadius:"50%", border:`2px solid ${T.bg}`, transform:"translateX(-50%)" }}/>}
                  </div>
                </div>
              ):null)}
              {c.avg_gpa&&<div style={{ marginTop:10, padding:"12px 14px", background:T.bg, borderRadius:10, border:`1px solid ${T.border}` }}><span style={{ color:T.textMuted, fontSize:13 }}>Avg GPA: </span><span style={{ fontFamily:"Sora", fontWeight:800, color:T.teal, fontSize:17 }}>{c.avg_gpa}</span>{profile.gpa&&<span style={{ color:T.textDim, fontSize:12, marginLeft:10 }}>(Yours: {profile.gpa})</span>}</div>}
            </Card>
            <Card style={{ padding:22 }}>
              <div style={{ fontFamily:"Sora", fontWeight:700, fontSize:16, marginBottom:18 }}>Deadlines & Rates</div>
              {[["Acceptance Rate",$.pct(c.acceptance_rate)],["ED Acceptance Rate",$.pct(c.ed_acceptance_rate)],["Yield Rate",$.pct(c.yield_rate)],["ED Deadline",c.ed_deadline||"—"],["EA Deadline",c.ea_deadline||"—"],["Regular Deadline",c.regular_deadline||"—"]].map(([k,v])=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ color:T.textMuted, fontSize:13 }}>{k}</span>
                  <span style={{ fontFamily:"Sora", fontWeight:700, fontSize:14 }}>{v}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab==="Financials"&&(
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
            <Card style={{ padding:22 }}>
              <div style={{ fontFamily:"Sora", fontWeight:700, fontSize:16, marginBottom:18 }}>Cost Breakdown</div>
              {[["In-State Tuition",c.tuition_in_state,T.teal],["Out-of-State Tuition",c.tuition_out_state,T.purple],["Room & Board",c.room_board,T.success],["Books & Supplies",c.books_supplies,T.gold]].map(([k,v,col])=>v?(
                <div key={k} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}><span style={{ color:T.textMuted, fontSize:13 }}>{k}</span><span style={{ fontFamily:"Sora", fontWeight:700, color:col }}>{$.k(v)}</span></div>
                  <ProgBar val={v} max={75000} color={col}/>
                </div>
              ):null)}
            </Card>
            <Card style={{ padding:22 }}>
              <div style={{ fontFamily:"Sora", fontWeight:700, fontSize:16, marginBottom:18 }}>4-Year Projections</div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <StatBox label="In-State (4yr total)" value={$.k(((c.tuition_in_state||0)+(c.room_board||0)+(c.books_supplies||0))*4)} color={T.teal}/>
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
    if (!profile.sat&&!profile.gpa) return;
    setLoading(true);
    try {
      let url = `${SB_URL}/rest/v1/colleges?select=id,name,city,state_abbr,control,is_public,tuition_in_state,tuition_out_state,graduation_rate_6yr,acceptance_rate,sat_math_25,sat_math_75,sat_ebrw_25,sat_ebrw_75,avg_gpa,total_enrollment,rank,room_board,books_supplies,retention_rate,hbcu&order=rank.asc.nullslast&limit=80`;
      if (profile.state) url+=`&state_abbr=eq.${profile.state}`;
      if (profile.budget) url+=`&tuition_out_state=lte.${profile.budget}`;
      const res = await fetch(url,{headers:H});
      const data = await res.json();
      const scored = (Array.isArray(data)?data:[]).map(c=>({...c,_fit:calcFit(c,profile),_type:calcType(c,profile)})).filter(c=>c._fit!==null).sort((a,b)=>b._fit-a._fit).slice(0,12);
      setColleges(scored); setRan(true);
    } catch(e){console.error(e);}
    setLoading(false);
  };

  const inpSt = { width:"100%", padding:"10px 12px", background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontSize:13, fontFamily:"DM Sans" };

  return (
    <div style={{ padding:"74px 36px 40px", maxWidth:1080, margin:"0 auto" }}>
      <Card style={{ padding:28, marginBottom:28, background:`linear-gradient(135deg,${T.bgCard},${T.bg})` }}>
        <div style={{ fontFamily:"Sora", fontWeight:800, fontSize:24, marginBottom:6 }}>AI Personalized Matching</div>
        <div style={{ color:T.textMuted, fontSize:14, marginBottom:22 }}>Enter your profile — we'll rank colleges from the full NCES database by AI fit score</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:20 }}>
          {[{k:"gpa",l:"GPA",ph:"3.7"},{k:"sat",l:"SAT Total",ph:"1420"},{k:"act",l:"ACT",ph:"32"},{k:"budget",l:"Max Tuition ($)",ph:"35000"},{k:"state",l:"State Pref.",ph:"NJ"}].map(f=>(
            <div key={f.k}>
              <label style={{ color:T.textMuted, fontSize:11, fontWeight:700, letterSpacing:"0.06em", display:"block", marginBottom:6 }}>{f.l}</label>
              <input placeholder={f.ph} value={profile[f.k]||""} onChange={e=>setProfile(p=>({...p,[f.k]:f.k==="state"?e.target.value.toUpperCase().slice(0,2):e.target.value}))} style={inpSt}
                onFocus={e=>e.target.style.borderColor=T.teal} onBlur={e=>e.target.style.borderColor=T.border}/>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <Btn variant="grad" size="lg" onClick={run} disabled={loading||(!profile.sat&&!profile.gpa)}>
            {loading?"⏳ Searching NCES database...":"✦ Find My Matches"}
          </Btn>
          {!profile.sat&&!profile.gpa&&<span style={{ color:T.textDim, fontSize:13 }}>Enter GPA or SAT to get started</span>}
        </div>
      </Card>

      {loading&&<Spinner/>}

      {ran&&!loading&&(
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div>
              <h2 style={{ fontFamily:"Sora", fontWeight:800, fontSize:24 }}>Your Top Matches</h2>
              <p style={{ color:T.textMuted, fontSize:13, marginTop:4 }}>{colleges.length} colleges ranked by AI fit score</p>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:18 }}>
            {colleges.map((c,i)=>(
              <div key={c.id} className="fu" style={{ animationDelay:`${i*0.05}s` }}>
                <Card hover style={{ padding:22, position:"relative", overflow:"hidden" }}>
                  {i<3&&<div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:[T.grad,`linear-gradient(90deg,${T.teal},${T.success})`,`linear-gradient(90deg,${T.gold},${T.purple})`][i] }}/>}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                    <div>{i===0&&<Badge type="gold">⭐ Best Fit</Badge>}{i===1&&<Badge>✦ Top Pick</Badge>}</div>
                    <Ring score={c._fit} size={62} type={c._type}/>
                  </div>
                  <div style={{ fontFamily:"Sora", fontWeight:700, fontSize:14, marginBottom:3, lineHeight:1.3 }}>{c.name}</div>
                  <div style={{ color:T.textMuted, fontSize:12, marginBottom:12 }}>📍 {c.city}, {c.state_abbr}</div>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:14 }}>
                    <Badge type={c._type} sm>{c._type==="reach"?"🎯 Reach":c._type==="safety"?"✓ Safety":"✓ Match"}</Badge>
                    <Badge type={c.is_public?"pub":"priv"} sm>{c.is_public?"Public":"Private"}</Badge>
                    {c.rank&&<Badge type="gold" sm>#{c.rank}</Badge>}
                    {c.hbcu&&<Badge type="hbcu" sm>HBCU</Badge>}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
                    {[["Tuition",$.k(c.is_public?c.tuition_in_state:c.tuition_out_state)],["Grad Rate",$.pct(c.graduation_rate_6yr)]].map(([l,v])=>(
                      <div key={l} style={{ padding:"8px 10px", background:T.bg, borderRadius:8, textAlign:"center", border:`1px solid ${T.border}` }}>
                        <div style={{ color:T.textDim, fontSize:10, fontWeight:700, textTransform:"uppercase", marginBottom:3 }}>{l}</div>
                        <div style={{ fontFamily:"Sora", fontWeight:700, fontSize:14, color:T.teal }}>{v}</div>
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

      {!ran&&!loading&&(
        <div style={{ textAlign:"center", padding:80, color:T.textMuted }}>
          <div style={{ fontSize:56, marginBottom:18 }}>🎓</div>
          <div style={{ fontFamily:"Sora", fontSize:22, marginBottom:8 }}>Enter your profile above</div>
          <div style={{ fontSize:15 }}>We'll search the full NCES database and rank by AI fit score</div>
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
    if (srch.length<2){setRes([]);return;}
    clearTimeout(tmr.current);
    setLoading(true);
    tmr.current = setTimeout(async()=>{
      try { const r=await fetch(`${SB_URL}/rest/v1/colleges?select=${SEL}&name=ilike.*${encodeURIComponent(srch)}*&limit=6`,{headers:H}); setRes(await r.json()); } catch(e){}
      setLoading(false);
    },300);
  },[srch]);

  const rows=[
    {l:"Type",fn:c=>c.is_public?"Public":"Private"},
    {l:"Rank",fn:c=>c.rank?`#${c.rank}`:"—"},
    {l:"In-State Tuition",fn:c=>$.k(c.tuition_in_state),col:T.teal},
    {l:"Out-of-State Tuition",fn:c=>$.k(c.tuition_out_state),col:T.purple},
    {l:"Room & Board",fn:c=>$.k(c.room_board)},
    {l:"6-Year Grad Rate",fn:c=>$.pct(c.graduation_rate_6yr),bar:true,max:100},
    {l:"Retention Rate",fn:c=>$.pct(c.retention_rate),bar:true,max:100},
    {l:"Acceptance Rate",fn:c=>$.pct(c.acceptance_rate),bar:true,max:100,rev:true},
    {l:"SAT Math",fn:c=>c.sat_math_25?`${c.sat_math_25}–${c.sat_math_75}`:"—"},
    {l:"SAT EBRW",fn:c=>c.sat_ebrw_25?`${c.sat_ebrw_25}–${c.sat_ebrw_75}`:"—"},
    {l:"Avg GPA",fn:c=>c.avg_gpa||"—"},
    {l:"Enrollment",fn:c=>$.num(c.total_enrollment)},
    {l:"AI Fit Score",fn:c=>{const f=calcFit(c,profile);return f?`${f}%`:"—"},col:T.gold},
  ];

  return (
    <div style={{ padding:"74px 36px 40px", maxWidth:1160, margin:"0 auto" }}>
      <div style={{ marginBottom:26 }}>
        <h1 style={{ fontFamily:"Sora", fontWeight:800, fontSize:26 }}>Side-by-Side Comparison</h1>
        <p style={{ color:T.textMuted, fontSize:14, marginTop:4 }}>Compare up to 3 colleges · Live NCES data</p>
      </div>

      {compList.length<3&&(
        <Card style={{ padding:18, marginBottom:22, position:"relative" }}>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ color:T.textMuted }}>🔍</span>
            <input value={srch} onChange={e=>setSrch(e.target.value)} placeholder="Search to add a college..."
              style={{ flex:1, background:"transparent", border:"none", color:T.text, fontSize:14, fontFamily:"DM Sans" }}/>
            {loading&&<div style={{ width:16, height:16, border:`2px solid ${T.border}`, borderTopColor:T.teal, borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>}
          </div>
          {res.length>0&&(
            <div style={{ position:"absolute", top:"100%", left:0, right:0, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:12, marginTop:4, zIndex:50, overflow:"hidden" }}>
              {res.map(r=>(
                <div key={r.id} onClick={()=>{setCompList(p=>p.find(s=>s.id===r.id)?p:[...p,r]);setSrch("");setRes([]);}}
                  style={{ padding:"12px 18px", cursor:"pointer", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", transition:"background 0.15s" }}
                  onMouseEnter={e=>e.currentTarget.style.background=T.bgHov} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div><div style={{ fontWeight:600, fontSize:13 }}>{r.name}</div><div style={{ color:T.textMuted, fontSize:11, marginTop:2 }}>{r.city}, {r.state_abbr} · {r.control}</div></div>
                  <span style={{ color:T.teal, fontSize:13, fontWeight:700 }}>+ Add</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {compList.length===0?(
        <div style={{ textAlign:"center", padding:80, color:T.textMuted }}><div style={{ fontSize:48, marginBottom:14 }}>⚖️</div><div style={{ fontFamily:"Sora", fontSize:20 }}>Search above to add colleges</div><div style={{ fontSize:13, marginTop:6 }}>Or go to My Matches → click Compare</div></div>
      ):(
        <Card style={{ overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:T.bg }}>
                <th style={{ padding:"14px 20px", textAlign:"left", color:T.textMuted, fontSize:11, fontWeight:700, letterSpacing:"0.07em", width:190 }}>METRIC</th>
                {compList.map(c=>(
                  <th key={c.id} style={{ padding:"14px 20px", textAlign:"center" }}>
                    <div style={{ fontFamily:"Sora", fontWeight:700, fontSize:14, marginBottom:3 }}>{c.name}</div>
                    <div style={{ color:T.textMuted, fontSize:11, marginBottom:5 }}>{c.city}, {c.state_abbr}</div>
                    <button onClick={()=>setCompList(p=>p.filter(s=>s.id!==c.id))} style={{ background:"none", border:"none", color:T.danger, cursor:"pointer", fontSize:12, fontFamily:"DM Sans", fontWeight:600 }}>✕ Remove</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row,ri)=>(
                <tr key={row.l} style={{ borderTop:`1px solid ${T.border}`, background:ri%2===0?T.bgCard:T.bg }}>
                  <td style={{ padding:"12px 20px", color:T.textMuted, fontSize:12, fontWeight:600 }}>{row.l}</td>
                  {compList.map(c=>{
                    const val=row.fn(c), nv=parseFloat(val);
                    return (
                      <td key={c.id} style={{ padding:"12px 20px", textAlign:"center" }}>
                        <div style={{ fontFamily:"Sora", fontWeight:700, fontSize:15, color:row.col||T.text }}>{val}</div>
                        {row.bar&&!isNaN(nv)&&<div style={{ marginTop:6, maxWidth:120, margin:"6px auto 0" }}><ProgBar val={row.rev?100-nv:nv} max={row.max||100} color={row.rev?T.danger:T.teal} h={4}/></div>}
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
  const COLS = { Researching:T.textMuted, Applied:T.teal, "In Progress":T.purple, Accepted:T.success, Rejected:T.danger };
  const [items, setItems] = useState([
    {id:1,school:"MIT",stage:"Researching",deadline:"2025-01-01",tasks:["Essays","Recommendations","Transcripts"],done:[false,false,false]},
    {id:2,school:"Stanford University",stage:"Applied",deadline:"2024-12-02",tasks:["Essays","Recommendations","Transcripts"],done:[true,true,true]},
    {id:3,school:"UC Berkeley",stage:"In Progress",deadline:"2025-01-15",tasks:["Essays","Recommendations","Transcripts","Portfolio"],done:[true,true,false,false]},
    {id:4,school:"Carnegie Mellon",stage:"Accepted",deadline:"2025-01-01",tasks:["Essays","Recommendations","Transcripts","Interview"],done:[true,true,true,true]},
  ]);
  const [adding, setAdding] = useState(false);
  const [newSchool, setNewSchool] = useState("");

  return (
    <div style={{ padding:"74px 28px 40px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:26 }}>
        <div>
          <h1 style={{ fontFamily:"Sora", fontWeight:800, fontSize:26 }}>Application Tracker</h1>
          <p style={{ color:T.textMuted, fontSize:13, marginTop:4 }}>{items.length} applications · {items.filter(i=>i.stage==="Accepted").length} accepted</p>
        </div>
        <Btn variant="grad" onClick={()=>setAdding(true)}>+ Add Application</Btn>
      </div>

      {adding&&(
        <Card style={{ padding:18, marginBottom:20, display:"flex", gap:10 }}>
          <input value={newSchool} onChange={e=>setNewSchool(e.target.value)} placeholder="College name..."
            style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"9px 13px", fontSize:13, fontFamily:"DM Sans" }}
            onFocus={e=>e.target.style.borderColor=T.teal} onBlur={e=>e.target.style.borderColor=T.border}/>
          <Btn onClick={()=>{if(newSchool.trim()){setItems(p=>[...p,{id:Date.now(),school:newSchool.trim(),stage:"Researching",deadline:"",tasks:["Essays","Recommendations","Transcripts"],done:[false,false,false]}]);setNewSchool("");setAdding(false);}}} variant="grad">Add</Btn>
          <Btn variant="ghost" onClick={()=>setAdding(false)}>Cancel</Btn>
        </Card>
      )}

      <div style={{ display:"grid", gridTemplateColumns:`repeat(${STAGES.length},1fr)`, gap:14, alignItems:"start" }}>
        {STAGES.map(stage=>{
          const si=items.filter(i=>i.stage===stage);
          return (
            <div key={stage}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, padding:"8px 10px", background:T.bgCard, borderRadius:10, border:`1px solid ${T.border}` }}>
                <span style={{ fontFamily:"Sora", fontWeight:700, fontSize:12, color:COLS[stage] }}>{stage}</span>
                <span style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:10, padding:"1px 7px", fontSize:11, fontWeight:700, color:COLS[stage] }}>{si.length}</span>
              </div>
              {si.map(item=>{
                const prog=item.done.filter(Boolean).length;
                return (
                  <Card key={item.id} style={{ padding:16, marginBottom:10 }}>
                    <div style={{ fontFamily:"Sora", fontWeight:700, fontSize:13, color:T.teal, marginBottom:3 }}>{item.school}</div>
                    {item.deadline&&<div style={{ color:T.textMuted, fontSize:11, marginBottom:10 }}>📅 {item.deadline}</div>}
                    <div style={{ marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.textDim, marginBottom:5 }}><span>Progress</span><span style={{ color:prog===item.tasks.length?T.success:T.textMuted }}>{prog}/{item.tasks.length}</span></div>
                      <ProgBar val={prog} max={item.tasks.length} color={prog===item.tasks.length?T.success:T.teal}/>
                    </div>
                    {item.tasks.map((t,i)=>(
                      <div key={i} onClick={()=>setItems(p=>p.map(it=>it.id===item.id?{...it,done:it.done.map((d,di)=>di===i?!d:d)}:it))} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5, cursor:"pointer" }}>
                        <span style={{ color:item.done[i]?T.teal:T.textDim, fontSize:14 }}>{item.done[i]?"✅":"⭕"}</span>
                        <span style={{ fontSize:12, color:item.done[i]?T.textMuted:T.text, textDecoration:item.done[i]?"line-through":"none" }}>{t}</span>
                      </div>
                    ))}
                    <select value={stage} onChange={e=>setItems(p=>p.map(it=>it.id===item.id?{...it,stage:e.target.value}:it))} style={{ width:"100%", marginTop:10, background:T.bg, border:`1px solid ${T.border}`, borderRadius:7, color:T.text, padding:"6px 10px", fontSize:11, fontFamily:"DM Sans" }}>
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

// ─── Chat ─────────────────────────────────────────────────────────────────────
const ChatScreen = ({ profile }) => {
  const [msgs, setMsgs] = useState([{role:"assistant",text:"Hi! I'm your Smart College Navigator AI — connected to the full NCES database. Ask me anything about colleges, writing requirements, financial aid, or application strategy!"}]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const btm = useRef(null);

  useEffect(()=>{btm.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  const send = async () => {
    if (!input.trim()||loading) return;
    const txt=input.trim(); setInput("");
    const history=[...msgs,{role:"user",text:txt}];
    setMsgs(history); setLoading(true);
    try {
      const pStr=Object.entries(profile).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join(", ");
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:`You are a college admissions AI in Smart College Navigator, powered by live NCES data. ${pStr?`Student profile: ${pStr}.`:""} Help with college selection, writing requirements, admissions strategy, financial aid, ROI, and major selection. Be warm, specific, and concise.`,messages:history.map(m=>({role:m.role,content:m.text}))})});
      const data=await res.json();
      setMsgs(p=>[...p,{role:"assistant",text:data.content?.[0]?.text||"Sorry, trouble responding."}]);
    } catch { setMsgs(p=>[...p,{role:"assistant",text:"Connection error — please try again."}]); }
    setLoading(false);
  };

  const SUGGEST=["Which schools have best CS programs under $20k tuition?","How do I evaluate a college's ROI?","What's the difference between reach, match, and safety schools?","What writing requirements should English majors look for?"];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", paddingTop:58 }}>
      <div style={{ padding:"18px 28px", borderBottom:`1px solid ${T.border}`, background:T.bgCard, display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:42, height:42, background:T.grad, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🤖</div>
        <div>
          <div style={{ fontFamily:"Sora", fontWeight:700, fontSize:16 }}>AI College Assistant</div>
          <div style={{ color:T.textMuted, fontSize:12, marginTop:1 }}>Powered by Claude · NCES data · {Object.values(profile).filter(Boolean).length} profile fields</div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"24px 0" }}>
        <div style={{ maxWidth:740, margin:"0 auto", padding:"0 24px" }}>
          {msgs.map((m,i)=>(
            <div key={i} className="fu" style={{ display:"flex", gap:10, marginBottom:18, flexDirection:m.role==="user"?"row-reverse":"row", animationDelay:`${i*0.03}s` }}>
              {m.role==="assistant"&&<div style={{ width:36, height:36, background:T.grad, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16 }}>🤖</div>}
              <div style={{ maxWidth:"76%", padding:"13px 17px", background:m.role==="user"?T.teal:T.bgCard, color:m.role==="user"?"#0f1117":T.text, borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px", border:m.role==="assistant"?`1px solid ${T.border}`:"none", fontSize:14, lineHeight:1.65, fontFamily:"DM Sans", whiteSpace:"pre-wrap" }}>{m.text}</div>
            </div>
          ))}
          {loading&&(
            <div style={{ display:"flex", gap:10, marginBottom:18 }}>
              <div style={{ width:36, height:36, background:T.grad, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>🤖</div>
              <div style={{ padding:"13px 17px", background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:"18px 18px 18px 4px", display:"flex", gap:5, alignItems:"center" }}>
                {[0,1,2].map(i=><div key={i} style={{ width:7, height:7, borderRadius:"50%", background:T.teal, animation:`pulse 1.2s ${i*0.2}s infinite` }}/>)}
              </div>
            </div>
          )}
          <div ref={btm}/>
        </div>
      </div>

      {msgs.length===1&&(
        <div style={{ maxWidth:740, margin:"0 auto", width:"100%", padding:"0 24px 12px" }}>
          <div style={{ color:T.textDim, fontSize:11, fontWeight:700, marginBottom:8, letterSpacing:"0.07em" }}>SUGGESTED</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {SUGGEST.map(s=>(
              <button key={s} onClick={()=>setInput(s)} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:20, color:T.text, padding:"7px 13px", fontSize:12, cursor:"pointer", fontFamily:"DM Sans", transition:"all 0.15s" }}
                onMouseEnter={e=>{e.target.style.borderColor=T.teal;e.target.style.color=T.teal;}}
                onMouseLeave={e=>{e.target.style.borderColor=T.border;e.target.style.color=T.text;}}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding:"14px 24px 22px", borderTop:`1px solid ${T.border}`, maxWidth:740, margin:"0 auto", width:"100%" }}>
        <div style={{ display:"flex", gap:10 }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Ask about colleges, requirements, financial aid, ROI..."
            style={{ flex:1, background:T.bgCard, border:`1.5px solid ${T.border}`, borderRadius:13, color:T.text, padding:"13px 17px", fontSize:14, fontFamily:"DM Sans", transition:"border 0.2s" }}
            onFocus={e=>e.target.style.borderColor=T.teal} onBlur={e=>e.target.style.borderColor=T.border}/>
          <button onClick={send} disabled={loading||!input.trim()} style={{ background:input.trim()&&!loading?T.teal:T.border, border:"none", borderRadius:13, color:"#0f1117", padding:"13px 20px", cursor:input.trim()&&!loading?"pointer":"not-allowed", fontWeight:700, fontSize:16, transition:"all 0.15s" }}>→</button>
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
