import { Link } from "react-router";
import ShieldIcon from "icon:shield-check";
import NetworkIcon from "icon:network";
import ActivityIcon from "icon:activity";
import ZapIcon from "icon:zap";
import LockIcon from "icon:lock";
import LayersIcon from "icon:layers";
import MailIcon from "icon:mail";

const PILLARS = [
  {
    icon: ShieldIcon,
    label: "Zero-Trust mTLS",
    desc: "Every service-to-service call is mutually authenticated with automatically rotated certificates — no implicit trust, ever.",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
  },
  {
    icon: NetworkIcon,
    label: "Ambient Mesh / ztunnel",
    desc: "Istio Ambient mesh with ztunnel removes the sidecar burden while enforcing policy at every network hop inside your EHR cluster.",
    color: "text-wolf-300",
    bg: "bg-wolf-400/10",
    border: "border-wolf-400/20",
  },
  {
    icon: ActivityIcon,
    label: "Mass Casualty Simulation",
    desc: "Run realistic MCI drills with live AI-driven triage, resource allocation, and outcome modeling — parameterized to your scenario.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  {
    icon: ZapIcon,
    label: "Google AI Suite",
    desc: "Vertex AI, BigQuery, and the full Google developer toolkit woven natively into the sovereign data mesh for real-time intelligence.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  {
    icon: LockIcon,
    label: "Sovereign Data",
    desc: "Patient records stay inside your jurisdiction — encrypted at rest and in motion, with cryptographic proof of data lineage.",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
  },
  {
    icon: LayersIcon,
    label: "EHR Interop Layer",
    desc: "FHIR R4 and HL7v2 bridging through the mesh — translate, route, and audit every clinical data exchange without leaving the perimeter.",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
  },
];

function MeshDiagram() {
  return (
    <div className="relative w-full max-w-sm mx-auto h-64 select-none" aria-hidden="true">
      {/* Central node */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-cyan-400/20 border border-cyan-400/50 flex items-center justify-center animate-node-pulse z-10">
        <span className="text-cyan-400 font-mono text-xs font-bold">OW</span>
      </div>

      {/* Orbital nodes */}
      {[
        { label: "EHR", angle: 0, color: "#00e5ff" },
        { label: "mTLS", angle: 60, color: "#4fc3f7" },
        { label: "AI", angle: 120, color: "#6ee7b7" },
        { label: "Istio", angle: 180, color: "#00e5ff" },
        { label: "FHIR", angle: 240, color: "#fbbf24" },
        { label: "K8s", angle: 300, color: "#a78bfa" },
      ].map(({ label, angle, color }) => {
        const rad = (angle * Math.PI) / 180;
        const r = 90;
        const cx = 50 + r * Math.cos(rad - Math.PI / 2);
        const cy = 50 + r * Math.sin(rad - Math.PI / 2);
        return (
          <div
            key={label}
            className="absolute flex flex-col items-center"
            style={{
              left: `calc(${cx}% - 20px)`,
              top: `calc(${cy}% - 16px)`,
            }}
          >
            {/* connection line — rendered via svg overlay */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: `${color}15`,
                border: `1px solid ${color}40`,
              }}
            >
              <span className="text-[10px] font-mono font-medium" style={{ color }}>
                {label}
              </span>
            </div>
          </div>
        );
      })}

      {/* SVG connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const r = 90;
          const cx = 100 + r * 0.44 * Math.cos(rad - Math.PI / 2);
          const cy = 100 + r * 0.55 * Math.sin(rad - Math.PI / 2);
          return (
            <line
              key={angle}
              x1="100"
              y1="100"
              x2={cx}
              y2={cy}
              stroke="rgba(0,229,255,0.2)"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
          );
        })}
        {/* Outer ring */}
        <circle cx="100" cy="100" r="76" stroke="rgba(0,229,255,0.08)" strokeWidth="1" fill="none" />
        <circle cx="100" cy="100" r="48" stroke="rgba(79,195,247,0.08)" strokeWidth="1" fill="none" />
      </svg>
    </div>
  );
}

export default function Home() {
  return (
    <div className="mesh-bg">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-16 overflow-hidden">
        {/* Ambient glow blobs */}
        <div
          className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #00e5ff, transparent)" }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #4fc3f7, transparent)" }}
          aria-hidden="true"
        />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="animate-fade-in inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/5 text-cyan-400 text-xs font-mono mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" aria-hidden="true" />
            Sovereign EHR Mesh · Zero-Trust · Ambient Architecture
          </div>

          {/* Logo */}
          <div className="animate-fade-in-up flex justify-center mb-8">
            <img
              src="/static/orcawolfai-logo.png"
              alt="OrcaWolf AI"
              className="w-40 h-40 sm:w-52 sm:h-52 rounded-full object-cover ring-4 ring-cyan-400/30 shadow-[0_0_60px_rgba(0,229,255,0.25)] animate-float"
            />
          </div>

          <h1 className="animate-fade-in-up font-display text-5xl sm:text-6xl lg:text-8xl font-extrabold text-white leading-none tracking-tight mb-6">
            Orca<span className="text-cyan-400 glow-text-cyan">Wolf</span>{" "}
            <span className="text-wolf-300">AI</span>
          </h1>

          <p className="animate-fade-in-up delay-200 text-xl sm:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-4 font-light">
            AI-native sovereign EHR architecture.
          </p>
          <p className="animate-fade-in-up delay-300 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Istio Ambient mesh with ztunnel-enforced mTLS, Google AI tooling, and a live Mass Casualty
            simulation engine — designed for the most demanding healthcare environments on earth.
          </p>

          <div className="animate-fade-in-up delay-400 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/simulation"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded bg-cyan-400 text-[#050a0f] font-semibold text-sm hover:bg-cyan-300 transition-all duration-200 glow-cyan"
            >
              <ActivityIcon className="w-4 h-4" aria-hidden="true" />
              Run Mass Casualty Sim
            </Link>
            <Link
              to="/architecture"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded border border-cyan-400/30 text-cyan-400 font-semibold text-sm hover:bg-cyan-400/10 transition-all duration-200"
            >
              <NetworkIcon className="w-4 h-4" aria-hidden="true" />
              Explore Architecture
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded border border-white/15 text-slate-300 font-semibold text-sm hover:bg-white/5 hover:text-white transition-all duration-200"
            >
              <MailIcon className="w-4 h-4" aria-hidden="true" />
              Contact Us
            </Link>
          </div>
        </div>

        {/* Mesh diagram */}
        <div className="animate-fade-in delay-600 mt-16 w-full max-w-sm mx-auto">
          <MeshDiagram />
        </div>
      </section>

      {/* Pillars */}
      <section className="py-24 px-4" aria-labelledby="pillars-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              id="pillars-heading"
              className="font-display text-4xl sm:text-5xl font-bold text-white mb-4"
            >
              Built on{" "}
              <span className="text-cyan-400">sovereign principles</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Every layer of the OrcaWolf architecture is designed to keep clinical data
              under your control, fully auditable, and cryptographically verified.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PILLARS.map(({ icon: Icon, label, desc, color, bg, border }, i) => (
              <article
                key={label}
                className={`gradient-border rounded-xl p-6 flex flex-col gap-4 ${bg} border ${border} hover:scale-[1.02] transition-transform duration-200`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-10 h-10 rounded-lg ${bg} border ${border} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} aria-hidden="true" />
                </div>
                <h3 className={`font-semibold text-white text-lg`}>{label}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-[#0a1628] to-[#070e18] p-10 sm:p-16 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(circle at 30% 50%, #00e5ff22, transparent 60%), radial-gradient(circle at 80% 60%, #4fc3f720, transparent 50%)"
              }}
              aria-hidden="true"
            />
            <div className="relative z-10">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to run your{" "}
                <span className="text-cyan-400">first simulation?</span>
              </h2>
              <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
                Enter your own mass casualty scenario parameters and watch the AI triage,
                resource-allocation, and outcome modeling run in real time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/simulation"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded bg-cyan-400 text-[#050a0f] font-semibold hover:bg-cyan-300 transition-all glow-cyan"
                >
                  <ActivityIcon className="w-4 h-4" aria-hidden="true" />
                  Launch Simulation
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded border border-cyan-400/30 text-cyan-400 font-semibold hover:bg-cyan-400/10 transition-all"
                >
                  <MailIcon className="w-4 h-4" aria-hidden="true" />
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
