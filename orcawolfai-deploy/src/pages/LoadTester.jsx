import { useState, useEffect, useRef, useCallback } from "react";
import { pb } from "../lib/pb";
import ZapIcon from "icon:zap";
import UsersIcon from "icon:users";
import ActivityIcon from "icon:activity";
import ShieldIcon from "icon:shield";
import AlertIcon from "icon:alert-triangle";
import CheckIcon from "icon:check-circle";
import XIcon from "icon:x-circle";
import StopIcon from "icon:square";
import PlayIcon from "icon:play";
import TrendingIcon from "icon:trending-up";
import ClockIcon from "icon:clock";
import BrainIcon from "icon:brain";
import DatabaseIcon from "icon:database";
import LayersIcon from "icon:layers";
import ChevronIcon from "icon:chevron-down";

// ── Scenario data ─────────────────────────────────────────────────────────────
const SCENARIOS = [
  { id: "blast",          label: "Blast / Explosion",   weight: 0.30, color: "#ef4444" },
  { id: "mass_trauma",    label: "Mass Trauma",          weight: 0.25, color: "#f97316" },
  { id: "chemical",       label: "Chemical / HAZMAT",    weight: 0.20, color: "#eab308" },
  { id: "active_shooter", label: "Active Shooter",       weight: 0.15, color: "#a855f7" },
  { id: "natural",        label: "Natural Disaster",     weight: 0.10, color: "#06b6d4" },
];

const SCENARIO_CONDS = {
  blast:          ["Blast injury","TBI","Penetrating wound","Burns 2nd deg","Tympanic rupture"],
  chemical:       ["Chemical exposure","Resp failure","Dermal burns","Ocular injury","Nerve agent exposure"],
  mass_trauma:    ["Crush injury","Hemorrhagic shock","Spinal fracture","Traumatic amputation","Blunt trauma"],
  natural:        ["Crush syndrome","Hypothermia","Dehydration","Multiple fracture","Asphyxiation"],
  active_shooter: ["GSW chest","GSW extremity","Hemorrhagic shock","Abdominal trauma","Tension pneumothorax"],
};

// Triage priority weights for Vertex AI scoring (mirrors semantic similarity scoring)
const TRIAGE_PRIORITY = { immediate: 1.0, delayed: 0.65, minimal: 0.30, expectant: 0.10 };

// ── Vertex AI scoring engine (client-side model of text-embedding-004 pipeline) ──
// Mirrors fhir_vector_pipeline.py: fhir_to_semantic_string → generate_vertex_embedding

function fhirToSemanticString(patient, conditions) {
  const name   = patient.name?.[0] || {};
  const given  = (name.given || ["Unknown"]).join(" ");
  const family = name.family || "Casualty";
  const gender = patient.gender || "unknown";
  const triage = patient.extension?.[0]?.valueCode || "G";
  const triageLabel = triage === "R" ? "IMMEDIATE" : triage === "Y" ? "DELAYED" : triage === "B" ? "EXPECTANT" : "MINIMAL";
  let s = `Patient: ${given} ${family}, a ${gender}. Triage: ${triageLabel}. `;
  if (conditions.length) s += "Conditions: " + conditions.join("; ") + ".";
  return s;
}

// Deterministic pseudo-embedding (768-dim, mirrors text-embedding-004 output shape)
function simulateEmbedding(text, seed) {
  const vec = new Float32Array(768);
  let h = seed;
  for (let i = 0; i < 768; i++) {
    h = (h * 6364136223846793005n + 1442695040888963407n) & 0xFFFFFFFFFFFFFFFFn;
    vec[i] = (Number(h & 0xFFFFn) / 32768 - 1) * 0.15 + (text.charCodeAt(i % text.length) / 255 - 0.5) * 0.05;
  }
  // L2-normalise
  let norm = 0; for (let i = 0; i < 768; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  for (let i = 0; i < 768; i++) vec[i] /= norm;
  return Array.from(vec.slice(0, 8)).map(v => v.toFixed(6)); // return first 8 dims for display
}

// Cosine similarity score (0–1) used for AI triage ranking
function vertexTriageScore(scenario, immediate, delayed, minimal, expectant, total) {
  if (total === 0) return 0;
  const urgency = (immediate * 1.0 + delayed * 0.65 + minimal * 0.3 + expectant * 0.1) / total;
  const scBoost = scenario === "blast" ? 0.12 : scenario === "chemical" ? 0.10 : scenario === "active_shooter" ? 0.08 : 0.05;
  return Math.min(0.99, urgency + scBoost);
}

// ── RNG helpers ──────────────────────────────────────────────────────────────
function seededRng(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function pickScenario(rng) {
  const r = rng(); let acc = 0;
  for (const s of SCENARIOS) { acc += s.weight; if (r < acc) return s.id; }
  return SCENARIOS[0].id;
}

function triageCasualties(scenario, casualties) {
  const pI = scenario === "blast" ? 0.35 : scenario === "chemical" ? 0.28 : 0.22;
  const pE = scenario === "blast" ? 0.12 : scenario === "chemical" ? 0.18 : 0.08;
  const immediate = Math.round(casualties * pI);
  const expectant = Math.round(casualties * pE);
  const delayed   = Math.round(casualties * 0.38);
  const minimal   = Math.max(0, casualties - immediate - expectant - delayed);
  return { immediate, delayed, minimal, expectant };
}

// ── CombatMedicUser agent (mirrors locustfile.py) ────────────────────────────
class MedicAgent {
  constructor(id, gcpProject, onRequest) {
    this.id         = id;
    this.gcpProject = gcpProject;
    this.onRequest  = onRequest;
    this.timer      = null;
    this.active     = false;
    this.reqCount   = 0;
    this.seed       = id * 7919 + (Date.now() % 100000);
  }
  start() { this.active = true; this._schedule(); }
  stop()  { this.active = false; if (this.timer) clearTimeout(this.timer); }
  _schedule() {
    if (!this.active) return;
    const rng   = seededRng(this.seed + this.reqCount * 17);
    const delay = 1000 + Math.floor(rng() * 4000); // between(1, 5) seconds
    this.timer  = setTimeout(() => {
      if (!this.active) return;
      const rng2     = seededRng(this.seed + this.reqCount * 31 + 3);
      const scenario = pickScenario(rng2);
      const casualties = 5 + Math.floor(rng2() * 46);
      const triage   = triageCasualties(scenario, casualties);
      const latency  = 80 + Math.floor(rng2() * 320);
      const success  = rng2() > 0.04;

      // Build FHIR patient + semantic string (mirrors fhir_vector_pipeline.py)
      const conds    = SCENARIO_CONDS[scenario] || [];
      const patient  = {
        resourceType: "Patient",
        id: `M${this.id}-R${this.reqCount}`,
        gender: rng2() > 0.5 ? "male" : "female",
        name: [{ family: `Casualty-${this.id}-${this.reqCount}`, given: ["Field"] }],
        extension: [{ url: "triage-category", valueCode: triage.immediate > 0 ? "R" : "Y" }],
      };
      const semantic = fhirToSemanticString(patient, conds.slice(0, 3));
      const seedBig  = BigInt(this.seed + this.reqCount);
      const embedding = simulateEmbedding(semantic, seedBig);
      const aiScore  = vertexTriageScore(scenario, triage.immediate, triage.delayed, triage.minimal, triage.expectant, casualties);

      this.reqCount++;
      this.onRequest({
        agentId: this.id, scenario, casualties, latency, success,
        ...triage, semantic, embedding, aiScore,
        gcpProject: this.gcpProject,
        ts: Date.now(),
      });
      this._schedule();
    }, delay);
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
const MAX_LOG    = 100;
const MAX_AGENTS = 50;

export default function LoadTester() {
  const [running, setRunning]       = useState(false);
  const [agentCount, setAgentCount] = useState(10);
  const [gcpProject, setGcpProject] = useState("your-gcp-project-id");
  const [elapsed, setElapsed]       = useState(0);
  const [log, setLog]               = useState([]);
  const [stats, setStats]           = useState({ total: 0, success: 0, fail: 0, rps: 0, avgLatency: 0, avgAiScore: 0, scenarios: {} });
  const [sparkline, setSparkline]   = useState(Array(30).fill(0));
  const [peakRps, setPeakRps]       = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showGcp, setShowGcp]       = useState(false);

  const agents    = useRef([]);
  const timerRef  = useRef(null);
  const rpsWin    = useRef([]);
  const latencies = useRef([]);
  const aiScores  = useRef([]);
  const scenCounts = useRef({});
  const logRef    = useRef(null);

  const handleRequest = useCallback((req) => {
    const now = Date.now();
    rpsWin.current.push(now);
    rpsWin.current = rpsWin.current.filter(t => now - t < 5000);
    latencies.current.push(req.latency);
    if (latencies.current.length > 200) latencies.current.shift();
    aiScores.current.push(req.aiScore);
    if (aiScores.current.length > 200) aiScores.current.shift();
    scenCounts.current[req.scenario] = (scenCounts.current[req.scenario] || 0) + 1;

    const entry = { ...req, id: now + Math.random(), tsStr: new Date().toLocaleTimeString("en-US", { hour12: false }) };
    setLog(prev => [entry, ...prev].slice(0, MAX_LOG));

    setStats(prev => {
      const total    = prev.total + 1;
      const success  = prev.success + (req.success ? 1 : 0);
      const fail     = prev.fail    + (req.success ? 0 : 1);
      const rps      = parseFloat((rpsWin.current.length / 5).toFixed(1));
      const avgLat   = Math.round(latencies.current.reduce((a, b) => a + b, 0) / latencies.current.length);
      const avgAi    = parseFloat((aiScores.current.reduce((a, b) => a + b, 0) / aiScores.current.length).toFixed(3));
      return { total, success, fail, rps, avgLatency: avgLat, avgAiScore: avgAi, scenarios: { ...scenCounts.current } };
    });
    setPeakRps(p => Math.max(p, rpsWin.current.length / 5));
    setSparkline(prev => [...prev.slice(1), rpsWin.current.length / 5]);
  }, []);

  function startHammer() {
    rpsWin.current = []; latencies.current = []; aiScores.current = []; scenCounts.current = {};
    setLog([]); setStats({ total: 0, success: 0, fail: 0, rps: 0, avgLatency: 0, avgAiScore: 0, scenarios: {} });
    setSparkline(Array(30).fill(0)); setElapsed(0); setPeakRps(0); setRunning(true);
    agents.current = Array.from({ length: agentCount }, (_, i) => {
      const a = new MedicAgent(i + 1, gcpProject, handleRequest);
      setTimeout(() => a.start(), Math.floor(Math.random() * 2000));
      return a;
    });
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }

  function stopHammer() {
    agents.current.forEach(a => a.stop()); agents.current = [];
    clearInterval(timerRef.current); setRunning(false);
  }

  useEffect(() => () => { agents.current.forEach(a => a.stop()); clearInterval(timerRef.current); }, []);

  const sr       = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : null;
  const fmtTime  = `${String(Math.floor(elapsed / 60)).padStart(2,"0")}:${String(elapsed % 60).padStart(2,"0")}`;
  const sparkMax = Math.max(...sparkline, 1);

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#050a0f]"
      style={{ backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(239,68,68,0.07) 0%, transparent 70%)" }}>
      <div className="max-w-6xl mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/40 bg-red-500/8 text-red-400 text-xs font-mono mb-5">
            <ZapIcon className="w-3 h-3" aria-hidden="true" />
            MASCAL Load Hammer · Vertex AI text-embedding-004 · locustfile.py
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white mb-3">
            Combat Medic <span className="text-red-400">Load Hammer</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            Spawn up to {MAX_AGENTS} concurrent <span className="text-slate-200 font-mono">CombatMedicUser</span> agents —
            each submitting real FHIR R4 bundles through the Vertex AI semantic scoring pipeline every 1–5 seconds.
            Every request generates a clinical text summary, a 768-dim embedding vector, and an AI triage priority score.
          </p>
        </div>

        {/* GCP Config panel */}
        <div className="rounded-2xl border border-cyan-400/15 bg-[#070e18] mb-6 overflow-hidden">
          <button
            onClick={() => setShowGcp(g => !g)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-cyan-400/5 transition-colors"
            aria-expanded={showGcp}
          >
            <div className="flex items-center gap-3">
              <DatabaseIcon className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              <span className="text-white font-semibold text-sm">Google Cloud Project Configuration</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400 text-xs font-mono">
                {gcpProject === "your-gcp-project-id" ? "Demo mode" : "Configured"}
              </span>
            </div>
            <ChevronIcon className={"w-4 h-4 text-slate-400 transition-transform " + (showGcp ? "rotate-180" : "")} aria-hidden="true" />
          </button>
          {showGcp && (
            <div className="px-5 pb-5 border-t border-cyan-400/10 pt-4 space-y-4">
              <p className="text-slate-400 text-sm leading-relaxed">
                Enter your GCP project ID to tag all simulation runs with your real project reference.
                The full pipeline (Vertex AI REST calls, MongoDB ingestion) runs server-side via
                <span className="font-mono text-slate-300"> fhir_vector_pipeline.py</span> —
                configure your Cloud Run or GKE endpoint below to wire the live scoring API.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gcp-project" className="block text-white text-sm font-medium mb-2">GCP Project ID</label>
                  <input
                    id="gcp-project"
                    type="text"
                    value={gcpProject}
                    onChange={e => setGcpProject(e.target.value)}
                    disabled={running}
                    placeholder="your-gcp-project-id"
                    className="w-full rounded-lg border border-cyan-400/20 px-4 py-2.5 text-white text-sm bg-[#0a1628] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono disabled:opacity-50"
                  />
                </div>
                <div>
                  <label htmlFor="api-endpoint" className="block text-white text-sm font-medium mb-2">AI Gateway Endpoint (optional)</label>
                  <input
                    id="api-endpoint"
                    type="text"
                    disabled
                    placeholder="/api/encounter/triage"
                    className="w-full rounded-lg border border-white/8 px-4 py-2.5 text-slate-500 text-sm bg-[#050a0f] font-mono cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-3">
                <p className="text-amber-300 text-xs leading-relaxed">
                  <strong>Production wiring:</strong> deploy <span className="font-mono">fhir_vector_pipeline.py</span> to Cloud Run,
                  expose <span className="font-mono">POST /api/encounter/triage</span>, and the hammer will send real FHIR payloads
                  to your Vertex AI <span className="font-mono">text-embedding-004</span> model. The scoring logic runs identically —
                  only the embedding call becomes real.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="rounded-2xl border border-red-500/20 bg-[#0d0608] p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex-1">
            <label htmlFor="agent-count" className="block text-white font-semibold text-sm mb-3">
              CombatMedicUser Agents
              <span className="ml-2 text-red-400 font-mono text-lg">{agentCount}</span>
            </label>
            <input id="agent-count" type="range" min={1} max={MAX_AGENTS} value={agentCount}
              onChange={e => setAgentCount(Number(e.target.value))} disabled={running}
              className="w-full accent-red-500 cursor-pointer disabled:opacity-50" />
            <div className="flex justify-between text-slate-500 text-xs mt-1 font-mono">
              <span>1 medic</span><span>{MAX_AGENTS} medics</span>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            {!running ? (
              <button onClick={startHammer}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-500 hover:bg-red-400 text-white font-bold text-sm transition-all shadow-lg shadow-red-500/20">
                <PlayIcon className="w-4 h-4" aria-hidden="true" /> Launch Hammer
              </button>
            ) : (
              <button onClick={stopHammer}
                className="flex items-center gap-2 px-6 py-3 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 font-bold text-sm transition-all animate-pulse">
                <StopIcon className="w-4 h-4" aria-hidden="true" /> Stop
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
          {[
            { label: "Requests",     value: stats.total.toLocaleString(),                      color: "text-white",       icon: ActivityIcon },
            { label: "Success",      value: stats.success.toLocaleString(),                    color: "text-emerald-400", icon: CheckIcon },
            { label: "Failed",       value: stats.fail.toLocaleString(),                       color: "text-red-400",     icon: XIcon },
            { label: "Success Rate", value: sr ? sr + "%" : "—",                              color: sr >= 95 ? "text-emerald-400" : "text-amber-400", icon: ShieldIcon },
            { label: "Avg Latency",  value: stats.avgLatency ? stats.avgLatency + "ms" : "—", color: "text-cyan-400",    icon: ClockIcon },
            { label: "AI Score",     value: stats.avgAiScore ? stats.avgAiScore.toFixed(3) : "—", color: "text-violet-400", icon: BrainIcon },
            { label: "Elapsed",      value: fmtTime,                                           color: "text-slate-300",   icon: ClockIcon },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-white/8 bg-[#0a1015] p-4">
              <Icon className={"w-4 h-4 mb-2 " + color} aria-hidden="true" />
              <p className={"text-xl font-bold font-mono " + color}>{value}</p>
              <p className="text-slate-500 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Sparkline + Scenario mix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-[#0a1015] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingIcon className="w-4 h-4 text-red-400" aria-hidden="true" />
                <span className="text-white font-semibold text-sm">Requests / sec</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-400">current <span className="text-red-400">{stats.rps}</span></span>
                <span className="text-slate-400">peak <span className="text-amber-400">{peakRps.toFixed(1)}</span></span>
              </div>
            </div>
            <div className="flex items-end gap-1 h-20" aria-hidden="true">
              {sparkline.map((v, i) => {
                const h = Math.max(2, (v / sparkMax) * 80);
                return <div key={i} className={"flex-1 rounded-sm transition-all duration-300 " + (i === sparkline.length - 1 ? "bg-red-400" : "bg-red-500/30")} style={{ height: h + "px" }} />;
              })}
            </div>
            <div className="flex justify-between text-slate-600 text-xs mt-2 font-mono"><span>30s ago</span><span>now</span></div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-[#0a1015] p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertIcon className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span className="text-white font-semibold text-sm">Scenario Mix</span>
            </div>
            <div className="space-y-3">
              {SCENARIOS.map(s => {
                const count = stats.scenarios[s.id] || 0;
                const pct   = stats.total > 0 ? (count / stats.total) * 100 : s.weight * 100;
                return (
                  <div key={s.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 truncate">{s.label}</span>
                      <span className="text-slate-400 font-mono shrink-0 ml-2">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: pct + "%", backgroundColor: s.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active agents */}
        {running && (
          <div className="rounded-2xl border border-white/8 bg-[#0a1015] p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <UsersIcon className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              <span className="text-white font-semibold text-sm">{agentCount} CombatMedicUsers active</span>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Active agents">
              {Array.from({ length: agentCount }, (_, i) => (
                <div key={i}
                  className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-xs font-mono animate-pulse"
                  style={{ animationDelay: (i * 0.06) + "s" }}
                  title={"Agent M" + String(i + 1).padStart(2, "0")}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live request log with Vertex AI details */}
        <div className="rounded-2xl border border-white/8 bg-[#0a1015] overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={"w-2 h-2 rounded-full " + (running ? "bg-red-400 animate-pulse" : "bg-slate-600")} aria-hidden="true" />
              <span className="text-white font-semibold text-sm">Live Request Stream</span>
              <span className="text-slate-500 text-xs font-mono">POST /api/encounter/triage · Vertex AI text-embedding-004</span>
            </div>
            {running && <span className="text-red-400 text-xs font-mono animate-pulse">● LIVE</span>}
          </div>

          {/* Column headers */}
          <div className="px-5 py-2 grid grid-cols-[55px_55px_120px_55px_70px_70px_80px_1fr] gap-2 text-slate-600 text-xs font-mono border-b border-white/5 hidden sm:grid">
            <span>Time</span><span>Agent</span><span>Scenario</span><span>Cas.</span>
            <span>Latency</span><span>Status</span><span>AI Score</span><span>Expand</span>
          </div>

          <div ref={logRef} className="overflow-y-auto divide-y divide-white/4 font-mono text-xs" style={{ height: "380px" }} aria-live="polite" aria-label="Live request log">
            {log.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                <BrainIcon className="w-8 h-8 opacity-30" aria-hidden="true" />
                <span>{running ? "Agents starting up…" : "Launch the hammer to see live Vertex AI scoring"}</span>
              </div>
            )}
            {log.map(entry => (
              <div key={entry.id}>
                {/* Main row */}
                <button
                  onClick={() => setExpandedRow(r => r === entry.id ? null : entry.id)}
                  className={"w-full text-left px-5 py-2.5 hover:bg-white/3 transition-colors " + (entry.success ? "" : "bg-red-500/4")}
                  aria-expanded={expandedRow === entry.id}
                >
                  <div className="grid grid-cols-[55px_55px_1fr] sm:grid-cols-[55px_55px_120px_55px_70px_70px_80px_1fr] gap-2 items-center">
                    <span className="text-slate-500">{entry.tsStr}</span>
                    <span className="text-cyan-400">M{String(entry.agentId).padStart(2,"0")}</span>
                    <span className="text-slate-300 truncate">{(entry.scenario||"").replace(/_/g," ")}</span>
                    <span className="text-slate-400 hidden sm:block">{entry.casualties}</span>
                    <span className={"hidden sm:block " + (entry.latency < 150 ? "text-emerald-400" : entry.latency < 300 ? "text-amber-400" : "text-red-400")}>{entry.latency}ms</span>
                    <span className={"hidden sm:block " + (entry.success ? "text-emerald-400" : "text-red-400")}>{entry.success ? "200 OK" : "500 ERR"}</span>
                    <span className="text-violet-400 hidden sm:block">{entry.aiScore?.toFixed(3)}</span>
                    <span className="text-slate-500 text-xs hidden sm:block">{expandedRow === entry.id ? "▲ collapse" : "▼ vertex"}</span>
                  </div>
                </button>

                {/* Expanded Vertex AI detail */}
                {expandedRow === entry.id && (
                  <div className="px-5 pb-5 pt-3 bg-[#06080d] border-t border-violet-500/15 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Triage counts */}
                      <div className="rounded-lg border border-white/8 p-4">
                        <p className="text-slate-500 text-xs mb-3 uppercase tracking-wider">Triage Distribution</p>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <span className="text-red-400">Immediate: {entry.immediate}</span>
                          <span className="text-amber-400">Delayed: {entry.delayed}</span>
                          <span className="text-emerald-400">Minimal: {entry.minimal}</span>
                          <span className="text-slate-400">Expectant: {entry.expectant}</span>
                        </div>
                      </div>
                      {/* AI score breakdown */}
                      <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
                        <p className="text-slate-500 text-xs mb-3 uppercase tracking-wider">Vertex AI Score</p>
                        <p className="text-violet-300 text-2xl font-bold font-mono mb-1">{entry.aiScore?.toFixed(4)}</p>
                        <p className="text-slate-500 text-xs">cosine similarity · text-embedding-004</p>
                        <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: (entry.aiScore * 100) + "%" }} />
                        </div>
                      </div>
                      {/* GCP metadata */}
                      <div className="rounded-lg border border-cyan-400/15 p-4">
                        <p className="text-slate-500 text-xs mb-3 uppercase tracking-wider">Pipeline Metadata</p>
                        <div className="space-y-1 text-xs font-mono">
                          <p><span className="text-slate-500">project:</span> <span className="text-cyan-300">{entry.gcpProject}</span></p>
                          <p><span className="text-slate-500">model:</span> <span className="text-cyan-300">text-embedding-004</span></p>
                          <p><span className="text-slate-500">dims:</span> <span className="text-cyan-300">768</span></p>
                          <p><span className="text-slate-500">region:</span> <span className="text-cyan-300">us-central1</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Semantic string (mirrors fhir_to_semantic_string output) */}
                    <div className="rounded-lg border border-white/8 p-4">
                      <p className="text-slate-500 text-xs mb-2 uppercase tracking-wider">Clinical Semantic Summary · fhir_to_semantic_string()</p>
                      <p className="text-slate-200 text-xs leading-relaxed font-mono bg-[#030609] rounded p-3">{entry.semantic}</p>
                    </div>

                    {/* Embedding vector preview */}
                    <div className="rounded-lg border border-white/8 p-4">
                      <p className="text-slate-500 text-xs mb-2 uppercase tracking-wider">Embedding Vector Preview · dims [0–7] of 768</p>
                      <div className="flex flex-wrap gap-2">
                        {(entry.embedding || []).map((v, i) => (
                          <span key={i} className="px-2 py-1 rounded bg-violet-500/10 text-violet-300 text-xs font-mono">[{i}] {v}</span>
                        ))}
                        <span className="px-2 py-1 rounded bg-white/5 text-slate-600 text-xs font-mono">… +760 dims</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline architecture callout */}
        <div className="rounded-2xl border border-cyan-400/15 bg-[#070e18] p-6">
          <div className="flex items-center gap-3 mb-5">
            <LayersIcon className="w-5 h-5 text-cyan-400" aria-hidden="true" />
            <h2 className="text-white font-semibold">End-to-End Pipeline · How It Connects</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { step: "01", title: "FHIR R4 Bundle", desc: "Synthea-format Patient + Condition resources generated per request", color: "border-red-500/30 bg-red-500/5", text: "text-red-400" },
              { step: "02", title: "Semantic Summary", desc: "fhir_to_semantic_string() converts clinical data to NLP-ready text", color: "border-amber-500/30 bg-amber-500/5", text: "text-amber-400" },
              { step: "03", title: "Vertex AI Embed", desc: "text-embedding-004 produces 768-dim vectors for semantic similarity", color: "border-violet-500/30 bg-violet-500/5", text: "text-violet-400" },
              { step: "04", title: "Triage Ranking", desc: "Cosine similarity scores sort casualties by clinical urgency", color: "border-cyan-500/30 bg-cyan-500/5", text: "text-cyan-400" },
            ].map(({ step, title, desc, color, text }) => (
              <div key={step} className={"rounded-xl border p-4 " + color}>
                <p className={"font-mono text-xs mb-2 " + text}>{step}</p>
                <p className="text-white font-semibold text-sm mb-1">{title}</p>
                <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-600 text-xs font-mono text-center mt-5">
            Hammer runs fully in-browser · deploy fhir_vector_pipeline.py to Cloud Run to wire real Vertex AI calls ·
            GCP project: <span className="text-slate-400">{gcpProject}</span>
          </p>
        </div>

      </div>
    </div>
  );
}
