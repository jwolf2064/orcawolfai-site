// Analytics for the Innovation Lab — everything is computed in the browser
// from the simulation runs saved on this site (no external calls).
import { pb } from "./pb";

const RATES = {
  blast: { imm: 0.35, exp: 0.12 },
  chemical: { imm: 0.28, exp: 0.18 },
  default: { imm: 0.22, exp: 0.08 },
};
const rateFor = (s) => RATES[s] || RATES.default;

export const SCENARIO_LABEL = {
  mass_trauma: "Mass Trauma",
  blast: "Blast / Explosion",
  chemical: "Chemical / HAZMAT",
  natural: "Natural Disaster",
  active_shooter: "Active Shooter",
};

export function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0");
}

function lcg(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function baselineSims() {
  return [
    { scenario: "blast", location: "Reference: Port blast", casualties: 150, resources: 25 },
    { scenario: "chemical", location: "Reference: HAZMAT release", casualties: 80, resources: 18 },
    { scenario: "mass_trauma", location: "Reference: Structural collapse", casualties: 120, resources: 30 },
  ].map((b, i) => {
    const r = rateFor(b.scenario);
    const immediate = Math.round(b.casualties * r.imm);
    const expectant = Math.round(b.casualties * r.exp);
    const delayed = Math.round(b.casualties * 0.38);
    return {
      ...b,
      id: `baseline-${i}`,
      immediate, expectant, delayed,
      minimal: b.casualties - immediate - expectant - delayed,
      shortfall: Math.max(0, immediate - Math.floor(b.resources * 0.4)),
      minutes: 15 + Math.ceil(immediate / b.resources) * 8,
      created: "",
      baseline: true,
    };
  });
}

export const survival = (f, run) => {
  const P = run.resources;
  const servedRed = Math.min(run.immediate, f * P * 2);
  const servedYel = Math.min(run.delayed, (1 - f) * P * 3);
  const total =
    servedRed * 0.9 + (run.immediate - servedRed) * 0.4 +
    servedYel * 0.97 + (run.delayed - servedYel) * 0.8 +
    run.minimal * 0.995 + run.expectant * 0.1;
  return total / run.casualties;
};

function bandit(run) {
  const arms = [0.3, 0.4, 0.5, 0.6, 0.7];
  const rnd = lcg(run.casualties * 31 + run.resources * 17);
  const q = arms.map(() => 0);
  const n = arms.map(() => 0);
  const curve = [];
  let running = 0;
  for (let ep = 1; ep <= 60; ep++) {
    const a = rnd() < 0.25 ? Math.floor(rnd() * arms.length) : q.indexOf(Math.max(...q));
    const reward = survival(arms[a], run) + (rnd() - 0.5) * 0.02;
    n[a] += 1;
    q[a] += (reward - q[a]) / n[a];
    running += (reward - running) / ep;
    curve.push(running);
  }
  const best = q.indexOf(Math.max(...q));
  return { arms, q, n, curve, best: arms[best] };
}

export function buildAnalytics(simRows, carrierRows) {
  let sims = simRows.map((r) => ({
    id: r.id, scenario: r.scenario, location: r.location,
    casualties: r.casualties, resources: r.resources,
    immediate: r.immediate, delayed: r.delayed, minimal: r.minimal, expectant: r.expectant,
    shortfall: r.resource_shortfall ?? 0, minutes: r.estimated_minutes ?? 0,
    created: r.created, baseline: false,
  })).filter((s) => s.casualties > 0 && s.resources > 0);
  const usingBaseline = sims.length === 0;
  if (usingBaseline) sims = baselineSims();

  const totalCas = sims.reduce((a, s) => a + s.casualties, 0);
  const sum = (k) => sims.reduce((a, s) => a + s[k], 0);
  const byScenario = {};
  sims.forEach((s) => {
    const b = (byScenario[s.scenario] ||= { runs: 0, cas: 0, imm: 0, minutes: 0, location: new Set() });
    b.runs += 1; b.cas += s.casualties; b.imm += s.immediate; b.minutes += s.minutes; b.location.add(s.location);
  });
  const immRate = (scen) => {
    const b = byScenario[scen];
    return b && b.cas ? b.imm / b.cas : rateFor(scen).imm;
  };

  // Least-squares fit: stabilisation minutes ~ a + b * (RED per responder)
  const pts = sims.map((s) => [s.immediate / s.resources, s.minutes]);
  let a = 15, b = 8, fitted = false;
  if (pts.length >= 3) {
    const mx = pts.reduce((t, p) => t + p[0], 0) / pts.length;
    const my = pts.reduce((t, p) => t + p[1], 0) / pts.length;
    const vx = pts.reduce((t, p) => t + (p[0] - mx) ** 2, 0);
    if (vx > 1e-6) {
      b = pts.reduce((t, p) => t + (p[0] - mx) * (p[1] - my), 0) / vx;
      a = my - b * mx;
      fitted = b > 0;
      if (!fitted) { a = 15; b = 8; }
    }
  }
  const forecast = (cas, res, scen) => {
    const imm = Math.round(cas * immRate(scen));
    const minutes = Math.max(15, Math.round(a + b * (imm / res)));
    const shortfall = Math.max(0, imm - Math.floor(res * 0.4));
    const needed = Math.ceil(imm / 0.4);
    return { imm, minutes, shortfall, needed };
  };

  const carriers = carrierRows.map((r) => ({
    id: r.id, vessel: r.vessel, threat: r.threat_type, intensity: r.threat_intensity,
    med: r.medical_readiness, lod: r.lod_readiness, blood: r.blood_supply,
    surgical: r.surgical_capacity, casualties: r.casualties, status: r.status,
    events: Array.isArray(r.event_log) ? r.event_log.length : 0, created: r.created,
  }));
  const avg = (arr, k) => (arr.length ? arr.reduce((t, x) => t + (x[k] || 0), 0) / arr.length : null);

  const latest = sims[0];
  // nearest previous run by cosine similarity on triage mix
  const vec = (s) => [s.immediate, s.delayed, s.minimal, s.expectant].map((x) => x / s.casualties);
  const cos = (u, v) => {
    const dot = u.reduce((t, x, i) => t + x * v[i], 0);
    return dot / (Math.hypot(...u) * Math.hypot(...v) || 1);
  };
  let nearest = null;
  if (sims.length > 1) {
    const lv = vec(latest);
    sims.slice(1).forEach((s) => {
      const c = cos(lv, vec(s));
      if (!nearest || c > nearest.score) nearest = { run: s, score: c };
    });
  }

  return {
    sims, carriers, usingBaseline, latest, nearest,
    totalCas, imm: sum("immediate"), del: sum("delayed"), min: sum("minimal"), exp: sum("expectant"),
    shortfallRuns: sims.filter((s) => s.shortfall > 0).length,
    avgMinutes: sum("minutes") / sims.length,
    byScenario, immRate, forecast, fit: { a, b, fitted, n: pts.length },
    carrierAvg: { med: avg(carriers, "med"), lod: avg(carriers, "lod"), blood: avg(carriers, "blood") },
    carrierEvents: carriers.reduce((t, c) => t + c.events, 0),
    rl: bandit(latest),
  };
}

export async function loadInnovationData(signal) {
  const [s, c] = await Promise.all([
    pb.collection("fhir_simulations").getList(1, 50, { sort: "-created", signal }).catch((e) => {
      if (e?.isAbort) throw e; return { items: [] };
    }),
    pb.collection("carrier_readiness_scenarios").getList(1, 50, { sort: "-created", signal }).catch((e) => {
      if (e?.isAbort) throw e; return { items: [] };
    }),
  ]);
  return buildAnalytics(s.items, c.items);
}
