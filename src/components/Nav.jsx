import { useState, useEffect } from "react";
import { NavLink } from "react-router";
import MenuIcon from "icon:menu";
import XIcon from "icon:x";

const links = [
  { to: "/", label: "Home" },
  { to: "/architecture", label: "Architecture" },
  { to: "/simulation", label: "MassCasualty Sim" },
  { to: "/innovation", label: "Innovation" },
  { to: "/about", label: "About" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#050a0f]/95 backdrop-blur-md border-b border-cyan-400/10"
          : "bg-transparent"
      }`}
    >
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <NavLink
          to="/"
          className="flex items-center gap-2 group"
          aria-label="OrcaWolf AI — Home"
        >
          <img
            src="/static/orcawolfai-logo.png"
            alt="OrcaWolf AI"
            className="w-10 h-10 rounded-full object-cover ring-1 ring-cyan-400/30 group-hover:ring-cyan-400/60 transition-all duration-200"
          />
          <span className="font-display font-800 text-lg text-white tracking-tight">
            Orca<span className="text-cyan-400">Wolf</span>{" "}
            <span className="text-wolf-300 text-sm font-normal font-mono">AI</span>
          </span>
        </NavLink>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1" role="list">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-cyan-400 bg-cyan-400/10"
                      : "text-slate-300 hover:text-cyan-300 hover:bg-white/5"
                  }`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded border border-cyan-400/30 text-cyan-400 text-sm font-medium hover:bg-cyan-400/10 transition-all duration-200"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            GitHub
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded text-slate-300 hover:text-cyan-400 hover:bg-white/5 transition-colors"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-cyan-400/10 bg-[#050a0f]/98 backdrop-blur-md"
        >
          <ul className="px-4 py-4 space-y-1" role="list">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-3 rounded text-sm font-medium transition-all ${
                      isActive
                        ? "text-cyan-400 bg-cyan-400/10"
                        : "text-slate-300 hover:text-cyan-300 hover:bg-white/5"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
            <li className="pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-3 rounded border border-cyan-400/30 text-cyan-400 text-sm font-medium hover:bg-cyan-400/10 transition-all"
              >
                GitHub Subscription
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
