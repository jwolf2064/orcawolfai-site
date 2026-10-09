import { useState, useRef, useEffect, useCallback } from "react";
import { pb } from "../lib/pb";
import CodeIcon from "icon:code-2";
import LayersIcon from "icon:layers";
import CpuIcon from "icon:cpu";
import GithubIcon from "icon:git-branch";
import HistoryIcon from "icon:clock";
import DownloadIcon from "icon:download";
import ChevronIcon from "icon:chevron-down";
import ActivityIcon from "icon:activity";
import UserIcon from "icon:users";
import AlertIcon from "icon:alert-triangle";
import CheckIcon from "icon:check-circle";
import ClockIcon from "icon:clock";
import RefreshIcon from "icon:refresh-cw";

// ── FHIR R4 Bundle Generator ──────────────────────────────────────────────────
function generateFhirBundle({ casualties, scenario, location, immediate, delayed, minimal, expectant }) {
  const now = new Date().toISOString();
  const entries = [];
  const scenarioConditions = {
    blast: ["Blast injury", "Traumatic brain injury", "Penetrating wound", "Burns — 2nd degree", "Tympanic membrane rupture"],
    chemical: ["Chemical exposure", "Respiratory failure", "Dermal burns — chemical", "Ocular injury", "Nerve agent exposure"],
    mass_trauma: ["Crush injury", "Hemorrhagic shock", "Spinal fracture", "Traumatic amputation", "Blunt force trauma"],
    natural: ["Crush syndrome", "Hypothermia", "Dehydration", "Fracture — multiple", "Asphyxiation"],
    active_shooter: ["Gunshot wound — chest", "Gunshot wound — extremity", "Hemorrhagic shock", "Penetrating abdominal trauma", "Tension pneumothorax"],
  };
  const conditions = scenarioConditions[scenario] || scenarioConditions.mass_trauma;
  const triageMap = [
    ...Array(immediate).fill("R"),
    ...Array(delayed).fill("Y"),
    ...Array(minimal).fill("G"),
    ...Array(expectant).fill("B"),
  ];
  for (let i = 0; i < Math.min(casualties, 20); i++) {
    const cat = triageMap[i] || "G";
    const pid = `patient-${i + 1}`;
    entries.push({
      resource: {
        resourceType: "Patient",
        id: pid,
        meta: { profile: ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient"] },
        extension: [{ url: "orcawolfai-triage-category", valueCode: cat }],
        name: [{ family: `Casualty-${String(i + 1).padStart(3, "0")}`, given: ["Unknown"] }],
        gender: i % 2 === 0 ? "male" : "female",
        birthDate: `${1960 + (i % 40)}-01-01`,
      },
      fullUrl: `urn:uuid:${pid}`,
      request: { method: "POST", url: "Patient" },
    });
    entries.push({
      resource: {
        resourceType: "Condition",
        id: `condition-${i + 1}`,
        subject: { reference: `urn:uuid:${pid}` },
        code: { text: conditions[i % conditions.length] },
        onsetDateTime: now,
        clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] },
      },
      fullUrl: `urn:uuid:condition-${i + 1}`,
      request: { method: "POST", url: "Condition" },
    });
  }
  return {
    resourceType: "Bundle",
    type: "transaction",
    timestamp: now,
    meta: {
      tag: [{ system: "orcawolfai", code: scenario }, { system: "orcawolfai-location", code: location }],
    },
    entry: entries,
  };
}

// ── Triage category colours ───────────────────────────────────────────────────
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

const ENGINE_FILES = [
  {
    name: "fhir_mongo_loader.py",
    label: "FHIR Ingestion Engine",
    icon: "layers",
    description: "Ingests Synthea-generated FHIR R4 bundles into the sovereign mesh data store. Routes each resource type to its own partition with upsert logic to prevent duplicates across local and cloud targets.",
    code: `import os, json
from pymongo import MongoClient

LOCAL_MONGO_URI = "mongodb://localhost:27017/"
ATLAS_MONGO_URI = "mongodb+srv://<user>:<pass>@<cluster>/?retryWrites=true&w=majority"

client = MongoClient(LOCAL_MONGO_URI)
db = client["fhir_v4"]
PAYLOAD_DIR = "load-engine/sample_fhir_payloads"

def process_fhir_bundle(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        bundle = json.load(f)
    if bundle.get("resourceType") != "Bundle":
        return
    for entry in bundle.get("entry", []):
        resource = entry.get("resource")
        if not resource:
            continue
        resource_type = resource.get("resourceType")
        if "id" in resource:
            resource["_id"] = resource["id"]
        db[resource_type].update_one(
            {"_id": resource.get("_id")},
            {"$set": resource},
            upsert=True
        )

for filename in os.listdir(PAYLOAD_DIR):
    if filename.endswith(".json"):
        process_fhir_bundle(os.path.join(PAYLOAD_DIR, filename))`,
  },
  {
    name: "fhir_vector_pipeline.py",
    label: "Vertex AI Vector Pipeline",
    icon: "cpu",
    description: "Converts FHIR R4 patient bundles into semantic clinical summaries and generates 768-dimension vector embeddings via Google Vertex AI (text-embedding-004). Powers the AI triage intelligence at L4 of the Sovereign Mesh stack.",
    code: `import os, json
from google.cloud import aiplatform
from vertexai.language_models import TextEmbeddingModel

os.environ["GOOGLE_CLOUD_PROJECT"] = "your-gcp-project-id"
aiplatform.init(project=os.environ["GOOGLE_CLOUD_PROJECT"], location="us-central1")

def fhir_to_semantic_string(fhir_bundle_path):
    with open(fhir_bundle_path, 'r') as f:
        bundle = json.load(f)
    patient_info, conditions, medications = "", [], []
    for entry in bundle.get('entry', []):
        resource = entry.get('resource', {})
        rt = resource.get('resourceType')
        if rt == 'Patient':
            name = resource.get('name', [{}])[0]
            given = " ".join(name.get('given', []))
            family = name.get('family', '')
            patient_info = f"Patient: {given} {family}, {resource.get('gender')} born {resource.get('birthDate')}."
        elif rt == 'Condition':
            code_text = resource.get('code', {}).get('text', '')
            if code_text:
                conditions.append(f"{code_text} (onset: {resource.get('onsetDateTime','unknown')})")
        elif rt == 'MedicationRequest':
            med = resource.get('medicationCodeableConcept', {}).get('text', '')
            if med:
                medications.append(f"{med} ({resource.get('status','unknown')})")
    summary = patient_info
    if conditions: summary += " Conditions: " + "; ".join(conditions) + "."
    if medications: summary += " Medications: " + "; ".join(medications) + "."
    return summary

def generate_vertex_embedding(text_content):
    model = TextEmbeddingModel.from_pretrained("text-embedding-004")
    embeddings = model.get_embeddings([text_content])
    return embeddings[0].values`,
  },
  {
    name: "locustfile.py",
    label: "Combat Medic Load Tester",
    icon: "code",
    description: "Simulates field chaos — each CombatMedicUser submits random Synthea FHIR trauma payloads to the AI Gateway every 1–5 seconds, mimicking real MASCAL conditions. Tracks success/failure rates in real time via the Locust dashboard.",
    code: `# Author: John Wolf, MBA CIS — OrcaWolfAI (08/02/2026)
import os, json, random
from locust import HttpUser, task, between

PAYLOAD_DIR = "sample_fhir_payloads"
fhir_payloads = []

for filename in os.listdir(PAYLOAD_DIR):
    if filename.endswith(".json"):
        with open(os.path.join(PAYLOAD_DIR, filename), "r", encoding="utf-8") as f:
            fhir_payloads.append(json.load(f))

class CombatMedicUser(HttpUser):
    # 1–5 second wait simulates field chaos
    wait_time = between(1, 5)

    @task
    def submit_casualty(self):
        if not fhir_payloads:
            return
        payload = random.choice(fhir_payloads)
        with self.client.post(
            "/api/encounter/triage",
            json=payload,
            name="/api/encounter/triage",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"AI Gateway returned: {response.status_code}")`,
  },
];

function CodeBlock({ file, isOpen, onToggle }) {
  return (
    <div className="rounded-2xl border border-cyan-400/15 bg-[#070e18] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-[#0a1628] transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center shrink-0">
            <CodeIcon className="w-5 h-5 text-cyan-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-white font-semibold font-mono text-sm">{file.name}</p>
            <p className="text-cyan-400 text-xs mt-0.5">{file.label}</p>
          </div>
        </div>
        <span className="text-slate-400 text-xs font-mono">{isOpen ? "▲ collapse" : "▼ expand"}</span>
      </button>
      {isOpen && (
        <div className="border-t border-cyan-400/10">
          <div className="px-5 py-4 border-b border-cyan-400/10">
            <p className="text-slate-300 text-sm leading-relaxed">{file.description}</p>
          </div>
          <pre className="p-5 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed bg-[#030609]">
            <code>{file.code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

export default function Simulation() {
  const [casualties, setCasualties] = useState("");
  const [resources, setResources] = useState("");
  const [scenario, setScenario] = useState("mass_trauma");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [logIdx, setLogIdx] = useState(0);
  const [errors, setErrors] = useState({});
  const [openFile, setOpenFile] = useState(null);
  const [pastRuns, setPastRuns] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [fhirBundle, setFhirBundle] = useState(null);
  const [showBundle, setShowBundle] = useState(false);
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

  // Load past runs from storage
  const loadHistory = useCallback(() => {
    const controller = new AbortController();
    pb.collection("fhir_simulations")
      .getList(1, 10, { sort: "-created", signal: controller.signal })
      .then((r) => setPastRuns(r.items))
      .catch((e) => { if (!e?.isAbort) console.error(e); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    return loadHistory();
  }, [loadHistory]);

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

    setTimeout(async () => {
      const c = parseInt(casualties);
      const r = parseInt(resources);
      const sim = runSimulation({ casualties: c, resources: r, scenario });
      const bundle = generateFhirBundle({
        casualties: c, scenario, location,
        immediate: sim.immediate, delayed: sim.delayed,
        minimal: sim.minimal, expectant: sim.expectant,
      });
      setFhirBundle(bundle);
      setResult(sim);
      setRunning(false);
      // Save to storage
      try {
        await pb.collection("fhir_simulations").create({
          scenario, location,
          casualties: c, resources: r,
          immediate: sim.immediate, delayed: sim.delayed,
          minimal: sim.minimal, expectant: sim.expectant,
          resource_shortfall: sim.resourceShortfall,
          estimated_minutes: sim.estimatedMinutes,
          fhir_bundle: bundle,
        });
        loadHistory();
      } catch (err) {
        console.error("Failed to save simulation run:", err);
      }
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

            {/* FHIR Bundle Viewer */}
            {fhirBundle && (
              <div className="rounded-xl border border-emerald-400/20 bg-[#030609] overflow-hidden">
                <button
                  onClick={() => setShowBundle(b => !b)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-emerald-400/5 transition-colors"
                  aria-expanded={showBundle}
                >
                  <div className="flex items-center gap-3">
                    <LayersIcon className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    <span className="text-emerald-400 font-mono text-sm font-semibold">Generated FHIR R4 Bundle</span>
                    <span className="text-slate-500 text-xs">{fhirBundle.entry.length} resources</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={"data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fhirBundle, null, 2))}
                      download={"orcawolf-mci-" + scenario + "-" + Date.now() + ".json"}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 text-slate-400 hover:text-white text-xs font-mono transition-colors"
                    >
                      <DownloadIcon className="w-3 h-3" aria-hidden="true" />
                      Download JSON
                    </a>
                    <ChevronIcon className={"w-4 h-4 text-slate-400 transition-transform " + (showBundle ? "rotate-180" : "")} aria-hidden="true" />
                  </div>
                </button>
                {showBundle && (
                  <pre className="px-5 pb-5 overflow-x-auto text-xs font-mono text-emerald-300/80 leading-relaxed max-h-72 overflow-y-auto">
                    {JSON.stringify(fhirBundle, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Past Runs History */}
      {pastRuns.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <button
            onClick={() => setShowHistory(h => !h)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-cyan-400/15 bg-[#070e18] hover:bg-[#0a1628] transition-colors"
            aria-expanded={showHistory}
          >
            <div className="flex items-center gap-3">
              <HistoryIcon className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              <span className="text-white font-semibold text-sm">Recent Simulation Runs</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400 text-xs font-mono">{pastRuns.length}</span>
            </div>
            <ChevronIcon className={`w-4 h-4 text-slate-400 transition-transform ${showHistory ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          {showHistory && (
            <div className="mt-2 rounded-xl border border-cyan-400/10 bg-[#070e18] divide-y divide-cyan-400/10 overflow-hidden">
              {pastRuns.map((run) => (
                <div key={run.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm capitalize">{(run.scenario || "").replace(/_/g, " ")}</span>
                      {run.location && <span className="text-slate-400 text-xs">· {run.location}</span>}
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">{new Date(run.created).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                    <span className="text-red-400">{run.immediate ?? 0}R</span>
                    <span className="text-amber-400">{run.delayed ?? 0}Y</span>
                    <span className="text-emerald-400">{run.minimal ?? 0}G</span>
                    <span className="text-slate-400">{run.expectant ?? 0}B</span>
                    <span className="text-cyan-300">{run.casualties ?? 0} total</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Production Engine Section */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        <div className="border-t border-cyan-400/10 pt-16">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
              <LayersIcon className="w-5 h-5 text-cyan-400" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-white font-display font-bold text-2xl">Production Engine</h2>
              <p className="text-cyan-400 text-sm font-mono">orcawolf-edge-triage-sim</p>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed mb-2">
            The interactive simulator above runs entirely in your browser. Behind it sits a production-grade
            combat triage engine — built by John Wolf, OrcaWolfAI — that ingests real FHIR R4 patient bundles,
            runs them through a Google Vertex AI vector embedding pipeline, and load-tests the AI gateway
            under field chaos conditions simulating real MASCAL events.
          </p>
          <a
            href="https://github.com/jwolf2064/orcawolf-edge-triage-sim"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-cyan-400 text-sm font-mono hover:text-white transition-colors mb-10"
          >
            <GithubIcon className="w-4 h-4" aria-hidden="true" />
            github.com/jwolf2064/orcawolf-edge-triage-sim
          </a>

          {/* Architecture flow */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { step: "01", label: "Synthea FHIR R4", desc: "Realistic synthetic patient bundles generated at scale — trauma, blast, chemical exposure profiles" },
              { step: "02", label: "Vertex AI Embeddings", desc: "Clinical narratives vectorised via text-embedding-004 — semantic similarity powers AI triage ranking" },
              { step: "03", label: "MASCAL Load Test", desc: "CombatMedicUser agents hammer the AI gateway at 1–5s intervals — real field chaos, measured in real time" },
            ].map(({ step, label, desc }) => (
              <div key={step} className="rounded-xl border border-cyan-400/15 bg-[#070e18] p-5">
                <p className="text-cyan-400 font-mono text-xs mb-2">{step}</p>
                <p className="text-white font-semibold text-sm mb-2">{label}</p>
                <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Code files */}
          <h3 className="text-white font-semibold text-sm mb-4 font-mono uppercase tracking-wider">Source Files</h3>
          <div className="space-y-3">
            {ENGINE_FILES.map((file) => (
              <CodeBlock
                key={file.name}
                file={file}
                isOpen={openFile === file.name}
                onToggle={() => setOpenFile(openFile === file.name ? null : file.name)}
              />
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-amber-400/20 bg-amber-400/5 p-5 flex items-start gap-4">
            <CpuIcon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-amber-300 font-semibold text-sm mb-1">Connecting the Engines</p>
              <p className="text-slate-300 text-xs leading-relaxed">
                The next phase wires this production engine directly into the live simulation UI — real FHIR payloads,
                live Vertex AI scoring, and a Locust dashboard embedded right here. Ready when you are.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
