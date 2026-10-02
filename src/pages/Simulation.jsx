import { useState, useRef, useEffect } from "react";
import ActivityIcon from "icon:activity";
import UserIcon from "icon:users";
import AlertIcon from "icon:alert-triangle";
import CheckIcon from "icon:check-circle";
import ClockIcon from "icon:clock";
import RefreshIcon from "icon:refresh-cw";

// Triage category colours (colour + pattern, never colour alone)
const TRIAGE = {
  immediate: { label: "Immediate (Red)", color: "#ef4444", pattern: "●●●" },
  delayed: { label: "Delayed (Yellow)", color: "#fbbf24", pattern: "●●○" },
  minimal: { label: "Minimal (Green)", color: "#22c55e", pattern: "●○○" },
  expectant: { label: "Expectant (Black)", color: "#94a3b8", pattern: "○○○" },
};

// Simple deterministic simulation engine (client-side only, no external service)
function runSimulation({ casualties, resources, scenario }) {
  const seed = casualties + resources;
  const rng = (n) => ((seed * 9301 + 49297) % 233280) / 233280 * n | 0;

  const pImmediate = scenario === "blast" ? 0.35 : scenario === "chemical" ? 0.28 : 0.22;
  const pExpectant = scenario === "blast" ? 0.12 : scenario === "chemical" ? 0.18 : 0.08;
  const pDelayed = 0.38;

  const immediate = Math.round(casualties * pImmediate);
  const expectant = Math.round(casualties * pExpectant);
  const delayed = Math.round(casualties * pDelayed);
  const minimal = casualties - immediate - expectant - delayed;

  const resourceShortfall = Math.max(0, immediate - Math.floor(resources * 0.4));
  const treatableNow = Math.min(immediate, Math.floor(resources * 0.4));
  const estimatedMinutes = 15 + Math.ceil(immediate / Math.max(1, resources)) * 8;

  const log = [];
  log.push({ t: "00:00", msg: `MCI declared — ${casualties} reported casualties`, type: "alert" });
  log.push({ t: "00:02", msg: `Triage START initiated at incident perimeter`, type: "info" });
  log.push({ t: "00:04", msg: `${immediate} RED tagged — ${treatableNow} slots available with ${resources} personnel`, type: "warn" });
  if (resourceShortfall > 0) {
    log.push({ t: "00:06", msg: `Resource shortfall: ${resourceShortfall} immediate patients awaiting care`, type: "alert" });
  }
  log.push({ t: "00:08", msg: `${delayed} YELLOW patients stable — secondary treatment queue opened`, type: "info" });
  log.push({ t: "00:10", msg: `${minimal} GREEN ambulatory — directed to collection point`, type: "ok" });
  log.push({ t: "00:14", msg: `Estimated time to initial stabilization: ${estimatedMinutes} min`, type: "info" });
  log.push({ t: "00:18", msg: `AI resource optimizer: redistribute ${Math.max(0, resources - immediate)} personnel to surgical prep`, type: "ok" });

  return { immediate, delayed, minimal, expectant, log, resourceShortfall, estimatedMinutes };
}

const SCENARIOS = [
  { value: "mass_trauma", label: "Mass Trauma (Vehicle / Structural)" },
  { value: "blast", label: "Blast / Explosion Incident" },
  { value: "chemical", label: "Chemical / HAZMAT Exposure" },
  { value: "natural", label: "Natural Disaster (Earthquake / Flood)" },
  { value: "active_shooter", label: "Active Shooter Event" },
];

export default function Simulation() {
  const [casualties, setCasualties] = useState("");
  const [resources, setResources] = useState("");
  const [scenario, setScenario] = useState("mass_trauma");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [logIdx, setLogIdx] = useState(0);
  const [errors, setErrors] = useState({});
  const logRef = useRef(null);

  useEffect(() => {
    if (!result || logIdx >= result.log.length) return;
    const t = setTimeout(() => {
      setLogIdx((i) => i + 1);
    }, 600);
    return () => clearTimeout(t);
  }, [result, logIdx]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logIdx]);

  function validate() {
    const errs = {};
    const c = parseInt(casualties);
    const r = parseInt(resources);
    if (!casualties || isNaN(c) || c < 1 || c > 5000) errs.casualties = "Enter a number between 1 and 5,000.";
    if (!resources || isNaN(r) || r < 1 || r > 2000) errs.resources = "Enter a number between 1 and 2,000.";
    if (!location.trim()) errs.location = "Please describe the incident location.";
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setRunning(true);
    setResult(null);
    setLogIdx(0);

    setTimeout(() => {
      const sim = runSimulation({ casualties: parseInt(casualties), resources: parseInt(resources), scenario });
      setResult(sim);
      setRunning(false);
    }, 1200);
  }

  function reset() {
    setResult(null);
    setLogIdx(0);
    setCasualties("");
    setResources("");
    setLocation("");
    setScenario("mass_trauma");
    setErrors({});
  }

  const logColors = {
    alert: "text-red-400",
    warn: "text-amber-400",
    info: "text-cyan-300",
    ok: "text-emerald-400",
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 mesh-bg">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono mb-6">
            <AlertIcon className="w-3 h-3" aria-hidden="true" />
            Mass Casualty Incident Simulation · OrcaWolf AI
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white mb-4">
            MCI <span className="text-cyan-400">Simulation</span> Engine
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Enter your incident parameters. The AI-driven triage engine will model casualty
            distribution, resource allocation, and estimated stabilization time.
          </p>
        </div>

        {!result ? (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-2xl border border-cyan-400/20 bg-[#070e18] p-8 space-y-6"
            aria-label="Mass Casualty Simulation parameters"
          >
            {/* Scenario */}
            <div>
              <label htmlFor="scenario" className="block text-white font-medium mb-2 text-sm">
                Incident Type
              </label>
              <select
                id="scenario"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#0a1628] text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              >
                {SCENARIOS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-white font-medium mb-2 text-sm">
                Incident Location / Description
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Downtown convention centre, Building C"
                className={`w-full rounded-lg border px-4 py-3 text-white text-sm bg-[#0a1628] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                  errors.location ? "border-red-500" : "border-slate-700 focus:border-cyan-400"
                }`}
                aria-describedby={errors.location ? "location-error" : undefined}
                aria-invalid={!!errors.location}
              />
              {errors.location && (
                <p id="location-error" className="mt-1 text-red-400 text-xs flex items-center gap-1">
                  <AlertIcon className="w-3 h-3" aria-hidden="true" />
                  {errors.location}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Casualties */}
              <div>
                <label htmlFor="casualties" className="block text-white font-medium mb-2 text-sm">
                  Estimated Casualties
                </label>
                <input
                  id="casualties"
                  type="number"
                  min="1"
                  max="5000"
                  value={casualties}
                  onChange={(e) => setCasualties(e.target.value)}
                  placeholder="e.g. 150"
                  className={`w-full rounded-lg border px-4 py-3 text-white text-sm bg-[#0a1628] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                    errors.casualties ? "border-red-500" : "border-slate-700 focus:border-cyan-400"
                  }`}
                  aria-describedby={errors.casualties ? "casualties-error" : undefined}
                  aria-invalid={!!errors.casualties}
                />
                {errors.casualties && (
                  <p id="casualties-error" className="mt-1 text-red-400 text-xs flex items-center gap-1">
                    <AlertIcon className="w-3 h-3" aria-hidden="true" />
                    {errors.casualties}
                  </p>
                )}
              </div>

              {/* Resources */}
              <div>
                <label htmlFor="resources" className="block text-white font-medium mb-2 text-sm">
                  Available Medical Personnel
                </label>
                <input
                  id="resources"
                  type="number"
                  min="1"
                  max="2000"
                  value={resources}
                  onChange={(e) => setResources(e.target.value)}
                  placeholder="e.g. 40"
                  className={`w-full rounded-lg border px-4 py-3 text-white text-sm bg-[#0a1628] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                    errors.resources ? "border-red-500" : "border-slate-700 focus:border-cyan-400"
                  }`}
                  aria-describedby={errors.resources ? "resources-error" : undefined}
                  aria-invalid={!!errors.resources}
                />
                {errors.resources && (
                  <p id="resources-error" className="mt-1 text-red-400 text-xs flex items-center gap-1">
                    <AlertIcon className="w-3 h-3" aria-hidden="true" />
                    {errors.resources}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={running}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-lg bg-cyan-400 text-[#050a0f] font-semibold text-sm hover:bg-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all glow-cyan"
            >
              {running ? (
                <>
                  <RefreshIcon className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Running Simulation…
                </>
              ) : (
                <>
                  <ActivityIcon className="w-4 h-4" aria-hidden="true" />
                  Run Simulation
                </>
              )}
            </button>

            <p className="text-slate-600 text-xs text-center">
              Simulation runs locally in your browser — no patient data is transmitted or stored.
            </p>
          </form>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Triage summary cards */}
            <section aria-labelledby="triage-summary">
              <h2 id="triage-summary" className="text-white font-semibold text-lg mb-4 font-mono">
                Triage Distribution — {parseInt(casualties)} casualties
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { key: "immediate", count: result.immediate },
                  { key: "delayed", count: result.delayed },
                  { key: "minimal", count: result.minimal },
                  { key: "expectant", count: result.expectant },
                ].map(({ key, count }) => {
                  const t = TRIAGE[key];
                  return (
                    <div
                      key={key}
                      className="rounded-xl p-4 border bg-[#070e18] text-center"
                      style={{ borderColor: `${t.color}30` }}
                    >
                      <div className="font-mono text-lg mb-1" style={{ color: t.color }} aria-hidden="true">
                        {t.pattern}
                      </div>
                      <div className="text-3xl font-bold text-white mb-1">{count}</div>
                      <div className="text-xs text-slate-400">{t.label}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Key metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl p-5 border border-amber-500/20 bg-[#070e18] flex items-center gap-4">
                <ClockIcon className="w-8 h-8 text-amber-400 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-white font-bold text-xl">{result.estimatedMinutes} min</p>
                  <p className="text-slate-400 text-xs">Est. stabilization time</p>
                </div>
              </div>
              <div className="rounded-xl p-5 border border-cyan-400/20 bg-[#070e18] flex items-center gap-4">
                <UserIcon className="w-8 h-8 text-cyan-400 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-white font-bold text-xl">{resources}</p>
                  <p className="text-slate-400 text-xs">Medical personnel</p>
                </div>
              </div>
              {result.resourceShortfall > 0 ? (
                <div className="rounded-xl p-5 border border-red-500/20 bg-[#070e18] flex items-center gap-4">
                  <AlertIcon className="w-8 h-8 text-red-400 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-white font-bold text-xl">{result.resourceShortfall}</p>
                    <p className="text-slate-400 text-xs">Resource shortfall (immediate)</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl p-5 border border-emerald-500/20 bg-[#070e18] flex items-center gap-4">
                  <CheckIcon className="w-8 h-8 text-emerald-400 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-white font-bold text-xl">Adequate</p>
                    <p className="text-slate-400 text-xs">Resources for immediate patients</p>
                  </div>
                </div>
              )}
            </div>

            {/* Live event log */}
            <section aria-labelledby="event-log-heading">
              <h2 id="event-log-heading" className="text-white font-semibold text-sm mb-3 font-mono uppercase tracking-wider">
                AI Event Stream
              </h2>
              <div
                ref={logRef}
                className="rounded-xl border border-cyan-400/15 bg-[#030609] p-4 h-56 overflow-y-auto font-mono text-xs space-y-2"
                aria-live="polite"
                aria-label="Simulation event log"
              >
                {result.log.slice(0, logIdx).map((entry, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-slate-400 shrink-0">[{entry.t}]</span>
                    <span className={logColors[entry.type] || "text-slate-300"}>{entry.msg}</span>
                  </div>
                ))}
                {logIdx < result.log.length && (
                  <div className="flex items-center gap-2 text-cyan-400">
                    <span className="animate-pulse">▋</span>
                    <span className="text-slate-400">processing…</span>
                  </div>
                )}
              </div>
            </section>

            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-lg border border-cyan-400/30 text-cyan-400 font-semibold text-sm hover:bg-cyan-400/10 transition-all"
            >
              <RefreshIcon className="w-4 h-4" aria-hidden="true" />
              Run Another Simulation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
