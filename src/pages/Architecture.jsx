import ShieldIcon from "icon:shield-check";
import NetworkIcon from "icon:network";
import LockIcon from "icon:lock";
import ServerIcon from "icon:server";
import LayersIcon from "icon:layers";
import KeyIcon from "icon:key";

const LAYERS = [
  {
    id: "L0",
    label: "Physical / Cloud Substrate",
    desc: "GKE Autopilot clusters with Confidential Computing nodes. All storage encrypted with customer-managed keys.",
    color: "#94a3b8",
    items: ["GKE Autopilot", "Confidential VMs", "Cloud KMS", "VPC-SC perimeter"],
  },
  {
    id: "L1",
    label: "Ambient Mesh / ztunnel",
    desc: "Istio Ambient mesh replaces per-pod sidecars. ztunnel operates at node level, enforcing HBONE tunneling and mTLS on every packet.",
    color: "#00e5ff",
    items: ["ztunnel (node-level)", "HBONE tunneling", "Waypoint proxies", "L4 policy enforcement"],
  },
  {
    id: "L2",
    label: "Zero-Trust Identity Layer",
    desc: "SPIFFE/SPIRE issues cryptographic workload identities. Every service presents a verifiable X.509 SVID — no long-lived secrets.",
    color: "#4fc3f7",
    items: ["SPIFFE / SPIRE", "X.509 SVIDs", "Cert-manager rotation", "Peer authentication policies"],
  },
  {
    id: "L3",
    label: "EHR Interop + Data Sovereignty",
    desc: "FHIR R4 API gateway with HL7v2 bridge. All PHI transits the mesh encrypted and stamped with tamper-evident provenance.",
    color: "#6ee7b7",
    items: ["FHIR R4 Gateway", "HL7v2 Bridge", "Data provenance ledger", "De-identification pipeline"],
  },
  {
    id: "L4",
    label: "Google AI Inference Layer",
    desc: "Vertex AI Workbench and Model Garden are mesh-native services — requests authenticated and authorized by the mesh before reaching the model endpoint.",
    color: "#fbbf24",
    items: ["Vertex AI (mesh-native)", "BigQuery ML", "Healthcare NLP API", "Gemini reasoning layer"],
  },
  {
    id: "L5",
    label: "Observability + Audit",
    desc: "Every mesh event flows to Cloud Logging with integrity-verified audit trails, feeding real-time alerting and compliance dashboards.",
    color: "#a78bfa",
    items: ["Istio telemetry (v2)", "Cloud Logging audit trail", "Prometheus + Grafana", "SIEM integration"],
  },
];

export default function Architecture() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4 mesh-bg">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/30 bg-cyan-400/5 text-cyan-400 text-xs font-mono mb-6">
            <NetworkIcon className="w-3 h-3" aria-hidden="true" />
            Sovereign EHR Mesh Architecture
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6">
            The <span className="text-cyan-400">Mesh</span> Stack
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Six layers of cryptographic trust, from bare metal to AI inference —
            each enforced by the mesh, none relying on network perimeter alone.
          </p>
        </div>

        {/* Layer stack */}
        <div className="space-y-4" aria-label="Architecture layers">
          {LAYERS.map((layer, i) => (
            <article
              key={layer.id}
              className="rounded-xl border bg-[#070e18] p-6 hover:bg-[#0a1628] transition-colors duration-200 animate-fade-in-up"
              style={{
                borderColor: `${layer.color}25`,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Layer ID badge */}
                <div
                  className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-mono text-sm font-bold"
                  style={{ background: `${layer.color}15`, color: layer.color, border: `1px solid ${layer.color}30` }}
                  aria-label={`Layer ${layer.id}`}
                >
                  {layer.id}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-semibold text-lg mb-1">{layer.label}</h2>
                  <p className="text-slate-400 text-sm mb-4 leading-relaxed">{layer.desc}</p>
                  <ul className="flex flex-wrap gap-2" role="list">
                    {layer.items.map((item) => (
                      <li
                        key={item}
                        className="px-3 py-1 rounded-full text-xs font-mono"
                        style={{
                          background: `${layer.color}10`,
                          color: layer.color,
                          border: `1px solid ${layer.color}25`,
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Key principles */}
        <section className="mt-20" aria-labelledby="principles-heading">
          <h2 id="principles-heading" className="font-display text-3xl font-bold text-white text-center mb-10">
            Design <span className="text-cyan-400">Principles</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldIcon,
                title: "Never-trust, always-verify",
                body: "Every workload presents cryptographic proof of identity on every request. Position in the network grants nothing.",
              },
              {
                icon: LockIcon,
                title: "Data stays sovereign",
                body: "PHI never crosses jurisdiction boundaries in plaintext. The mesh policy is the enforcement point — not firewall rules.",
              },
              {
                icon: ServerIcon,
                title: "Sidecar-free operations",
                body: "Istio Ambient eliminates per-pod proxies. Policy is enforced at the node, reducing blast radius and resource overhead.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl p-6 border border-cyan-400/15 bg-gradient-to-b from-[#0a1628] to-[#070e18]"
              >
                <Icon className="w-7 h-7 text-cyan-400 mb-4" aria-hidden="true" />
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
