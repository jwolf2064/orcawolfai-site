import ZapIcon from "icon:zap";
import CpuIcon from "icon:cpu";
import GitBranchIcon from "icon:git-branch";
import DatabaseIcon from "icon:database";
import GlobeIcon from "icon:globe";
import TrendingUpIcon from "icon:trending-up";

const INNOVATIONS = [
  {
    icon: CpuIcon,
    title: "AI-Native EHR Processing",
    status: "Active Research",
    statusColor: "text-emerald-400",
    body: "Large language models trained on de-identified clinical corpora reason over structured FHIR data, surfacing triage insights, diagnostic differentials, and protocol recommendations — all within the sovereign mesh boundary.",
    tags: ["Vertex AI", "FHIR R4", "Clinical NLP", "RAG pipeline"],
  },
  {
    icon: GlobeIcon,
    title: "Federated Mesh Learning",
    status: "Prototype",
    statusColor: "text-amber-400",
    body: "Model weights improve across hospital systems without raw data ever leaving each facility. Differential privacy and secure aggregation run as mesh-native waypoint policies — verifiable without trust in a central coordinator.",
    tags: ["Federated Learning", "Differential Privacy", "Waypoint Policy", "Secure Aggregation"],
  },
  {
    icon: GitBranchIcon,
    title: "Ambient Mesh GitOps",
    status: "Active Research",
    statusColor: "text-emerald-400",
    body: "Istio AuthorizationPolicy and PeerAuthentication manifests managed as code — every mesh policy change goes through a signed, audited GitOps pipeline, giving operations teams full lineage of who changed what and when.",
    tags: ["Argo CD", "Policy as Code", "SPIFFE signing", "Audit lineage"],
  },
  {
    icon: DatabaseIcon,
    title: "Sovereign Data Mesh",
    status: "Production",
    statusColor: "text-cyan-400",
    body: "Each domain (ED, ICU, pharmacy, radiology) owns its data product. Mesh-enforced data contracts between domains replace hand-crafted ETL pipelines — with cryptographic provenance on every record.",
    tags: ["Data Mesh", "Data Contracts", "Data Provenance", "Domain ownership"],
  },
  {
    icon: ZapIcon,
    title: "Real-Time MCI Intelligence",
    status: "Active Research",
    statusColor: "text-emerald-400",
    body: "Streaming vitals, triage tags, and resource signals fed through Pub/Sub into AI models give incident commanders a continuously updated picture — time-to-treatment predictions accurate to within minutes.",
    tags: ["Pub/Sub streaming", "Edge inference", "Vertex Forecast", "Resource modeling"],
  },
  {
    icon: TrendingUpIcon,
    title: "Outcome-Driven Resource Optimizer",
    status: "Prototype",
    statusColor: "text-amber-400",
    body: "Reinforcement learning agent trained on historical MCI outcome data suggests real-time re-allocation of personnel, OR capacity, and blood supply — balancing survival probability across the entire incident population.",
    tags: ["Reinforcement Learning", "Multi-objective optimization", "Gemini reasoning", "Live telemetry"],
  },
];

export default function Innovation() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4 mesh-bg">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-400/30 bg-violet-400/5 text-violet-400 text-xs font-mono mb-6">
            <ZapIcon className="w-3 h-3" aria-hidden="true" />
            Innovation Lab
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6">
            Research &amp; <span className="text-cyan-400">Ideas</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            What we're building toward — the ideas and prototypes shaping the next
            generation of sovereign AI-native healthcare infrastructure.
          </p>
        </div>

        {/* Status legend */}
        <div className="flex flex-wrap gap-4 justify-center mb-10" aria-label="Status legend">
          {[
            { label: "Production", color: "text-cyan-400", dot: "bg-cyan-400" },
            { label: "Active Research", color: "text-emerald-400", dot: "bg-emerald-400" },
            { label: "Prototype", color: "text-amber-400", dot: "bg-amber-400" },
          ].map(({ label, color, dot }) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${dot}`} aria-hidden="true" />
              <span className={color}>{label}</span>
            </div>
          ))}
        </div>

        {/* Innovation cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {INNOVATIONS.map(({ icon: Icon, title, status, statusColor, body, tags }, i) => (
            <article
              key={title}
              className="rounded-xl border border-slate-700/60 bg-[#070e18] p-6 hover:border-cyan-400/30 hover:bg-[#0a1628] transition-all duration-200 animate-fade-in-up flex flex-col gap-4"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-cyan-400" aria-hidden="true" />
                </div>
                <span className={`text-xs font-mono font-medium ${statusColor} flex items-center gap-1.5`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusColor.replace("text-", "bg-")} animate-pulse`} aria-hidden="true" />
                  {status}
                </span>
              </div>
              <h2 className="text-white font-semibold text-lg leading-snug">{title}</h2>
              <p className="text-slate-400 text-sm leading-relaxed flex-1">{body}</p>
              <ul className="flex flex-wrap gap-2" role="list">
                {tags.map((tag) => (
                  <li
                    key={tag}
                    className="px-2.5 py-1 rounded-full text-xs font-mono text-slate-400 bg-slate-800 border border-slate-700"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* GitHub callout */}
        <div className="mt-16 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-[#0a1628] to-[#070e18] p-10 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Follow the work on <span className="text-cyan-400">GitHub</span>
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            The OrcaWolf codebase — simulation engine, mesh configuration, and AI pipeline — 
            lives in GitHub. Connect your subscription to pull from and contribute to the repo.
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded border border-cyan-400/30 text-cyan-400 font-semibold text-sm hover:bg-cyan-400/10 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
