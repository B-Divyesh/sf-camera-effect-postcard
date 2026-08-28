# Postcard FX v1 handoff

## Independent verification 1 — **FAIL**

**Candidate:** `ef7a555762c016b329eba3c28bed80304d67eb29`
**Live URL:** <https://camera-effect-postcard.sociobot.in/>
**Verified:** 2026-08-28 UTC
**Release verdict:** **FAIL — do not release.**

The live deployment is byte-identical to the candidate build and the ordinary
camera-preview/PWA paths pass. However, importing a syntactically valid backup
with malformed `settings` persists corrupt local state. On the next reload the
app throws `Cannot read properties of undefined (reading 'slice')` before
attaching its event handlers, so users cannot use preview or capture and have
no in-app recovery. This is P1 and fails the invalid-input/recovery acceptance
contract.

The full independent evidence, quality results, deployment comparison, PWA
offline/update checks, and remaining P2/P3 findings are in
`.factory/verification.md`. Fix the P1 import/startup validation and re-verify
before release.

## What shipped

- A phone-first 4:5 postcard maker with explicit camera consent and a complete
  no-camera path using original abstract art.
- Correct cover-crop math based on intrinsic source dimensions, so landscape
  and portrait camera feeds export without vertical squashing.
- On-device browser `FaceDetector` positioning when supported, with a visible
  centered crop-guide fallback and honest status text everywhere else. No face
  recognition or identity data is used.
- Three locally drawn Canvas 2D effects: Orbit bloom, Sun signal, and Party
  post; 0/3/10-second timer; mirrored front-camera capture; motion freeze;
  caption; 1200×1500 PNG output; download and Web Share paths.
- Camera-error and permission-denial recovery, live status announcements,
  keyboard control, 44 px touch targets, reduced-motion behavior, and a
  confirmation before deleting the saved image.
- IndexedDB retention for one latest postcard, localStorage preferences,
  explicit JSON export/import, restore, and delete controls.
- Installable PWA manifest with any/maskable icons and a versioned service
  worker. The shell, app assets, legal pages, and no-camera artwork are
  precached; updates surface an in-app reload notice.
- Dedicated `/privacy/` and `/terms/` documents, crawl metadata, sitemap, MIT
  license, project documentation, and the product-specific design thesis.

## Visual and asset record

The interface follows the “kinetic generative geometry” thesis in
`.factory/design.md`: cream paper, navy ink, cobalt, brick coral, and acid-lime
markers; Georgia plus system sans; print-block interactions; restrained canvas
motion. The abstract preview portrait was generated with the factory Azure
image deployment on 2026-08-28 from the prompt recorded in both the design doc
and `assets/src/geometry-portrait.prompt.json`. It was manually reviewed and
shipped as a 60 KB WebP (well below the 300 KB budget). PWA icons are original
repo-authored geometry.

## Verification

Run from a clean checkout:

```bash
npm install
npm test
npm run build
```

Verified on 2026-08-28:

- `npm test`: 3/3 Vitest unit tests and 6/6 Playwright tests passed.
- Playwright projects: Chromium at Pixel 5 mobile size and desktop Chromium.
- End-to-end: keyboard-only preview → effect → 1200×1500 PNG; persisted result;
  title/lang/main/one-h1 structure; legal pages; no console/page errors.
- Offline: service worker reached controlling state, the browser was put into
  offline mode with `context.setOffline(true)`, `/` reloaded, and preview mode
  remained usable in both projects.
- Axe: no serious or critical violations on `/`, `/privacy/`, or `/terms/` in
  either project.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 0.9 s; LCP 1.4 s; TBT 0 ms; CLS 0.003.
- Production budget: initial JS 13.75 KB raw / 5.62 KB gzip; CSS 12.24 KB raw /
  3.68 KB gzip; hero WebP 60 KB; no webfonts. `npm audit` reports 0 known
  vulnerabilities.
- `npm run build` succeeds and writes `dist/index.html`, `dist/privacy/`, and
  `dist/terms/` exactly under the deploy root.

## Known gaps and next steps

- Automated tests use the no-camera route because the worker has no physical
  phone camera. Before launch, smoke-test front/back camera switching and the
  share sheet on one iOS Safari and one Android Chrome device over HTTPS.
- Face-following depends on the browser’s native `FaceDetector`. Unsupported
  browsers deliberately use the centered guide rather than downloading a
  multi-megabyte third-party vision model; capture and all three effects remain
  functional. If tracking coverage becomes more important than the current
  speed/privacy budget, evaluate a lazily loaded, self-hosted landmark model.
- Static hosting must serve `/privacy/index.html` and `/terms/index.html` for
  their directory URLs and use HTTPS for camera/PWA capabilities.
