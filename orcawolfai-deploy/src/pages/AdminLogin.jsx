import { useState } from "react";
import { useNavigate } from "react-router";
import { pb } from "../lib/pb.js";
import ShieldIcon from "icon:shield";
import EyeIcon from "icon:eye";
import EyeOffIcon from "icon:eye-off";

export default function AdminLogin() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate                = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    try {
      await pb.collection("admin_users").authWithPassword(email.trim(), password);
      navigate("/admin");
    } catch {
      setError("Incorrect email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050a0f] flex items-center justify-center px-4">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" aria-hidden="true"
        style={{backgroundImage:"linear-gradient(#00e5ff 1px,transparent 1px),linear-gradient(90deg,#00e5ff 1px,transparent 1px)",backgroundSize:"40px 40px"}} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/static/orcawolfai-logo.png" alt="OrcaWolf AI"
            className="w-20 h-20 rounded-full object-cover ring-2 ring-cyan-400/40 mx-auto mb-4" />
          <p className="font-display text-xl font-bold text-white">OrcaWolf AI</p>
          <p className="text-cyan-400 text-sm font-mono mt-1">Admin Access</p>
        </div>

        <form onSubmit={handleSubmit} noValidate aria-label="Admin login"
          className="rounded-2xl border border-white/8 bg-[#070e18] p-8 space-y-5 shadow-[0_0_60px_rgba(0,229,255,0.05)]">

          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-cyan-400/10 flex items-center justify-center">
              <ShieldIcon className="w-5 h-5 text-cyan-400" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-base">Secure sign-in</h1>
              <p className="text-slate-400 text-xs">Authorised personnel only</p>
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-slate-200 mb-2">
              Email address
            </label>
            <input id="admin-email" type="email" autoComplete="email"
              value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
              aria-required="true"
              placeholder="admin@orcawolfai.com"
              className="w-full px-4 py-3 rounded-lg bg-[#0a1628] text-white placeholder-slate-500 border border-white/10 focus:border-cyan-400/40 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-colors" />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-slate-200 mb-2">
              Password
            </label>
            <div className="relative">
              <input id="admin-password" type={showPw ? "text" : "password"} autoComplete="current-password"
                value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                aria-required="true"
                placeholder="••••••••••••"
                className="w-full px-4 py-3 pr-11 rounded-lg bg-[#0a1628] text-white placeholder-slate-500 border border-white/10 focus:border-cyan-400/40 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-colors" />
              <button type="button" onClick={() => setShowPw(s => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showPw ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-red-400 text-sm text-center py-2 px-3 rounded-lg bg-red-400/10 border border-red-400/20">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-cyan-400 text-[#050a0f] font-semibold text-sm hover:bg-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#050a0f]/30 border-t-[#050a0f] rounded-full animate-spin" aria-hidden="true" />
                Signing in…
              </>
            ) : "Sign in"}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-6">
          This area is restricted to authorised OrcaWolf AI personnel.
        </p>
      </div>
    </main>
  );
}
