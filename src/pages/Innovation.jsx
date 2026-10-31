import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";
import ZapIcon from "icon:zap";
import CpuIcon from "icon:cpu";
import GitBranchIcon from "icon:git-branch";
import DatabaseIcon from "icon:database";
import GlobeIcon from "icon:globe";
import TrendingUpIcon from "icon:trending-up";
import RefreshIcon from "icon:refresh-cw";
import XIcon from "icon:x";
import { GROUPS } from "../lib/innovationGroups";
import { loadInnovationData, buildAnalytics } from "../lib/innovationData";

const ICONS = { ehr: CpuIcon, fed: GlobeIcon, gitops: GitBranchIcon, datamesh: DatabaseIcon, mci: ZapIcon, optimizer: TrendingUpIcon };

function Detail({ group, node, data, ctx, onClose, idx }) {
  const out = node.build(data, ctx);
  const computed = node.kind === "data";
  return (
    <section
      aria-labelledby={`${group.id}-detail-title`}
      className="mt-5 rounded-xl border bg-[#050a0f] p-5 sm:p-6 animate-fade-in"
      style={{ borderColor: `${group.accent}66` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-mono mb-1" style={{ color: group.accent }}>Step {idx + 1} of {group.nodes.length} · {node.stage}</p>
          <h3 id={`${group.id}-detail-title`} className="text-xl font-bold text-white">{node.key}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono px-2.5 py-1 rounded-full border ${computed ? "border-emerald-400/40 text-emerald-300 bg-emerald-400/10" : "border-amber-400/40 text-amber-300 bg-amber-400/10"}`}>
            {computed ? "Computed from your runs" : "Illustrative reference"}
          </span>
          <button type="button" onClick={onClose} className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-md border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400" >
            <XIcon className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only">Close details</span>
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {out.stats.map(([k, v]) => (
          <div key={k} className="rounded-lg bg-[#0a1628] border border-slate-700/60 px-4 py-3 min-w-0">
            <dt className="text-xs text-slate-300">{k}</dt>
            <dd className="font-mono text-base text-white mt-1 break-words">{String(v)}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="space-y-4 text-sm leading-relaxed">
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider mb-1" style={{ color: group.accent }}>What it does</h4>
            <p className="text-slate-200">{out.what}</p>
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider mb-1" style={{ color: group.accent }}>Where the data comes from</h4>
            <p className="text-slate-200">{out.source}</p>
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider mb-1" style={{ color: group.accent }}>What it produces</h4>
            <p className="text-slate-200">{out.output}</p>
          </div>
          {out.link && (
            <Link to={out.link.to} className="inline-flex items-center min-h-[40px] text-cyan-300 underline underline-offset-4 hover:text-cyan-100">{out.link.label} →</Link>
          )}
        </div>
        <div className="min-w-0 space-y-4">
          {out.controls}
          {out.visual}
        </div>
      </div>
    </section>
  );
}

function GroupCard({ group, data, ctx, index }) {
  const [sel, setSel] = useState(null);
  const Icon = ICONS[group.id];
  const node = sel !== null ? group.nodes[sel] : null;

  return (
    <article
      className="flow-card rounded-2xl border border-slate-700/60 bg-[#070e18] p-5 sm:p-7 transition-colors duration-200 hover:bg-[#0a1628] animate-fade-in-up"
      style={{ animationDelay: `${index * 0.08}s`, borderColor: sel !== null ? `${group.accent}88` : undefined }}
    >
      <div className="flex flex-wrap items-start gap-4 mb-6">
        <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border" style={{ background: `${group.accent}1a`, borderColor: `${group.accent}44` }}>
          <Icon className="w-5 h-5" style={{ color: group.accent }} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-[16rem]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-white font-semibold text-xl">{group.title}</h2>
            <span className={`text-xs font-mono font-medium ${group.statusColor} flex items-center gap-1.5`}>
              <span className={`w-1.5 h-1.5 rounded-full ${group.statusColor.replace("text-", "bg-")} animate-pulse`} aria-hidden="true" />
              {group.status}
            </span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed mt-2 max-w-3xl">{group.body}</p>
        </div>
      </div>

      {/* Workflow diagram */}
      <ol className="flex flex-col lg:flex-row lg:items-stretch gap-2 lg:gap-0 list-none p-0 m-0" style={{ color: group.accent }} aria-label={`${group.title} workflow`}>
        <li className="lg:w-36 shrink-0 flex">
          <div className="w-full rounded-lg border border-dashed border-slate-600 px-3 py-3 text-xs text-slate-300 flex flex-col justify-center">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Input</span>
            {group.input}
          </div>
        </li>
        {group.nodes.map((n, i) => (
          <li key={n.key} className="contents">
            <span className="flow-link hidden lg:block self-center w-6 shrink-0" aria-hidden="true" />
            <span className="lg:hidden text-center leading-none text-lg" aria-hidden="true">↓</span>
            <div className="flex-1 flex min-w-0">
              <button
                type="button"
                aria-pressed={sel === i}
                aria-controls={`${group.id}-detail`}
                onClick={() => setSel(sel === i ? null : i)}
                className="w-full text-left rounded-lg border px-4 py-3 min-h-[76px] transition-all duration-150 cursor-pointer hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  borderColor: sel === i ? group.accent : "#334155",
                  background: sel === i ? `${group.accent}26` : "#0a1628",
                  outlineColor: group.accent,
                  boxShadow: sel === i ? `0 0 22px ${group.accent}33` : undefined,
                }}
              >
                <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">Step {i + 1}</span>
                <span className="block text-sm font-semibold text-white leading-snug">{n.key}</span>
                <span className="block text-xs text-slate-300 mt-0.5">{n.stage}</span>
              </button>
            </div>
          </li>
        ))}
        <li className="contents">
          <span className="flow-link hidden lg:block self-center w-6 shrink-0" aria-hidden="true" />
          <span className="lg:hidden text-center leading-none text-lg" aria-hidden="true">↓</span>
          <div className="lg:w-36 shrink-0 flex">
            <div className="w-full rounded-lg border px-3 py-3 text-xs text-white flex flex-col justify-center" style={{ borderColor: `${group.accent}77`, background: `${group.accent}14` }}>
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-300">Output</span>
              {group.output}
            </div>
          </div>
        </li>
      </ol>

      <div id={`${group.id}-detail`}>
        {node ? (
          <Detail key={node.key} group={group} node={node} idx={sel} data={data} ctx={ctx} onClose={() => setSel(null)} />
        ) : (
          <p className="mt-4 text-xs text-slate-300 font-mono">Select a step above to see the data behind it.</p>
        )}
      </div>
    </article>
  );
}

export default function Innovation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eps, setEps] = useState(1);
  const [res, setRes] = useState(25);
  const [scen, setScen] = useState("blast");

  const load = useCallback(() => {
    const controller = new AbortController();
    setLoading(true);
    loadInnovationData(controller.signal)
      .then(setData)
      .catch((e) => { if (!e?.isAbort) setData(buildAnalytics([], [])); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => load(), [load]);

  const ctx = { eps, setEps, res, setRes, scen, setScen };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 mesh-bg">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-400/30 bg-violet-400/5 text-violet-300 text-xs font-mono mb-6">
            <ZapIcon className="w-3 h-3" aria-hidden="true" />
            Innovation Lab
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6">
            Research &amp; <span className="text-cyan-400">Ideas</span>, in action
          </h1>
          <p className="text-slate-300 text-lg max-w-3xl mx-auto">
            Six research tracks, each shown as a working flow. Select any step to see the data behind it — what it is calculated from and what it predicts — using the simulations you have run on this site.
          </p>
        </div>

        {/* Data provenance strip */}
        <div className="rounded-xl border border-cyan-400/25 bg-[#0a1628] p-4 sm:p-5 mb-8 flex flex-wrap items-center justify-between gap-4" role="status" aria-live="polite">
          <div className="text-sm text-slate-200 max-w-3xl">
            {loading || !data ? (
              "Loading your simulation data…"
            ) : data.usingBaseline ? (
              <>No Mass Casualty runs are saved yet, so reference scenarios are shown{data.carriers.length > 0 ? `, alongside ${data.carriers.length} saved carrier exercise${data.carriers.length === 1 ? "" : "s"}` : ""}. <Link to="/simulation" className="text-cyan-300 underline underline-offset-4">Run a Mass Casualty simulation</Link>, then press Refresh data. Your saved runs are listed under “Recent Simulation Runs” at the bottom of that page.</>
            ) : (
              <>Calculated live from <strong className="text-white">{data.sims.length} simulation run{data.sims.length === 1 ? "" : "s"}</strong> and <strong className="text-white">{data.carriers.length} carrier exercise{data.carriers.length === 1 ? "" : "s"}</strong> saved on this site. View them in <Link to="/simulation" className="text-cyan-300 underline underline-offset-4">Recent Simulation Runs</Link> and <Link to="/carrier" className="text-cyan-300 underline underline-offset-4">Mission History</Link>. All figures are synthetic training data — no operational feeds, no live cloud calls.</>
            )}
          </div>
          <button type="button" onClick={load} className="min-h-[40px] inline-flex items-center gap-2 px-4 rounded-md border border-cyan-400/40 text-cyan-300 text-sm hover:bg-cyan-400/10">
            <RefreshIcon className="w-4 h-4" aria-hidden="true" />
            Refresh data
          </button>
        </div>

        {/* Legend */}
        <ul className="flex flex-wrap gap-x-6 gap-y-2 justify-center mb-10 text-sm list-none p-0" aria-label="Legend">
          {[
            ["Production", "text-cyan-400", "bg-cyan-400"],
            ["Active Research", "text-emerald-400", "bg-emerald-400"],
            ["Prototype", "text-amber-400", "bg-amber-400"],
          ].map(([l, c, dot]) => (
            <li key={l} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${dot}`} aria-hidden="true" />
              <span className={c}>{l}</span>
            </li>
          ))}
        </ul>

        {data ? (
          <div className="flex flex-col gap-6">
            {GROUPS.map((g, i) => <GroupCard key={g.id} group={g} data={data} ctx={ctx} index={i} />)}
          </div>
        ) : (
          <p className="text-center text-slate-300 py-20">Loading…</p>
        )}

        <div className="mt-16 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-[#0a1628] to-[#070e18] p-10 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Follow the work on <span className="text-cyan-400">GitHub</span>
          </h2>
          <p className="text-slate-300 mb-8 max-w-lg mx-auto">
            The OrcaWolf codebase — simulation engine, mesh configuration, and AI pipeline — lives on GitHub.
          </p>
          <a
            href="https://github.com/jwolf2064/orcawolfai-site"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 min-h-[44px] rounded border border-cyan-400/30 text-cyan-300 font-semibold text-sm hover:bg-cyan-400/10 transition-all"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
