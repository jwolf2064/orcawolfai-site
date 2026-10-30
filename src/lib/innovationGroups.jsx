import { Link } from "react-router";
import { hash, survival, SCENARIO_LABEL } from "./innovationData";

/* ---------- small visual helpers ---------- */
const sl = (s) => SCENARIO_LABEL[s] || s;
const f1 = (n) => (Number.isFinite(n) ? n.toFixed(1) : "—");
const pc = (n, d = 0) => (Number.isFinite(n) ? `${(n * 100).toFixed(d)}%` : "—");
const when = (iso) => (iso ? iso.slice(0, 16).replace("T", " ") : "reference");

function Code({ children }) {
  return (
    <pre className="text-xs leading-relaxed font-mono text-cyan-100 bg-[#030609] border border-slate-700/70 rounded-lg p-4 overflow-x-auto whitespace-pre">
      {children}
    </pre>
  );
}

function Bars({ rows, unit = "%", color = "#22d3ee" }) {
  const max = Math.max(...rows.map((r) => r.value), 1e-9);
  return (
    <ul className="space-y-2.5" role="list">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[8.5rem_1fr_4.5rem] items-center gap-3 text-xs">
          <span className="text-slate-300 truncate">{r.label}</span>
          <span className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <span className="block h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: r.color || color }} />
          </span>
          <span className="font-mono text-slate-100 text-right">{r.text ?? `${r.value.toFixed(1)}${unit}`}</span>
        </li>
      ))}
    </ul>
  );
}

function Table({ head, rows }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700/70">
      <table className="w-full text-xs text-left">
        <thead className="bg-[#0a1628] text-slate-300">
          <tr>{head.map((h) => <th key={h} scope="col" className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {rows.map((r, i) => (
            <tr key={i} className={r._hl ? "bg-cyan-400/10" : ""}>
              {r.cells.map((c, j) => (
                <td key={j} className={`px-3 py-2 ${j === 0 ? "text-slate-100 font-medium" : "text-slate-300 font-mono"} whitespace-nowrap`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Spark({ values, color = "#22d3ee", title }) {
  const w = 360, h = 90, min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 8 - ((v - min) / span) * (h - 16)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24 bg-[#030609] border border-slate-700/70 rounded-lg" role="img">
      <title>{title}</title>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

function Segmented({ label, value, onChange, options }) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">{label}</legend>
      <span className="text-xs text-slate-300 mr-1" aria-hidden="true">{label}</span>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-[36px] px-3 rounded-md border text-xs font-mono transition-colors ${
            value === o.value ? "border-cyan-400 bg-cyan-400/15 text-cyan-200" : "border-slate-600 text-slate-300 hover:border-slate-400"
          }`}
        >
          {o.label}
        </button>
      ))}
    </fieldset>
  );
}

const SERVICES = ["triage-engine", "carrier-readiness", "mesh-c2", "fhir-gateway"];

const CONDITIONS = {
  blast: ["Blast lung", "Traumatic brain injury", "Traumatic amputation"],
  chemical: ["Chemical burns", "Respiratory distress", "Neurotoxic exposure"],
  mass_trauma: ["Crush injury", "Haemorrhage", "Long-bone fracture"],
  natural: ["Crush injury", "Hypothermia", "Open fracture"],
  active_shooter: ["Gunshot wound", "Haemorrhage", "Pneumothorax"],
};

/* ---------- the six groups ---------- */
export const GROUPS = [
  {
    id: "ehr",
    title: "AI-Native EHR Processing",
    status: "Active Research", statusColor: "text-emerald-400",
    accent: "#34d399",
    body: "Large language models reason over structured FHIR data, surfacing triage insights and protocol recommendations — all within the sovereign mesh boundary.",
    input: "Saved simulation runs",
    output: "Protocol recommendation",
    nodes: [
      {
        key: "Vertex AI", stage: "Semantic summary", kind: "data",
        build: (d) => {
          const s = d.latest;
          const text = `Incident: ${sl(s.scenario)} at ${s.location}. ${s.casualties} casualties — ${s.immediate} IMMEDIATE, ${s.delayed} DELAYED, ${s.minimal} MINIMAL, ${s.expectant} EXPECTANT. Responders: ${s.resources}. Resource shortfall: ${s.shortfall}. Stabilisation estimate: ${s.minutes} min.`;
          return {
            what: "Turns every saved triage record into a plain clinical sentence — the same step your fhir_vector_pipeline.py performs before asking Vertex AI for an embedding.",
            source: `The most recent simulation run (${when(s.created)}) — ${d.sims.length} run${d.sims.length === 1 ? "" : "s"} available.`,
            stats: [["Runs summarised", d.sims.length], ["Casualties covered", d.totalCas], ["Vector size", "768 dims"]],
            visual: <Code>{text}</Code>,
            output: "One 768-dimension embedding per run, ready for similarity search. In this demonstrator the embedding step is simulated in the browser; in production it is a Vertex AI text-embedding call.",
          };
        },
      },
      {
        key: "FHIR R4", stage: "Standard records", kind: "data",
        build: (d) => {
          const s = d.latest;
          const cat = s.immediate >= s.delayed ? "IMMEDIATE" : "DELAYED";
          const patients = d.sims.reduce((t, x) => t + Math.min(x.casualties, 20), 0);
          return {
            what: "Each run is also written as a FHIR R4 Bundle: one Patient and one Condition per casualty (up to 20 per bundle) carrying the triage category.",
            source: "Generated on the Simulation page whenever you run a scenario; downloadable as JSON.",
            stats: [["Bundles", d.sims.length], ["Patient records", patients], ["Standard", "HL7 FHIR R4"]],
            visual: (
              <Code>{`{ "resourceType": "Condition",
  "clinicalStatus": "active",
  "code": { "text": "${CONDITIONS[s.scenario]?.[0] || "Trauma"}" },
  "subject": { "reference": "Patient/field-casualty-1" },
  "extension": [{ "url": "triage-category", "valueString": "${cat}" }],
  "note": [{ "text": "${sl(s.scenario)} — ${s.location}" }] }`}</Code>
            ),
            output: "Interoperable records any FHIR-capable hospital system can ingest.",
          };
        },
      },
      {
        key: "Clinical NLP", stage: "Injury patterns", kind: "data",
        build: (d) => {
          const rows = Object.entries(d.byScenario).map(([k, v]) => ({ label: sl(k), value: (v.imm / v.cas) * 100 }));
          return {
            what: "Maps each incident type to the injuries clinicians should expect, then measures how often casualties land in the IMMEDIATE (RED) category.",
            source: "RED share per scenario, calculated from every saved run of that scenario.",
            stats: [["Scenarios seen", rows.length], ["Overall RED share", pc(d.imm / d.totalCas, 1)], ["Highest", rows.sort((a, b) => b.value - a.value)[0]?.label]],
            visual: (
              <div className="space-y-5">
                <Bars rows={rows} />
                <Table head={["Scenario", "Typical conditions flagged"]} rows={Object.keys(d.byScenario).map((k) => ({ cells: [sl(k), (CONDITIONS[k] || CONDITIONS.mass_trauma).join(" · ")] }))} />
              </div>
            ),
            output: "A condition shortlist and expected RED load per incident type.",
          };
        },
      },
      {
        key: "RAG pipeline", stage: "Retrieve similar", kind: "data",
        build: (d) => {
          const n = d.nearest;
          return {
            what: "Retrieval-augmented generation: before advising, the system searches earlier runs for the one whose triage mix looks most like the current incident (cosine similarity).",
            source: "Compares your latest run against every earlier saved run.",
            stats: [["Library size", d.sims.length], ["Best match", n ? pc(n.score, 1) : "needs 2+ runs"], ["Method", "Cosine"]],
            visual: n ? (
              <Table
                head={["", "Scenario", "Casualties", "Responders", "Shortfall", "Stabilise"]}
                rows={[
                  { _hl: true, cells: ["Current", sl(d.latest.scenario), d.latest.casualties, d.latest.resources, d.latest.shortfall, `${d.latest.minutes} min`] },
                  { cells: ["Closest past", sl(n.run.scenario), n.run.casualties, n.run.resources, n.run.shortfall, `${n.run.minutes} min`] },
                ]}
              />
            ) : (
              <p className="text-sm text-slate-300">Run one more simulation and the closest earlier incident will appear here.</p>
            ),
            output: n
              ? `Suggested protocol: the closest past incident needed ${n.run.minutes} min to stabilise${n.run.shortfall ? ` and fell short by ${n.run.shortfall} responders — pre-position extra capacity` : " with no shortfall — current staffing pattern is sound"}.`
              : "A protocol recommendation grounded in your own history.",
          };
        },
      },
    ],
  },
  {
    id: "fed",
    title: "Federated Mesh Learning",
    status: "Prototype", statusColor: "text-amber-400",
    accent: "#fbbf24",
    body: "Model weights improve across sites without raw data leaving any facility. Differential privacy and secure aggregation run as mesh-native waypoint policies.",
    input: "Per-site run statistics",
    output: "Shared global model",
    nodes: [
      {
        key: "Federated Learning", stage: "Local → global", kind: "data",
        build: (d) => {
          const sites = siteStats(d);
          const tot = sites.reduce((t, s) => t + s.cas, 0);
          const global = sites.reduce((t, s) => t + s.rate * s.cas, 0) / tot;
          return {
            what: "Each location learns its own RED rate locally. Only that summary is shared; the coordinator combines them weighted by casualty volume (federated averaging).",
            source: "Saved runs grouped by incident location — each location plays the role of one hospital site.",
            stats: [["Sites", sites.length], ["Global RED rate", pc(global, 1)], ["Raw records shared", "0"]],
            visual: (
              <Table
                head={["Site", "Runs", "Casualties", "Local RED rate", "Weight"]}
                rows={[...sites.map((s) => ({ cells: [s.name, s.runs, s.cas, pc(s.rate, 1), pc(s.cas / tot, 0)] })), { _hl: true, cells: ["Global model", "", tot, pc(global, 1), "100%"] }]}
              />
            ),
            output: "A shared model every site benefits from, with no patient data moved.",
          };
        },
      },
      {
        key: "Differential Privacy", stage: "Add calibrated noise", kind: "data", interactive: "eps",
        build: (d, c) => {
          const sites = siteStats(d);
          const rnd = seeded(7 + sites.length);
          const rows = sites.map((s) => {
            const scale = 1 / s.cas / c.eps;
            const u = rnd() - 0.5;
            const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
            return { ...s, noisy: Math.min(1, Math.max(0, s.rate + noise)), scale };
          });
          const err = rows.reduce((t, r) => t + Math.abs(r.noisy - r.rate), 0) / rows.length;
          return {
            what: "Before leaving a site, each statistic gets random noise sized by the privacy budget ε. Lower ε means stronger privacy and a noisier answer.",
            source: "The same per-site RED rates, with Laplace noise generated in your browser.",
            stats: [["Privacy budget ε", c.eps], ["Avg. distortion", pc(err, 2)], ["Noise mechanism", "Laplace"]],
            controls: <Segmented label="Privacy budget ε" value={c.eps} onChange={c.setEps} options={[0.1, 0.5, 1, 2].map((v) => ({ value: v, label: `ε ${v}` }))} />,
            visual: <Table head={["Site", "True RED rate", "Published (noisy)", "Noise scale"]} rows={rows.map((r) => ({ cells: [r.name, pc(r.rate, 2), pc(r.noisy, 2), r.scale.toExponential(1)] }))} />,
            output: "Statistics that are safe to publish — no individual casualty can be inferred.",
          };
        },
      },
      {
        key: "Waypoint Policy", stage: "Enforce egress rules", kind: "illustrative",
        build: (d, c) => ({
          what: "A mesh waypoint proxy checks everything leaving a site and only lets approved, privacy-budgeted aggregates through.",
          source: `Policy written for this demo; the counts shown are your real saved bundles (${d.sims.length}) that stay local.`,
          stats: [["Bundles kept local", d.sims.length], ["Egress allowed", "aggregates"], ["Max ε", c.eps]],
          visual: (
            <Code>{`apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata: { name: federated-egress, namespace: orcawolf-fed }
spec:
  targetRefs: [{ kind: Gateway, name: site-waypoint }]
  action: ALLOW
  rules:
  - to: [{ operation: { paths: ["/v1/aggregate"] } }]
    when:
    - { key: request.headers[x-dp-epsilon], values: ["<=${c.eps}"] }
  # raw FHIR bundles: no ALLOW rule → denied by default`}</Code>
          ),
          output: "Privacy enforced by the network itself, verifiable without trusting the coordinator.",
        }),
      },
      {
        key: "Secure Aggregation", stage: "Mask & combine", kind: "data",
        build: (d) => {
          const sites = siteStats(d);
          const rnd = seeded(99);
          const masks = sites.map(() => 0);
          for (let i = 0; i < sites.length; i++)
            for (let j = i + 1; j < sites.length; j++) {
              const m = Math.floor(rnd() * 9000) + 1000;
              masks[i] += m; masks[j] -= m;
            }
          const rows = sites.map((s, i) => ({ name: s.name, true: s.imm, masked: s.imm + masks[i] }));
          const trueSum = rows.reduce((t, r) => t + r.true, 0);
          const maskedSum = rows.reduce((t, r) => t + r.masked, 0);
          return {
            what: "Sites add secret pairwise masks to their numbers. The coordinator only sees scrambled values, yet the masks cancel out in the total.",
            source: "Each site's total IMMEDIATE (RED) casualties from your saved runs.",
            stats: [["Sites", sites.length], ["Sum of masked", maskedSum], ["Sum of true", trueSum]],
            visual: <Table head={["Site", "True RED count", "What coordinator sees"]} rows={[...rows.map((r) => ({ cells: [r.name, r.true, r.masked] })), { _hl: true, cells: ["Total", trueSum, `${maskedSum} ${maskedSum === trueSum ? "✓ matches" : ""}`] }]} />,
            output: maskedSum === trueSum ? "The exact network-wide total, with no single site's number ever exposed." : "Aggregate total.",
          };
        },
      },
    ],
  },
  {
    id: "gitops",
    title: "Ambient Mesh GitOps",
    status: "Active Research", statusColor: "text-emerald-400",
    accent: "#60a5fa",
    body: "Every mesh policy change flows through a signed, audited pipeline — full lineage of who changed what and when.",
    input: "Policy repository",
    output: "Verified mesh state",
    nodes: [
      {
        key: "Argo CD", stage: "Sync to cluster", kind: "illustrative",
        build: () => {
          const apps = [["mesh-mtls-strict", "PeerAuthentication"], ["sim-engine-authz", "AuthorizationPolicy"], ["fed-waypoint", "Waypoint + policy"], ["fhir-gateway", "Gateway + routes"]];
          return {
            what: "Argo CD continuously compares the policies in Git with what is running and corrects any drift.",
            source: "Reference application set describing the mesh shown on the Architecture page. Illustrative — not connected to a live cluster.",
            stats: [["Applications", apps.length], ["Sync status", "Synced"], ["Drift", "0"]],
            visual: <Table head={["Application", "Kind", "Revision", "Status"]} rows={apps.map(([n, k]) => ({ cells: [n, k, hash(n).slice(0, 7), "Synced · Healthy"] }))} />,
            output: "Cluster state that always matches the approved policy in Git.",
          };
        },
      },
      {
        key: "Policy as Code", stage: "Declarative rules", kind: "illustrative",
        build: () => ({
          what: "Access rules are written as files, reviewed like software, and applied automatically.",
          source: "Reference policy naming the services this demo site simulates.",
          stats: [["Services governed", SERVICES.length], ["Default", "deny"], ["Transport", "mTLS strict"]],
          visual: (
            <Code>{`apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata: { name: sim-engine-authz }
spec:
  action: ALLOW
  rules:
  - from:
    - source:
        principals:
${SERVICES.map((s) => `        - cluster.local/ns/orcawolf/sa/${s}`).join("\n")}`}</Code>
          ),
          output: "Least-privilege service-to-service access, versioned and reviewable.",
        }),
      },
      {
        key: "SPIFFE signing", stage: "Prove who changed it", kind: "data",
        build: (d) => {
          const rows = d.sims.slice(0, 5).map((s) => ({
            cells: [when(s.created), "spiffe://orcawolf.mesh/ns/sim/sa/triage-engine", hash(`${s.id}${s.created}`), hash(`sig:${s.id}`)],
          }));
          return {
            what: "Every change is signed with the workload's SPIFFE identity so nobody can alter the record unnoticed.",
            source: "A digest and signature computed from each of your latest saved run records.",
            stats: [["Records signed", Math.min(5, d.sims.length)], ["Identity", "SPIFFE SVID"], ["Digest", "32-bit demo"]],
            visual: <Table head={["Time", "Signer identity", "Digest", "Signature"]} rows={rows} />,
            output: "Tamper-evident change records. (Demo digests are short; production uses SHA-256 with certificate-backed signatures.)",
          };
        },
      },
      {
        key: "Audit lineage", stage: "Who / what / when", kind: "data",
        build: (d) => {
          const ev = [
            ...d.sims.map((s) => ({ t: s.created, who: "triage-engine", what: `Simulation ${sl(s.scenario)} (${s.casualties} cas.)`, id: s.id })),
            ...d.carriers.map((c) => ({ t: c.created, who: "carrier-readiness", what: `${c.vessel} exercise, ${c.status}`, id: c.id })),
          ].sort((a, b) => (a.t < b.t ? 1 : -1)).slice(0, 8);
          let prev = "00000000";
          const rows = [...ev].reverse().map((e) => { const h = hash(prev + e.id); const r = { cells: [when(e.t), e.who, e.what, `${prev.slice(0, 6)} → ${h.slice(0, 6)}`] }; prev = h; return r; }).reverse();
          return {
            what: "A running, chained ledger of every action. Each entry includes the fingerprint of the one before it, so gaps or edits are obvious.",
            source: `The ${d.sims.length} simulation runs and ${d.carriers.length} carrier exercises saved on this site.`,
            stats: [["Events listed", ev.length], ["Chain", "hash-linked"], ["Retention", "append-only"]],
            visual: <Table head={["Time", "Actor", "Action", "Hash chain"]} rows={rows} />,
            output: "A complete audit trail for compliance and after-action review.",
          };
        },
      },
    ],
  },
  {
    id: "datamesh",
    title: "Sovereign Data Mesh",
    status: "Production", statusColor: "text-cyan-400",
    accent: "#22d3ee",
    body: "Each domain owns its data product. Mesh-enforced contracts replace hand-built pipelines, with cryptographic provenance on every record.",
    input: "Domain data products",
    output: "Trusted shared data",
    nodes: [
      {
        key: "Data Mesh", stage: "Domain products", kind: "data",
        build: (d) => ({
          what: "Instead of one central warehouse, each team publishes its own data product that others can subscribe to.",
          source: "Record counts read from the stores that back the Simulation and Carrier Readiness pages.",
          stats: [["Data products", 3], ["Incident records", d.usingBaseline ? 0 : d.sims.length], ["Readiness records", d.carriers.length]],
          visual: (
            <Table
              head={["Data product", "Owner", "Records", "Consumers"]}
              rows={[
                { cells: ["Incident triage", "Emergency Dept domain", d.usingBaseline ? 0 : d.sims.length, "Innovation Lab, Hammer"] },
                { cells: ["Fleet readiness", "Command / medical domain", d.carriers.length, "Mesh C2, Innovation Lab"] },
                { cells: ["Blood & supply", "Logistics domain", d.carriers.length, "Readiness dials, COA"] },
              ]}
            />
          ),
          output: "Discoverable, self-service data with a clear owner.",
        }),
      },
      {
        key: "Data Contracts", stage: "Validate on write", kind: "data",
        build: (d) => {
          const okSim = d.sims.filter((s) => s.immediate + s.delayed + s.minimal + s.expectant === s.casualties).length;
          const okCar = d.carriers.filter((c) => c.med >= 0 && c.med <= 100 && c.lod >= 0 && c.lod <= 100).length;
          return {
            what: "A contract states what a record must look like. Each saved run is checked against it, so bad data is caught at the door.",
            source: "Every saved simulation and carrier record is re-checked live.",
            stats: [["Incident checks passed", `${okSim}/${d.sims.length}`], ["Readiness checks passed", `${okCar}/${d.carriers.length}`], ["Rule", "totals must add up"]],
            visual: (
              <Table
                head={["Contract", "Rule", "Result"]}
                rows={[
                  { cells: ["incident.triage.v1", "RED + YELLOW + GREEN + BLACK = casualties", `${okSim} of ${d.sims.length} valid`] },
                  { cells: ["fleet.readiness.v1", "readiness scores between 0 and 100", `${okCar} of ${d.carriers.length} valid`] },
                ]}
              />
            ),
            output: "Consumers can rely on the data without custom clean-up.",
          };
        },
      },
      {
        key: "Data Provenance", stage: "Fingerprint records", kind: "data",
        build: (d) => ({
          what: "Each record carries an identifier, a timestamp and a content fingerprint so its origin can be proven later.",
          source: "Your five most recent saved simulation runs.",
          stats: [["Records fingerprinted", Math.min(5, d.sims.length)], ["Lineage depth", "source → bundle → vector"], ["Algorithm", "demo hash"]],
          visual: <Table head={["Record ID", "Created", "Origin", "Fingerprint"]} rows={d.sims.slice(0, 5).map((s) => ({ cells: [String(s.id).slice(0, 10), when(s.created), `${sl(s.scenario)} · ${s.location}`, hash(JSON.stringify([s.casualties, s.immediate, s.delayed, s.minimal, s.expectant]))] }))} />,
          output: "An unbroken chain from the original simulation to every downstream use.",
        }),
      },
      {
        key: "Domain ownership", stage: "Accountable teams", kind: "illustrative",
        build: () => ({
          what: "Every data product has a named owner who decides who may read it and how long it is kept.",
          source: "Reference ownership model for a deployment of this architecture.",
          stats: [["Domains", 3], ["Access model", "need-to-know"], ["Cross-domain", "via contract"]],
          visual: (
            <Table
              head={["Domain", "Accountable role", "Who can read", "Retention"]}
              rows={[
                { cells: ["Incident triage", "Chief of Emergency Medicine", "Clinical + C2", "7 years"] },
                { cells: ["Fleet readiness", "Medical Department Head", "Command staff", "Mission + 2 years"] },
                { cells: ["Blood & supply", "Logistics Officer", "Medical + Supply", "Mission + 1 year"] },
              ]}
            />
          ),
          output: "Clear responsibility and fewer data disputes.",
        }),
      },
    ],
  },
  {
    id: "mci",
    title: "Real-Time MCI Intelligence",
    status: "Active Research", statusColor: "text-emerald-400",
    accent: "#a78bfa",
    body: "Streaming vitals, triage tags and resource signals give incident commanders a continuously updated picture — with time-to-treatment predictions.",
    input: "Triage + resource events",
    output: "Commander's forecast",
    nodes: [
      {
        key: "Pub/Sub Streaming", stage: "Event backbone", kind: "data",
        build: (d) => {
          const rows = [
            { label: "mci.triage.tagged", value: d.totalCas, text: String(d.totalCas) },
            { label: "mci.resource.alert", value: d.shortfallRuns, text: String(d.shortfallRuns) },
            { label: "mesh.triage.carrier", value: d.carrierEvents, text: String(d.carrierEvents) },
          ];
          return {
            what: "Every tag and alert is published as a message on a topic, so any screen or model can follow the incident live.",
            source: "Topic volumes are counted from your saved runs: casualties tagged, runs that raised a shortfall alert, and carrier exercise events logged.",
            stats: [["Topics", 3], ["Tag events", d.totalCas], ["Shortfall alerts", d.shortfallRuns]],
            visual: <Bars rows={rows} color="#a78bfa" />,
            output: "A shared, real-time event stream. The Mesh C2 page shows the same pattern live.",
          };
        },
      },
      {
        key: "Edge Inference", stage: "Tag at the point of care", kind: "data",
        build: (d) => {
          const t = d.totalCas;
          return {
            what: "Triage decisions are made on the local node — no round trip to the cloud — so tagging keeps working when the satellite link drops.",
            source: "Triage outcomes across all saved runs.",
            stats: [["Casualties tagged", t], ["RED share", pc(d.imm / t, 1)], ["Link needed", "no"]],
            visual: <Bars rows={[
              { label: "RED · Immediate", value: d.imm, color: "#f87171", text: `${d.imm} (${pc(d.imm / t)})` },
              { label: "YELLOW · Delayed", value: d.del, color: "#fbbf24", text: `${d.del} (${pc(d.del / t)})` },
              { label: "GREEN · Minimal", value: d.min, color: "#4ade80", text: `${d.min} (${pc(d.min / t)})` },
              { label: "BLACK · Expectant", value: d.exp, color: "#94a3b8", text: `${d.exp} (${pc(d.exp / t)})` },
            ]} />,
            output: "Instant local triage categories. Demo uses rule-based weights; production would run a compact model on the edge node.",
          };
        },
      },
      {
        key: "Vertex Forecast", stage: "Predict time-to-treatment", kind: "data", interactive: "forecast",
        build: (d, c) => {
          const loads = [50, 100, 250, 500, 1000];
          const rows = loads.map((n) => ({ n, ...d.forecast(n, c.res, c.scen) }));
          const scenOpts = Object.keys(SCENARIO_LABEL).map((k) => ({ value: k, label: SCENARIO_LABEL[k] }));
          return {
            what: "Predicts how long it will take to stabilise all RED patients, and whether you will run short of responders, for a range of possible casualty counts.",
            source: `Learned from ${d.fit.n} saved simulation run${d.fit.n === 1 ? "" : "s"}: stabilisation minutes versus RED patients per responder${d.usingBaseline ? " (reference runs until you save your own)" : ""}. The RED share for each scenario comes from the same runs.`,
            stats: [["Model", `${f1(d.fit.a)} + ${f1(d.fit.b)} × RED per responder`], ["Training runs", d.fit.n], ["Fit", d.fit.fitted ? "learned" : "default engine"]],
            controls: (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <label className="text-xs text-slate-300 flex items-center gap-2">Scenario
                  <select value={c.scen} onChange={(e) => c.setScen(e.target.value)} className="bg-[#030609] border border-slate-600 rounded-md px-2 py-2 text-slate-100 min-h-[36px]">
                    {scenOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
                <label className="text-xs text-slate-300 flex items-center gap-3">Responders on scene
                  <input type="range" min="5" max="200" value={c.res} onChange={(e) => c.setRes(+e.target.value)} className="accent-cyan-400" />
                  <span className="font-mono text-slate-100 w-8">{c.res}</span>
                </label>
              </div>
            ),
            visual: (
              <div className="space-y-4">
                <Table head={["Casualties", "Expected RED", "Time to stabilise", "Shortfall", "Responders needed"]} rows={rows.map((r) => ({ cells: [r.n, r.imm, `${r.minutes} min`, r.shortfall ? `${r.shortfall} short` : "covered", r.needed] }))} />
                <Spark values={rows.map((r) => r.minutes)} color="#a78bfa" title="Predicted minutes to stabilise as casualty count rises" />
              </div>
            ),
            output: "A forecast the commander can act on: when to call for reinforcements and how many. This runs in your browser as an illustration of a Vertex AI forecasting model — no live Google Cloud call is made.",
          };
        },
      },
      {
        key: "Resource modeling", stage: "What-if staffing", kind: "data",
        build: (d) => {
          const s = d.latest;
          const rows = [0.5, 1, 1.5, 2].map((m) => {
            const res = Math.max(1, Math.round(s.resources * m));
            const sf = Math.max(0, s.immediate - Math.floor(res * 0.4));
            const mins = Math.max(15, Math.round(d.fit.a + d.fit.b * (s.immediate / res)));
            return { cells: [`${m}×`, res, sf ? `${sf} short` : "covered", `${mins} min`], _hl: m === 1 };
          });
          return {
            what: "Re-runs your latest incident with more or fewer responders to show what each extra person buys you.",
            source: `Your latest run: ${sl(s.scenario)} at ${s.location}, ${s.casualties} casualties, ${s.resources} responders.`,
            stats: [["Baseline responders", s.resources], ["RED patients", s.immediate], ["Needed for zero shortfall", Math.ceil(s.immediate / 0.4)]],
            visual: <Table head={["Staffing", "Responders", "RED patients", "Time to stabilise"]} rows={rows.map((r) => ({ _hl: r._hl, cells: [r.cells[0], r.cells[1], r.cells[2], r.cells[3]] }))} />,
            output: `Staffing recommendation: ${s.shortfall ? `add at least ${Math.ceil(s.immediate / 0.4) - s.resources} responders to clear the RED queue.` : "current staffing already covers the RED queue."}`,
          };
        },
      },
    ],
  },
  {
    id: "optimizer",
    title: "Outcome-Driven Resource Optimizer",
    status: "Prototype", statusColor: "text-amber-400",
    accent: "#fb7185",
    body: "A learning agent suggests real-time re-allocation of personnel, OR capacity and blood supply — balancing survival probability across the whole incident.",
    input: "Latest incident + readiness",
    output: "Re-allocation order",
    nodes: [
      {
        key: "Reinforcement Learning", stage: "Learn allocation", kind: "data",
        build: (d) => {
          const r = d.rl;
          return {
            what: "An agent tries different splits of responders between RED and YELLOW patients over 60 practice rounds, keeping what works best (epsilon-greedy bandit).",
            source: `Practice rounds replay your latest run (${sl(d.latest.scenario)}, ${d.latest.casualties} casualties, ${d.latest.resources} responders).`,
            stats: [["Practice rounds", 60], ["Learned split", `${pc(r.best)} to RED`], ["Final avg. survival", pc(r.curve[r.curve.length - 1], 1)]],
            visual: (
              <div className="space-y-4">
                <Spark values={r.curve} color="#fb7185" title="Average survival estimate improving across 60 practice rounds" />
                <Bars rows={r.arms.map((a, i) => ({ label: `${pc(a)} to RED`, value: r.q[i] * 100, text: `${(r.q[i] * 100).toFixed(1)}% · ${r.n[i]}×`, color: a === r.best ? "#fb7185" : "#475569" }))} />
              </div>
            ),
            output: "A learned allocation policy. The survival model is a simplified training environment, not clinical outcome data.",
          };
        },
      },
      {
        key: "Multi-objective optimization", stage: "Balance trade-offs", kind: "data",
        build: (d) => {
          const s = d.latest;
          const strat = [["Max RED", 0.7], ["Balanced", 0.5], ["Throughput", 0.3], ["Learned", d.rl.best]].map(([n, f]) => {
            const sv = survival(f, s);
            const mins = 15 + Math.ceil(s.immediate / Math.max(1, f * s.resources)) * 8;
            return { n, f, sv, mins };
          });
          const best = Math.max(...strat.map((x) => x.sv));
          return {
            what: "Compares allocation strategies on two goals at once — how many survive and how fast RED patients are stabilised — instead of optimising just one.",
            source: "Each strategy is scored on your latest saved run.",
            stats: [["Strategies compared", strat.length], ["Best survival", pc(best, 1)], ["Objectives", "survival · speed"]],
            visual: <Table head={["Strategy", "Share to RED", "Est. survival", "RED stabilised in"]} rows={strat.map((x) => ({ _hl: x.sv === best, cells: [x.n, pc(x.f), pc(x.sv, 1), `${x.mins} min`] }))} />,
            output: "A shortlist of defensible options with the trade-offs visible, so the commander chooses.",
          };
        },
      },
      {
        key: "Gemini reasoning", stage: "Explain the order", kind: "illustrative",
        build: (d) => {
          const s = d.latest;
          const need = Math.ceil(s.immediate / 0.4);
          const brief = [
            `SITUATION: ${s.casualties} casualties (${s.immediate} RED) from ${sl(s.scenario)} at ${s.location}; ${s.resources} responders on scene.`,
            `ASSESSMENT: ${s.shortfall ? `RED queue exceeds capacity by ${s.shortfall}.` : "RED queue is within capacity."} Estimated ${s.minutes} min to stabilise.`,
            `RECOMMENDATION: shift ${pc(d.rl.best)} of responders to RED treatment${s.shortfall ? `; request ${Math.max(0, need - s.resources)} additional responders` : ""}; hold YELLOW in secondary queue.`,
          ];
          return {
            what: "A language model turns the numbers into a short commander's brief with the reasoning spelled out.",
            source: "Written from your latest run and the learned allocation. Template-generated here — no live model call — to show the format a Gemini-backed version would produce.",
            stats: [["Format", "SITREP"], ["Inputs", "run + policy"], ["Live model call", "no"]],
            visual: <Code>{brief.join("\n\n")}</Code>,
            output: "A plain-language order a human can approve, challenge or override.",
          };
        },
      },
      {
        key: "Live telemetry", stage: "Feed from the fleet", kind: "data",
        build: (d) => ({
          what: "Readiness readings from the carrier exercises feed the optimizer so allocations reflect the real state of surgical capacity and blood stock.",
          source: `The ${d.carriers.length} carrier exercise${d.carriers.length === 1 ? "" : "s"} saved from the Carrier Readiness page.`,
          stats: [["Avg. medical readiness", d.carriers.length ? `${f1(d.carrierAvg.med)}%` : "—"], ["Avg. line-of-duty", d.carriers.length ? `${f1(d.carrierAvg.lod)}%` : "—"], ["Avg. blood supply", d.carriers.length ? `${f1(d.carrierAvg.blood)}%` : "—"]],
          visual: d.carriers.length ? (
            <Table head={["Vessel", "Threat", "Medical", "Line of duty", "Status"]} rows={d.carriers.slice(0, 5).map((c) => ({ cells: [c.vessel, String(c.threat).replace(/_/g, " "), `${f1(c.med)}%`, `${f1(c.lod)}%`, c.status] }))} />
          ) : (
            <p className="text-sm text-slate-300">No carrier exercises saved yet. Run one on the <Link to="/carrier-readiness" className="text-cyan-300 underline">Carrier Readiness</Link> page and its readings will appear here.</p>
          ),
          output: "Allocations grounded in current readiness. Watch the live stream on the Mesh C2 page.",
          link: { to: "/mesh-c2", label: "Open Mesh C2 live view" },
        }),
      },
    ],
  },
];

/* ---------- shared helpers ---------- */
function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function siteStats(d) {
  const m = {};
  d.sims.forEach((s) => {
    const k = (s.location || "Unknown").slice(0, 28);
    const b = (m[k] ||= { name: k, runs: 0, cas: 0, imm: 0 });
    b.runs += 1; b.cas += s.casualties; b.imm += s.immediate;
  });
  return Object.values(m).sort((a, b) => b.cas - a.cas).slice(0, 5).map((b) => ({ ...b, rate: b.imm / b.cas }));
}
