# Independent verification — FAIL

**Work order:** `camera-effect-postcard-verify-1`
**Candidate:** `ef7a555762c016b329eba3c28bed80304d67eb29`
**Live URL:** <https://camera-effect-postcard.sociobot.in/>
**Verified:** 2026-08-28 UTC
**Verdict:** **FAIL — do not release this candidate.**

The normal postcard flow is good, but a malformed user backup can permanently
disable the application after a reload. This violates the required invalid
input/recovery path and local-first reliability contract.

## Defects

### P1 — malformed backup can brick the app across reloads

1. At 390 px, open the app and import a syntactically valid JSON file:
   `{"product":"postcard-fx","version":1,"settings":"corrupt"}`.
2. The UI shows “That file is not a valid Postcard FX backup.”
3. Reload the page. A `pageerror` is raised: `Cannot read properties of
   undefined (reading 'slice')`.
4. The page remains visually present, but initialization stops before event
   listeners are installed. “Try without a camera” no longer changes the
   status and “Make postcard” remains disabled. There is no in-app reset or
   recovery; clearing site storage outside the app is required.

Cause confirmed by inspection: the importer saves `payload.settings` before
validating its shape; `restoreSettings()` assumes `saved.caption` is a string
and calls `.slice(0, 42)`.

### P2 — keyboard focus is not visible for Import local backup

The tab sequence lands on the visually clipped `#import-data` input rather
than its visible 294 × 50 px label/button. At that point the focused input is
1 × 1 px with `clip: rect(0, 0, 0, 0)`; its 3 px focus outline is clipped and
the visible label has no focus indication. This fails the stated visible-focus
requirement for keyboard-only users. Axe does not flag this visual failure.

### P3 — deployment response policy and asset caching need hardening

Live HTML, JS, CSS, manifest, service worker, and images all return
`Cache-Control: public, must-revalidate, max-age=30`; assets are also
unhashed. This misses the required long-lived immutable caching for static
assets, although the service-worker cache keeps the app usable offline.

The live response has HSTS, `nosniff`, and a strict referrer policy, but lacks
an enforcing Content-Security-Policy, `frame-ancestors`/X-Frame-Options, and a
Permissions-Policy. Lighthouse reports “No CSP found in enforcement mode.”
These are deployment hardening findings; no third-party runtime requests were
observed.

## Evidence that passed

### Clean checkout and build

- Clean candidate checkout began at the requested SHA with no worktree
  changes.
- `npm ci`: installed 60 packages; `npm audit` reported 0 vulnerabilities.
- `npm test`: passed — Vitest 3/3 and Playwright 6/6 (Chromium mobile and
  desktop).
- `npm run build`: passed TypeScript checking and Vite build; emitted `dist/`.
  There is no separate lint script in `package.json`.
- Build output: app JS 13.75 kB raw / 5.62 kB gzip; CSS 12.24 kB raw / 3.68 kB
  gzip; preview WebP 58.55 kB; no shipped webfonts. This is within the stated
  200 kB JS, 50 kB CSS, 300 kB image, and 120 kB font budgets.

### Product exercise

- At a 390 × 844 viewport: camera startup failure moves focus to the preview
  path and gives actionable recovery copy; no-camera preview works.
- Normal preview flow exercised each of Orbit bloom, Sun signal, and Party
  post; a 42-character caption; a zero-second capture; PNG download; saved
  postcard restore; confirmation-backed deletion; invalid JSON rejection and
  continued capture. The exported image was exactly 1200 × 1500 and downloaded
  as `postcard-fx.png`; no console or page errors occurred.
- The 10-second timer completed in 10.44 seconds and produced a postcard with
  no page errors. Reduced-motion CSS reduced countdown animation to `0.00001s`.
- Keyboard smoke test traversed controls in logical order, showed a 3 px cobalt
  focus outline for ordinary controls, and the existing keyboard capture path
  passed. The import-control exception is recorded above.
- Visual checks were made at desktop and 390 px. The portrait stage, responsive
  single-column mobile layout, crop guide, and export result are legible and
  product-specific.

### Accessibility, privacy, and performance

- Fresh axe scans of `/`, `/privacy/`, and `/terms/` at desktop and 390 px:
  **0 serious and 0 critical violations**.
- Live mobile Lighthouse: Performance 100, Accessibility 100, Best Practices
  100, SEO 92; FCP 1.0 s, LCP 1.3 s, TBT 40 ms, CLS 0.003. The SEO reduction
  was Lighthouse reporting a failed robots.txt fetch despite direct `200
  text/plain` retrieval of the valid file.
- Browser request capture on the live app found no outbound runtime origins;
  source inspection confirms no analytics, remote fonts, third-party scripts,
  uploads, or audio capture. Camera is requested only from the user action;
  `audio: false` is explicit. IndexedDB/localStorage are the only application
  persistence mechanisms.

### PWA and deployment identity

- Live root, JS, CSS, service worker, manifest, offline page, legal pages,
  artwork, and all PNG icons matched the locally built files byte-for-byte
  (SHA-256 comparisons). `origin/main` resolves to the requested candidate SHA.
- Live HTTPS service worker registered at scope `/`, controlled the page, and
  used cache `postcard-fx-v2`. With the browser offline, `/` reloaded and the
  no-camera preview created a result without console/page errors.
- In an isolated test server, changing only the served service-worker version
  from `v2` to `v3` caused the app to show “A fresh version is ready.” with an
  available Reload action. This verifies the update path without modifying
  product code.

## Required release work

1. Validate every imported settings field before saving it; reject invalid
   backups without changing local state. Make startup tolerate/recover from
   malformed stored settings, preferably with a visible reset action.
2. Put the visible import label into the focus style (for example,
   `input:focus-visible + ...` or `label:focus-within`) or make the label the
   keyboard focus target.
3. Configure deployment CSP/framing/permissions policies and immutable caching
   for versioned static assets. Re-run this verification after the P1 fix.
