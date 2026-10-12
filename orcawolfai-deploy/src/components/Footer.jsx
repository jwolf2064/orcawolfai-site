import { Link } from "react-router";

export default function Footer() {
  return (
    <footer className="border-t border-cyan-400/10 bg-[#070e18]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <rect width="32" height="32" rx="6" fill="#0a1628"/>
                <path d="M6 22 Q10 8 16 10 Q22 8 26 22" stroke="#00e5ff" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <circle cx="11" cy="16" r="2" fill="#00e5ff"/>
                <circle cx="21" cy="16" r="2" fill="#4fc3f7"/>
                <path d="M11 16 L16 11 L21 16" stroke="#00e5ff" strokeWidth="1" fill="none"/>
              </svg>
              <span className="font-display font-bold text-white">
                Orca<span className="text-cyan-400">Wolf</span>{" "}
                <span className="text-wolf-300 text-xs font-mono">AI</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Sovereign AI-native EHR mesh architecture. Zero-trust. Ambient mesh. 
              Built for the future of healthcare infrastructure.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Platform</h3>
            <ul className="space-y-2" role="list">
              {[
                { to: "/architecture", label: "Mesh Architecture" },
                { to: "/simulation", label: "Mass Casualty Sim" },
                { to: "/innovation", label: "Innovation Lab" },
                { to: "/about", label: "About OrcaWolf" },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-slate-400 hover:text-cyan-400 text-sm transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech stack */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Core Stack</h3>
            <ul className="space-y-2" role="list">
              {[
                "Istio Ambient Mesh / ztunnel",
                "mTLS Zero-Trust Networking",
                "Google AI Developer Suite",
                "Sovereign EHR Interop",
                "Mass Casualty Simulation",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-slate-400 text-sm">
                  <span className="w-1 h-1 rounded-full bg-cyan-400 shrink-0" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-cyan-400/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} OrcaWolf AI. All rights reserved.
          </p>
          <p className="text-slate-600 text-xs font-mono">
            orcawolfai.com · Sovereign Mesh · v0.1
          </p>
        </div>
      </div>
    </footer>
  );
}
