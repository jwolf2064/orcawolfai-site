import { useState } from "react";
import { Link } from "react-router";
import GitBranchIcon from "icon:git-branch";
import GitMergeIcon from "icon:git-merge";
import GitPullRequestIcon from "icon:git-pull-request";
import DownloadIcon from "icon:download";
import UploadIcon from "icon:upload";
import CodeIcon from "icon:code-2";
import FolderIcon from "icon:folder-open";
import TerminalIcon from "icon:terminal";
import CheckCircleIcon from "icon:check-circle";
import ExternalLinkIcon from "icon:external-link";
import CopyIcon from "icon:copy";
import BookOpenIcon from "icon:book-open";

const REPO_URL = "https://github.com/jwolf2064/orcawolfai-site";
const CLONE_CMD = 'git clone https://github.com/jwolf2064/orcawolfai-site.git "C:\\Users\\jwolf\\Local OrcaWolf AI Projects\\orcawolfai-site"';

function CopyBlock({ code, label }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div className="relative group mt-3">
      <pre className="bg-[#030609] border border-cyan-400/20 rounded-lg px-4 py-3 text-sm text-cyan-300 font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 hover:bg-cyan-400/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label={`Copy ${label}`}
      >
        {copied ? <CheckCircleIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
      </button>
    </div>
  );
}

const steps = [
  {
    icon: DownloadIcon,
    color: "cyan",
    title: "Install Git on Windows",
    desc: "Git is the tool that keeps your code in sync between your machine and GitHub. Install it once and you're set forever.",
    actions: [
      {
        type: "link",
        label: "Download Git for Windows",
        href: "https://git-scm.com/download/win",
        note: "Click the first download link — it detects your Windows version automatically. Takes about 2 minutes to install with all defaults."
      }
    ]
  },
  {
    icon: FolderIcon,
    color: "wolf",
    title: "Clone Your Repository Locally",
    desc: "This copies all your site source files from GitHub down to your Local OrcaWolf AI Projects folder on your machine.",
    actions: [
      {
        type: "command",
        label: "Open Command Prompt or PowerShell and run:",
        code: CLONE_CMD
      },
      {
        type: "command",
        label: "Then move into the folder:",
        code: 'cd "C:\\Users\\jwolf\\Local OrcaWolf AI Projects\\orcawolfai-site"'
      }
    ]
  },
  {
    icon: CodeIcon,
    color: "cyan",
    title: "Open in VS Code",
    desc: "VS Code is the easiest way to browse, search, and edit your source files. It's free and shows you the full project at a glance.",
    actions: [
      {
        type: "link",
        label: "Download VS Code (free)",
        href: "https://code.visualstudio.com/",
        note: "Once installed, open your terminal in VS Code and you can run all the commands below without leaving the editor."
      },
      {
        type: "command",
        label: "Or open the project folder directly from terminal:",
        code: 'code "C:\\Users\\jwolf\\Local OrcaWolf AI Projects\\orcawolfai-site"'
      }
    ]
  },
  {
    icon: UploadIcon,
    color: "wolf",
    title: "Bring In Your Mass Casualty Simulation Code",
    desc: "Copy your existing MCI simulation files into the project's src/pages/ or src/components/ folders, then push them up.",
    actions: [
      {
        type: "note",
        label: "Where to put your files",
        note: "Drop your simulation source files into: orcawolfai-site\\app\\src\\pages\\ — they'll slot right into the existing simulation page structure."
      },
      {
        type: "command",
        label: "After copying your files, push them to GitHub:",
        code: 'git add .\ngit commit -m "Add MCI simulation code"\ngit push'
      }
    ]
  },
  {
    icon: GitBranchIcon,
    color: "cyan",
    title: "Staying in Sync — Pulling Latest Changes",
    desc: "Whenever new features are added to your site here, pull them to your local copy to keep everything in sync.",
    actions: [
      {
        type: "command",
        label: "Run this any time to get the latest version:",
        code: "git pull origin dev"
      }
    ]
  },
  {
    icon: GitPullRequestIcon,
    color: "wolf",
    title: "Pushing Your Own Changes",
    desc: "Made an edit locally? These three commands save it to GitHub so it can be pulled back into the live site.",
    actions: [
      {
        type: "command",
        label: "Stage, describe, and push your changes:",
        code: 'git add .\ngit commit -m "Describe what you changed"\ngit push'
      }
    ]
  }
];

const colorMap = {
  cyan: {
    icon: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/30",
    num: "bg-cyan-400 text-[#050a0f]",
    link: "text-cyan-400 hover:text-cyan-300 border-cyan-400/30 hover:bg-cyan-400/10"
  },
  wolf: {
    icon: "text-[#4fc3f7]",
    bg: "bg-[#4fc3f7]/10",
    border: "border-[#4fc3f7]/30",
    num: "bg-[#4fc3f7] text-[#050a0f]",
    link: "text-[#4fc3f7] hover:text-cyan-300 border-[#4fc3f7]/30 hover:bg-[#4fc3f7]/10"
  }
};

export default function GitHub() {
  return (
    <main className="min-h-screen bg-[#050a0f] pt-20 pb-24">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs font-mono tracking-wider mb-6">
          <GitBranchIcon className="w-3.5 h-3.5" aria-hidden="true" />
          SOURCE CODE ACCESS
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
          Your GitHub <span className="text-cyan-400">Integration</span> Guide
        </h1>
        <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
          Every line of OrcaWolf AI is yours — stored in your private GitHub repository and ready to clone, edit, and extend on your local machine.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-400 text-[#050a0f] font-semibold hover:bg-cyan-300 transition-all duration-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            Open Your Repository
            <ExternalLinkIcon className="w-4 h-4" aria-hidden="true" />
          </a>
          <Link
            to="/simulation"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-cyan-400/30 text-cyan-400 font-semibold hover:bg-cyan-400/10 transition-all duration-200"
          >
            Go to MCI Simulation
          </Link>
        </div>
      </section>

      {/* Repo summary */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-[#070e18] border border-cyan-400/20 rounded-2xl p-6 grid sm:grid-cols-3 gap-6">
          {[
            { label: "Repository", value: "jwolf2064/orcawolfai-site", icon: GitBranchIcon },
            { label: "Branch", value: "dev (active)", icon: GitMergeIcon },
            { label: "Source files", value: "24 components & pages", icon: FolderIcon },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-400/10 shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-mono uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-white text-sm font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Step-by-step guide */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="flex items-center gap-3 mb-10">
          <BookOpenIcon className="w-5 h-5 text-cyan-400" aria-hidden="true" />
          <h2 className="font-display text-2xl font-bold text-white">Step-by-Step Access Guide</h2>
        </div>
        <div className="space-y-6">
          {steps.map((step, i) => {
            const c = colorMap[step.color];
            const Icon = step.icon;
            return (
              <article
                key={step.title}
                className={`bg-[#070e18] border ${c.border} rounded-2xl p-6`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-8 h-8 rounded-full ${c.num} flex items-center justify-center text-sm font-bold shrink-0 mt-0.5`} aria-hidden="true">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-5 h-5 ${c.icon}`} aria-hidden="true" />
                      <h3 className="text-white font-semibold text-lg">{step.title}</h3>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
                <div className="ml-12 space-y-4">
                  {step.actions.map((action, j) => (
                    <div key={j}>
                      {action.type === "command" && (
                        <>
                          <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-1">{action.label}</p>
                          <CopyBlock code={action.code} label={action.label} />
                        </>
                      )}
                      {action.type === "link" && (
                        <div className={`flex flex-col gap-2`}>
                          <a
                            href={action.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border ${c.link} text-sm font-medium transition-all w-fit`}
                          >
                            <ExternalLinkIcon className="w-4 h-4" aria-hidden="true" />
                            {action.label}
                          </a>
                          {action.note && <p className="text-slate-500 text-xs leading-relaxed">{action.note}</p>}
                        </div>
                      )}
                      {action.type === "note" && (
                        <div className={`${c.bg} border ${c.border} rounded-lg px-4 py-3`}>
                          <p className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">{action.label}</p>
                          <p className="text-slate-300 text-sm leading-relaxed">{action.note}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Project structure */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="flex items-center gap-3 mb-6">
          <TerminalIcon className="w-5 h-5 text-cyan-400" aria-hidden="true" />
          <h2 className="font-display text-2xl font-bold text-white">Your Project File Structure</h2>
        </div>
        <div className="bg-[#030609] border border-cyan-400/20 rounded-2xl p-6 font-mono text-sm">
          {[
            { indent: 0, text: "orcawolfai-site/app/src/", color: "text-cyan-400" },
            { indent: 1, text: "pages/", color: "text-[#4fc3f7]" },
            { indent: 2, text: "Home.jsx          ← home hero & mesh diagram", color: "text-slate-300" },
            { indent: 2, text: "Architecture.jsx  ← L0–L5 walkthrough & 3D images", color: "text-slate-300" },
            { indent: 2, text: "Simulation.jsx    ← MCI triage engine ← your code goes here", color: "text-green-400" },
            { indent: 2, text: "Innovation.jsx    ← research cards", color: "text-slate-300" },
            { indent: 2, text: "About.jsx         ← mission & links", color: "text-slate-300" },
            { indent: 2, text: "Contact.jsx       ← enquiry form", color: "text-slate-300" },
            { indent: 2, text: "AdminDashboard.jsx← your private admin view", color: "text-slate-300" },
            { indent: 1, text: "components/", color: "text-[#4fc3f7]" },
            { indent: 2, text: "Nav.jsx           ← navigation bar", color: "text-slate-300" },
            { indent: 2, text: "Footer.jsx        ← site footer", color: "text-slate-300" },
            { indent: 1, text: "layouts/", color: "text-[#4fc3f7]" },
            { indent: 2, text: "SiteLayout.jsx    ← wraps nav + content + footer", color: "text-slate-300" },
            { indent: 1, text: "lib/", color: "text-[#4fc3f7]" },
            { indent: 2, text: "pb.js             ← data store connection", color: "text-slate-300" },
          ].map((line, i) => (
            <div key={i} className={`${line.color} leading-7`} style={{ paddingLeft: `${line.indent * 1.25}rem` }}>
              {line.text}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-gradient-to-br from-[#070e18] to-[#0a1628] border border-cyan-400/20 rounded-2xl p-10">
          <h2 className="font-display text-2xl font-bold text-white mb-3">Ready to bring in your MCI simulation?</h2>
          <p className="text-slate-400 mb-6 max-w-xl mx-auto">Share your simulation source files here and I'll integrate them directly into the existing simulation page — preserving your logic while connecting it to the full sovereign mesh UI.</p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-400 text-[#050a0f] font-semibold hover:bg-cyan-300 transition-all duration-200"
          >
            Get in Touch
          </Link>
        </div>
      </section>
    </main>
  );
}
