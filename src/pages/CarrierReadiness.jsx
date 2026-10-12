import { useState, useEffect, useRef, useCallback } from "react";

// ─── Deterministic PRNG ───────────────────────────────────────────────────────
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── Gauge / Dial component ───────────────────────────────────────────────────
function RadialDial({ value, max = 100, label, size = 120, thresholds = { red: 30, yellow: 60 } }) {
  const pct = Math.min(Math.max(value / max, 0), 1);
  const angle = -135 + pct * 270;
  const r = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;

  // arc helpers
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

  const color =
    value <= thresholds.red
      ? "#ef4444"
      : value <= thresholds.yellow
      ? "#f59e0b"
      : "#22d3ee";

  const needle = polarToXY(angle, r - 8);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} aria-label={`${label}: ${value}%`} role="img">
        {/* track */}
        <path
          d={describeArc(-135 + 90, 135 + 90, r)}
          fill="none"
          stroke="#1e293b"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* fill */}
        {pct > 0 && (
          <path
            d={describeArc(-135 + 90, angle + 90, r)}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        )}
        {/* needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needle.x}
          y2={needle.y}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="4" fill={color} />
        {/* value */}
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
  ROUTINE: "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
  ELEVATED: "bg-yellow-900/40 text-yellow-300 border-yellow-700/40",
  HIGH: "bg-orange-900/40 text-orange-300 border-orange-700/40",
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
  { id: "cvn68", name: "USS Nimitz", hull: "CVN-68", type: "Nimitz-class" },
  { id: "cvn71", name: "USS Theodore Roosevelt", hull: "CVN-71", type: "Nimitz-class" },
];

const THREAT_TYPES = [
  { id: "drone_swarm", label: "Drone Swarm", icon: "⬡" },
  { id: "sea_skim", label: "Sea-Skimming Missile", icon: "⟶" },
  { id: "ew_gps", label: "EW / GPS Denial", icon: "⚡" },
  { id: "cbrn", label: "CBRN Exposure", icon: "☣" },
  { id: "combined", label: "Combined Arms", icon: "⊕" },
];

const DEPT_LABELS = [
  "Medical", "Flight Deck", "Engineering", "Combat Systems",
  "Supply / Log", "Navigation", "Damage Control", "Air Wing",
];

const LOD_DEFAULTS = {
  medical_readiness: 85,
  surgical_capacity: 70,
  blood_supply: 75,
  personnel_fit: 90,
  watchstation_fill: 85,
  dc_certification: 80,
  flight_deck_crew: 88,
  pharmacy: 72,
};

// ─── Simulation engine ────────────────────────────────────────────────────────
function runReadinessEngine({ crew, threatType, threatIntensity, seed, thresholds }) {
  const rng = seededRand(seed);
  const now = Date.now();

  const threatMultiplier = {
    drone_swarm: { cas: 0.15, eq: 0.20, stress: 0.25 },
    sea_skim: { cas: 0.28, eq: 0.35, stress: 0.30 },
    ew_gps: { cas: 0.05, eq: 0.45, stress: 0.20 },
    cbrn: { cas: 0.22, eq: 0.10, stress: 0.50 },
    combined: { cas: 0.35, eq: 0.40, stress: 0.45 },
  }[threatType] || { cas: 0.10, eq: 0.15, stress: 0.15 };

  const intensity = threatIntensity / 100;
  const cas = Math.round(crew * threatMultiplier.cas * intensity * (0.7 + rng() * 0.6));
  const kia = Math.round(cas * 0.08 * (0.5 + rng() * 0.5));
  const immediate = Math.round((cas - kia) * 0.35);
  const delayed = Math.round((cas - kia) * 0.40);
  const minimal = Math.round((cas - kia) * 0.25);

  // Department readiness — each drops based on threat type + intensity
  const deptReadiness = DEPT_LABELS.map((d, i) => {
    const base = 70 + rng() * 25;
    const drop = threatMultiplier.eq * intensity * (40 + rng() * 30);
    return Math.max(15, base - drop);
  });

  // Medical metrics
  const medMetrics = {
    medical_readiness: Math.max(20, thresholds.medical_readiness - threatMultiplier.cas * intensity * 60 * (0.5 + rng() * 0.5)),
    surgical_capacity: Math.max(10, thresholds.surgical_capacity - (immediate / 20) * (0.4 + rng() * 0.3)),
    blood_supply: Math.max(5, thresholds.blood_supply - cas * 0.08 * (0.6 + rng() * 0.4)),
    pharmacy: Math.max(15, thresholds.pharmacy - cas * 0.05 * (0.4 + rng() * 0.3)),
    personnel_fit: Math.max(30, thresholds.personnel_fit - threatMultiplier.stress * intensity * 40 * (0.5 + rng() * 0.5)),
    mental_health: Math.max(20, 80 - threatMultiplier.stress * intensity * 50 * (0.4 + rng() * 0.6)),
    preventive_med: Math.max(40, 90 - intensity * 20 * (0.5 + rng() * 0.5)),
    dental_readiness: Math.max(50, 88 - intensity * 15 * (0.3 + rng() * 0.4)),
  };

  // LOD metrics
  const lodMetrics = {
    watchstation_fill: Math.max(20, thresholds.watchstation_fill - cas * 0.06 * (0.5 + rng() * 0.5)),
    dc_certification: Math.max(30, thresholds.dc_certification - intensity * 20 * (0.4 + rng() * 0.4)),
    flight_deck_crew: Math.max(15, thresholds.flight_deck_crew - cas * 0.07 * (0.5 + rng() * 0.5)),
    battle_station_assign: Math.max(25, 92 - cas * 0.08 * (0.4 + rng() * 0.5)),
    watch_qual: Math.max(30, 85 - intensity * 25 * (0.3 + rng() * 0.5)),
    damage_ctrl_ready: Math.max(20, thresholds.dc_certification - intensity * 30 * (0.4 + rng() * 0.4)),
  };

  // Overall readiness score
  const overall = (
    Object.values(medMetrics).reduce((a, b) => a + b, 0) / Object.values(medMetrics).length * 0.5 +
    Object.values(lodMetrics).reduce((a, b) => a + b, 0) / Object.values(lodMetrics).length * 0.5
  );

  const threatLevel =
    overall >= 75 ? "ROUTINE" :
    overall >= 55 ? "ELEVATED" :
    overall >= 35 ? "HIGH" : "CRITICAL";

  // Event log
  const events = [];
  const push = (msg, type = "info") => events.push({ ts: now + events.length * 1800, msg, type });
  push(`EXERCISE COMMENCED — ${THREAT_TYPES.find(t => t.id === threatType)?.label} scenario initiated`, "start");
  push(`Threat intensity: ${threatIntensity}% — Crew complement: ${crew.toLocaleString()} personnel`, "info");
  if (threatType === "ew_gps" || threatType === "combined")
    push("⚡ GPS DENIED — EMCON Alpha enforced, navigating by SINS/celestial", "warn");
  if (threatType === "cbrn" || threatType === "combined")
    push("☣ CBRN ALERT — MOPP Level 4 ordered, decontamination stations manned", "warn");
  if (threatType === "drone_swarm" || threatType === "combined")
    push("⬡ DRONE SWARM detected — CIWS and SM-6 batteries engaging", "warn");
  if (threatType === "sea_skim" || threatType === "combined")
    push("⟶ SEA-SKIMMING contact — Active decoy countermeasures deployed", "warn");
  push(`Mass Casualty declared — ${cas} total casualties, ${kia} KIA`, "critical");
  push(`Triage breakdown: IMMEDIATE ${immediate} | DELAYED ${delayed} | MINIMAL ${minimal}`, "critical");
  push(`Medical Officer: Activating mass casualty bill — all ORs surging to capacity`, "med");
  if (medMetrics.blood_supply < 40) push(`⚠ BLOOD SUPPLY CRITICAL — ${Math.round(medMetrics.blood_supply)}% remaining — VERTREP request initiated`, "warn");
  if (medMetrics.surgical_capacity < 40) push(`⚠ SURGICAL CAPACITY EXCEEDED — overflow routing to secondary sickbay`, "warn");
  push(`Damage Control: ${Math.round(lodMetrics.dc_certification)}% DC-certified personnel available`, "info");
  push(`Flight Deck: ${Math.round(lodMetrics.flight_deck_crew)}% crew operational — ${Math.round(cas * 0.07)} personnel removed from flight ops`, "info");
  if (medMetrics.mental_health < 45) push(`🧠 COMBAT STRESS WARNING — Fleet Mental Health Officer activated`, "warn");
  push(`Pharmacy formulary at ${Math.round(medMetrics.pharmacy)}% — requesting emergency resupply`, "med");
  push(`Watch station fill rate: ${Math.round(lodMetrics.watchstation_fill)}% — ${Math.round(crew * (1 - lodMetrics.watchstation_fill / 100))} positions understrength`, "info");
  push(`Overall readiness score: ${Math.round(overall)}% — Status: ${threatLevel}`, overall >= 55 ? "info" : "critical");
  push(`C2 BRIEF READY — Admiral / Commanding Officer dashboard updated`, "start");

  return { cas, kia, immediate, delayed, minimal, deptReadiness, medMetrics, lodMetrics, overall, threatLevel, events };
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CarrierReadiness() {
  // Config state
  const [selectedShip, setSelectedShip] = useState("cvn68");
  const [secondShip, setSecondShip] = useState("cvn71");
  const [showBothShips, setShowBothShips] = useState(true);
  const [crewCount, setCrewCount] = useState(6000);
  const [threatType, setThreatType] = useState("drone_swarm");
  const [threatIntensity, setThreatIntensity] = useState(65);
  const [thresholds, setThresholds] = useState(LOD_DEFAULTS);
  const [showThresholds, setShowThresholds] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [result2, setResult2] = useState(null);
  const [logIdx, setLogIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const logRef = useRef(null);
  const timerRef = useRef(null);

  const handleRun = useCallback(() => {
    setRunning(true);
    setResult(null);
    setResult2(null);
    setLogIdx(0);
    setElapsed(0);

    const seed1 = Date.now() & 0xffffffff;
    const seed2 = (seed1 ^ 0xdeadbeef) & 0xffffffff;

    const r1 = runReadinessEngine({ crew: crewCount, threatType, threatIntensity, seed: seed1, thresholds });
    const r2 = showBothShips
      ? runReadinessEngine({ crew: crewCount, threatType, threatIntensity, seed: seed2, thresholds })
      : null;

    setResult(r1);
    setResult2(r2);

    // stream events
    let idx = 0;
    const allEvents = r1.events;
    const tick = () => {
      idx++;
      setLogIdx(idx);
      setElapsed(e => e + 1800);
      if (idx < allEvents.length) {
        timerRef.current = setTimeout(tick, 220);
      } else {
        setRunning(false);
      }
    };
    timerRef.current = setTimeout(tick, 220);
  }, [crewCount, threatType, threatIntensity, showBothShips, thresholds]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logIdx]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const ship1 = SHIPS.find(s => s.id === selectedShip);
  const ship2 = SHIPS.find(s => s.id === secondShip);

  const eventTypeStyle = {
    start: "text-cyan-300",
    info: "text-slate-300",
    warn: "text-amber-300",
    critical: "text-red-400",
    med: "text-emerald-300",
  };

  const formatElapsed = (ms) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `T+${String(m).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;
  };

  return (
    <div className="min-h-screen bg-[#020608] text-white">
      {/* ── Header ── */}
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
                C2 Readiness simulation for Commanding Officers and Medical Officers. Configure threat scenario, crew complement, and minimum viable thresholds — then run the exercise.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-[10px] font-mono text-slate-500 tracking-widest">SOVEREIGN MESH // OrcaWolf AI</span>
              {result && <ThreatBadge level={result.threatLevel} />}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Configuration panel ── */}
        <section aria-labelledby="config-heading" className="bg-[#040d17] border border-cyan-900/30 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 id="config-heading" className="text-cyan-400 font-mono font-bold text-sm tracking-widest uppercase">Exercise Configuration</h2>
            <button
              onClick={() => setShowThresholds(v => !v)}
              className="text-xs px-3 py-1.5 rounded border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-700 transition-colors"
            >
              {showThresholds ? "Hide" : "Set"} Minimum Viable Thresholds
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Ship 1 */}
            <div>
              <label htmlFor="ship1" className="block text-xs text-slate-400 mb-1.5 font-medium">Primary Vessel</label>
              <select
                id="ship1"
                value={selectedShip}
                onChange={e => setSelectedShip(e.target.value)}
                className="w-full bg-[#0a1628] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {SHIPS.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.hull})</option>
                ))}
              </select>
            </div>

            {/* Ship 2 toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="ship2" className="text-xs text-slate-400 font-medium">Secondary Vessel</label>
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBothShips}
                    onChange={e => setShowBothShips(e.target.checked)}
                    className="w-3.5 h-3.5 accent-cyan-400"
                  />
                  Enable
                </label>
              </div>
              <select
                id="ship2"
                value={secondShip}
                onChange={e => setSecondShip(e.target.value)}
                disabled={!showBothShips}
                className="w-full bg-[#0a1628] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 disabled:opacity-40"
              >
                {SHIPS.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.hull})</option>
                ))}
              </select>
            </div>

            {/* Crew complement */}
            <div>
              <label htmlFor="crew" className="block text-xs text-slate-400 mb-1.5 font-medium">
                Crew Complement — <span className="text-cyan-300 font-mono">{crewCount.toLocaleString()}</span>
              </label>
              <select
                id="crew"
                value={crewCount}
                onChange={e => setCrewCount(Number(e.target.value))}
                className="w-full bg-[#0a1628] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value={500}>Command Element Only (500)</option>
                <option value={1500}>Medical + C2 Staff (1,500)</option>
                <option value={3000}>Half Complement (3,000)</option>
                <option value={4500}>Reduced Crew (4,500)</option>
                <option value={6000}>Full Complement (6,000)</option>
              </select>
            </div>

            {/* Threat type */}
            <div className="md:col-span-2 lg:col-span-2">
              <fieldset>
                <legend className="text-xs text-slate-400 mb-2 font-medium">Threat Scenario</legend>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {THREAT_TYPES.map(t => (
                    <label
                      key={t.id}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border cursor-pointer transition-all text-center ${
                        threatType === t.id
                          ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                          : "border-slate-700 bg-[#0a1628] text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="threat"
                        value={t.id}
                        checked={threatType === t.id}
                        onChange={() => setThreatType(t.id)}
                        className="sr-only"
                      />
                      <span className="text-xl" aria-hidden="true">{t.icon}</span>
                      <span className="text-[10px] font-medium leading-tight">{t.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* Threat intensity */}
            <div>
              <label htmlFor="intensity" className="block text-xs text-slate-400 mb-1.5 font-medium">
                Threat Intensity — <span className="text-red-400 font-mono font-bold">{threatIntensity}%</span>
              </label>
              <input
                id="intensity"
                type="range"
                min={10}
                max={100}
                value={threatIntensity}
                onChange={e => setThreatIntensity(Number(e.target.value))}
                className="w-full accent-red-500"
              />
              <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                <span>Probe</span><span>Moderate</span><span>Maximum</span>
              </div>
            </div>
          </div>

          {/* Thresholds panel */}
          {showThresholds && (
            <div className="border-t border-slate-800 pt-5">
              <p className="text-xs text-slate-400 mb-4">Set minimum viable thresholds (%) — alerts trigger when readiness falls below these levels.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(thresholds).map(([key, val]) => (
                  <div key={key}>
                    <label htmlFor={`thr-${key}`} className="block text-[10px] text-slate-500 mb-1 capitalize">{key.replace(/_/g, " ")}</label>
                    <div className="flex items-center gap-2">
                      <input
                        id={`thr-${key}`}
                        type="number"
                        min={0}
                        max={100}
                        value={val}
                        onChange={e => setThresholds(t => ({ ...t, [key]: Number(e.target.value) }))}
                        className="w-16 bg-[#0a1628] border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                      <span className="text-xs text-slate-600">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Run button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleRun}
              disabled={running}
              className="px-10 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-[#020608] font-bold text-sm tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] disabled:shadow-none"
            >
              {running ? "⟳ EXERCISE RUNNING…" : "▶ RUN READINESS EXERCISE"}
            </button>
          </div>
        </section>

        {/* ── Results ── */}
        {result && (
          <div className="space-y-8 animate-[fadeInUp_0.4s_ease_both]">

            {/* Ship comparison row */}
            <div className={`grid gap-6 ${showBothShips && result2 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
              {[{ ship: ship1, res: result }, ...(showBothShips && result2 ? [{ ship: ship2, res: result2 }] : [])].map(({ ship, res }) => (
                <section key={ship.id} aria-labelledby={`ship-${ship.id}`} className="bg-[#040d17] border border-cyan-900/30 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                    <div>
                      <h2 id={`ship-${ship.id}`} className="font-display text-xl font-bold text-white">{ship.name}</h2>
                      <p className="text-slate-500 text-xs font-mono">{ship.hull} · {ship.type} · {crewCount.toLocaleString()} crew</p>
                    </div>
                    <ThreatBadge level={res.threatLevel} />
                  </div>

                  {/* Overall score */}
                  <div className="flex items-center gap-4 mb-6 p-4 rounded-lg bg-[#0a1628] border border-slate-800">
                    <div className="text-5xl font-mono font-bold" style={{ color: res.overall >= 75 ? "#22d3ee" : res.overall >= 55 ? "#f59e0b" : "#ef4444" }}>
                      {Math.round(res.overall)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Overall Readiness Score</div>
                      <div className="text-xs text-slate-400">Combat-Effective Threshold: 75 | Current: {res.overall >= 75 ? "✓ MET" : "✗ NOT MET"}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Casualties: <span className="text-red-400">{res.cas} total</span> · KIA: <span className="text-red-600">{res.kia}</span> · IMM: <span className="text-red-400">{res.immediate}</span> · DEL: <span className="text-amber-400">{res.delayed}</span> · MIN: <span className="text-emerald-400">{res.minimal}</span>
                      </div>
                    </div>
                  </div>

                  {/* Medical readiness dials */}
                  <div className="mb-5">
                    <h3 className="text-xs font-mono text-emerald-400 tracking-widest uppercase mb-3">Medical Readiness</h3>
                    <div className="grid grid-cols-4 gap-2 justify-items-center">
                      <RadialDial value={res.medMetrics.medical_readiness} label="Medical Readiness" thresholds={{ red: thresholds.medical_readiness, yellow: thresholds.medical_readiness + 15 }} />
                      <RadialDial value={res.medMetrics.surgical_capacity} label="Surgical Capacity" thresholds={{ red: thresholds.surgical_capacity, yellow: thresholds.surgical_capacity + 15 }} />
                      <RadialDial value={res.medMetrics.blood_supply} label="Blood Supply" thresholds={{ red: thresholds.blood_supply, yellow: thresholds.blood_supply + 15 }} />
                      <RadialDial value={res.medMetrics.pharmacy} label="Pharmacy / Formulary" thresholds={{ red: thresholds.pharmacy, yellow: thresholds.pharmacy + 15 }} />
                      <RadialDial value={res.medMetrics.personnel_fit} label="Personnel Fitness" thresholds={{ red: thresholds.personnel_fit, yellow: thresholds.personnel_fit + 10 }} />
                      <RadialDial value={res.medMetrics.mental_health} label="Mental Health / PTSD" thresholds={{ red: 40, yellow: 60 }} />
                      <RadialDial value={res.medMetrics.preventive_med} label="Preventive Medicine" thresholds={{ red: 50, yellow: 65 }} />
                      <RadialDial value={res.medMetrics.dental_readiness} label="Dental Readiness" thresholds={{ red: 60, yellow: 75 }} />
                    </div>
                  </div>

                  {/* LOD readiness dials */}
                  <div className="mb-5">
                    <h3 className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-3">Line-of-Duty Readiness</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 justify-items-center">
                      <RadialDial value={res.lodMetrics.watchstation_fill} label="Watch Station Fill" thresholds={{ red: thresholds.watchstation_fill, yellow: thresholds.watchstation_fill + 10 }} />
                      <RadialDial value={res.lodMetrics.dc_certification} label="DC Certification" thresholds={{ red: thresholds.dc_certification, yellow: thresholds.dc_certification + 10 }} />
                      <RadialDial value={res.lodMetrics.flight_deck_crew} label="Flight Deck Crew" thresholds={{ red: thresholds.flight_deck_crew, yellow: thresholds.flight_deck_crew + 10 }} />
                      <RadialDial value={res.lodMetrics.battle_station_assign} label="Battle Station Assign" thresholds={{ red: 70, yellow: 82 }} />
                      <RadialDial value={res.lodMetrics.watch_qual} label="Watch Qualifications" thresholds={{ red: 60, yellow: 75 }} />
                      <RadialDial value={res.lodMetrics.damage_ctrl_ready} label="Damage Control Ready" thresholds={{ red: thresholds.dc_certification, yellow: thresholds.dc_certification + 10 }} />
                    </div>
                  </div>

                  {/* Department bar chart */}
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
              <div
                ref={logRef}
                className="h-72 overflow-y-auto space-y-1.5 font-mono text-xs bg-[#020608] rounded-lg p-4 border border-slate-800"
                aria-live="polite"
                aria-label="Exercise event log"
              >
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

            {/* Reset */}
            <div className="flex justify-center">
              <button
                onClick={() => { setResult(null); setResult2(null); setLogIdx(0); setElapsed(0); }}
                className="px-6 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-700 text-sm transition-colors"
              >
                ↺ Reset Exercise
              </button>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-center text-xs text-slate-600 pb-4">
          UNCLASSIFIED // FOR EXERCISE USE ONLY · This simulation demonstrates sovereign AI EHR mesh capabilities · OrcaWolf AI · orcawolfai.com
        </p>
      </div>
    </div>
  );
}
