# Project Setup

Last updated: <!-- update this after each change -->

Factual state of this project, for the assistant's reference. Record project
state here only — structure, installed packages, active patterns. Keep it brief.

## Stack

A **Vite + React** single-page app (JSX), styled with **Tailwind CSS v4**. The
dev server runs with live reload, so edits appear in the preview immediately —
no build or restart needed to see a change.

The app is rendered inside **React StrictMode** in dev. StrictMode
intentionally double-invokes components, effects, and state updaters (mounting
each component twice on the first render) to surface unsafe side effects. Write
code that tolerates this: effects must clean up after themselves (return a
teardown from `useEffect`), and rendering, reducers, and state updaters must be
pure — no side effects, mutation, or one-off work outside an effect. Don't treat
the double render as a bug or try to suppress it; just write idempotent,
effect-safe code and it behaves correctly in production (where StrictMode adds
no double-invocation).

Provided by the platform (available at runtime — never add these to
`package.json`): React, react-dom, react-router, Vite, @vitejs/plugin-react,
lucide-react, pocketbase, `tailwind-merge`, and the Tailwind v4 engine itself.
This project has **no dependencies of its own** — `package.json` is empty and
there is no `node_modules`. Do not `npm install` anything for styling.

## Tailwind v4 notes

This is Tailwind **v4**, not v3. Almost all utilities are identical, but:

- The stylesheet entry is `@import "tailwindcss";` (not the three `@tailwind`
  directives). Already set up in `src/index.css`.
- **Theme customization goes in `tailwind.config.cjs`** (custom colors, fonts,
  spacing under `theme.extend`). It is wired in via `@config` in `index.css` —
  edit the config file as you would in v3. You may instead define tokens with a
  `@theme { --color-brand: …; }` block in `index.css`.
- **Never add `postcss.config`, `postcss`, or `autoprefixer`** — vendor
  prefixing is built into the v4 engine. Adding them breaks the build.
- A few renamed utilities vs v3: `shadow` → `shadow-sm`, `shadow-sm` →
  `shadow-xs`, `rounded` → `rounded-sm`, `outline-none` → `outline-hidden`,
  `flex-shrink-0` → `shrink-0`, and `bg-opacity-50` → the `bg-black/50` slash
  syntax. The default border color is now `currentColor` (set one explicitly,
  e.g. `border border-gray-200`).
- Arbitrary values (`w-[473px]`, `text-[#1da1f2]`, `grid-cols-[1fr_2fr]`) work
  exactly as in v3.

## Structure

```
src/
  App.jsx      # Root component — replace with the user's app
  main.jsx     # Entry point — renders <App/> into #root, imports index.css
  index.css    # @import "tailwindcss" + @config bridge
public/
  favicon.svg  # Placeholder — replace with the user's mark
index.html
package.json · vite.config.js · tailwind.config.cjs
```

`dist/` is committed (the deploy reads from it); `node_modules/` is ignored.

## Starting point

`App.jsx` ships a placeholder welcome page. Replace its contents with whatever
the user is building. Also replace the placeholder `<title>`, meta
description and `public/favicon.svg` with ones that match the
business — see your instructions for the full checklist.

## Routing & asset paths

The published `dist/` is served from more than one base path (the live site at
`/`, and read-only history snapshots under a longer prefix). The build uses a
relative asset base plus a `<base href>` in `index.html` so the same output
works from any of them — so two rules keep links and assets from breaking:

- **Never hardcode root-absolute URLs** (a leading `/`) for in-app assets or
  links — `/logo.png`, `/about`, `fetch("/data.json")`. Import assets
  (`import logo from "./logo.png"`) or reference them relatively; they then
  resolve against the base automatically.
  - **Exception — `/static/…`.** Files in the project's `static/` directory are
    served by the platform at the fixed absolute URL `/static/<filename>`, which
    resolves the same on every base path (live, preview, snapshots) because it's
    mapped outside the app, not bundled into `dist/`. Reference these **exactly**
    as `/static/<file>` (e.g. `<img src="/static/photo.jpg">`) — leading slash and
    all. This is the one allowed root-absolute path. Never copy a `static/` asset
    into the app (`public/`, `src/`) and never reach it with a relative `../`
    path. (The get-image skill saves design images into `static/` and prints the
    `/static/<file>` path to use verbatim.)
- **If you add a router**, set its basename from the document base, never a
  literal `/`:

  ```jsx
  import { createBrowserRouter } from "react-router";
  // strip the trailing slash; "/" becomes "" which react-router wants
  const basename = new URL(document.baseURI).pathname.replace(/\/$/, "");
  const router = createBrowserRouter(routes, { basename });
  ```

  (or `<BrowserRouter basename={basename}>`). This makes the app mount
  correctly whether served from `/` or a longer prefix.
