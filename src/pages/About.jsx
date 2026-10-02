import ShieldIcon from "icon:shield-check";
import GitBranchIcon from "icon:git-branch";
import ActivityIcon from "icon:activity";
import GlobeIcon from "icon:globe";

export default function About() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4 mesh-bg">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-wolf-400/30 bg-wolf-400/5 text-wolf-300 text-xs font-mono mb-6">
            <GlobeIcon className="w-3 h-3" aria-hidden="true" />
            About OrcaWolf AI
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Why <span className="text-cyan-400">OrcaWolf</span>?
          </h1>
        </div>

        {/* Mission */}
        <section className="rounded-2xl border border-cyan-400/20 bg-[#070e18] p-8 sm:p-12 mb-10" aria-labelledby="mission-heading">
          <h2 id="mission-heading" className="font-display text-2xl font-bold text-white mb-6">
            The Mission
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              Healthcare data is among the most sensitive information that exists — and yet most 
              EHR infrastructure was built in an era before the internet was adversarial, before 
              AI was a first-class participant in clinical decisions, and long before the regulatory 
              landscape demanded cryptographic proof of where data went and why.
            </p>
            <p>
              OrcaWolf AI is being built to close that gap. The premise is simple: every byte of 
              patient data should be under verifiable control of the institution that owns it, every 
              service-to-service call inside that system should be mutually authenticated, and AI 
              should be able to operate at the speed of clinical need — without ever requiring you 
              to trust a black box or a distant cloud provider's word.
            </p>
            <p>
              The name reflects the architecture's character: the orca for its disciplined, 
              coordinated pack intelligence — and the wolf for its zero-trust instinct. 
              Nothing gets through without being vouched for.
            </p>
          </div>
        </section>

        {/* Pillars */}
        <section aria-labelledby="pillars-about-heading">
          <h2 id="pillars-about-heading" className="font-display text-2xl font-bold text-white mb-6 text-center">
            What we stand for
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            {[
              {
                icon: ShieldIcon,
                title: "Sovereignty first",
                body: "No patient record reaches a compute node — AI or otherwise — that hasn't been authorised by a mesh policy you control and can audit.",
                color: "text-cyan-400",
              },
              {
                icon: ActivityIcon,
                title: "Clinical urgency",
                body: "Mass casualty events don't wait. The simulation and triage tooling here exists because the gap between the worst day and the best possible outcome is often a data-flow problem.",
                color: "text-emerald-400",
              },
              {
                icon: GitBranchIcon,
                title: "Open reasoning",
                body: "Every architecture decision, every mesh policy, every model config lives in version control. If you can't read the policy, you can't trust the policy.",
                color: "text-violet-400",
              },
              {
                icon: GlobeIcon,
                title: "Interoperability without surrender",
                body: "FHIR, HL7, DICOM — the standards matter. But interop should never mean giving up sovereignty. The mesh bridge lets you speak every protocol while staying inside your perimeter.",
                color: "text-wolf-300",
              },
            ].map(({ icon: Icon, title, body, color }) => (
              <div
                key={title}
                className="rounded-xl border border-slate-700/50 bg-[#070e18] p-6 hover:border-cyan-400/25 transition-colors"
              >
                <Icon className={`w-7 h-7 ${color} mb-4`} aria-hidden="true" />
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Connection to orcawolfai.com */}
        <section className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-[#0a1628] to-[#070e18] p-8 text-center">
          <h2 className="font-display text-2xl font-bold text-white mb-3">
            Live at <span className="text-cyan-400">orcawolfai.com</span>
          </h2>
          <p className="text-slate-400 mb-6 max-w-lg mx-auto text-sm">
            This site mirrors the public face of OrcaWolf AI. The production infrastructure,
            simulation engine, and architecture assets are maintained alongside a GitHub-linked
            codebase — so every improvement you make here can flow directly to the live domain.
          </p>
          <a
            href="https://www.orcawolfai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded border border-cyan-400/30 text-cyan-400 text-sm font-medium hover:bg-cyan-400/10 transition-all"
          >
            <GlobeIcon className="w-4 h-4" aria-hidden="true" />
            Visit orcawolfai.com
          </a>
        </section>
      </div>
    </div>
  );
}
