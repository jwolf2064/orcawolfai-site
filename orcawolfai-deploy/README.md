# OrcaWolf AI — Deployable Package

**Website:** https://www.orcawolfai.com  
**GitHub:** https://github.com/jwolf2064/orcawolfai-site  
**Packaged:** 2026-10-12

## What's inside

```
orcawolfai-deploy/
  src/                        # All React source code
    App.jsx                   # Root app + routing
    main.jsx                  # Entry point
    index.css                 # Tailwind v4 styles + animations
    pages/
      Home.jsx                # Landing page with mesh hero
      Architecture.jsx        # L0–L5 sovereign mesh + 3D visuals + walkthrough
      Simulation.jsx          # MCI Triage simulator + FHIR R4 bundle generator
      LoadTester.jsx          # Combat Medic Load Hammer (50 agents, Vertex AI scoring)
      CarrierReadiness.jsx    # USS Nimitz / USS Theodore Roosevelt C2 readiness
      Innovation.jsx          # Research & innovation cards
      About.jsx               # Mission + principles
      Contact.jsx             # Enquiry form (saves every submission)
      AdminLogin.jsx          # Private admin login
      AdminDashboard.jsx      # Admin view of all enquiries
      GitHub.jsx              # GitHub integration guide
      NotFound.jsx            # 404 page
    components/
      Nav.jsx                 # Fixed top nav with mobile hamburger
      Footer.jsx              # Three-column footer
    layouts/
      SiteLayout.jsx          # Nav + Outlet + Footer wrapper
    lib/
      pb.js                   # Backend client initialisation
  public/
    favicon.svg               # OrcaWolf AI brand mark
    sitemap.xml               # Search engine sitemap (all pages)
    robots.txt                # Crawler rules + sitemap reference
    google9be7fe033d5c3a89.html  # Google Search Console verification
    og-image.jpg / og-image.png  # Open Graph / LinkedIn preview image
  static/
    orcawolfai-logo.png           # OrcaWolf AI logo (all pages)
    gen_arch-l0-*.webp            # L0 Physical Substrate 3D render
    gen_arch-l1-*.webp            # L1 Ambient Mesh 3D render
    gen_arch-l2-*.webp            # L2 Zero Trust Identity 3D render
    gen_arch-l3-*.webp            # L3 EHR Interoperability 3D render
    gen_arch-l4-*.webp            # L4 AI Inference 3D render
    gen_arch-l5-*.webp            # L5 Observability 3D render
  simulation-engine/
    fhir_mongo_loader.py      # FHIR R4 bundle → MongoDB ingestion
    fhir_vector_pipeline.py   # Vertex AI text-embedding-004 pipeline
    locustfile.py             # CombatMedicUser load test script
    README.md                 # Engine setup + usage guide
  dist/                       # Pre-built production output (deploy-ready)
  index.html                  # App entry with all meta tags + OG cards
  vite.config.js              # Build config
  tailwind.config.cjs         # Theme: Syne / Space Grotesk / DM Mono + palette
  package.json                # Project manifest
  GITHUB-SETUP.md             # GitHub connection guide
  AGENTS.md                   # Project state reference
```

## Stack

- **React 18** + **Vite** (JSX, client-side SPA)
- **Tailwind CSS v4** (dark ocean palette, custom animations)
- **React Router** (BrowserRouter, basename-aware)
- **PocketBase** backend (enquiries, carrier scenarios, FHIR simulations)
- **Google Fonts** — Syne (display), Space Grotesk (body), DM Mono (mono)
- **Lucide React** icons

## Deploying to a new environment

1. Clone or unzip into your project folder
2. The `dist/` folder is pre-built and ready to serve as-is
3. To rebuild: `npm run build:prod` (Node 18+ required; no npm install needed — all dependencies are platform-provided)
4. Point your web server / CDN root at `dist/`
5. Serve `static/` at the fixed path `/static/` (outside the app root)
6. Set your backend URL in `src/lib/pb.js`

## Pages & routes

| Route | Page |
|---|---|
| `/` | Home |
| `/architecture` | Sovereign Mesh Architecture L0–L5 |
| `/simulation` | MCI Triage Simulator |
| `/loadtest` | Combat Medic Load Hammer |
| `/carrier` | Carrier Battle Group Readiness |
| `/innovation` | Innovation Lab |
| `/about` | Mission & About |
| `/contact` | Contact / Enquiry Form |
| `/admin/login` | Admin Login |
| `/admin/dashboard` | Admin Dashboard |
| `/github` | GitHub Integration Guide |

## Admin credentials

Set your own admin credentials in your backend instance.  
Default admin email: `admin@orcawolfai.com`

## UNCLASSIFIED // FOR EXERCISE USE ONLY

All military / carrier readiness simulations in this package are training and  
technology demonstration tools only. No classified data is stored or transmitted.

---
OrcaWolf AI · https://www.orcawolfai.com · © 2026
