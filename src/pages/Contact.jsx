import { useState } from "react";
import { pb } from "../lib/pb.js";
import MailIcon from "icon:mail";
import MapPinIcon from "icon:map-pin";
import GlobeIcon from "icon:globe";
import SendIcon from "icon:send";
import CheckCircleIcon from "icon:check-circle";

const SUBJECTS = [
  "General Enquiry",
  "Architecture Consultation",
  "MCI Simulation",
  "Partnership",
  "Press & Media",
  "Other",
];

const INITIAL = {
  name: "",
  email: "",
  organisation: "",
  subject: "",
  message: "",
};

export default function Contact() {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Please enter your name.";
    if (!form.email.trim()) e.email = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Please enter a valid email address.";
    if (!form.subject) e.subject = "Please select a subject.";
    if (!form.message.trim()) e.message = "Please enter your message.";
    else if (form.message.trim().length < 20)
      e.message = "Message must be at least 20 characters.";
    return e;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((errs) => ({ ...errs, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setStatus("submitting");
    try {
      await pb.collection("contact_enquiries").create({
        name: form.name.trim(),
        email: form.email.trim(),
        organisation: form.organisation.trim(),
        subject: form.subject,
        message: form.message.trim(),
      });
      setStatus("success");
      setForm(INITIAL);
      setErrors({});
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-[#050a0f] pt-24 pb-20">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/5 text-cyan-400 text-xs font-mono tracking-widest uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" aria-hidden="true" />
            Get in Touch
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-800 text-white leading-tight mb-6">
            Connect with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#4fc3f7]">
              OrcaWolf AI
            </span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Whether you're exploring sovereign mesh architecture, running an MCI
            simulation, or looking to collaborate — we'd love to hear from you.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Contact info sidebar */}
          <aside className="lg:col-span-2 space-y-8">
            {/* Logo */}
            <div className="flex items-center gap-4 mb-8">
              <img
                src="/static/orcawolfai-logo.png"
                alt="OrcaWolf AI"
                className="w-20 h-20 rounded-full object-cover ring-2 ring-cyan-400/40"
              />
              <div>
                <p className="font-display text-xl font-bold text-white">OrcaWolf AI</p>
                <p className="text-cyan-400 text-sm font-mono">Sovereign EHR Mesh</p>
              </div>
            </div>

            {/* Info cards */}
            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-white/5 bg-[#070e18]">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-400/10 flex items-center justify-center shrink-0">
                    <GlobeIcon className="w-5 h-5 text-cyan-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm mb-1">Website</p>
                    <a
                      href="https://www.orcawolfai.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors"
                    >
                      www.orcawolfai.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-white/5 bg-[#070e18]">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-400/10 flex items-center justify-center shrink-0">
                    <MailIcon className="w-5 h-5 text-cyan-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm mb-1">Email</p>
                    <p className="text-slate-300 text-sm">
                      Use the form and we'll respond promptly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-white/5 bg-[#070e18]">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-400/10 flex items-center justify-center shrink-0">
                    <MapPinIcon className="w-5 h-5 text-cyan-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm mb-1">Focus Areas</p>
                    <ul className="text-slate-300 text-sm space-y-1">
                      <li>Sovereign EHR Mesh Architecture</li>
                      <li>Mass Casualty AI Simulation</li>
                      <li>Zero-Trust Healthcare Networks</li>
                      <li>Federated AI &amp; Observability</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative mesh lines */}
            <div className="hidden lg:block mt-8 opacity-20" aria-hidden="true">
              <svg viewBox="0 0 200 120" className="w-full" xmlns="http://www.w3.org/2000/svg">
                <title>Decorative mesh pattern</title>
                <g stroke="#00e5ff" strokeWidth="0.5" fill="none">
                  <circle cx="20" cy="20" r="3" fill="#00e5ff" opacity="0.8"/>
                  <circle cx="100" cy="60" r="3" fill="#00e5ff" opacity="0.8"/>
                  <circle cx="180" cy="20" r="3" fill="#00e5ff" opacity="0.8"/>
                  <circle cx="60" cy="100" r="3" fill="#4fc3f7" opacity="0.8"/>
                  <circle cx="150" cy="100" r="3" fill="#4fc3f7" opacity="0.8"/>
                  <line x1="20" y1="20" x2="100" y2="60"/>
                  <line x1="100" y1="60" x2="180" y2="20"/>
                  <line x1="20" y1="20" x2="60" y2="100"/>
                  <line x1="100" y1="60" x2="60" y2="100"/>
                  <line x1="100" y1="60" x2="150" y2="100"/>
                  <line x1="180" y1="20" x2="150" y2="100"/>
                </g>
              </svg>
            </div>
          </aside>

          {/* Contact form */}
          <div className="lg:col-span-3">
            {status === "success" ? (
              <div
                role="alert"
                className="flex flex-col items-center justify-center text-center h-full min-h-[480px] rounded-2xl border border-cyan-400/20 bg-[#070e18] p-12"
              >
                <CheckCircleIcon className="w-16 h-16 text-cyan-400 mb-6" aria-hidden="true" />
                <h2 className="font-display text-2xl font-bold text-white mb-3">
                  Message received!
                </h2>
                <p className="text-slate-300 text-lg max-w-sm leading-relaxed mb-8">
                  Your enquiry is saved and we'll be in touch soon. Thank you for
                  reaching out to OrcaWolf AI.
                </p>
                <button
                  onClick={() => setStatus("idle")}
                  className="px-6 py-3 rounded-lg bg-cyan-400 text-[#050a0f] font-semibold text-sm hover:bg-cyan-300 transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="rounded-2xl border border-white/5 bg-[#070e18] p-8 sm:p-10 space-y-6"
                aria-label="Contact form"
              >
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-slate-200 mb-2"
                    >
                      Full name <span className="text-cyan-400" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={form.name}
                      onChange={handleChange}
                      aria-required="true"
                      aria-describedby={errors.name ? "name-error" : undefined}
                      aria-invalid={!!errors.name}
                      placeholder="Jane Wolf"
                      className={`w-full px-4 py-3 rounded-lg bg-[#0a1628] text-white placeholder-slate-500 border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
                        errors.name
                          ? "border-red-400/60 focus:ring-red-400/40"
                          : "border-white/10 focus:border-cyan-400/40"
                      }`}
                    />
                    {errors.name && (
                      <p id="name-error" role="alert" className="mt-1.5 text-red-400 text-xs">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-slate-200 mb-2"
                    >
                      Email address <span className="text-cyan-400" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange}
                      aria-required="true"
                      aria-describedby={errors.email ? "email-error" : undefined}
                      aria-invalid={!!errors.email}
                      placeholder="jane@example.com"
                      className={`w-full px-4 py-3 rounded-lg bg-[#0a1628] text-white placeholder-slate-500 border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
                        errors.email
                          ? "border-red-400/60 focus:ring-red-400/40"
                          : "border-white/10 focus:border-cyan-400/40"
                      }`}
                    />
                    {errors.email && (
                      <p id="email-error" role="alert" className="mt-1.5 text-red-400 text-xs">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Organisation */}
                <div>
                  <label
                    htmlFor="organisation"
                    className="block text-sm font-medium text-slate-200 mb-2"
                  >
                    Organisation <span className="text-slate-500 text-xs font-normal">(optional)</span>
                  </label>
                  <input
                    id="organisation"
                    name="organisation"
                    type="text"
                    autoComplete="organization"
                    value={form.organisation}
                    onChange={handleChange}
                    placeholder="Hospital, agency, or company"
                    className="w-full px-4 py-3 rounded-lg bg-[#0a1628] text-white placeholder-slate-500 border border-white/10 focus:border-cyan-400/40 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-slate-200 mb-2"
                  >
                    Subject <span className="text-cyan-400" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    aria-required="true"
                    aria-describedby={errors.subject ? "subject-error" : undefined}
                    aria-invalid={!!errors.subject}
                    className={`w-full px-4 py-3 rounded-lg bg-[#0a1628] text-white border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
                      errors.subject
                        ? "border-red-400/60 focus:ring-red-400/40"
                        : "border-white/10 focus:border-cyan-400/40"
                    } ${!form.subject ? "text-slate-500" : "text-white"}`}
                  >
                    <option value="" disabled>Select a topic…</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s} className="bg-[#0a1628] text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.subject && (
                    <p id="subject-error" role="alert" className="mt-1.5 text-red-400 text-xs">
                      {errors.subject}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-slate-200 mb-2"
                  >
                    Message <span className="text-cyan-400" aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={form.message}
                    onChange={handleChange}
                    aria-required="true"
                    aria-describedby={errors.message ? "message-error" : undefined}
                    aria-invalid={!!errors.message}
                    placeholder="Tell us about your project, question, or how we can help…"
                    className={`w-full px-4 py-3 rounded-lg bg-[#0a1628] text-white placeholder-slate-500 border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50 resize-none ${
                      errors.message
                        ? "border-red-400/60 focus:ring-red-400/40"
                        : "border-white/10 focus:border-cyan-400/40"
                    }`}
                  />
                  {errors.message && (
                    <p id="message-error" role="alert" className="mt-1.5 text-red-400 text-xs">
                      {errors.message}
                    </p>
                  )}
                </div>

                {status === "error" && (
                  <p role="alert" className="text-red-400 text-sm text-center">
                    Something went wrong — please try again in a moment.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg bg-cyan-400 text-[#050a0f] font-semibold text-sm hover:bg-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {status === "submitting" ? (
                    <>
                      <span
                        className="w-4 h-4 border-2 border-[#050a0f]/30 border-t-[#050a0f] rounded-full animate-spin"
                        aria-hidden="true"
                      />
                      Sending…
                    </>
                  ) : (
                    <>
                      <SendIcon className="w-4 h-4" aria-hidden="true" />
                      Send message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
