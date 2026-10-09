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

// ── Scenario payloads (mirrors locustfile.py CombatMedicUser) ─────────────────
const SCENARIOS = [
  { id: "blast",         label: "Blast / Explosion",       weight: 0.30 },
  { id: "mass_trauma",   label: "Mass Trauma",              weight: 0.25 },
  { id: "chemical",      label: "Chemical / HAZMAT",        weight: 0.20 },
  { id: "active_shooter",label: "Active Shooter",           weight: 0.15 },
  { id: "natural",       label: "Natural Disaster",         weight: 0.10 },
];

const SCENARIO_CONDS = {
  blast:         ["Blast injury","TBI","Penetrating wound","Burns 2nd deg","Tympanic rupture"],
  chemical:      ["Chemical exposure","Resp failure","Dermal burns","Ocular injury","Nerve agent"],
  mass_trauma:   ["Crush injury","Hemorrhagic shock","Spinal fracture","Amputation","Blunt trauma"],
  natural:       ["Crush syndrome","Hypothermia","Dehydration","Multiple fracture","Asphyxiation"],
  active_shooter:["GSW chest","GSW extremity","Hemorrhagic shock","Abdominal trauma","Tension pneumo"],
};

// Deterministic RNG seeded per request
function seededRng(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

// Mirrors the triage logic from Simulation.jsx / locustfile.py
function triageCasualties(scenario, casualties, rng) {
  const pI = scenario === "blast" ? 0.35 : scenario === "chemical" ? 0.28 : 0.22;
  const pE = scenario === "blast" ? 0.12 : scenario === "chemical" ? 0.18 : 0.08;
  const immediate = Math.round(casualties * pI);
  const expectant = Math.round(casualties * pE);
  const delayed   = Math.round(casualties * 0.38);
  const minimal   = casualties - immediate - expectant - delayed;
  return { immediate, delayed, minimal: Math.max(0, minimal), expectant };
}

// Pick weighted random scenario
function pickScenario(rng) {
  const r = rng();
  let acc = 0;
  for (const s of SCENARIOS) { acc += s.weight; if (r < acc) return s.id; }
  return SCENARIOS[0].id;
}

// Generate one FHIR request payload (mirrors locustfile.py)
function generatePayload(requestId, rng) {
  const scenario  = pickScenario(rng);
  const casualties = 5 + Math.floor(rng() * 46); // 5–50 per medic submission
  const { immediate, delayed, minimal, expectant } = triageCasualties(scenario, casualties, rng);
  const conds = SCENARIO_CONDS[scenario];
  const entries = Array.from({ length: Math.min(casualties, 5) }, (_, i) => ({
    resource: {
      resourceType: "Patient",
      id: `req-${requestId}-p${i}`,
      extension: [{ url: "triage-category", valueCode: i < immediate ? "R" : i < immediate + delayed ? "Y" : "G" }],
      name: [{ family: `Casualty-${requestId}-${i}`, given: ["Field"] }],
    },
  }));
  return { scenario, casualties, immediate, delayed, minimal, expectant, entries };
}

// ── Simulated CombatMedicUser agent ──────────────────────────────────────────
class MedicAgent {
  constructor(id, onRequest) {
    this.id      = id;
    this.seed    = id * 7919 + Date.now() % 10000;
    this.onRequest = onRequest;
    this.timer   = null;
    this.active  = false;
    this.reqCount = 0;
  }

  start() {
    this.active = true;
    this._schedule();
  }

  stop() {
    this.active = false;
    if (this.timer) clearTimeout(this.timer);
  }

  _schedule() {
    if (!this.active) return;
    const rng = seededRng(this.seed + this.reqCount);
    // 1–5 second wait between submissions (mirrors locustfile.py wait_time = between(1, 5))
    const delay = 1000 + Math.floor(rng() * 4000);
    this.timer = setTimeout(() => {
      if (!this.active) return;
      const rng2 = seededRng(this.seed + this.reqCount * 31);
      const payload = generatePayload(`M${this.id}-R${this.reqCount}`, rng2);
      const latency = 80 + Math.floor(rng2() * 320); // 80–400ms simulated latency
      const success = rng2() > 0.04; // 96% success rate
      this.reqCount++;
      this.onRequest({ agentId: this.id, payload, latency, success, ts: Date.now() });
      this._schedule();
    }, delay);
  }
}

// ── Component ────────────────────────────────────────────────────────────────
const MAX_LOG = 120;
const MAX_AGENTS = 50;

export default function LoadTester() {
  const [running, setRunning]         = useState(false);
  const [agentCount, setAgentCount]   = useState(10);
  const [elapsed, setElapsed]         = useState(0);
  const [log, setLog]                 = useState([]);
  const [stats, setStats]             = useState({ total: 0, success: 0, fail: 0, rps: 0, avgLatency: 0, scenarios: {} });
  const [sparkline, setSparkline]     = useState(Array(30).fill(0));
  const [peakRps, setPeakRps]         = useState(0);

  const agents      = useRef([]);
  const timerRef    = useRef(null);
  const rpsWindow   = useRef([]);   // timestamps of last N requests for RPS calc
  const latencies   = useRef([]);
  const scenarioCounts = useRef({});
  const startTime   = useRef(null);
  const logRef      = useRef(null);

  const handleRequest = useCallback(({ agentId, payload, latency, success }) => {
    const now = Date.now();
    rpsWindow.current.push(now);
    // keep only last 5 seconds for RPS
    rpsWindow.current = rpsWindow.current.filter(t => now - t < 5000);
    latencies.current.push(latency);
    if (latencies.current.length > 200) latencies.current.shift();
    scenarioCounts.current[payload.scenario] = (scenarioCounts.current[payload.scenario] || 0) + 1;

    setLog(prev => {
      const entry = {
        id: now + Math.random(),
        ts: new Date().toLocaleTimeString("en-US", { hour12: false }),
        agent: `M${String(agentId).padStart(2, "0")}`,
        scenario: payload.scenario,
        casualties: payload.casualties,
        latency,
        success,
        immediate: payload.immediate,
      };
      return [entry, ...prev].slice(0, MAX_LOG);
    });

    setStats(prev => {
      const total   = prev.total + 1;
      const success_ = prev.success + (success ? 1 : 0);
      const fail    = prev.fail    + (success ? 0 : 1);
      const rps     = parseFloat((rpsWindow.current.length / 5).toFixed(1));
      const avgLat  = Math.round(latencies.current.reduce((a, b) => a + b, 0) / latencies.current.length);
      return { total, success: success_, fail, rps, avgLatency: avgLat, scenarios: { ...scenarioCounts.current } };
    });

    setPeakRps(p => {
      const rps = parseFloat((rpsWindow.current.length / 5).toFixed(1));
      return Math.max(p, rps);
    });

    setSparkline(prev => {
      const next = [...prev.slice(1), rpsWindow.current.length / 5];
      return next;
    });
  }, []);

  function startHammer() {
    rpsWindow.current   = [];
    latencies.current   = [];
    scenarioCounts.current = {};
    startTime.current   = Date.now();
    setLog([]);
    setStats({ total: 0, success: 0, fail: 0, rps: 0, avgLatency: 0, scenarios: {} });
    setSparkline(Array(30).fill(0));
    setElapsed(0);
    setPeakRps(0);
    setRunning(true);

    agents.current = Array.from({ length: agentCount }, (_, i) => {
      const a = new MedicAgent(i + 1, handleRequest);
      // Stagger starts 0–2s so they don't all fire at once
      setTimeout(() => a.start(), Math.floor(Math.random() * 2000));
      return a;
    });

    timerRef.current = setInterval(() => {
      setElapsed(e => e + 1);
    }, 1000);
  }

  function stopHammer() {
    agents.current.forEach(a => a.stop());
    agents.current = [];
    clearInterval(timerRef.current);
    setRunning(false);
  }

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0;
  }, [log]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      agents.current.forEach(a => a.stop());
      clearInterval(timerRef.current);
    };
  }, []);

  const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : "—";
  const fmtElapsed  = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const sparkMax    = Math.max(...sparkline, 1);

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#050a0f]" style={{ backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(239,68,68,0.08) 0%, transparent 70%)" }}>
      <div className="max-w-6xl mx-auto px-4">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/40 bg-red-500/8 text-red-400 text-xs font-mono mb-5">
            <ZapIcon className="w-3 h-3" aria-hidden="true" />
            MASCAL Load Hammer · OrcaWolf AI · Mirrors locustfile.py
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white mb-3">
            Combat Medic <span className="text-red-400">Load Hammer</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Spawn up to {MAX_AGENTS} concurrent CombatMedicUser agents — each submitting random FHIR R4 trauma payloads
            every 1–5 seconds, exactly as your <span className="font-mono text-slate-300">locustfile.py</span> does in production.
            Watch the AI gateway hold under field chaos.
          </p>
        </div>

        {/* Controls */}
        <div className="rounded-2xl border border-red-500/20 bg-[#0d0608] p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex-1">
            <label htmlFor="agent-count" className="block text-white font-semibold text-sm mb-3">
              CombatMedicUser Agents
              <span className="ml-2 text-red-400 font-mono text-lg">{agentCount}</span>
            </label>
            <input
              id="agent-count"
              type="range"
              min={1}
              max={MAX_AGENTS}
              value={agentCount}
              onChange={e => setAgentCount(Number(e.target.value))}
              disabled={running}
              className="w-full accent-red-500 cursor-pointer disabled:opacity-50"
            />
            <div className="flex justify-between text-slate-500 text-xs mt-1 font-mono">
              <span>1 medic</span>
              <span>{MAX_AGENTS} medics</span>
            </div>
          </div>

          <div className="flex gap-3 shrink-0">
            {!running ? (
              <button
                onClick={startHammer}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-500 hover:bg-red-400 text-white font-bold text-sm transition-all shadow-lg shadow-red-500/20"
              >
                <PlayIcon className="w-4 h-4" aria-hidden="true" />
                Launch Hammer
              </button>
            ) : (
              <button
                onClick={stopHammer}
                className="flex items-center gap-2 px-6 py-3 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 font-bold text-sm transition-all animate-pulse"
              >
                <StopIcon className="w-4 h-4" aria-hidden="true" />
                Stop
              </button>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Requests", value: stats.total.toLocaleString(), icon: ActivityIcon, color: "text-white" },
            { label: "Success", value: stats.success.toLocaleString(), icon: CheckIcon, color: "text-emerald-400" },
            { label: "Failed", value: stats.fail.toLocaleString(), icon: XIcon, color: "text-red-400" },
            { label: "Success Rate", value: successRate === "—" ? "—" : successRate + "%", icon: ShieldIcon, color: successRate >= 95 ? "text-emerald-400" : "text-amber-400" },
            { label: "Avg Latency", value: stats.avgLatency ? stats.avgLatency + "ms" : "—", icon: ClockIcon, color: "text-cyan-400" },
            { label: "Elapsed", value: fmtElapsed, icon: ClockIcon, color: "text-slate-300" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-white/8 bg-[#0a1015] p-4">
              <Icon className={"w-4 h-4 mb-2 " + color} aria-hidden="true" />
              <p className={"text-xl font-bold font-mono " + color}>{value}</p>
              <p className="text-slate-500 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* RPS sparkline + live gauge */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Sparkline */}
          <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-[#0a1015] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingIcon className="w-4 h-4 text-red-400" aria-hidden="true" />
                <span className="text-white font-semibold text-sm">Requests / sec</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-400">current <span className="text-red-400">{stats.rps}</span></span>
                <span className="text-slate-400">peak <span className="text-amber-400">{peakRps}</span></span>
              </div>
            </div>
            {/* Sparkline bars */}
            <div className="flex items-end gap-1 h-20" aria-hidden="true">
              {sparkline.map((v, i) => {
                const h = sparkMax > 0 ? Math.max(2, (v / sparkMax) * 80) : 2;
                const isLast = i === sparkline.length - 1;
                return (
                  <div
                    key={i}
                    className={"flex-1 rounded-sm transition-all duration-300 " + (isLast ? "bg-red-400" : "bg-red-500/30")}
                    style={{ height: h + "px" }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-slate-600 text-xs mt-2 font-mono">
              <span>30s ago</span>
              <span>now</span>
            </div>
          </div>

          {/* Scenario breakdown */}
          <div className="rounded-2xl border border-white/8 bg-[#0a1015] p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertIcon className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span className="text-white font-semibold text-sm">Scenario Mix</span>
            </div>
            <div className="space-y-2">
              {SCENARIOS.map(s => {
                const count = stats.scenarios[s.id] || 0;
                const pct   = stats.total > 0 ? ((count / stats.total) * 100) : s.weight * 100;
                return (
                  <div key={s.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 truncate">{s.label}</span>
                      <span className="text-slate-400 font-mono shrink-0 ml-2">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-500"
                        style={{ width: pct + "%" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Agent status grid */}
        {running && (
          <div className="rounded-2xl border border-white/8 bg-[#0a1015] p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <UsersIcon className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              <span className="text-white font-semibold text-sm">Active Agents — {agentCount} CombatMedicUsers</span>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Active agent indicators">
              {Array.from({ length: agentCount }, (_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-xs font-mono animate-pulse"
                  style={{ animationDelay: (i * 0.07) + "s" }}
                  title={"Agent M" + String(i + 1).padStart(2, "0")}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live request log */}
        <div className="rounded-2xl border border-white/8 bg-[#0a1015] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={"w-2 h-2 rounded-full " + (running ? "bg-red-400 animate-pulse" : "bg-slate-600")} aria-hidden="true" />
              <span className="text-white font-semibold text-sm">Live Request Stream</span>
              <span className="text-slate-500 text-xs font-mono">POST /api/encounter/triage</span>
            </div>
            {running && (
              <span className="text-red-400 text-xs font-mono animate-pulse">● LIVE</span>
            )}
          </div>

          {/* Header row */}
          <div className="px-5 py-2 grid grid-cols-[60px_70px_130px_80px_80px_80px_1fr] gap-2 text-slate-600 text-xs font-mono border-b border-white/5">
            <span>Time</span>
            <span>Agent</span>
            <span>Scenario</span>
            <span>Cas.</span>
            <span>Latency</span>
            <span>Status</span>
            <span>Triage</span>
          </div>

          <div
            ref={logRef}
            className="overflow-y-auto font-mono text-xs divide-y divide-white/4"
            style={{ height: "360px" }}
            aria-live="polite"
            aria-label="Live request log"
          >
            {log.length === 0 && (
              <div className="flex items-center justify-center h-full text-slate-600">
                {running ? "Agents starting up…" : "Launch the hammer to see live requests"}
              </div>
            )}
            {log.map(entry => (
              <div
                key={entry.id}
                className={"grid grid-cols-[60px_70px_130px_80px_80px_80px_1fr] gap-2 px-5 py-2 items-center " + (entry.success ? "hover:bg-white/2" : "bg-red-500/4 hover:bg-red-500/8")}
              >
                <span className="text-slate-500">{entry.ts}</span>
                <span className="text-cyan-400">M{String(entry.agent.replace("M","")).padStart(2,"0")}</span>
                <span className="text-slate-300 truncate">{(entry.scenario || "").replace(/_/g, " ")}</span>
                <span className="text-slate-400">{entry.casualties}</span>
                <span className={entry.latency < 150 ? "text-emerald-400" : entry.latency < 300 ? "text-amber-400" : "text-red-400"}>
                  {entry.latency}ms
                </span>
                <span className={entry.success ? "text-emerald-400" : "text-red-400"}>
                  {entry.success ? "200 OK" : "500 ERR"}
                </span>
                <span className="text-slate-400">
                  <span className="text-red-400">{entry.immediate}R</span>
                  {" / "}
                  <span className="text-amber-400">{Math.round(entry.casualties * 0.38)}Y</span>
                  {" / "}
                  <span className="text-emerald-400">{Math.max(0, entry.casualties - entry.immediate - Math.round(entry.casualties * 0.38) - Math.round(entry.casualties * 0.08))}G</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-slate-600 text-xs font-mono mt-6">
          Simulation mirrors <span className="text-slate-400">locustfile.py</span> CombatMedicUser · wait_time between(1, 5) ·
          FHIR R4 payloads · POST /api/encounter/triage · {agentCount} concurrent agents
        </p>
      </div>
    </div>
  );
}
