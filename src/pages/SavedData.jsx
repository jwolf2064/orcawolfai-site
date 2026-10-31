import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { pb } from "../lib/pb.js";
import DownloadIcon from "icon:download";
import RefreshIcon from "icon:refresh-cw";

const fmtDate = (d) => (d ? new Date(d.replace(" ", "T")).toLocaleString() : "—");
const pct = (n) => (typeof n === "number" ? `${Math.round(n)}%` : "—");

function download(name, mime, text) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toCsv(rows, cols) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

const MCI_COLS = ["created", "scenario", "location", "casualties", "resources", "immediate", "delayed", "minimal", "expectant", "resource_shortfall", "estimated_minutes"];
const CAR_COLS = ["created", "vessel", "threat_type", "threat_intensity", "crew_complement", "status", "casualties", "medical_readiness", "lod_readiness", "blood_supply", "surgical_capacity"];

async function fetchAll(name, signal) {
  const items = [];
  for (let page = 1; page <= 10; page++) {
    const res = await pb.collection(name).getList(page, 100, { sort: "-created", signal });
    items.push(...res.items);
    if (page >= res.totalPages) break;
  }
  return items;
}

export default function SavedData() {
  const [tab, setTab] = useState("mci");
  const [mci, setMci] = useState([]);
  const [car, setCar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);

  const load = useCallback((signal) => {
    setLoading(true);
    setError("");
    return Promise.all([fetchAll("fhir_simulations", signal), fetchAll("carrier_readiness_scenarios", signal)])
      .then(([a, b]) => { setMci(a); setCar(b); })
      .catch((e) => { if (!e?.isAbort) setError("We couldn't load your saved runs just now. Please press Refresh."); })
      .finally(() => { if (!signal?.aborted) setLoading(false); });
  }, []);

  useEffect(() => {
    const c = new AbortController();
    load(c.signal);
    return () => c.abort();
  }, [load]);

  const rows = tab === "mci" ? mci : car;
  const stats = useMemo(() => {
    const avg = (arr, k) => (arr.length ? arr.reduce((t, r) => t + (Number(r[k]) || 0), 0) / arr.length : 0);
    return tab === "mci"
      ? [["Runs saved", mci.length], ["Total casualties simulated", mci.reduce((t, r) => t + (r.casualties || 0), 0).toLocaleString()], ["Average minutes to stabilise", Math.round(avg(mci, "estimated_minutes"))], ["Runs with a shortfall", mci.filter((r) => r.resource_shortfall > 0).length]]
      : [["Exercises saved", car.length], ["Average medical readiness", pct(avg(car, "medical_readiness"))], ["Average line-of-duty readiness", pct(avg(car, "lod_readiness"))], ["Critical exercises", car.filter((r) => r.status === "CRITICAL").length]];
  }, [tab, mci, car]);

  const tabCls = (id) => `min-h-[44px] px-5 rounded-md text-sm font-semibold border transition-colors ${tab === id ? "bg-cyan-400 text-[#050a0f] border-cyan-400" : "text-cyan-200 border-cyan-400/30 hover:bg-cyan-400/10"}`;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 mesh-bg">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <p className="font-mono text-xs tracking-widest text-cyan-300 mb-2">YOUR DATA</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">Saved Runs &amp; Exercises</h1>
          <p className="text-slate-300 max-w-3xl">Every Mass Casualty run and Carrier Readiness exercise saved on this site, in one place. These are the same figures the <Link to="/innovation" className="text-cyan-300 underline underline-offset-4">Innovation</Link> flows are calculated from. All data is synthetic training data.</p>
        </header>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div role="tablist" aria-label="Saved data type" className="flex gap-3">
            <button role="tab" aria-selected={tab === "mci"} className={tabCls("mci")} onClick={() => { setTab("mci"); setOpen(null); }}>Mass Casualty runs ({mci.length})</button>
            <button role="tab" aria-selected={tab === "car"} className={tabCls("car")} onClick={() => { setTab("car"); setOpen(null); }}>Carrier exercises ({car.length})</button>
          </div>
          <div className="flex gap-3 ml-auto">
            <button type="button" onClick={() => load()} className="min-h-[44px] inline-flex items-center gap-2 px-4 rounded-md border border-cyan-400/40 text-cyan-200 text-sm hover:bg-cyan-400/10">
              <RefreshIcon className="w-4 h-4" aria-hidden="true" /> Refresh
            </button>
            <button type="button" disabled={!rows.length} onClick={() => download(`orcawolf-${tab === "mci" ? "mass-casualty-runs" : "carrier-exercises"}.csv`, "text/csv", toCsv(rows, tab === "mci" ? MCI_COLS : CAR_COLS))} className="min-h-[44px] inline-flex items-center gap-2 px-4 rounded-md border border-cyan-400/40 text-cyan-200 text-sm hover:bg-cyan-400/10 disabled:opacity-50">
              <DownloadIcon className="w-4 h-4" aria-hidden="true" /> Download CSV
            </button>
            <button type="button" disabled={!rows.length} onClick={() => download(`orcawolf-${tab === "mci" ? "mass-casualty-runs" : "carrier-exercises"}.json`, "application/json", JSON.stringify(rows.map(({ fhir_bundle, embedding_vector, ...r }) => r), null, 2))} className="min-h-[44px] inline-flex items-center gap-2 px-4 rounded-md border border-cyan-400/40 text-cyan-200 text-sm hover:bg-cyan-400/10 disabled:opacity-50">
              <DownloadIcon className="w-4 h-4" aria-hidden="true" /> Download JSON
            </button>
          </div>
        </div>

        {error && <p role="alert" className="mb-4 rounded-md border border-red-400/40 bg-red-950/40 p-3 text-red-200 text-sm">{error}</p>}

        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {stats.map(([k, v]) => (
            <div key={k} className="rounded-xl border border-cyan-400/20 bg-[#0a1628] p-4">
              <dt className="text-xs text-slate-300">{k}</dt>
              <dd className="font-display text-2xl font-bold text-white mt-1">{v}</dd>
            </div>
          ))}
        </dl>

        {loading ? (
          <p className="text-slate-300" role="status">Loading your saved data…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-cyan-400/20 bg-[#0a1628] p-8 text-center">
            <p className="text-white font-semibold mb-2">Nothing saved here yet</p>
            <p className="text-slate-300 mb-4">{tab === "mci" ? "Run a Mass Casualty simulation and it will appear here." : "Run a Carrier Readiness exercise and it will appear here."}</p>
            <Link to={tab === "mci" ? "/simulation" : "/carrier-readiness"} className="inline-flex items-center min-h-[44px] px-5 rounded-md bg-cyan-400 text-[#050a0f] font-semibold">{tab === "mci" ? "Open MCI Simulation" : "Open Carrier Readiness"}</Link>
          </div>
        ) : (
          <div className="rounded-xl border border-cyan-400/20 bg-[#0a1628] overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[720px]">
              <caption className="sr-only">{tab === "mci" ? "Saved Mass Casualty runs" : "Saved Carrier Readiness exercises"}</caption>
              <thead className="text-slate-300 border-b border-cyan-400/20">
                {tab === "mci" ? (
                  <tr>{["When", "Scenario", "Location", "Casualties", "Responders", "Red", "Yellow", "Green", "Black", "Minutes"].map((h) => <th key={h} scope="col" className="px-3 py-3 font-semibold">{h}</th>)}</tr>
                ) : (
                  <tr>{["When", "Vessel", "Threat", "Status", "Medical", "Line of duty", "Casualties", "Details"].map((h) => <th key={h} scope="col" className="px-3 py-3 font-semibold">{h}</th>)}</tr>
                )}
              </thead>
              <tbody className="text-slate-100">
                {rows.map((r) => tab === "mci" ? (
                  <tr key={r.id} className="border-b border-cyan-400/10">
                    <td className="px-3 py-2.5 whitespace-nowrap">{fmtDate(r.created)}</td>
                    <td className="px-3 py-2.5">{String(r.scenario || "").replace(/_/g, " ")}</td>
                    <td className="px-3 py-2.5">{r.location || "—"}</td>
                    <td className="px-3 py-2.5">{r.casualties}</td>
                    <td className="px-3 py-2.5">{r.resources}</td>
                    <td className="px-3 py-2.5 text-red-300 font-semibold">{r.immediate}</td>
                    <td className="px-3 py-2.5 text-amber-300 font-semibold">{r.delayed}</td>
                    <td className="px-3 py-2.5 text-emerald-300 font-semibold">{r.minimal}</td>
                    <td className="px-3 py-2.5 text-slate-200 font-semibold">{r.expectant}</td>
                    <td className="px-3 py-2.5">{r.estimated_minutes}</td>
                  </tr>
                ) : (
                  <>
                    <tr key={r.id} className="border-b border-cyan-400/10">
                      <td className="px-3 py-2.5 whitespace-nowrap">{fmtDate(r.created)}</td>
                      <td className="px-3 py-2.5">{r.vessel}</td>
                      <td className="px-3 py-2.5">{String(r.threat_type || "").replace(/_/g, " ")} · {r.threat_intensity}%</td>
                      <td className={`px-3 py-2.5 font-semibold ${r.status === "CRITICAL" ? "text-red-300" : r.status === "HIGH" ? "text-orange-300" : r.status === "ELEVATED" ? "text-amber-300" : "text-emerald-300"}`}>{r.status}</td>
                      <td className="px-3 py-2.5">{pct(r.medical_readiness)}</td>
                      <td className="px-3 py-2.5">{pct(r.lod_readiness)}</td>
                      <td className="px-3 py-2.5">{r.casualties}</td>
                      <td className="px-3 py-2.5">
                        <button type="button" aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)} className="min-h-[44px] px-3 text-cyan-300 underline underline-offset-4">{open === r.id ? "Hide" : "Show"}</button>
                      </td>
                    </tr>
                    {open === r.id && (
                      <tr key={`${r.id}-d`} className="border-b border-cyan-400/10 bg-[#070e18]">
                        <td colSpan={8} className="px-4 py-4">
                          <p className="text-slate-200 mb-3">{r.semantic_summary || "No summary saved."}</p>
                          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-200 list-none p-0">
                            {[["Surgical", r.surgical_capacity], ["Blood", r.blood_supply], ["Pharmacy", r.pharmacy], ["Mental health", r.mental_health], ["Fitness", r.personnel_fitness], ["Preventive", r.preventive_medicine], ["Dental", r.dental_readiness], ["Watch fill", r.watch_station_fill], ["DC cert", r.dc_certification], ["Flight deck", r.flight_deck_crew], ["Battle stations", r.battle_station], ["Watch quals", r.watch_quals]].map(([k, v]) => (
                              <li key={k} className="rounded border border-cyan-400/15 px-2 py-1.5">{k}: <strong className="text-white">{pct(v)}</strong></li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
