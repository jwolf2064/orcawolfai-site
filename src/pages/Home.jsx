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
    guide: "/OrcaWolfAI-UserGuide.html#pillar-mtls",
  },
  {
    icon: NetworkIcon,
    label: "Ambient Mesh / ztunnel",
    desc: "Istio Ambient mesh with ztunnel removes the sidecar burden while enforcing policy at every network hop inside your EHR cluster.",
    color: "text-wolf-300",
    bg: "bg-wolf-400/10",
    border: "border-wolf-400/20",
    guide: "/OrcaWolfAI-UserGuide.html#pillar-ambient-mesh",
  },
  {
    icon: ActivityIcon,
    label: "Mass Casualty Simulation",
    desc: "Run realistic MCI drills with live AI-driven triage, resource allocation, and outcome modeling — parameterized to your scenario.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    guide: "/OrcaWolfAI-UserGuide.html#pillar-mci",
  },
  {
    icon: ZapIcon,
    label: "Google AI Suite",
    desc: "Vertex AI, BigQuery, and the full Google developer toolkit woven natively into the sovereign data mesh for real-time intelligence.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    guide: "/OrcaWolfAI-UserGuide.html#pillar-google-ai",
  },
  {
    icon: LockIcon,
    label: "Sovereign Data",
    desc: "Patient records stay inside your jurisdiction — encrypted at rest and in motion, with cryptographic proof of data lineage.",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
    guide: "/OrcaWolfAI-UserGuide.html#pillar-sovereign-data",
  },
  {
    icon: LayersIcon,
    label: "EHR Interop Layer",
    desc: "FHIR R4 and HL7v2 bridging through the mesh — translate, route, and audit every clinical data exchange without leaving the perimeter.",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
    guide: "/OrcaWolfAI-UserGuide.html#pillar-ehr-interop",
  },
];

function EcosystemImage() {
  return (
    <div className="relative w-full max-w-5xl mx-auto mt-16 select-none group" aria-label="OrcaWolf AI global ecosystem — StarShield satellite backhaul connecting carriers, hospital ships and next echelons of care">
      {/* Outer glow ring */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400/20 via-blue-500/10 to-cyan-400/20 blur-xl opacity-60 group-hover:opacity-90 transition-opacity duration-700 pointer-events-none" aria-hidden="true" />
      {/* Image */}
      <img
        src="/static/gen_orcawolfai-ecosystem-hero-39ada8.webp"
        alt="OrcaWolf AI sovereign mesh ecosystem — StarShield satellite constellation connecting two US Navy carriers, USNS Mercy hospital ship, and Kuwait coalition hospital via cyan mesh telemetry arcs"
        className="relative w-full rounded-2xl border border-cyan-400/20 shadow-[0_0_80px_rgba(0,229,255,0.15)] object-cover"
        style={{ maxHeight: "520px" }}
      />
      {/* Caption bar */}
      <div className="absolute bottom-0 left-0 right-0 rounded-b-2xl bg-gradient-to-t from-[#050a0f]/90 to-transparent px-6 py-4 flex flex-wrap items-center gap-3">
        {[
          { label: "StarShield Backhaul", color: "#fbbf24" },
          { label: "Carrier Strike Group", color: "#00e5ff" },
          { label: "USNS Hospital Ship", color: "#6ee7b7" },
          { label: "Role 4 — Kuwait", color: "#f97316" },
          { label: "Sovereign Mesh", color: "#a78bfa" },
        ].map(({ label, color }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium px-2 py-1 rounded-full"
            style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>
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

        {/* Ecosystem image */}
        <div className="animate-fade-in delay-600 w-full px-4">
          <EcosystemImage />
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
            {PILLARS.map(({ icon: Icon, label, desc, color, bg, border, guide }, i) => (
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
                <a
                  href={guide}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-auto inline-flex items-center gap-1 text-xs font-semibold ${color} hover:underline underline-offset-2 transition-opacity opacity-80 hover:opacity-100`}
                  aria-label={`Read about ${label} in the User Guide`}
                >
                  Read in User Guide
                  <span aria-hidden="true">→</span>
                </a>
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
