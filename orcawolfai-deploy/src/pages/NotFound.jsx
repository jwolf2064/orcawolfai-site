import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center mesh-bg">
      <p className="font-mono text-cyan-400 text-sm mb-4 tracking-widest">404 · NODE NOT FOUND</p>
      <h1 className="font-display text-5xl sm:text-7xl font-extrabold text-white mb-6">
        Lost in the <span className="text-cyan-400">mesh</span>
      </h1>
      <p className="text-slate-400 mb-10 max-w-md">
        That route doesn't resolve to any known service endpoint. Let's get you back to a known node.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-8 py-4 rounded bg-cyan-400 text-[#050a0f] font-semibold text-sm hover:bg-cyan-300 transition-all glow-cyan"
      >
        Return Home
      </Link>
    </div>
  );
}
