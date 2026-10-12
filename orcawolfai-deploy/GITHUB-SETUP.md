# Connecting OrcaWolf AI to Your GitHub Repository

Follow these steps once to link this site to your GitHub account.
After that, every change made here can be pushed directly to your repo.

---

## Step 1 — Create a GitHub repository (2 minutes)

1. Go to https://github.com/new
2. Name it `orcawolfai-site` (or anything you prefer)
3. Set it to **Private** (recommended) or Public
4. **Do NOT** tick "Add a README" — leave it completely empty
5. Click **Create repository**
6. Copy the HTTPS URL shown — it looks like:
   `https://github.com/YOUR-USERNAME/orcawolfai-site.git`

---

## Step 2 — Give me your repo URL

Paste that URL into the chat here and tell me:
> "Connect to GitHub: https://github.com/YOUR-USERNAME/orcawolfai-site.git"

I will wire up the connection and push every file — all 24 source files —
directly to your repository in one go.

---

## Step 3 — Personal Access Token (one time only)

GitHub requires a token to allow pushes. To create one:

1. Go to https://github.com/settings/tokens/new
2. Give it a name: `orcawolfai-deploy`
3. Set expiration: **No expiration** (or 1 year)
4. Under **Scopes**, tick only: `repo` (full control of private repositories)
5. Click **Generate token**
6. Copy the token — it starts with `ghp_...`
7. Paste it into the chat — I will use it once to push the code, and it
   will never be stored anywhere on the site itself.

---

## What's in your source code

All 24 files that make up orcawolfai.com:

- `src/pages/` — Home, Architecture, Simulation, Innovation, About,
  Contact, AdminLogin, AdminDashboard, NotFound
- `src/components/` — Nav, Footer
- `src/layouts/` — SiteLayout
- `src/lib/pb.js` — backend connection
- `index.html` — all meta tags, fonts, OG cards
- `tailwind.config.cjs` — design tokens (colours, typefaces)
- `vite.config.js` — build configuration
- `public/` — favicon, sitemap, robots.txt, Google verification

---

Once connected, every future edit I make here can be committed to GitHub
automatically, giving you a full history and a personal backup of every
version of your site.
