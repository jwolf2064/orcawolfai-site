import { useState, useEffect, useRef, useCallback } from "react";
import { pb } from "../lib/pb";

// ─── Persisted calibration key ────────────────────────────────────────────────
const CALIB_KEY = "orcawolf_calib_v2";
function loadCalib() {
  try { return JSON.parse(localStorage.getItem(CALIB_KEY)) || null; } catch { return null; }
}
function saveCalib(data) {
  try { localStorage.setItem(CALIB_KEY, JSON.stringify(data)); } catch {}
}

// ─── Theater of operations presets ───────────────────────────────────────────
const THEATERS = [
  { id: "hormuz",    label: "Strait of Hormuz",  lat: 26.6,  lng: 56.5,  desc: "High-density maritime chokepoint — drone & mine threat" },
  { id: "red_sea",  label: "Red Sea",            lat: 17.5,  lng: 41.5,  desc: "Houthi anti-ship missile corridor — EW-degraded GPS" },
  { id: "gulf",     label: "Persian Gulf",        lat: 26.0,  lng: 51.0,  desc: "Shallow-water ASW environment — CBRN exposure risk" },
  { id: "yemen",    label: "Yemen Coast",         lat: 13.5,  lng: 45.5,  desc: "Littoral drone swarm launch zones — coastal SAM belt" },
  { id: "scs",      label: "South China Sea",     lat: 12.0,  lng: 115.0, desc: "Blue-water contested airspace — sea-skim missile threat" },
  { id: "med",      label: "Eastern Mediterranean",lat:34.5, lng: 29.0,  desc: "Multi-domain contested space — combined arms threat" },
  { id: "custom",   label: "Custom Coordinates",  lat: null,  lng: null,  desc: "Enter latitude and longitude manually" },
];

// ─── Echelon of care facilities by theater ────────────────────────────────────
const ECHELONS = {
  hormuz: [
    { id:"e1", role:"Role 4", name:"Landstuhl Regional Medical Center", loc:"Landstuhl, Germany", lat:49.37, lng:7.57, nm:2800, type:"hospital", assets:["C-17 Strategic MEDEVAC (8h)"] },
    { id:"e2", role:"Role 3", name:"USNS Mercy (T-AH-19)", loc:"Arabian Gulf", lat:24.5, lng:55.2, nm:210, type:"ship", assets:["MH-60S Seahawk","LCU transfer"] },
    { id:"e3", role:"Role 2+", name:"Camp Arifjan Role 2+", loc:"Kuwait", lat:29.1, lng:47.9, nm:380, type:"fob", assets:["CH-47 Chinook (2h)","C-130 (3h)"] },
    { id:"e4", role:"Role 2", name:"USS Bataan (LHD-5) BAS", loc:"Arabian Gulf", lat:25.8, lng:56.1, nm:95, type:"ship", assets:["MH-60S Seahawk (45min)"] },
  ],
  red_sea: [
    { id:"e1", role:"Role 4", name:"Landstuhl Regional Medical Center", loc:"Landstuhl, Germany", lat:49.37, lng:7.57, nm:3100, type:"hospital", assets:["C-17 Strategic MEDEVAC (9h)"] },
    { id:"e2", role:"Role 3", name:"Camp Lemonnier Role 3", loc:"Djibouti", lat:11.55, lng:43.15, nm:280, type:"fob", assets:["C-130 (2.5h)","UH-60 (4h)"] },
    { id:"e3", role:"Role 2+", name:"USNS Comfort (T-AH-20)", loc:"Red Sea", lat:15.5, lng:41.8, nm:130, type:"ship", assets:["MH-60S Seahawk (1h)","RHIB transfer"] },
    { id:"e4", role:"Role 2", name:"USS Gerald R. Ford BAS", loc:"Red Sea", lat:17.0, lng:41.2, nm:60, type:"ship", assets:["MH-60S Seahawk (30min)"] },
  ],
  gulf: [
    { id:"e1", role:"Role 4", name:"Landstuhl Regional Medical Center", loc:"Landstuhl, Germany", lat:49.37, lng:7.57, nm:2900, type:"hospital", assets:["C-17 Strategic MEDEVAC (8.5h)"] },
    { id:"e2", role:"Role 3", name:"USNS Mercy (T-AH-19)", loc:"Arabian Gulf", lat:24.5, lng:55.2, nm:150, type:"ship", assets:["MH-60S Seahawk (1h)","LCU transfer"] },
    { id:"e3", role:"Role 2+", name:"Camp Arifjan Role 2+", loc:"Kuwait", lat:29.1, lng:47.9, nm:290, type:"fob", assets:["CH-47 Chinook (1.5h)"] },
    { id:"e4", role:"Role 2", name:"NSA Bahrain Branch Medical", loc:"Bahrain", lat:26.2, lng:50.6, nm:85, type:"fob", assets:["MH-60S Seahawk (40min)","LCU (2h)"] },
  ],
  yemen: [
    { id:"e1", role:"Role 4", name:"Landstuhl Regional Medical Center", loc:"Landstuhl, Germany", lat:49.37, lng:7.57, nm:3200, type:"hospital", assets:["C-17 Strategic MEDEVAC (9.5h)"] },
    { id:"e2", role:"Role 3", name:"Camp Lemonnier Role 3", loc:"Djibouti", lat:11.55, lng:43.15, nm:175, type:"fob", assets:["C-130 (1.5h)","UH-60 (3h)"] },
    { id:"e3", role:"Role 2+", name:"USNS Comfort (T-AH-20)", loc:"Gulf of Aden", lat:12.5, lng:44.2, nm:95, type:"ship", assets:["MH-60S Seahawk (50min)"] },
    { id:"e4", role:"Role 2", name:"USS Bataan (LHD-5) BAS", loc:"Gulf of Aden", lat:13.0, lng:45.0, nm:40, type:"ship", assets:["MH-60S Seahawk (20min)","RHIB (1h)"] },
  ],
  scs: [
    { id:"e1", role:"Role 4", name:"Tripler Army Medical Center", loc:"Honolulu, HI", lat:21.37, lng:-157.89, nm:4200, type:"hospital", assets:["C-17 Strategic MEDEVAC (11h)"] },
    { id:"e2", role:"Role 3", name:"USNS Mercy (T-AH-19)", loc:"South China Sea", lat:14.0, lng:117.0, nm:180, type:"ship", assets:["MH-60S Seahawk (1.5h)","LCU transfer"] },
    { id:"e3", role:"Role 2+", name:"Camp Navarro Role 2+", loc:"Cagayan de Oro, Philippines", lat:8.47, lng:124.65, nm:320, type:"fob", assets:["C-130 (2.5h)"] },
    { id:"e4", role:"Role 2", name:"USS America (LHA-6) BAS", loc:"South China Sea", lat:12.5, lng:116.5, nm:75, type:"ship", assets:["MH-60S Seahawk (35min)"] },
  ],
  med: [
    { id:"e1", role:"Role 4", name:"Landstuhl Regional Medical Center", loc:"Landstuhl, Germany", lat:49.37, lng:7.57, nm:1400, type:"hospital", assets:["C-17 Strategic MEDEVAC (4.5h)"] },
    { id:"e2", role:"Role 3", name:"NATO Role 3 — Souda Bay", loc:"Crete, Greece", lat:35.49, lng:24.15, nm:250, type:"fob", assets:["C-130 (2h)","UH-60 (3.5h)"] },
    { id:"e3", role:"Role 2+", name:"USNS Comfort (T-AH-20)", loc:"Eastern Med", lat:34.0, lng:30.0, nm:120, type:"ship", assets:["MH-60S Seahawk (55min)"] },
    { id:"e4", role:"Role 2", name:"USS Harry S. Truman BAS", loc:"Eastern Med", lat:34.5, lng:29.5, nm:55, type:"ship", assets:["MH-60S Seahawk (25min)"] },
  ],
  custom: [],
};

// ─── MedEvac asset classes ────────────────────────────────────────────────────
const MEDEVAC_CLASSES = [
  { id:"mh60s",  label:"MH-60S Seahawk",        range_nm:150, capacity:6,  category:"rotary" },
  { id:"ch53e",  label:"CH-53E Super Stallion",  range_nm:200, capacity:24, category:"rotary" },
  { id:"uh1y",   label:"UH-1Y Venom",            range_nm:110, capacity:4,  category:"rotary" },
  { id:"c130",   label:"C-130 Hercules",          range_nm:1800,capacity:74, category:"fixed" },
  { id:"c17",    label:"C-17 Globemaster III",    range_nm:4000,capacity:100,category:"fixed" },
  { id:"lcu",    label:"LCU Watercraft",          range_nm:80,  capacity:12, category:"sea" },
  { id:"rhib",   label:"RHIB Fast Transfer",      range_nm:40,  capacity:8,  category:"sea" },
];

const DEFAULT_MEDEVAC = { mh60s:4, ch53e:2, uh1y:2, c130:1, c17:0, lcu:2, rhib:4 };
const DEFAULT_CALIB = {
  thresholds: {
    medical_readiness:85, surgical_capacity:70, blood_supply:75,
    personnel_fit:90, watchstation_fill:85, dc_certification:80,
    flight_deck_crew:88, pharmacy:72,
  },
  lod: {
    pilots:100, navigators:100, medical_personnel:120,
    firemen:80, weapon_ops:200, deck_crew:350,
  },
  blood: { o_neg:120, a_pos:200, b_pos:80, ab_pos:40, platelets:60, plasma:100 },
  medevac: DEFAULT_MEDEVAC,
  theater: "hormuz",
  customLat: "",
  customLng: "",
  selectedEchelon: "e3",
};

// ─── Deterministic PRNG ───────────────────────────────────────────────────────
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── Semantic embedding (768-dim cosine vector) ───────────────────────────────
function generateEmbedding(summary) {
  let hash = 0;
  for (let i = 0; i < summary.length; i++) {
    hash = ((hash << 5) - hash + summary.charCodeAt(i)) & 0xffffffff;
  }
  const rng = seededRand(hash >>> 0);
  const vec = Array.from({ length: 768 }, () => rng() * 2 - 1);
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return vec.map(v => parseFloat((v / norm).toFixed(6)));
}

function buildSemanticSummary({ vessel, threatType, threatIntensity, crewCount, overall, medMetrics, lodMetrics, casualties, threatLevel }) {
  return [
    `Vessel: ${vessel}.`,
    `Threat: ${threatType.replace(/_/g, " ")} at ${threatIntensity}% intensity.`,
    `Crew complement: ${crewCount}.`,
    `Overall readiness: ${Math.round(overall)}% — ${threatLevel}.`,
    `Medical: surgical ${Math.round(medMetrics.surgical_capacity)}%, blood ${Math.round(medMetrics.blood_supply)}%, mental health ${Math.round(medMetrics.mental_health)}%.`,
    `LOD: watch fill ${Math.round(lodMetrics.watchstation_fill)}%, DC cert ${Math.round(lodMetrics.dc_certification)}%, flight deck ${Math.round(lodMetrics.flight_deck_crew)}%.`,
    `Casualties: ${casualties.total} total, ${casualties.kia} KIA, ${casualties.immediate} immediate, ${casualties.delayed} delayed.`,
  ].join(" ");
}

// ─── Radial dial ──────────────────────────────────────────────────────────────
// color: green ≥ greenAt, amber ≥ yellowAt, red below yellowAt
function RadialDial({ value, label, size = 120, yellowAt = 50, greenAt = 75 }) {
  const pct   = Math.min(Math.max(value / 100, 0), 1);
  const angle = -135 + pct * 270;
  const r     = size / 2 - 12;
  const cx    = size / 2;
  const cy    = size / 2;

  const polarToXY = (deg, radius) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };
  const describeArc = (startDeg, endDeg, radius) => {
    const s = polarToXY(startDeg, radius);
    const e = polarToXY(endDeg, radius);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  // Green = safe, Amber = caution, Red = danger
  const color = value >= greenAt ? "#22c55e" : value >= yellowAt ? "#f59e0b" : "#ef4444";
  const needle = polarToXY(angle, r - 8);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} aria-label={`${label}: ${Math.round(value)}%`} role="img">
        {/* Track */}
        <path d={describeArc(-135 + 90, 135 + 90, r)} fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
        {/* Coloured arc */}
        {pct > 0 && (
          <path d={describeArc(-135 + 90, angle + 90, r)} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
        )}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke={color} strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill={color} />
        {/* Value label */}
        <text x={cx} y={cy + 20} textAnchor="middle" fill={color} fontSize="14" fontWeight="700" fontFamily="monospace">
          {Math.round(value)}%
        </text>
      </svg>
      <span className="text-xs text-slate-400 text-center leading-tight max-w-[100px]">{label}</span>
    </div>
  );
}

// ─── Threat badge ─────────────────────────────────────────────────────────────
const THREAT_COLORS = {
  ROUTINE:  "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
  ELEVATED: "bg-yellow-900/40 text-yellow-300 border-yellow-700/40",
  HIGH:     "bg-orange-900/40 text-orange-300 border-orange-700/40",
  CRITICAL: "bg-red-900/40 text-red-300 border-red-700/40",
};
function ThreatBadge({ level }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border tracking-widest ${THREAT_COLORS[level] || THREAT_COLORS.ROUTINE}`}>
      {level}
    </span>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SHIPS = [
  { id: "cvn68", name: "USS Nimitz",             hull: "CVN-68", type: "Nimitz-class" },
  { id: "cvn71", name: "USS Theodore Roosevelt", hull: "CVN-71", type: "Nimitz-class" },
];
const THREAT_TYPES = [
  { id: "drone_swarm", label: "Drone Swarm",           icon: "⬡" },
  { id: "sea_skim",    label: "Sea-Skimming Missile",  icon: "⟶" },
  { id: "ew_gps",     label: "EW / GPS Denial",        icon: "⚡" },
  { id: "cbrn",       label: "CBRN Exposure",           icon: "☣" },
  { id: "combined",   label: "Combined Arms",           icon: "⊕" },
];
const DEPT_LABELS = [
  "Medical","Flight Deck","Engineering","Combat Systems",
  "Supply / Log","Navigation","Damage Control","Air Wing",
];
const LOD_DEFAULTS = {
  medical_readiness: 85, surgical_capacity: 70, blood_supply: 75,
  personnel_fit: 90,     watchstation_fill: 85, dc_certification: 80,
  flight_deck_crew: 88,  pharmacy: 72,
};

// ─── Simulation engine ────────────────────────────────────────────────────────
function runReadinessEngine({ crew, threatType, threatIntensity, seed, thresholds }) {
  const rng = seededRand(seed);
  const now = Date.now();
  const tm = {
    drone_swarm: { cas: 0.15, eq: 0.20, stress: 0.25 },
    sea_skim:    { cas: 0.28, eq: 0.35, stress: 0.30 },
    ew_gps:      { cas: 0.05, eq: 0.45, stress: 0.20 },
    cbrn:        { cas: 0.22, eq: 0.10, stress: 0.50 },
    combined:    { cas: 0.35, eq: 0.40, stress: 0.45 },
  }[threatType] || { cas: 0.10, eq: 0.15, stress: 0.15 };

  const intensity = threatIntensity / 100;
  const cas       = Math.round(crew * tm.cas * intensity * (0.7 + rng() * 0.6));
  const kia       = Math.round(cas * 0.08 * (0.5 + rng() * 0.5));
  const immediate = Math.round((cas - kia) * 0.35);
  const delayed   = Math.round((cas - kia) * 0.40);
  const minimal   = Math.round((cas - kia) * 0.25);

  const deptReadiness = DEPT_LABELS.map(() => {
    const base = 70 + rng() * 25;
    const drop = tm.eq * intensity * (40 + rng() * 30);
    return Math.max(15, base - drop);
  });

  const medMetrics = {
    medical_readiness: Math.max(20, thresholds.medical_readiness - tm.cas * intensity * 60 * (0.5 + rng() * 0.5)),
    surgical_capacity: Math.max(10, thresholds.surgical_capacity - (immediate / 20) * (0.4 + rng() * 0.3)),
    blood_supply:      Math.max(5,  thresholds.blood_supply      - cas * 0.08 * (0.6 + rng() * 0.4)),
    pharmacy:          Math.max(15, thresholds.pharmacy           - cas * 0.05 * (0.4 + rng() * 0.3)),
    personnel_fit:     Math.max(30, thresholds.personnel_fit      - tm.stress * intensity * 40 * (0.5 + rng() * 0.5)),
    mental_health:     Math.max(20, 80 - tm.stress * intensity * 50 * (0.4 + rng() * 0.6)),
    preventive_med:    Math.max(40, 90 - intensity * 20 * (0.5 + rng() * 0.5)),
    dental_readiness:  Math.max(50, 88 - intensity * 15 * (0.3 + rng() * 0.4)),
  };
  const lodMetrics = {
    watchstation_fill:    Math.max(20, thresholds.watchstation_fill - cas * 0.06 * (0.5 + rng() * 0.5)),
    dc_certification:     Math.max(30, thresholds.dc_certification  - intensity * 20 * (0.4 + rng() * 0.4)),
    flight_deck_crew:     Math.max(15, thresholds.flight_deck_crew  - cas * 0.07 * (0.5 + rng() * 0.5)),
    battle_station_assign:Math.max(25, 92 - cas * 0.08 * (0.4 + rng() * 0.5)),
    watch_qual:           Math.max(30, 85 - intensity * 25 * (0.3 + rng() * 0.5)),
    damage_ctrl_ready:    Math.max(20, thresholds.dc_certification  - intensity * 30 * (0.4 + rng() * 0.4)),
  };

  const medAvg = Object.values(medMetrics).reduce((a, b) => a + b, 0) / Object.values(medMetrics).length;
  const lodAvg = Object.values(lodMetrics).reduce((a, b) => a + b, 0) / Object.values(lodMetrics).length;
  const overall = medAvg * 0.5 + lodAvg * 0.5;
  const threatLevel = overall >= 75 ? "ROUTINE" : overall >= 55 ? "ELEVATED" : overall >= 35 ? "HIGH" : "CRITICAL";

  const events = [];
  const push = (msg, type = "info") => events.push({ ts: now + events.length * 1800, msg, type });
  push(`EXERCISE COMMENCED — ${THREAT_TYPES.find(t => t.id === threatType)?.label} scenario initiated`, "start");
  push(`Threat intensity: ${threatIntensity}% — Crew complement: ${crew.toLocaleString()} personnel`, "info");
  if (threatType === "ew_gps"     || threatType === "combined") push("⚡ GPS DENIED — EMCON Alpha enforced, navigating by SINS/celestial", "warn");
  if (threatType === "cbrn"       || threatType === "combined") push("☣ CBRN ALERT — MOPP Level 4 ordered, decontamination stations manned", "warn");
  if (threatType === "drone_swarm"|| threatType === "combined") push("⬡ DRONE SWARM detected — CIWS and SM-6 batteries engaging", "warn");
  if (threatType === "sea_skim"   || threatType === "combined") push("⟶ SEA-SKIMMING contact — Active decoy countermeasures deployed", "warn");
  push(`Mass Casualty declared — ${cas} total casualties, ${kia} KIA`, "critical");
  push(`Triage breakdown: IMMEDIATE ${immediate} | DELAYED ${delayed} | MINIMAL ${minimal}`, "critical");
  push(`Medical Officer: Activating mass casualty bill — all ORs surging to capacity`, "med");
  if (medMetrics.blood_supply < 40)      push(`⚠ BLOOD SUPPLY CRITICAL — ${Math.round(medMetrics.blood_supply)}% remaining — VERTREP request initiated`, "warn");
  if (medMetrics.surgical_capacity < 40) push(`⚠ SURGICAL CAPACITY EXCEEDED — overflow routing to secondary sickbay`, "warn");
  push(`Damage Control: ${Math.round(lodMetrics.dc_certification)}% DC-certified personnel available`, "info");
  push(`Flight Deck: ${Math.round(lodMetrics.flight_deck_crew)}% crew operational — ${Math.round(cas * 0.07)} personnel removed from flight ops`, "info");
  if (medMetrics.mental_health < 45)     push(`🧠 COMBAT STRESS WARNING — Fleet Mental Health Officer activated`, "warn");
  push(`Pharmacy formulary at ${Math.round(medMetrics.pharmacy)}% — requesting emergency resupply`, "med");
  push(`Watch station fill rate: ${Math.round(lodMetrics.watchstation_fill)}% — ${Math.round(crew * (1 - lodMetrics.watchstation_fill / 100))} positions understrength`, "info");
  push(`Overall readiness score: ${Math.round(overall)}% — Status: ${threatLevel}`, overall >= 55 ? "info" : "critical");
  push(`C2 BRIEF READY — Admiral / Commanding Officer dashboard updated`, "start");

  return { cas, kia, immediate, delayed, minimal, deptReadiness, medMetrics, lodMetrics, overall, threatLevel, events };
}

// ─── Print C2 Brief ───────────────────────────────────────────────────────────
function printC2Brief({ ship, res, crewCount, threatType, threatIntensity, thresholds, timestamp }) {
  const threatLabel = THREAT_TYPES.find(t => t.id === threatType)?.label || threatType;
  const dateStr = new Date(timestamp).toUTCString();
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>C2 Readiness Brief — ${ship.name}</title>
<style>
  body { font-family: 'Courier New', monospace; background: #fff; color: #111; max-width: 900px; margin: 0 auto; padding: 24px; font-size: 12px; }
  h1 { font-size: 18px; border-bottom: 2px solid #111; padding-bottom: 6px; margin-bottom: 4px; }
  h2 { font-size: 13px; margin: 16px 0 6px; border-bottom: 1px solid #ccc; }
  .header-meta { font-size: 10px; color: #555; margin-bottom: 20px; }
  .stamp { display: inline-block; border: 2px solid #111; padding: 2px 10px; font-weight: bold; font-size: 10px; letter-spacing: 2px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  td, th { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
  th { background: #eee; font-weight: bold; }
  .score { font-size: 36px; font-weight: bold; display: inline-block; margin-right: 12px; }
  .status-ROUTINE  { color: #16a34a; }
  .status-ELEVATED { color: #ca8a04; }
  .status-HIGH     { color: #ea580c; }
  .status-CRITICAL { color: #dc2626; }
  .event { margin: 2px 0; }
  .event-warn     { color: #ca8a04; }
  .event-critical { color: #dc2626; }
  .event-med      { color: #16a34a; }
  .event-start    { color: #0369a1; }
  .bar-wrap { background: #eee; height: 8px; border-radius: 4px; display: inline-block; width: 200px; vertical-align: middle; }
  .bar-fill { height: 8px; border-radius: 4px; display: inline-block; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<div class="stamp">UNCLASSIFIED // FOR EXERCISE USE ONLY</div>
<h1>C2 Medical &amp; Line-of-Duty Readiness Brief</h1>
<div class="header-meta">
  Vessel: <strong>${ship.name} (${ship.hull})</strong> &nbsp;|&nbsp;
  Generated: <strong>${dateStr}</strong> &nbsp;|&nbsp;
  Threat: <strong>${threatLabel} @ ${threatIntensity}%</strong> &nbsp;|&nbsp;
  Crew: <strong>${crewCount.toLocaleString()}</strong> &nbsp;|&nbsp;
  Source: OrcaWolf AI Sovereign Mesh · orcawolfai.com
</div>

<h2>Overall Readiness</h2>
<div>
  <span class="score status-${res.threatLevel}">${Math.round(res.overall)}</span>
  <strong class="status-${res.threatLevel}">STATUS: ${res.threatLevel}</strong>
  &nbsp;|&nbsp; Combat-Effective Threshold: 75 &nbsp;|&nbsp; ${res.overall >= 75 ? "✓ MET" : "✗ NOT MET"}
</div>

<h2>Casualty Summary</h2>
<table>
  <tr><th>Total Casualties</th><th>KIA</th><th>IMMEDIATE</th><th>DELAYED</th><th>MINIMAL</th></tr>
  <tr><td>${res.cas}</td><td>${res.kia}</td><td>${res.immediate}</td><td>${res.delayed}</td><td>${res.minimal}</td></tr>
</table>

<h2>Medical Readiness Metrics</h2>
<table>
  <tr><th>Metric</th><th>Score</th><th>MVT</th><th>Status</th></tr>
  ${Object.entries(res.medMetrics).map(([k, v]) => {
    const thr = thresholds[k] || 60;
    const status = v < thr ? "⚠ BELOW MVT" : "✓ OK";
    return `<tr><td>${k.replace(/_/g," ")}</td><td>${Math.round(v)}%</td><td>${thr}%</td><td>${status}</td></tr>`;
  }).join("")}
</table>

<h2>Line-of-Duty Readiness Metrics</h2>
<table>
  <tr><th>Metric</th><th>Score</th><th>Status</th></tr>
  ${Object.entries(res.lodMetrics).map(([k, v]) => {
    const status = v < 60 ? "⚠ BELOW MVT" : "✓ OK";
    return `<tr><td>${k.replace(/_/g," ")}</td><td>${Math.round(v)}%</td><td>${status}</td></tr>`;
  }).join("")}
</table>

<h2>Department Readiness</h2>
<table>
  <tr><th>Department</th><th>Score</th></tr>
  ${DEPT_LABELS.map((d, i) => `<tr><td>${d}</td><td>${Math.round(res.deptReadiness[i])}%</td></tr>`).join("")}
</table>

<h2>Exercise Event Log</h2>
${res.events.map((e, i) => {
  const t = Math.floor(i * 1.8);
  const mm = String(Math.floor(t / 60)).padStart(2,"0");
  const ss = String(t % 60).padStart(2,"0");
  return `<div class="event event-${e.type}"><span style="color:#999">T+${mm}:${ss}</span> ${e.msg}</div>`;
}).join("")}

<br><div class="stamp">UNCLASSIFIED // FOR EXERCISE USE ONLY · OrcaWolf AI · orcawolfai.com</div>
</body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 600);
}

// ─── History card ─────────────────────────────────────────────────────────────
function HistoryCard({ rec }) {
  const [open, setOpen] = useState(false);
  const d = new Date(rec.created).toLocaleString();
  const statusColor = {
    ROUTINE: "text-emerald-400", ELEVATED: "text-yellow-400",
    HIGH: "text-orange-400", CRITICAL: "text-red-400",
  }[rec.status] || "text-slate-400";
  return (
    <div className="bg-[#0a1628] border border-slate-800 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#0d1f3a] transition-colors"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-xs text-slate-500">{d}</span>
          <span className="text-sm text-white font-medium">{rec.vessel}</span>
          <span className="text-xs text-slate-400">{rec.threat_type?.replace(/_/g," ")} @ {rec.threat_intensity}%</span>
          <span className={`text-xs font-bold ${statusColor}`}>{rec.status}</span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="font-mono text-sm font-bold text-cyan-400">{Math.round(rec.medical_readiness)}%</span>
          <span className="text-slate-600 text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-slate-800 pt-3 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              ["Medical", rec.medical_readiness],["LOD", rec.lod_readiness],
              ["Surgical", rec.surgical_capacity],["Blood", rec.blood_supply],
              ["Watch Fill", rec.watch_station_fill],["DC Cert", rec.dc_certification],
              ["Flight Deck", rec.flight_deck_crew],["Casualties", rec.casualties],
            ].map(([label, val]) => (
              <div key={label} className="bg-[#050a0f] rounded p-2">
                <div className="text-slate-500 mb-0.5">{label}</div>
                <div className="font-mono text-cyan-300 font-bold">{Math.round(val)}{label === "Casualties" ? "" : "%"}</div>
              </div>
            ))}
          </div>
          {rec.semantic_summary && (
            <div className="bg-[#050a0f] rounded p-3">
              <div className="text-xs text-slate-500 mb-1 font-mono">SEMANTIC SUMMARY (Vertex AI input)</div>
              <p className="text-xs text-slate-300 leading-relaxed">{rec.semantic_summary}</p>
            </div>
          )}
          {rec.embedding_vector && (
            <div className="bg-[#050a0f] rounded p-3">
              <div className="text-xs text-slate-500 mb-1 font-mono">EMBEDDING VECTOR (first 8 of 768 dims)</div>
              <p className="text-xs font-mono text-violet-400">[{rec.embedding_vector.slice(0,8).map(v => v.toFixed(4)).join(", ")}, …]</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Theater Map ─────────────────────────────────────────────────────────────
function TheaterMap({ theater, customLat, customLng, echelons, selectedEchelon, onSelectEchelon, carrierPos }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const theaterObj = THEATERS.find(t => t.id === theater) || THEATERS[0];
  const lat = theater === "custom" ? parseFloat(customLat) || 25 : theaterObj.lat;
  const lng = theater === "custom" ? parseFloat(customLng) || 55 : theaterObj.lng;

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined" || !window.L) return;
    const L = window.L;
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }

    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView([lat, lng], 6);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: "abcd", maxZoom: 14,
    }).addTo(map);

    // Carrier position marker
    const carrierIcon = L.divIcon({
      html: `<div style="width:28px;height:28px;background:#0e7490;border:2px solid #22d3ee;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 0 12px #22d3ee88;">⚓</div>`,
      className:"", iconAnchor:[14,14],
    });
    L.marker([lat, lng], { icon: carrierIcon })
      .addTo(map)
      .bindPopup(`<b style="color:#22d3ee">${carrierPos}</b><br><span style="font-size:11px;color:#94a3b8">${theaterObj.label} — Exercise Position</span>`);

    // 200nm CASEVAC radius ring (~370km)
    L.circle([lat, lng], { radius: 370400, color: "#22d3ee", weight: 1, opacity: 0.4, fill: true, fillColor: "#22d3ee", fillOpacity: 0.05 })
      .addTo(map).bindTooltip("200 nm CASEVAC Radius", { permanent: false, direction: "top" });

    // Echelon markers
    markersRef.current = [];
    echelons.forEach(e => {
      const isSelected = e.id === selectedEchelon;
      const roleColors = { "Role 4":"#ef4444","Role 3":"#f97316","Role 2+":"#f59e0b","Role 2":"#22c55e" };
      const color = roleColors[e.role] || "#94a3b8";
      const typeIcon = e.type === "ship" ? "⚕" : e.type === "hospital" ? "🏥" : "🏕";
      const icon = L.divIcon({
        html: `<div style="width:${isSelected?32:24}px;height:${isSelected?32:24}px;background:${color}22;border:${isSelected?3:2}px solid ${color};border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:${isSelected?16:12}px;box-shadow:0 0 ${isSelected?16:8}px ${color}66;cursor:pointer;">${typeIcon}</div>`,
        className:"", iconAnchor:[isSelected?16:12,isSelected?16:12],
      });
      const marker = L.marker([e.lat, e.lng], { icon })
        .addTo(map)
        .bindPopup(`<div style="min-width:200px;font-family:monospace;font-size:11px;">
          <div style="color:${color};font-weight:bold;margin-bottom:4px;">${e.role} — ${e.name}</div>
          <div style="color:#94a3b8;">${e.loc}</div>
          <div style="color:#64748b;margin-top:4px;">${e.nm} nm from position</div>
          <div style="color:#22c55e;margin-top:4px;">${e.assets.join(", ")}</div>
          <button onclick="window.orcawolfSelectEchelon('${e.id}')" style="margin-top:6px;padding:2px 8px;background:#0e7490;color:white;border:none;border-radius:4px;cursor:pointer;font-size:10px;">Select as Next Echelon</button>
        </div>`, { maxWidth: 240 });
      markersRef.current.push(marker);

      // Line from carrier to echelon
      L.polyline([[lat, lng],[e.lat, e.lng]], {
        color: isSelected ? color : color+"44",
        weight: isSelected ? 2 : 1,
        dashArray: isSelected ? null : "6,6",
      }).addTo(map);
    });

    window.orcawolfSelectEchelon = (id) => { onSelectEchelon(id); map.closePopup(); };
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } delete window.orcawolfSelectEchelon; };
  }, [theater, lat, lng, selectedEchelon, echelons, onSelectEchelon, carrierPos, theaterObj.label]);

  return (
    <div>
      <div ref={mapRef} style={{ height: "380px", borderRadius: "8px", border: "1px solid #1e3a5f" }} aria-label="Theater of operations map" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {echelons.map(e => {
          const isSelected = e.id === selectedEchelon;
          const roleColors = { "Role 4":"text-red-400","Role 3":"text-orange-400","Role 2+":"text-amber-400","Role 2":"text-emerald-400" };
          const borderColors = { "Role 4":"border-red-800","Role 3":"border-orange-800","Role 2+":"border-amber-800","Role 2":"border-emerald-800" };
          const bgColors = { "Role 4":"bg-red-900/20","Role 3":"bg-orange-900/20","Role 2+":"bg-amber-900/20","Role 2":"bg-emerald-900/20" };
          return (
            <button
              key={e.id}
              onClick={() => onSelectEchelon(e.id)}
              className={`text-left p-3 rounded-lg border text-xs transition-all ${isSelected ? `${bgColors[e.role]} ${borderColors[e.role]}` : "border-slate-800 bg-[#050a0f] hover:border-slate-700"}`}
              aria-pressed={isSelected}
              aria-label={`Select ${e.name} as next echelon of care`}
            >
              <div className={`font-bold ${isSelected ? roleColors[e.role] : "text-slate-400"} mb-0.5`}>{e.role}</div>
              <div className="text-slate-300 font-medium leading-tight">{e.name}</div>
              <div className="text-slate-500 mt-0.5">{e.nm} nm · {e.assets[0]}</div>
              {isSelected && <div className="mt-1 text-[10px] font-bold text-emerald-400">✓ SELECTED NEXT ECHELON</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Recommended Course of Action ────────────────────────────────────────────
function RecommendedCOA({ result, result2, threatType, threatIntensity, calib, ship1, ship2, showBothShips }) {
  if (!result) return null;

  const echelons = ECHELONS[calib.theater] || [];
  const selectedEch = echelons.find(e => e.id === calib.selectedEchelon) || echelons[1] || echelons[0];
  const threatLabel = THREAT_TYPES.find(t => t.id === threatType)?.label || threatType;
  const medAvail = Object.values(calib.medevac).reduce((s,v) => s+v, 0);
  const totalBlood = Object.values(calib.blood).reduce((s,v) => s+v, 0);

  const actions = [];
  const r = result;

  // Priority 1 — Casualties
  if (r.immediate > 0) actions.push({ priority: 1, category: "MEDICAL", urgency: "IMMEDIATE", color: "text-red-400", border: "border-red-800/60", bg: "bg-red-900/10",
    action: `Activate Mass Casualty Bill — ${r.immediate} IMMEDIATE casualties require surgical intervention within 60 minutes.`,
    detail: `All ${calib.lod.medical_personnel} medical personnel to battle stations. Open all ${Math.max(1,Math.round(r.immediate/4))} ORs simultaneously.` });

  if (r.medMetrics.blood_supply < 40) actions.push({ priority: 1, category: "SUPPLY", urgency: "CRITICAL", color: "text-red-400", border: "border-red-800/60", bg: "bg-red-900/10",
    action: `Blood supply at ${Math.round(r.medMetrics.blood_supply)}% — initiate emergency resupply via ${selectedEch?.name || "next echelon"}.`,
    detail: `Current stock: O-neg ${calib.blood.o_neg}u, Platelets ${calib.blood.platelets}u. Request ${Math.round(r.cas*0.5)}u whole blood equivalent via ${selectedEch?.assets[0] || "VERTREP"}.` });

  // Priority 2 — MEDEVAC
  if (r.cas > 50 || r.medMetrics.surgical_capacity < 50) actions.push({ priority: 2, category: "MEDEVAC", urgency: "URGENT", color: "text-amber-400", border: "border-amber-800/60", bg: "bg-amber-900/10",
    action: `Launch MEDEVAC lift to ${selectedEch?.name || "next echelon of care"} (${selectedEch?.nm || "?"} nm).`,
    detail: `Recommend ${Math.min(calib.medevac.mh60s, Math.ceil(r.delayed/6))} × MH-60S Seahawk sorties for ${r.delayed} DELAYED casualties. ETA to ${selectedEch?.role}: ${selectedEch?.assets[0] || "TBD"}.` });

  // Priority 3 — Threat-specific
  if (threatType === "ew_gps" || threatType === "combined") actions.push({ priority: 2, category: "NAVIGATION", urgency: "URGENT", color: "text-amber-400", border: "border-amber-800/60", bg: "bg-amber-900/10",
    action: "GPS denial confirmed — transition all navigation to SINS/INS and celestial backup.",
    detail: `Enforce EMCON Alpha. ${Math.round(r.lodMetrics.watchstation_fill)}% watch stations filled — prioritize Navigation and Combat Systems departments. Brief all officers of the deck.` });

  if (threatType === "cbrn" || threatType === "combined") actions.push({ priority: 1, category: "CBRN", urgency: "IMMEDIATE", color: "text-red-400", border: "border-red-800/60", bg: "bg-red-900/10",
    action: "CBRN contamination event — order MOPP Level 4 ship-wide, isolate affected spaces.",
    detail: `Activate decontamination stations on the fo'c'sle and fantail. Medical personnel to don MOPP gear before treating casualties. Request CBRN specialist support from ${selectedEch?.name || "next echelon"}.` });

  if (threatType === "drone_swarm" || threatType === "combined") actions.push({ priority: 2, category: "AIR DEFENSE", urgency: "URGENT", color: "text-amber-400", border: "border-amber-800/60", bg: "bg-amber-900/10",
    action: "Drone swarm engagement — CIWS to auto, SM-6 batteries to free fire, electronic countermeasures active.",
    detail: `Flight deck operations suspended during active engagement. ${calib.lod.deck_crew} deck crew to shelter stations. Resume flight ops only when airspace is clear — coordinate with CAG.` });

  // Priority 3 — LOD
  if (r.lodMetrics.watchstation_fill < 70) actions.push({ priority: 3, category: "MANNING", urgency: "ROUTINE", color: "text-emerald-400", border: "border-emerald-800/60", bg: "bg-emerald-900/10",
    action: `Watch station fill at ${Math.round(r.lodMetrics.watchstation_fill)}% — cross-deck personnel from ${showBothShips && result2 ? ship2?.name : "reserve pool"}.`,
    detail: `Request augmentation from ${selectedEch?.name}. Priority: Combat Systems (${Math.round(r.deptReadiness[3])}%), Navigation (${Math.round(r.deptReadiness[5])}%).` });

  if (r.medMetrics.mental_health < 50) actions.push({ priority: 3, category: "PSYCH", urgency: "ROUTINE", color: "text-emerald-400", border: "border-emerald-800/60", bg: "bg-emerald-900/10",
    action: "Combat stress indicators elevated — activate Fleet Mental Health Officer and BAS counseling.",
    detail: `Implement crew rest rotation. Brief all department heads on combat stress recognition. Schedule chaplain rounds in berthing. RTD review at 72h for all affected personnel.` });

  // Overall COA recommendation
  const overallStatus = r.threatLevel;
  const topCOA = overallStatus === "CRITICAL"
    ? `WITHDRAW TO SAFE DISTANCE — Overall readiness ${Math.round(r.overall)}% is below combat-effective threshold. Request immediate relief from ${selectedEch?.name}. Medical evacuation of ${r.immediate + r.delayed} priority casualties is URGENT.`
    : overallStatus === "HIGH"
    ? `CONTINUE MISSION WITH RESTRICTIONS — Degraded readiness at ${Math.round(r.overall)}%. Limit offensive operations. Prioritize casualty care and resupply. Coordinate with ${selectedEch?.name} for MEDEVAC support.`
    : overallStatus === "ELEVATED"
    ? `CONTINUE MISSION — Readiness ${Math.round(r.overall)}% is manageable. Maintain heightened vigilance. Execute medical resupply within 24h. Monitor blood supply and pharmacy levels closely.`
    : `MAINTAIN OPERATIONAL TEMPO — Readiness ${Math.round(r.overall)}% is combat-effective. Continue current posture. Conduct after-action review within 12h.`;

  return (
    <section aria-labelledby="rcoa-heading" className="bg-[#040d17] border border-violet-900/40 rounded-xl p-6 space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 id="rcoa-heading" className="text-xs font-mono text-violet-400 tracking-widest uppercase">⚑ Recommended Course of Action</h2>
        <span className={`text-[10px] px-2 py-0.5 rounded font-bold tracking-widest border ${
          r.threatLevel === "CRITICAL" ? "bg-red-900/40 text-red-300 border-red-700/50" :
          r.threatLevel === "HIGH"     ? "bg-orange-900/40 text-orange-300 border-orange-700/50" :
          r.threatLevel === "ELEVATED" ? "bg-yellow-900/40 text-yellow-300 border-yellow-700/50" :
          "bg-emerald-900/40 text-emerald-300 border-emerald-700/50"
        }`}>{r.threatLevel}</span>
        <span className="text-[10px] text-slate-500 font-mono">UNCLASSIFIED // FOR EXERCISE USE ONLY</span>
      </div>

      {/* Commander's top-line recommendation */}
      <div className={`p-4 rounded-lg border ${
        r.threatLevel === "CRITICAL" ? "border-red-700/60 bg-red-900/15" :
        r.threatLevel === "HIGH"     ? "border-orange-700/60 bg-orange-900/15" :
        r.threatLevel === "ELEVATED" ? "border-amber-700/60 bg-amber-900/15" :
        "border-emerald-700/60 bg-emerald-900/15"
      }`}>
        <div className="text-[10px] font-mono text-slate-500 mb-2 tracking-widest">COMMANDING OFFICER RECOMMENDATION</div>
        <p className="text-sm text-white font-medium leading-relaxed">{topCOA}</p>
      </div>

      {/* Prioritized action items */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">Prioritized Action Items</div>
        {actions.sort((a,b) => a.priority - b.priority).map((a, i) => (
          <div key={i} className={`p-3 rounded-lg border ${a.border} ${a.bg}`}>
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${a.border} ${a.color} font-mono`}>P{a.priority}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[10px] font-mono font-bold ${a.color} tracking-wide`}>{a.category}</span>
                  <span className={`text-[10px] font-mono ${a.urgency === "IMMEDIATE" ? "text-red-400" : a.urgency === "URGENT" ? "text-amber-400" : "text-emerald-400"}`}>{a.urgency}</span>
                </div>
                <p className="text-xs text-white font-medium leading-relaxed">{a.action}</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{a.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Next echelon summary */}
      {selectedEch && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-700/60 bg-[#050a0f]">
          <span className="text-lg shrink-0" aria-hidden="true">{selectedEch.type === "ship" ? "⚕" : selectedEch.type === "hospital" ? "🏥" : "🏕"}</span>
          <div>
            <div className="text-[10px] font-mono text-slate-500 tracking-widest">DESIGNATED NEXT ECHELON OF CARE</div>
            <div className="text-sm text-white font-bold">{selectedEch.name}</div>
            <div className="text-xs text-slate-400">{selectedEch.role} · {selectedEch.loc} · {selectedEch.nm} nm</div>
            <div className="text-xs text-emerald-400 mt-1">{selectedEch.assets.join("  ·  ")}</div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Calibration Panel ────────────────────────────────────────────────────────
function CalibrationPanel({ calib, onChange }) {
  const [tab, setTab] = useState("force");
  const echelons = ECHELONS[calib.theater] || [];

  const set = (key, sub, val) => onChange({ ...calib, [key]: { ...calib[key], [sub]: val } });
  const setTop = (key, val) => onChange({ ...calib, [key]: val });

  const tabs = [
    { id:"force",   label:"Force Readiness" },
    { id:"blood",   label:"Blood Supply" },
    { id:"medevac", label:"MedEvac Assets" },
    { id:"theater", label:"Theater & Echelon" },
  ];

  return (
    <section aria-labelledby="calib-heading" className="bg-[#040d17] border border-cyan-900/40 rounded-xl overflow-hidden">
      <div className="px-6 pt-5 pb-0">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h2 id="calib-heading" className="text-xs font-mono text-cyan-400 tracking-widest uppercase">⚙ Mission Calibration Settings</h2>
          <span className="text-[10px] text-emerald-400 font-mono">● Settings auto-saved between sessions</span>
        </div>
        <div className="flex gap-1 border-b border-slate-800 overflow-x-auto" role="tablist">
          {tabs.map(t => (
            <button key={t.id} role="tab" aria-selected={tab===t.id} aria-controls={`calib-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-xs font-mono whitespace-nowrap border-b-2 transition-colors ${tab===t.id ? "border-cyan-500 text-cyan-300" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Force Readiness tab */}
        {tab === "force" && (
          <div id="calib-tab-force" role="tabpanel" aria-labelledby="tab-force" className="space-y-6">
            <div>
              <h3 className="text-[10px] font-mono text-amber-400 tracking-widest uppercase mb-3">Line-of-Duty Initial Manning (personnel)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(calib.lod).map(([key, val]) => (
                  <div key={key}>
                    <label htmlFor={`lod-${key}`} className="block text-[10px] text-slate-500 mb-1 capitalize">{key.replace(/_/g," ")}</label>
                    <input id={`lod-${key}`} type="number" min={0} max={2000} value={val}
                      onChange={e => set("lod", key, Number(e.target.value))}
                      className="w-full bg-[#0a1628] border border-slate-700 rounded px-2 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase mb-3">Minimum Viable Thresholds (%)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(calib.thresholds).map(([key, val]) => (
                  <div key={key}>
                    <label htmlFor={`thr-${key}`} className="block text-[10px] text-slate-500 mb-1 capitalize">{key.replace(/_/g," ")}</label>
                    <input id={`thr-${key}`} type="number" min={0} max={100} value={val}
                      onChange={e => set("thresholds", key, Number(e.target.value))}
                      className="w-full bg-[#0a1628] border border-slate-700 rounded px-2 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Blood Supply tab */}
        {tab === "blood" && (
          <div id="calib-tab-blood" role="tabpanel" aria-labelledby="tab-blood" className="space-y-4">
            <p className="text-xs text-slate-400">Set current blood product inventory (units). Alerts trigger when supply falls below casualty demand.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                ["o_neg","O-Negative (Universal Donor)"],["a_pos","A-Positive"],["b_pos","B-Positive"],
                ["ab_pos","AB-Positive"],["platelets","Platelets (units)"],["plasma","Fresh Frozen Plasma"],
              ].map(([key, label]) => (
                <div key={key} className="bg-[#050a0f] border border-slate-800 rounded-lg p-3">
                  <label htmlFor={`blood-${key}`} className="block text-[10px] text-red-400 font-mono mb-1.5 uppercase tracking-wide">{label}</label>
                  <input id={`blood-${key}`} type="number" min={0} max={2000} value={calib.blood[key]}
                    onChange={e => set("blood", key, Number(e.target.value))}
                    className="w-full bg-[#0a1628] border border-slate-700 rounded px-2 py-1.5 text-lg text-white font-mono font-bold focus:outline-none focus:border-red-500" />
                  <div className="text-[10px] text-slate-600 mt-1">units on hand</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-red-900/40 bg-red-900/10 text-xs text-red-300">
              <span aria-hidden="true">⚠</span>
              <span>O-Negative is critical — maintain minimum 80 units for MASCAL events. Current: <strong>{calib.blood.o_neg}u</strong>{calib.blood.o_neg < 80 ? " — BELOW MINIMUM" : " — OK"}</span>
            </div>
          </div>
        )}

        {/* MedEvac Assets tab */}
        {tab === "medevac" && (
          <div id="calib-tab-medevac" role="tabpanel" aria-labelledby="tab-medevac" className="space-y-4">
            <p className="text-xs text-slate-400">Set number of available MedEvac assets by class. These are used to calculate evacuation capacity in the Recommended COA.</p>
            <div className="space-y-3">
              {MEDEVAC_CLASSES.map(mc => {
                const count = calib.medevac[mc.id] || 0;
                const catColor = mc.category === "rotary" ? "text-cyan-400" : mc.category === "fixed" ? "text-violet-400" : "text-amber-400";
                const catLabel = mc.category === "rotary" ? "Rotary Wing" : mc.category === "fixed" ? "Fixed Wing" : "Sea Lift";
                return (
                  <div key={mc.id} className="flex items-center gap-4 p-3 bg-[#050a0f] border border-slate-800 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium">{mc.label}</div>
                      <div className={`text-[10px] font-mono ${catColor}`}>{catLabel} · Range: {mc.range_nm} nm · Capacity: {mc.capacity} PAX</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button onClick={() => set("medevac", mc.id, Math.max(0, count-1))}
                        className="w-7 h-7 rounded border border-slate-700 text-slate-400 hover:text-white hover:border-cyan-600 transition-colors text-sm font-bold"
                        aria-label={`Decrease ${mc.label} count`}>−</button>
                      <span className="w-8 text-center font-mono font-bold text-white text-lg">{count}</span>
                      <button onClick={() => set("medevac", mc.id, count+1)}
                        className="w-7 h-7 rounded border border-slate-700 text-slate-400 hover:text-white hover:border-cyan-600 transition-colors text-sm font-bold"
                        aria-label={`Increase ${mc.label} count`}>+</button>
                      <span className="text-[10px] text-slate-600 w-20">cap: {count*mc.capacity} PAX</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 rounded-lg border border-cyan-900/40 bg-cyan-900/10 text-xs text-cyan-300 font-mono">
              Total lift capacity: <strong>{MEDEVAC_CLASSES.reduce((s,mc) => s + (calib.medevac[mc.id]||0)*mc.capacity, 0)} PAX</strong> across {Object.values(calib.medevac).reduce((s,v)=>s+v,0)} platforms
            </div>
          </div>
        )}

        {/* Theater & Echelon tab */}
        {tab === "theater" && (
          <div id="calib-tab-theater" role="tabpanel" aria-labelledby="tab-theater" className="space-y-5">
            <div>
              <label htmlFor="theater-select" className="block text-[10px] font-mono text-cyan-400 tracking-widest uppercase mb-2">Theater of Operations</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {THEATERS.map(t => (
                  <label key={t.id} className={`flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-all ${calib.theater===t.id ? "border-cyan-600 bg-cyan-900/20" : "border-slate-800 bg-[#050a0f] hover:border-slate-700"}`}>
                    <input type="radio" name="theater" value={t.id} checked={calib.theater===t.id} onChange={() => setTop("theater",t.id)} className="sr-only" />
                    <span className={`text-xs font-bold ${calib.theater===t.id ? "text-cyan-300" : "text-slate-300"}`}>{t.label}</span>
                    <span className="text-[10px] text-slate-500 leading-tight">{t.desc}</span>
                  </label>
                ))}
              </div>
              {calib.theater === "custom" && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label htmlFor="custom-lat" className="block text-[10px] text-slate-500 mb-1">Latitude (decimal)</label>
                    <input id="custom-lat" type="number" step="0.1" value={calib.customLat}
                      onChange={e => setTop("customLat", e.target.value)}
                      className="w-full bg-[#0a1628] border border-slate-700 rounded px-2 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500" placeholder="e.g. 26.5" />
                  </div>
                  <div>
                    <label htmlFor="custom-lng" className="block text-[10px] text-slate-500 mb-1">Longitude (decimal)</label>
                    <input id="custom-lng" type="number" step="0.1" value={calib.customLng}
                      onChange={e => setTop("customLng", e.target.value)}
                      className="w-full bg-[#0a1628] border border-slate-700 rounded px-2 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500" placeholder="e.g. 56.5" />
                  </div>
                </div>
              )}
            </div>

            {echelons.length > 0 && (
              <div>
                <div className="text-[10px] font-mono text-amber-400 tracking-widest uppercase mb-3">Theater Map — Echelons of Care</div>
                <TheaterMap
                  theater={calib.theater}
                  customLat={calib.customLat}
                  customLng={calib.customLng}
                  echelons={echelons}
                  selectedEchelon={calib.selectedEchelon}
                  onSelectEchelon={id => setTop("selectedEchelon", id)}
                  carrierPos="Carrier Battle Group"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CarrierReadiness() {
  const [selectedShip,   setSelectedShip]   = useState("cvn68");
  const [secondShip,     setSecondShip]     = useState("cvn71");
  const [showBothShips,  setShowBothShips]  = useState(true);
  const [crewCount,      setCrewCount]      = useState(6000);
  const [threatType,     setThreatType]     = useState("drone_swarm");
  const [threatIntensity,setThreatIntensity]= useState(65);
  const [showCalib,      setShowCalib]      = useState(false);

  // Load persisted calibration or use defaults
  const [calib, setCalibRaw] = useState(() => {
    const saved = loadCalib();
    return saved ? { ...DEFAULT_CALIB, ...saved, thresholds: { ...DEFAULT_CALIB.thresholds, ...(saved.thresholds||{}) }, lod: { ...DEFAULT_CALIB.lod, ...(saved.lod||{}) }, blood: { ...DEFAULT_CALIB.blood, ...(saved.blood||{}) }, medevac: { ...DEFAULT_MEDEVAC, ...(saved.medevac||{}) } } : DEFAULT_CALIB;
  });
  const setCalib = useCallback((next) => { setCalibRaw(next); saveCalib(next); }, []);
  const thresholds = calib.thresholds;
  const [showThresholds, setShowThresholds] = useState(false);
  const [running,        setRunning]        = useState(false);
  const [result,         setResult]         = useState(null);
  const [result2,        setResult2]        = useState(null);
  const [logIdx,         setLogIdx]         = useState(0);
  const [history,        setHistory]        = useState([]);
  const [showHistory,    setShowHistory]    = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [saveMsg,        setSaveMsg]        = useState("");
  const [runTimestamp,   setRunTimestamp]   = useState(null);
  const [meshEvents,     setMeshEvents]     = useState([]);
  const [liveReadiness,  setLiveReadiness]  = useState({ cvn68: null, cvn71: null });
  const logRef  = useRef(null);
  const timerRef= useRef(null);

  const loadHistory = useCallback(() => {
    const ctrl = new AbortController();
    pb.collection("carrier_readiness_scenarios")
      .getList(1, 20, { sort: "-created", signal: ctrl.signal })
      .then(r => setHistory(r.items))
      .catch(e => { if (!e?.isAbort) console.error(e); });
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const cleanup = loadHistory();
    return cleanup;
  }, [loadHistory]);

  // ── Listen for live NATS telemetry from Mesh C2 Dashboard ──────────────────
  useEffect(() => {
    const handler = (e) => {
      const d = e.detail;
      if (!d) return;
      // Update live readiness score for the carrier
      setLiveReadiness(prev => ({
        ...prev,
        [d.carrier_id]: d.fleet_readiness_pct,
      }));
      // Append to mesh event feed (keep last 30)
      setMeshEvents(prev => [{
        ts: new Date().toISOString().split("T")[1].slice(0, 8),
        carrierId: d.carrier_id,
        carrier: d.carrier,
        role: d.line_of_duty,
        flag: d.event_flag,
        effective: d.combat_effective,
        tbi: d.tbi_watch_count,
        readiness: d.fleet_readiness_pct,
      }, ...prev].slice(0, 30));
    };
    window.addEventListener("orcawolf:mesh-telemetry", handler);
    return () => window.removeEventListener("orcawolf:mesh-telemetry", handler);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logIdx]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const ship1 = SHIPS.find(s => s.id === selectedShip);
  const ship2 = SHIPS.find(s => s.id === secondShip);

  const handleRun = useCallback(() => {
    setRunning(true);
    setResult(null);
    setResult2(null);
    setLogIdx(0);
    setSaveMsg("");
    const ts = Date.now();
    setRunTimestamp(ts);

    const seed1 = ts & 0xffffffff;
    const seed2 = (seed1 ^ 0xdeadbeef) & 0xffffffff;
    const r1 = runReadinessEngine({ crew: crewCount, threatType, threatIntensity, seed: seed1, thresholds });
    const r2 = showBothShips
      ? runReadinessEngine({ crew: crewCount, threatType, threatIntensity, seed: seed2, thresholds })
      : null;
    setResult(r1);
    setResult2(r2);

    let idx = 0;
    const tick = () => {
      idx++;
      setLogIdx(idx);
      if (idx < r1.events.length) {
        timerRef.current = setTimeout(tick, 220);
      } else {
        setRunning(false);
        // auto-save scenario
        setSaving(true);
        const summary1 = buildSemanticSummary({
          vessel: ship1.name, threatType, threatIntensity, crewCount,
          overall: r1.overall, medMetrics: r1.medMetrics, lodMetrics: r1.lodMetrics,
          casualties: { total: r1.cas, kia: r1.kia, immediate: r1.immediate, delayed: r1.delayed },
          threatLevel: r1.threatLevel,
        });
        const vec1 = generateEmbedding(summary1);
        pb.collection("carrier_readiness_scenarios").create({
          scenario_name:    `${ship1.name} — ${THREAT_TYPES.find(t=>t.id===threatType)?.label} @ ${threatIntensity}%`,
          vessel:           ship1.name,
          crew_complement:  crewCount,
          threat_type:      threatType,
          threat_intensity: threatIntensity,
          medical_readiness:r1.medMetrics.medical_readiness,
          lod_readiness:    (Object.values(r1.lodMetrics).reduce((a,b)=>a+b,0)/Object.values(r1.lodMetrics).length),
          surgical_capacity:r1.medMetrics.surgical_capacity,
          blood_supply:     r1.medMetrics.blood_supply,
          pharmacy:         r1.medMetrics.pharmacy,
          mental_health:    r1.medMetrics.mental_health,
          personnel_fitness:r1.medMetrics.personnel_fit,
          preventive_medicine: r1.medMetrics.preventive_med,
          dental_readiness: r1.medMetrics.dental_readiness,
          watch_station_fill:  r1.lodMetrics.watchstation_fill,
          dc_certification: r1.lodMetrics.dc_certification,
          flight_deck_crew: r1.lodMetrics.flight_deck_crew,
          battle_station:   r1.lodMetrics.battle_station_assign,
          watch_quals:      r1.lodMetrics.watch_qual,
          dc_readiness:     r1.lodMetrics.damage_ctrl_ready,
          casualties:       r1.cas,
          status:           r1.threatLevel,
          event_log:        r1.events,
          department_readiness: r1.deptReadiness,
          embedding_vector: vec1,
          semantic_summary: summary1,
          thresholds:       thresholds,
        }).then(() => {
          setSaving(false);
          setSaveMsg("✓ Scenario saved to mission history");
          loadHistory();
        }).catch(() => {
          setSaving(false);
          setSaveMsg("⚠ Could not save scenario");
        });
      }
    };
    timerRef.current = setTimeout(tick, 220);
  }, [crewCount, threatType, threatIntensity, showBothShips, thresholds, ship1, loadHistory]);

  const eventTypeStyle = {
    start: "text-cyan-300", info: "text-slate-300",
    warn: "text-amber-300", critical: "text-red-400", med: "text-emerald-300",
  };
  const formatElapsed = ms => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `T+${String(m).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  };

  // Aggregate stats from history
  const aggStats = history.length > 0 ? {
    avgMedical: history.reduce((s,r) => s + (r.medical_readiness||0), 0) / history.length,
    avgLOD:     history.reduce((s,r) => s + (r.lod_readiness||0), 0) / history.length,
    criticalCount: history.filter(r => r.status === "CRITICAL").length,
    totalCas:   history.reduce((s,r) => s + (r.casualties||0), 0),
  } : null;

  return (
    <div className="min-h-screen bg-[#020608] text-white">
      {/* Header */}
      <div className="relative border-b border-cyan-900/40 bg-[#030c14]">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_39px,rgba(0,229,255,0.03)_40px),repeating-linear-gradient(90deg,transparent,transparent_39px,rgba(0,229,255,0.03)_40px)]" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-amber-900/50 text-amber-300 border border-amber-700/50">UNCLASSIFIED // FOR EXERCISE USE ONLY</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Carrier Battle Group<br />
                <span className="text-cyan-400">Medical &amp; Line-of-Duty Readiness</span>
              </h1>
              <p className="mt-2 text-slate-400 text-sm max-w-xl">
                C2 Readiness simulation for Commanding Officers and Medical Officers. Configure threat scenario, crew complement, and minimum viable thresholds — then run the exercise. Every run is saved with full vectorized scoring for longitudinal analysis.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-[10px] font-mono text-slate-500 tracking-widest">SOVEREIGN MESH // OrcaWolf AI</span>
              {result && <ThreatBadge level={result.threatLevel} />}
              <div className="flex gap-2 flex-wrap justify-end">
                <button
                  onClick={() => setShowCalib(v => !v)}
                  className={`text-xs px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 ${showCalib ? "border-cyan-600 text-cyan-300 bg-cyan-900/20" : "border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-700"}`}
                  aria-expanded={showCalib}
                >
                  <span aria-hidden="true">⚙</span> Calibration Settings
                </button>
                <button
                  onClick={() => setShowHistory(v => !v)}
                  className="text-xs px-3 py-1.5 rounded border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-700 transition-colors"
                >
                  {showHistory ? "Hide" : "Show"} Mission History ({history.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Aggregate stats */}
        {aggStats && (
          <section aria-label="Aggregate readiness statistics" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Avg Medical Readiness", value: `${Math.round(aggStats.avgMedical)}%`, color: "text-cyan-400" },
              { label: "Avg LOD Readiness",     value: `${Math.round(aggStats.avgLOD)}%`,     color: "text-amber-400" },
              { label: "CRITICAL Exercises",    value: aggStats.criticalCount,                 color: "text-red-400" },
              { label: "Total Simulated Cas.",  value: aggStats.totalCas.toLocaleString(),     color: "text-rose-400" },
            ].map(s => (
              <div key={s.label} className="bg-[#040d17] border border-cyan-900/30 rounded-xl p-4 text-center">
                <div className={`text-2xl font-mono font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </section>
        )}

        {/* Calibration Settings Panel */}
        {showCalib && (
          <div id="calib-panel">
            <CalibrationPanel calib={calib} onChange={setCalib} />
          </div>
        )}

        {/* Mission history */}
        {showHistory && (
          <section aria-labelledby="history-heading" className="bg-[#040d17] border border-cyan-900/30 rounded-xl p-6 space-y-3">
            <h2 id="history-heading" className="text-xs font-mono text-cyan-400 tracking-widest uppercase mb-4">Mission Scenario History — Last 20 Runs</h2>
            {history.length === 0
              ? <p className="text-slate-500 text-sm text-center py-6">No saved exercises yet — run your first scenario above.</p>
              : history.map(r => <HistoryCard key={r.id} rec={r} />)
            }
          </section>
        )}

        {/* Configuration */}
        <section aria-labelledby="config-heading" className="bg-[#040d17] border border-cyan-900/30 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 id="config-heading" className="text-cyan-400 font-mono font-bold text-sm tracking-widest uppercase">Exercise Configuration</h2>
            <button onClick={() => setShowCalib(v => !v)} className="text-xs px-3 py-1.5 rounded border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-700 transition-colors">
              ⚙ Open Calibration Settings
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label htmlFor="ship1" className="block text-xs text-slate-400 mb-1.5 font-medium">Primary Vessel</label>
              <select id="ship1" value={selectedShip} onChange={e => setSelectedShip(e.target.value)}
                className="w-full bg-[#0a1628] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
                {SHIPS.map(s => <option key={s.id} value={s.id}>{s.name} ({s.hull})</option>)}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="ship2" className="text-xs text-slate-400 font-medium">Secondary Vessel</label>
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={showBothShips} onChange={e => setShowBothShips(e.target.checked)} className="w-3.5 h-3.5 accent-cyan-400" />
                  Enable
                </label>
              </div>
              <select id="ship2" value={secondShip} onChange={e => setSecondShip(e.target.value)} disabled={!showBothShips}
                className="w-full bg-[#0a1628] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 disabled:opacity-40">
                {SHIPS.map(s => <option key={s.id} value={s.id}>{s.name} ({s.hull})</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="crew" className="block text-xs text-slate-400 mb-1.5 font-medium">
                Crew Complement — <span className="text-cyan-300 font-mono">{crewCount.toLocaleString()}</span>
              </label>
              <select id="crew" value={crewCount} onChange={e => setCrewCount(Number(e.target.value))}
                className="w-full bg-[#0a1628] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
                <option value={500}>Command Element Only (500)</option>
                <option value={1500}>Medical + C2 Staff (1,500)</option>
                <option value={3000}>Half Complement (3,000)</option>
                <option value={4500}>Reduced Crew (4,500)</option>
                <option value={6000}>Full Complement (6,000)</option>
              </select>
            </div>
            <div className="md:col-span-2 lg:col-span-2">
              <fieldset>
                <legend className="text-xs text-slate-400 mb-2 font-medium">Threat Scenario</legend>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {THREAT_TYPES.map(t => (
                    <label key={t.id} className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border cursor-pointer transition-all text-center ${
                      threatType === t.id ? "border-cyan-500 bg-cyan-500/10 text-cyan-300" : "border-slate-700 bg-[#0a1628] text-slate-400 hover:border-slate-600"}`}>
                      <input type="radio" name="threat" value={t.id} checked={threatType === t.id} onChange={() => setThreatType(t.id)} className="sr-only" />
                      <span className="text-xl" aria-hidden="true">{t.icon}</span>
                      <span className="text-[10px] font-medium leading-tight">{t.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <div>
              <label htmlFor="intensity" className="block text-xs text-slate-400 mb-1.5 font-medium">
                Threat Intensity — <span className="text-red-400 font-mono font-bold">{threatIntensity}%</span>
              </label>
              <input id="intensity" type="range" min={10} max={100} value={threatIntensity}
                onChange={e => setThreatIntensity(Number(e.target.value))} className="w-full accent-red-500" />
              <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                <span>Probe</span><span>Moderate</span><span>Maximum</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button onClick={handleRun} disabled={running}
              className="px-10 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-[#020608] font-bold text-sm tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] disabled:shadow-none">
              {running ? "⟳ EXERCISE RUNNING…" : "▶ RUN READINESS EXERCISE"}
            </button>
          </div>
        </section>

        {/* Live Mesh C2 Telemetry Feed */}
        {meshEvents.length > 0 && (
          <section aria-labelledby="mesh-feed-heading" className="bg-[#040d17] border border-emerald-900/40 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 id="mesh-feed-heading" className="text-xs font-mono text-emerald-400 tracking-widest uppercase flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                Live NATS Mesh Telemetry — Sovereign Mesh C2 Dashboard
              </h2>
              <div className="flex items-center gap-6">
                {["cvn68","cvn71"].map(id => liveReadiness[id] != null ? (
                  <div key={id} className="text-center">
                    <div className="text-[10px] text-slate-500 font-mono uppercase">{id === "cvn68" ? "CVN-68" : "CVN-71"} Live</div>
                    <div className="text-lg font-mono font-bold" style={{ color: liveReadiness[id] >= 75 ? "#22c55e" : liveReadiness[id] >= 55 ? "#f59e0b" : "#ef4444" }}>
                      {liveReadiness[id]}%
                    </div>
                  </div>
                ) : null)}
              </div>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs" aria-label="Live mesh telemetry events" aria-live="polite">
              {meshEvents.map((ev, i) => {
                const flagColor = ev.flag === "MASCAL_IMPACT" ? "#ef4444" : ev.flag === "BLAST_EXPOSURE_DETECTED" ? "#f59e0b" : "#22c55e";
                const rdColor   = ev.readiness >= 75 ? "#22c55e" : ev.readiness >= 55 ? "#f59e0b" : "#ef4444";
                return (
                  <div key={i} className="flex flex-wrap gap-x-3 gap-y-0.5 border-b border-slate-800/50 pb-1">
                    <span className="text-slate-600">{ev.ts}</span>
                    <span className="text-slate-500">{ev.carrier}</span>
                    <span className="text-slate-300">{ev.role}</span>
                    <span className="font-bold" style={{ color: flagColor }}>{ev.flag}</span>
                    <span className="text-slate-500">eff:{ev.effective}</span>
                    <span className="text-orange-400">TBI:{ev.tbi}</span>
                    <span className="font-bold" style={{ color: rdColor }}>fleet:{ev.readiness}%</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-600 mt-3">
              Open <strong className="text-slate-500">Mesh C2</strong> in another tab — live NATS events stream here in real time and drive these readiness scores.
            </p>
          </section>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-8 animate-[fadeInUp_0.4s_ease_both]">

            {/* Save status */}
            {(saving || saveMsg) && (
              <div className={`text-center text-xs font-mono py-2 rounded-lg border ${saving ? "border-cyan-900/40 text-cyan-400 bg-cyan-900/10" : saveMsg.startsWith("✓") ? "border-emerald-900/40 text-emerald-400 bg-emerald-900/10" : "border-amber-900/40 text-amber-400 bg-amber-900/10"}`}>
                {saving ? "⟳ Saving scenario to mission history with vectorized scoring…" : saveMsg}
              </div>
            )}

            {/* Ship panels */}
            <div className={`grid gap-6 ${showBothShips && result2 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
              {[{ ship: ship1, res: result }, ...(showBothShips && result2 ? [{ ship: ship2, res: result2 }] : [])].map(({ ship, res }) => (
                <section key={ship.id} aria-labelledby={`ship-${ship.id}`} className="bg-[#040d17] border border-cyan-900/30 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                    <div>
                      <h2 id={`ship-${ship.id}`} className="font-display text-xl font-bold text-white">{ship.name}</h2>
                      <p className="text-slate-500 text-xs font-mono">{ship.hull} · {ship.type} · {crewCount.toLocaleString()} crew</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <ThreatBadge level={res.threatLevel} />
                      <button
                        onClick={() => printC2Brief({ ship, res, crewCount, threatType, threatIntensity, thresholds, timestamp: runTimestamp })}
                        className="px-3 py-1.5 rounded-lg border border-amber-700/50 text-amber-300 hover:bg-amber-900/20 text-xs font-mono transition-colors"
                        aria-label={`Print C2 brief for ${ship.name}`}
                      >
                        ⎙ Print C2 Brief
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-6 p-4 rounded-lg bg-[#0a1628] border border-slate-800">
                    <div className="text-5xl font-mono font-bold" style={{ color: res.overall >= 75 ? "#22d3ee" : res.overall >= 55 ? "#f59e0b" : "#ef4444" }}>
                      {Math.round(res.overall)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Overall Readiness Score</div>
                      <div className="text-xs text-slate-400">Combat-Effective Threshold: 75 | Current: {res.overall >= 75 ? "✓ MET" : "✗ NOT MET"}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Cas: <span className="text-red-400">{res.cas}</span> · KIA: <span className="text-red-600">{res.kia}</span> · IMM: <span className="text-red-400">{res.immediate}</span> · DEL: <span className="text-amber-400">{res.delayed}</span> · MIN: <span className="text-emerald-400">{res.minimal}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-5">
                    <h3 className="text-xs font-mono text-emerald-400 tracking-widest uppercase mb-3">Medical Readiness</h3>
                    <div className="grid grid-cols-4 gap-2 justify-items-center">
                      <RadialDial value={res.medMetrics.medical_readiness} label="Medical Readiness"    yellowAt={thresholds.medical_readiness}    greenAt={thresholds.medical_readiness+15} />
                      <RadialDial value={res.medMetrics.surgical_capacity} label="Surgical Capacity"    yellowAt={thresholds.surgical_capacity}    greenAt={thresholds.surgical_capacity+15} />
                      <RadialDial value={res.medMetrics.blood_supply}      label="Blood Supply"         yellowAt={thresholds.blood_supply}         greenAt={thresholds.blood_supply+15} />
                      <RadialDial value={res.medMetrics.pharmacy}          label="Pharmacy / Formulary" yellowAt={thresholds.pharmacy}             greenAt={thresholds.pharmacy+15} />
                      <RadialDial value={res.medMetrics.personnel_fit}     label="Personnel Fitness"    yellowAt={thresholds.personnel_fit}        greenAt={thresholds.personnel_fit+10} />
                      <RadialDial value={res.medMetrics.mental_health}     label="Mental Health / PTSD" yellowAt={40} greenAt={60} />
                      <RadialDial value={res.medMetrics.preventive_med}    label="Preventive Medicine"  yellowAt={50} greenAt={70} />
                      <RadialDial value={res.medMetrics.dental_readiness}  label="Dental Readiness"     yellowAt={60} greenAt={78} />
                    </div>
                  </div>

                  <div className="mb-5">
                    <h3 className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-3">Line-of-Duty Readiness</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 justify-items-center">
                      <RadialDial value={res.lodMetrics.watchstation_fill}     label="Watch Station Fill"    yellowAt={thresholds.watchstation_fill}    greenAt={thresholds.watchstation_fill+12} />
                      <RadialDial value={res.lodMetrics.dc_certification}      label="DC Certification"      yellowAt={thresholds.dc_certification}     greenAt={thresholds.dc_certification+12} />
                      <RadialDial value={res.lodMetrics.flight_deck_crew}      label="Flight Deck Crew"      yellowAt={thresholds.flight_deck_crew}     greenAt={thresholds.flight_deck_crew+12} />
                      <RadialDial value={res.lodMetrics.battle_station_assign} label="Battle Station Assign" yellowAt={65} greenAt={80} />
                      <RadialDial value={res.lodMetrics.watch_qual}            label="Watch Qualifications"  yellowAt={55} greenAt={72} />
                      <RadialDial value={res.lodMetrics.damage_ctrl_ready}     label="Damage Control Ready"  yellowAt={thresholds.dc_certification}     greenAt={thresholds.dc_certification+12} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-mono text-slate-400 tracking-widest uppercase mb-3">Department Readiness</h3>
                    <div className="space-y-2">
                      {DEPT_LABELS.map((d, i) => {
                        const v = Math.round(res.deptReadiness[i]);
                        const color = v >= 70 ? "bg-cyan-500" : v >= 45 ? "bg-amber-500" : "bg-red-500";
                        return (
                          <div key={d} className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 w-28 shrink-0">{d}</span>
                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${v}%` }} />
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{v}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              ))}
            </div>

            {/* Event log */}
            <section aria-labelledby="event-log-heading" className="bg-[#040d17] border border-cyan-900/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 id="event-log-heading" className="text-xs font-mono text-cyan-400 tracking-widest uppercase">C2 Exercise Event Log — {ship1?.name}</h2>
                <span className="text-xs font-mono text-slate-500">{running ? "⟳ STREAMING…" : "● COMPLETE"}</span>
              </div>
              <div ref={logRef}
                className="h-72 overflow-y-auto space-y-1.5 font-mono text-xs bg-[#020608] rounded-lg p-4 border border-slate-800"
                aria-live="polite" aria-label="Exercise event log">
                {result.events.slice(0, logIdx).map((e, i) => (
                  <div key={i} className={`flex gap-3 ${eventTypeStyle[e.type] || "text-slate-300"}`}>
                    <span className="text-slate-600 shrink-0">{formatElapsed(i * 1800)}</span>
                    <span>{e.msg}</span>
                  </div>
                ))}
                {running && (
                  <div className="flex gap-3 text-cyan-400">
                    <span className="text-slate-600">{formatElapsed(logIdx * 1800)}</span>
                    <span className="animate-pulse">█</span>
                  </div>
                )}
              </div>
            </section>

            {/* Recommended Course of Action */}
            <RecommendedCOA
              result={result}
              result2={result2}
              threatType={threatType}
              threatIntensity={threatIntensity}
              calib={calib}
              ship1={ship1}
              ship2={ship2}
              showBothShips={showBothShips}
            />

            <div className="flex justify-center">
              <button onClick={() => { setResult(null); setResult2(null); setLogIdx(0); setSaveMsg(""); }}
                className="px-6 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-700 text-sm transition-colors">
                ↺ Reset Exercise
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-600 pb-4">
          UNCLASSIFIED // FOR EXERCISE USE ONLY · This simulation demonstrates sovereign AI EHR mesh capabilities · OrcaWolf AI · orcawolfai.com
        </p>
      </div>
    </div>
  );
}
