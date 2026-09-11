<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Exhale Memorials — Front Desk</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --slate:#2B2D37;
    --slate-soft:#3B3E4A;
    --green:#20C997;
    --green-deep:#189873;
    --cream:#F3EEE8;
    --card:#FFFFFF;
    --ink:#2B2D37;
    --ink-soft:#6B6F7B;
    --hairline:#E7E2D8;
    --amber:#C98A20;
    --amber-pale:#F7ECD8;
    --rust:#B5493A;
    --rust-pale:#F5E1DD;
    --shadow: 0 1px 2px rgba(43,45,55,0.05), 0 10px 28px rgba(43,45,55,0.07);
  }
  :root[data-theme="dark"]{
    --cream:#1A1B21;
    --card:#24252D;
    --ink:#F3EEE8;
    --ink-soft:#9A9CA6;
    --hairline:rgba(255,255,255,0.09);
    --amber:#E0A548;
    --amber-pale:rgba(224,165,72,0.16);
    --rust:#E2776A;
    --rust-pale:rgba(226,119,106,0.16);
    --shadow: 0 1px 2px rgba(0,0,0,0.3), 0 10px 28px rgba(0,0,0,0.35);
  }
  body, .stat-card, .panel{ transition: background-color .2s ease, color .2s ease, border-color .2s ease; }
  *{box-sizing:border-box; margin:0; padding:0;}
  html, body{ height:100%; overflow:hidden; }
  body{
    font-family:'Nunito', sans-serif;
    background: var(--cream);
    color: var(--ink);
    -webkit-font-smoothing:antialiased;
  }
  .shell{ height:100vh; display:flex; flex-direction:column; }

  header{
    background: var(--slate);
    color:#F3EEE8;
    padding: 18px 32px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    flex-wrap:wrap;
    gap:12px;
    flex-shrink:0;
  }
  .brand{ display:flex; align-items:center; gap:14px; }
  .brand-logo{ display:inline-flex; flex-direction:column; align-items:flex-start; line-height:1; position:relative; }
  .brand-word{ position:relative; display:inline-block; font-family:'Poppins', sans-serif; font-weight:800; font-size:19px; letter-spacing:-0.01em; color:#F3EEE8; }
  .brand-arrow{ position:absolute; top:-7px; right:-13px; width:13px; height:13px; }
  .brand-dot{ font-family:'Inter', 'Nunito', sans-serif; font-weight:400; font-size:10px; color:#9A9CA6; margin-top:2px; padding-left:2px; letter-spacing:0.01em; }
  .brand-sub{ font-size:11px; color:#B9BAC4; letter-spacing:0.8px; text-transform:uppercase; margin-top:1px; }
  .header-right{ display:flex; align-items:center; gap:18px; }
  .clock{ text-align:right; }
  .clock .time{ font-family:'Poppins', sans-serif; font-weight:700; font-size:20px; }
  .clock .date{ font-size:11px; color:#B9BAC4; }
  .sync-pill{
    font-size:11px; font-weight:700;
    background: rgba(32,201,151,0.15);
    color: var(--green);
    padding:6px 12px;
    border-radius:20px;
    display:flex; align-items:center; gap:6px;
  }
  .sync-dot{ width:7px; height:7px; border-radius:50%; background:var(--green); animation: pulse 2s infinite; }
  @keyframes pulse{ 0%,100%{opacity:1;} 50%{opacity:0.35;} }
  .refresh-btn{
    background: none; border:1px solid rgba(255,255,255,0.25); color:#F3EEE8;
    font-family:'Nunito',sans-serif; font-weight:700; font-size:11.5px;
    padding:7px 13px; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:6px;
  }
  .refresh-btn:hover{ background: rgba(255,255,255,0.08); }
  .refresh-btn:disabled{ opacity:0.5; cursor:default; }

  main{ flex:1; min-height:0; overflow:hidden; padding: 20px 32px 20px; max-width:1400px; margin:0 auto; width:100%; display:flex; flex-direction:column; gap:14px; }

  .error-banner{
    background: var(--rust-pale); color:var(--rust); border-radius:10px;
    padding:10px 14px; font-size:12.5px; display:none;
    flex-shrink:0;
  }

  .stat-row{
    display:grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap:14px;
    flex-shrink:0;
  }
  .stat-card{
    background: var(--card);
    border-radius:14px;
    box-shadow: var(--shadow);
    padding:18px 20px;
    border-left: 4px solid var(--green);
  }
  .stat-card.attention{ border-left-color: var(--amber); }
  .stat-label{ font-size:11.5px; font-weight:700; color:var(--ink-soft); text-transform:uppercase; letter-spacing:0.4px; }
  .stat-value{ font-family:'Poppins', sans-serif; font-size:30px; font-weight:700; margin-top:6px; }
  .stat-foot{ font-size:11.5px; color:var(--ink-soft); margin-top:4px; }

  .content-area{ flex:1; min-height:0; display:flex; flex-direction:column; gap:14px; }
  .grid{
    display:grid;
    grid-template-columns: 1.4fr 1fr;
    gap:18px;
    flex:1 1 56%;
    min-height:0;
  }
  .panel{
    background: var(--card);
    border-radius:16px;
    box-shadow: var(--shadow);
    padding:20px 22px;
    display:flex;
    flex-direction:column;
    min-height:0;
    overflow:hidden;
  }
  .panel-head{ display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-shrink:0; }
  .panel-list{ flex:1; min-height:0; overflow-y:auto; }
  .panel-title{ font-family:'Poppins', sans-serif; font-size:16.5px; font-weight:700; }
  .panel-sub{ font-size:11.5px; color:var(--ink-soft); margin-top:2px; }
  .count-pill{
    background: var(--cream); border:1px solid var(--hairline);
    font-size:11.5px; font-weight:700; padding:4px 11px; border-radius:20px; color:var(--ink-soft);
  }

  .lead-row{ display:flex; align-items:center; gap:14px; padding:13px 0; border-bottom:1px solid var(--hairline); }
  .lead-row:last-child{ border-bottom:none; }
  .lead-avatar{
    width:38px; height:38px; border-radius:50%;
    background: var(--slate); color:#fff;
    font-family:'Poppins',sans-serif; font-weight:700; font-size:14px;
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0;
  }
  .lead-main{ flex:1; min-width:0; }
  .lead-name{ font-weight:700; font-size:13.5px; }
  .lead-meta{ font-size:11.5px; color:var(--ink-soft); margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lead-right{ text-align:right; flex-shrink:0; }
  .lead-time{ font-size:11px; color:var(--ink-soft); font-weight:600; }
  .lead-stage{
    display:inline-block; margin-top:5px;
    font-size:10px; font-weight:700; padding:3px 9px; border-radius:20px;
    background: var(--cream); color:var(--ink-soft); border:1px solid var(--hairline);
  }
  .lead-stage.hot{ background: rgba(32,201,151,0.12); color: var(--green-deep); border-color: transparent; }
  .lead-stage.lost{ background: var(--rust-pale); color:var(--rust); border-color:transparent; }
  .lead-stage.quoted{ background: var(--amber-pale); color:var(--amber); border-color:transparent; }

  .status-row{ display:flex; align-items:center; gap:14px; padding:13px 0; border-bottom:1px solid var(--hairline); }
  .status-row:last-child{ border-bottom:none; }
  .status-dot{ width:10px; height:10px; border-radius:50%; flex-shrink:0; }
  .status-main{ flex:1; font-weight:700; font-size:13.5px; }
  .status-count{ font-family:'Poppins',sans-serif; font-weight:700; font-size:16px; }

  .panel-wide{ flex:1 1 40%; min-height:0; margin-top:0; }

  .esc-layout{ display:flex; gap:16px; flex:1; min-height:0; width:100%; }
  .esc-list{ flex:0 0 30%; min-width:200px; overflow-y:auto; border-right:1px solid var(--hairline); padding-right:14px; }
  .esc-row{ padding:11px 8px; border-radius:10px; cursor:pointer; border:1px solid transparent; margin-bottom:4px; }
  .esc-row:hover{ background:var(--cream); }
  .esc-row.selected{ background:rgba(32,201,151,0.1); border-color:var(--green); }
  .esc-row-name{ font-weight:700; font-size:13px; }
  .esc-row-msg{ font-size:11.5px; color:var(--ink-soft); margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .esc-row-time{ font-size:10px; color:var(--ink-soft); margin-top:3px; }
  .esc-thread{ flex:1; min-width:0; display:flex; flex-direction:column; min-height:0; }
  .esc-messages{ flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:8px; padding:4px 4px 10px; }
  .esc-detail{ padding:6px 4px; }
  .esc-detail-name{ font-family:'Poppins',sans-serif; font-weight:700; font-size:17px; margin-bottom:4px; }
  .esc-detail-phone{ font-size:13px; color:var(--ink-soft); margin-bottom:18px; }
  .esc-detail-label{ font-size:10.5px; font-weight:700; color:var(--ink-soft); text-transform:uppercase; letter-spacing:0.4px; margin-bottom:6px; }
  .esc-detail-msg{ background:var(--cream); border-radius:12px; padding:14px 16px; font-size:13.5px; line-height:1.5; margin-bottom:20px; }
  .esc-open-btn{
    display:inline-flex; align-items:center; gap:8px;
    background:var(--green); color:#0e2a20; font-weight:800; font-size:13px;
    padding:11px 20px; border-radius:20px; text-decoration:none; border:none; cursor:pointer;
  }
  .esc-open-btn:hover{ background:var(--green-deep); color:#fff; }
  .esc-empty{ display:flex; align-items:center; justify-content:center; height:100%; color:var(--ink-soft); font-size:13px; flex-direction:column; gap:6px; }

  .empty-state{ padding:30px 0; text-align:center; color:var(--ink-soft); font-size:13px; }

  footer{ text-align:center; font-size:10.5px; color:var(--ink-soft); flex-shrink:0; padding: 2px 0 0; }

  @media (max-width: 980px){
    .stat-row{ grid-template-columns: 1fr 1fr; }
    .grid{ grid-template-columns: 1fr; }
  }

  #gate{
    position:fixed; inset:0; z-index:999;
    background: var(--slate);
    display:flex; align-items:center; justify-content:center;
    flex-direction:column; gap:18px;
  }
  #gate .gate-title{ font-family:'Poppins', sans-serif; color:#F3EEE8; font-size:20px; font-weight:700; }
  #gate .gate-title span{ color:var(--green); }
  #gate form{ display:flex; flex-direction:column; gap:12px; width:260px; }
  #gate input{
    padding:12px 14px; border-radius:9px; border:1px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.06); color:#F3EEE8; font-family:'Nunito',sans-serif; font-size:14px;
  }
  #gate input::placeholder{ color:#9A9CA8; }
  #gate button{
    padding:12px 14px; border-radius:9px; border:none;
    background: var(--green); color:#12241D; font-weight:800; font-size:13.5px;
    cursor:pointer; font-family:'Nunito',sans-serif;
  }
  #gate button:hover{ background: var(--green-deep); color:#fff; }
  #gate .gate-error{ color:#E6A79A; font-size:12px; text-align:center; min-height:16px; }
  .shell{ display:none; }
  .gate-brand-logo{ align-items:center; }
  .gate-brand-word{ font-size:34px; color:#F3EEE8; }
  .gate-brand-arrow{ width:22px; height:22px; top:-13px; right:-22px; }
  .gate-brand-dot{ font-size:14px; margin-top:6px; }
</style>
</head>
<body>
<div id="gate">
  <div class="brand-logo gate-brand-logo">
    <span class="brand-word gate-brand-word">exhale<svg class="brand-arrow gate-brand-arrow" viewBox="0 0 40 40" fill="none"><path d="M20 6h12a2 2 0 0 1 2 2v12" stroke="#20C997" stroke-width="7" stroke-linecap="round"/><path d="M8 18h12a2 2 0 0 1 2 2v12" stroke="#20C997" stroke-width="7" stroke-linecap="round"/></svg></span>
    <span class="brand-dot gate-brand-dot">.memorials</span>
  </div>
  <div class="gate-title">Front Desk</div>
  <form id="gateForm">
    <input type="password" id="gatePassword" placeholder="Enter password" autofocus>
    <button type="submit">Unlock</button>
    <div class="gate-error" id="gateError"></div>
  </form>
</div>
<div class="shell">
  <header>
    <div class="brand">
      <div class="brand-logo">
        <span class="brand-word">exhale<svg class="brand-arrow" viewBox="0 0 40 40" fill="none"><path d="M20 6h12a2 2 0 0 1 2 2v12" stroke="#20C997" stroke-width="7" stroke-linecap="round"/><path d="M8 18h12a2 2 0 0 1 2 2v12" stroke="#20C997" stroke-width="7" stroke-linecap="round"/></svg></span>
        <span class="brand-dot">.memorials</span>
      </div>
      <div class="brand-sub" style="align-self:center;">Front Desk Monitor</div>
    </div>
    <div class="header-right">
      <div class="sync-pill"><span class="sync-dot"></span><span id="syncText">Live</span></div>
      <button class="refresh-btn" id="refreshBtn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M21 2v6h-6M3 22v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L21 8M20.5 15a9 9 0 0 1-14.9 3.4L3 16"/></svg>
        Refresh
      </button>
      <button class="refresh-btn" id="themeToggleBtn" aria-label="Toggle dark mode">
        <svg id="themeIcon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
      </button>
      <div class="clock">
        <div class="time" id="clockTime">--:--</div>
        <div class="date" id="clockDate">—</div>
      </div>
    </div>
  </header>

  <main>
    <div class="error-banner" id="errorBanner"></div>

    <div class="stat-row" id="statRow"></div>

    <div class="content-area">
      <div class="grid">
        <div class="panel">
          <div class="panel-head">
            <div>
              <div class="panel-title">Recent Enquiries</div>
              <div class="panel-sub">Newest submissions from the website form</div>
            </div>
            <span class="count-pill" id="leadsPill">0</span>
          </div>
          <div class="panel-list" id="leadsList"></div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <div>
              <div class="panel-title">By Status</div>
              <div class="panel-sub">Where every enquiry currently stands</div>
            </div>
            <span class="count-pill" id="statusPill">0</span>
          </div>
          <div class="panel-list" id="statusList"></div>
        </div>
      </div>

      <div class="panel panel-wide">
        <div class="panel-head">
          <div>
            <div class="panel-title">Escalations</div>
            <div class="panel-sub">Open WhatsApp conversations escalated for a human reply</div>
          </div>
          <span class="count-pill" id="wideCountPill">0</span>
        </div>
        <div class="panel-list" id="tabEscalations" style="display:flex;">
          <div class="esc-layout">
            <div class="esc-list" id="escList"></div>
            <div class="esc-thread">
              <div class="esc-messages" id="escMessages"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <footer id="footnote"></footer>
  </main>
</div>

<script>
// --- Password gate (client-side deterrent, not high-security auth) ---
const GATE_HASH = "6dc6da2a4d2f76400701a5c58c07d795098208a2b904f899ec76a024e55f8718";
async function sha256(text){
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}
function showApp(){
  document.getElementById("gate").style.display = "none";
  document.querySelector(".shell").style.display = "flex";
}
if(sessionStorage.getItem("exhale_desk_unlocked") === "1"){
  showApp();
}
document.getElementById("gateForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const val = document.getElementById("gatePassword").value;
  const hash = await sha256(val);
  if(hash === GATE_HASH){
    sessionStorage.setItem("exhale_desk_unlocked", "1");
    showApp();
  }else{
    document.getElementById("gateError").textContent = "Incorrect password";
    document.getElementById("gatePassword").value = "";
  }
});

const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

const STATUS_ORDER = ["New", "Contacted", "Quoted", "Won", "Lost"];
const STATUS_COLOR = { New: "var(--rust)", Contacted: "var(--amber)", Quoted: "#3B82C4", Won: "var(--green)", Lost: "var(--ink-soft)" };
const STATUS_BADGE_CLASS = { New: "hot", Contacted: "", Quoted: "quoted", Won: "hot", Lost: "lost" };

let escConversations = [];
let selectedConversationId = null;

function initials(name){
  return (name||"?").split(" ").filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join("");
}
function timeAgo(iso){
  if(!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime())/1000;
  if(diff < 60) return "just now";
  if(diff < 3600) return Math.floor(diff/60) + "m ago";
  if(diff < 86400) return Math.floor(diff/3600) + "h ago";
  return Math.floor(diff/86400) + "d ago";
}

function tickClock(){
  const now = new Date();
  document.getElementById("clockTime").textContent = now.toLocaleTimeString("en-ZA", {hour:"2-digit", minute:"2-digit"});
  document.getElementById("clockDate").textContent = now.toLocaleDateString("en-ZA", {weekday:"long", day:"numeric", month:"long"});
}
tickClock();
setInterval(tickClock, 1000 * 30);

function computeAndRender(enquiries){
  enquiries = enquiries || [];
  const now = Date.now();
  const dayMs = 86400000;
  const today = enquiries.filter(e => (now - new Date(e.submitted_at).getTime()) < dayMs);
  const week = enquiries.filter(e => (now - new Date(e.submitted_at).getTime()) < dayMs*7);
  const flaggedPhone = enquiries.filter(e => !e.phone_valid);

  const byStatus = {};
  STATUS_ORDER.forEach(s => byStatus[s] = 0);
  enquiries.forEach(e => { byStatus[e.status] = (byStatus[e.status] || 0) + 1; });
  const newCount = byStatus["New"] || 0;

  // Stat row
  document.getElementById("statRow").innerHTML = `
    <div class="stat-card">
      <div class="stat-label">New Today</div>
      <div class="stat-value">${today.length}</div>
      <div class="stat-foot">${week.length} in the last 7 days</div>
    </div>
    <div class="stat-card ${newCount ? "attention" : ""}">
      <div class="stat-label">Awaiting Response</div>
      <div class="stat-value">${newCount}</div>
      <div class="stat-foot">Status still marked "New"</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Won</div>
      <div class="stat-value">${byStatus["Won"] || 0}</div>
      <div class="stat-foot">since records began</div>
    </div>
    <div class="stat-card ${flaggedPhone.length ? "attention" : ""}">
      <div class="stat-label">Phone Needs Checking</div>
      <div class="stat-value">${flaggedPhone.length}</div>
      <div class="stat-foot">doesn't match standard SA format</div>
    </div>
  `;

  // Recent Enquiries
  const recent = enquiries.slice(0, 10);
  document.getElementById("leadsPill").textContent = enquiries.length;
  document.getElementById("leadsList").innerHTML = recent.length ? recent.map(e => {
    const isNew = (now - new Date(e.submitted_at).getTime()) < dayMs;
    const meta = [e.interest, e.town].filter(Boolean).join(" · ") || (e.message ? e.message.slice(0, 40) : "No details given");
    const badgeClass = STATUS_BADGE_CLASS[e.status] || "";
    return `<div class="lead-row">
      <div class="lead-avatar">${initials(e.name)}</div>
      <div class="lead-main">
        <div class="lead-name">${e.name}${!e.phone_valid ? " ⚠️" : ""}</div>
        <div class="lead-meta">${meta}</div>
      </div>
      <div class="lead-right">
        <div class="lead-time">${timeAgo(e.submitted_at)}</div>
        <div class="lead-stage ${isNew ? "hot" : badgeClass}">${e.status}</div>
      </div>
    </div>`;
  }).join("") : `<div class="empty-state">No enquiries yet</div>`;

  // By Status breakdown
  document.getElementById("statusPill").textContent = enquiries.length;
  document.getElementById("statusList").innerHTML = STATUS_ORDER.map(s => `
    <div class="status-row">
      <span class="status-dot" style="background:${STATUS_COLOR[s]}"></span>
      <div class="status-main">${s}</div>
      <div class="status-count">${byStatus[s] || 0}</div>
    </div>
  `).join("");

  document.getElementById("footnote").textContent =
    `Sourced from the Website Enquiries Notion database · Auto-refreshes every 15 minutes`;
}

computeAndRender([]);

let refreshTimer = null;

async function refreshFromNotion(){
  const btn = document.getElementById("refreshBtn");
  const banner = document.getElementById("errorBanner");
  const syncText = document.getElementById("syncText");
  banner.style.display = "none";
  btn.disabled = true;
  syncText.textContent = "Syncing…";
  try{
    const resp = await fetch("/.netlify/functions/notion-enquiries");
    if(!resp.ok) throw new Error("Function error " + resp.status);
    const parsed = await resp.json();
    if(!parsed || !parsed.enquiries) throw new Error("Could not parse response");
    computeAndRender(parsed.enquiries);
    syncText.textContent = "Live";
  }catch(err){
    banner.textContent = "Couldn't refresh enquiries (" + err.message + "). Showing the last synced data.";
    banner.style.display = "block";
    syncText.textContent = "Live";
  }finally{
    btn.disabled = false;
  }
}

document.getElementById("refreshBtn").addEventListener("click", refreshFromNotion);
refreshFromNotion();
refreshTimer = setInterval(refreshFromNotion, REFRESH_INTERVAL_MS);

// --- Dark mode toggle ---
const SUN_PATH = `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`;
const MOON_PATH = `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>`;
function applyTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("themeIcon").innerHTML = theme === "dark" ? SUN_PATH : MOON_PATH;
}
applyTheme(localStorage.getItem("exhale_desk_theme") || "light");
document.getElementById("themeToggleBtn").addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  localStorage.setItem("exhale_desk_theme", next);
  applyTheme(next);
});

// --- Escalations panel (unchanged from before — talks to Peach directly) ---
loadEscalations();

async function loadEscalations(){
  document.getElementById("escList").innerHTML = `<div class="esc-empty">Loading…</div>`;
  try{
    const resp = await fetch("/.netlify/functions/peach-data");
    if(!resp.ok){
      const errText = await resp.text();
      throw new Error("Function error " + resp.status + ": " + errText.slice(0, 200));
    }
    const data = JSON.parse(await resp.text());
    escConversations = data.conversations || data.data || (Array.isArray(data) ? data : []);
    document.getElementById("wideCountPill").textContent = escConversations.length;
    renderEscList();
  }catch(err){
    document.getElementById("escList").innerHTML = `<div class="esc-empty">Couldn't load escalations<br><span style="font-size:10.5px">${err.message}</span></div>`;
  }
}

function renderEscList(){
  const list = document.getElementById("escList");
  if(!escConversations.length){
    list.innerHTML = `<div class="esc-empty">No open escalations</div>`;
    return;
  }
  list.innerHTML = escConversations.map(c => {
    const name = (c.subscriber && (c.subscriber.name || c.subscriber.phone_number)) || c.phone_number || "Unknown";
    const lastMsg = (c.last_inbound && c.last_inbound.text) || "";
    const time = c.last_activity_at ? timeAgo(c.last_activity_at) : "";
    return `<div class="esc-row ${c.id === selectedConversationId ? "selected" : ""}" onclick="selectConversation(${c.id})">
      <div class="esc-row-name">${name}</div>
      <div class="esc-row-msg">${lastMsg}</div>
      <div class="esc-row-time">${time}</div>
    </div>`;
  }).join("");
}

function selectConversation(id){
  selectedConversationId = id;
  renderEscList();
  const c = escConversations.find(conv => conv.id === id);
  if(!c){
    document.getElementById("escMessages").innerHTML = `<div class="esc-empty">Conversation not found</div>`;
    return;
  }
  const name = (c.subscriber && (c.subscriber.name || c.subscriber.phone_number)) || c.phone_number || "Unknown";
  const phone = (c.subscriber && c.subscriber.phone_number) || c.phone_number || "";
  const lastMsg = (c.last_inbound && c.last_inbound.text) || "No recent message on file";
  const time = c.last_activity_at ? timeAgo(c.last_activity_at) : "";
  document.getElementById("escMessages").innerHTML = `
    <div class="esc-detail">
      <div class="esc-detail-name">${name}</div>
      <div class="esc-detail-phone">${phone}</div>
      <div class="esc-detail-label">Last message${time ? " · " + time : ""}</div>
      <div class="esc-detail-msg">${lastMsg}</div>
      <a class="esc-open-btn" href="https://app.trypeach.ai" target="_blank" rel="noopener">
        Reply in Peach
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>
      </a>
    </div>
  `;
}
</script>
</body>
</html>
