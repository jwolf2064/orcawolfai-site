import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { pb } from "../lib/pb.js";
import LogOutIcon from "icon:log-out";
import RefreshCwIcon from "icon:refresh-cw";
import SearchIcon from "icon:search";
import ChevronDownIcon from "icon:chevron-down";
import ChevronUpIcon from "icon:chevron-up";
import InboxIcon from "icon:inbox";
import TrashIcon from "icon:trash-2";
import XIcon from "icon:x";

const SUBJECT_COLORS = {
  "General Enquiry":          "bg-slate-400/15 text-slate-300 border-slate-400/20",
  "Architecture Consultation":"bg-blue-400/15  text-blue-300  border-blue-400/20",
  "MCI Simulation":           "bg-red-400/15   text-red-300   border-red-400/20",
  "Quote Request":            "bg-amber-400/15 text-amber-300 border-amber-400/20",
  "Partnership":              "bg-purple-400/15 text-purple-300 border-purple-400/20",
  "Press & Media":            "bg-pink-400/15  text-pink-300  border-pink-400/20",
  "Other":                    "bg-slate-400/15 text-slate-300 border-slate-400/20",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminDashboard() {
  const navigate                  = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("All");
  const [expanded, setExpanded]   = useState(null);
  const [deleting, setDeleting]   = useState(null);

  const isAuthed = pb.authStore.isValid && pb.authStore.record;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const controller = new AbortController();
    try {
      const result = await pb.collection("contact_enquiries").getList(1, 200, {
        sort: "-created",
        signal: controller.signal,
      });
      setEnquiries(result.items);
    } catch (e) {
      if (!e?.isAbort && e?.name !== "AbortError") {
        if (e?.status === 401 || e?.status === 403) {
          pb.authStore.clear();
          navigate("/admin/login");
        } else {
          setError("Could not load enquiries. Please try refreshing.");
        }
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [navigate]);

  useEffect(() => {
    if (!isAuthed) { navigate("/admin/login"); return; }
    const cleanup = load();
    return () => { cleanup && cleanup.then && cleanup.then(fn => fn && fn()); };
  }, [isAuthed, load, navigate]);

  function logout() {
    pb.authStore.clear();
    navigate("/admin/login");
  }

  async function deleteEnquiry(id) {
    if (!window.confirm("Delete this enquiry? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await pb.collection("contact_enquiries").delete(id);
      setEnquiries(prev => prev.filter(e => e.id !== id));
      if (expanded === id) setExpanded(null);
    } catch {
      alert("Could not delete enquiry. Please try again.");
    } finally {
      setDeleting(null);
    }
  }

  const subjects = ["All", ...Array.from(new Set(enquiries.map(e => e.subject)))];

  const filtered = enquiries.filter(e => {
    const matchesFilter  = filter === "All" || e.subject === filter;
    const q = search.toLowerCase();
    const matchesSearch  = !q ||
      e.name?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.organisation?.toLowerCase().includes(q) ||
      e.message?.toLowerCase().includes(q) ||
      e.subject?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total:   enquiries.length,
    today:   enquiries.filter(e => new Date(e.created) > new Date(Date.now() - 86400000)).length,
    quotes:  enquiries.filter(e => e.subject === "Quote Request").length,
    unread:  enquiries.filter(e => new Date(e.created) > new Date(Date.now() - 86400000 * 7)).length,
  };

  if (!isAuthed) return null;

  return (
    <main className="min-h-screen bg-[#050a0f] text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#050a0f]/95 backdrop-blur border-b border-white/5 px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/static/orcawolfai-logo.png" alt="OrcaWolf AI"
            className="w-8 h-8 rounded-full ring-1 ring-cyan-400/30" />
          <div>
            <span className="font-display font-bold text-white text-sm">OrcaWolf AI</span>
            <span className="text-cyan-400 font-mono text-xs ml-2">/ Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} aria-label="Refresh enquiries"
            className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-colors">
            <RefreshCwIcon className="w-4 h-4" />
          </button>
          <button onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-slate-300 text-sm hover:text-red-400 hover:border-red-400/30 transition-all">
            <LogOutIcon className="w-4 h-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total enquiries", value: stats.total,  color: "text-cyan-400" },
            { label: "Last 24 hours",   value: stats.today,  color: "text-green-400" },
            { label: "Quote requests",  value: stats.quotes, color: "text-amber-400" },
            { label: "This week",       value: stats.unread, color: "text-purple-400" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-white/5 bg-[#070e18] p-5">
              <p className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</p>
              <p className="text-slate-400 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters + search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" aria-hidden="true" />
            <input type="search" placeholder="Search by name, email, organisation, or message…"
              value={search} onChange={e => setSearch(e.target.value)}
              aria-label="Search enquiries"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#070e18] text-white placeholder-slate-500 border border-white/8 focus:border-cyan-400/40 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/40 transition-colors" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {subjects.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${filter === s ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300" : "border-white/8 text-slate-400 hover:text-slate-200 hover:border-white/20"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="p-4 rounded-xl border border-red-400/20 bg-red-400/10 text-red-400 text-sm flex items-center justify-between">
            {error}
            <button onClick={load} className="text-red-400 underline text-xs ml-4">Retry</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <span className="w-8 h-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" aria-label="Loading" />
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <InboxIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" aria-hidden="true" />
            <p className="text-slate-400 text-sm">
              {enquiries.length === 0 ? "No enquiries yet — they'll appear here when people reach out." : "No results match your search."}
            </p>
            {search && <button onClick={() => setSearch("")} className="mt-3 text-cyan-400 text-xs hover:underline">Clear search</button>}
          </div>
        )}

        {/* Enquiry list */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-3" role="list" aria-label="Enquiries">
            {filtered.map(item => {
              const isOpen   = expanded === item.id;
              const tagClass = SUBJECT_COLORS[item.subject] || SUBJECT_COLORS["Other"];
              return (
                <article key={item.id} role="listitem"
                  className="rounded-xl border border-white/5 bg-[#070e18] overflow-hidden transition-all">
                  {/* Row header */}
                  <div className="flex items-start sm:items-center gap-4 p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpanded(isOpen ? null : item.id)}
                    role="button" tabIndex={0} aria-expanded={isOpen}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(isOpen ? null : item.id); } }}>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-white font-semibold text-sm">{item.name || "—"}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${tagClass}`}>
                          {item.subject}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                        <span>{item.email}</span>
                        {item.organisation && <span>· {item.organisation}</span>}
                      </div>
                      <p className="text-slate-500 text-xs truncate max-w-lg">
                        {item.message?.split("\n")[0]}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-500 text-xs hidden sm:block">{formatDate(item.created)}</span>
                      {isOpen ? <ChevronUpIcon className="w-4 h-4 text-slate-500" aria-hidden="true" /> : <ChevronDownIcon className="w-4 h-4 text-slate-500" aria-hidden="true" />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="border-t border-white/5 px-5 pb-5 pt-4 space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        {[
                          ["Name",         item.name],
                          ["Email",        item.email],
                          ["Organisation", item.organisation],
                          ["Received",     formatDate(item.created)],
                        ].map(([k, v]) => v ? (
                          <div key={k}>
                            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">{k}</p>
                            <p className="text-slate-200">{v}</p>
                          </div>
                        ) : null)}
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Message</p>
                        <div className="bg-[#0a1628] rounded-lg p-4 text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                          {item.message}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <a href={`mailto:${item.email}?subject=Re: ${encodeURIComponent(item.subject)}`}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs font-medium hover:bg-cyan-400/20 transition-colors">
                          Reply via email client
                        </a>
                        <button onClick={() => deleteEnquiry(item.id)} disabled={deleting === item.id}
                          aria-label="Delete this enquiry"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 text-xs transition-colors disabled:opacity-50">
                          <TrashIcon className="w-3.5 h-3.5" aria-hidden="true" />
                          {deleting === item.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
