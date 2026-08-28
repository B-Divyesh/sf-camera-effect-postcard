# Postcard FX repair handoff

**Repair commit:** `154431232d940265b42a54e92c2751826d4ae683`
**Base / verifier report:** `71b17f081fd490098fc9b796ddf795771205b539`
**Live URL:** <https://camera-effect-postcard.sociobot.in/>
**Deployed:** 2026-08-28 UTC via Azure Static Web Apps (`dist/`)

## Release verdict — PASS

All three findings from the independent verification are repaired without
changing the camera, no-camera, capture, export, privacy, or PWA product
behavior that had already passed.

### Repairs

1. **P1: malformed backup recovery**
   - `isSavedSettings()` now accepts only the complete, exact v1 preference
     shape (known effect, 0/3/10 timer, booleans, and a ≤42-character caption).
   - Import validates the complete envelope, every settings field, and any PNG
     data URL before writing either local store. A rejected backup leaves the
     existing preferences and saved postcard unchanged.
   - Startup validates persisted preferences, removes corrupt/legacy values,
     and shows the user a recovery status instead of allowing initialization to
     throw. Restored preferences no longer write partial defaults during
     restoration.
2. **P2: import control keyboard focus**
   - The visible `Import local backup` print-block label receives the same
     3 px cobalt focus treatment whenever its visually hidden file input has
     focus.
3. **P3: caching and response policy**
   - Production JS, CSS, and preview art are content-hashed under `/assets/`;
     the generated service worker precaches the exact hashed app, legal CSS,
     and artwork URLs with a cache name derived from those URLs.
   - `public/staticwebapp.config.json` is the native Azure Static Web Apps
     deployment configuration. It applies CSP, `frame-ancestors 'none'`,
     `X-Frame-Options: DENY`, `Permissions-Policy`, `nosniff`, strict referrer
     policy, mutable document caching, and one-year immutable caching to
     `/assets/*`.

## Regression coverage

- `tests/storage.test.ts` rejects each malformed settings field, overlong
  caption, and unexpected fields.
- `tests/e2e/app.spec.ts` imports the verifier's
  `{"product":"postcard-fx","version":1,"settings":"corrupt"}` backup,
  proves prior stored preferences are unchanged, reloads a separately corrupt
  stored value, confirms recovery UI and working preview/capture, and records
  no page errors. It also checks the visible import label's focus outline.
- `tests/deployment-contract.test.ts` locks the Azure CSP/framing/permissions
  and immutable hashed-asset policy into the test suite.

## Verification evidence

Run from a clean checkout:

```bash
npm ci
npm test
npm run build
```

Completed on 2026-08-28:

- `npm ci`: 60 packages installed; `npm audit --omit=dev --audit-level=high`:
  0 vulnerabilities.
- `npm test`: 5/5 Vitest unit/deployment-contract tests and 10/10 Playwright
  tests passed. Playwright uses the production build at desktop Chromium and
  Pixel 5 (390 × 844), including keyboard capture, malformed import/reload,
  visible import focus, legal-page Axe scans, no-console/page-error checks, and
  service-worker offline reload.
- `npm run build`: TypeScript check and Vite production build passed; `dist/`
  has its root `index.html`. Initial app JS is 14.86 kB raw / 6.04 kB gzip;
  main CSS is 12.32 kB raw / 3.70 kB gzip; legal CSS is 1.14 kB raw / 0.63 kB
  gzip; preview WebP is 58.55 kB; no webfonts ship.
- Local production-build Lighthouse mobile: Performance 100, Accessibility
  100, Best Practices 100, SEO 92; FCP 1.0 s, LCP 1.4 s, TBT 10 ms, CLS 0.003.
  The SEO point is the expected localhost/HTTP limitation.
- Visual review of the production build at 1366 × 900 and 390 × 844 confirmed
  the original kinetic-generative-geometry presentation and responsive
  phone-first layout remain intact.
- Live `verify-url.sh`: HTTPS 200, title/lang/one h1/main/alt checks passed,
  no browser console or page errors, 789 ms load in the verifier smoke run.
- Live Axe: 0 serious/critical violations across `/`, `/privacy/`, and
  `/terms/` at both 1366 × 900 and 390 × 844.
- Live privacy capture observed only
  `https://camera-effect-postcard.sociobot.in`; no third-party runtime origin
  or remote font/script request occurred.
- Live offline: a controlled live service worker cache
  `postcard-fx-9fc4d09b8171` reloaded `/` offline and enabled no-camera
  preview/capture with no errors. An isolated service-worker revision test
  observed the in-app “A fresh version is ready.” update toast.
- Live identity: root HTML, service worker, manifest, offline page, both legal
  pages, app JS, both CSS files, preview WebP (10 files) were byte-identical
  to `dist/` by SHA-256. Live root uses `max-age=0, must-revalidate`; the
  hashed app JS returns `public, max-age=31536000, immutable`; CSP,
  Permissions-Policy, `X-Frame-Options`, `nosniff`, strict referrer policy,
  and HSTS are present.

## Known gaps / next steps

- The automated environment has no physical phone camera. Before a broad
  launch, smoke-test front/back camera switching and the native share sheet on
  one iOS Safari and one Android Chrome device over HTTPS.
- `FaceDetector` remains an on-device optional enhancement. Unsupported
  browsers use the honest centered-guide fallback; no third-party vision model
  or face data is introduced.
