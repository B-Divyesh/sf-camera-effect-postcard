# Postcard FX verification handoff

**Work order:** `camera-effect-postcard-verify-2`

**Tested commit:** `088c05184202e45f521eb077f4b7c9992adfddc1`

**Tested URL:** <https://camera-effect-postcard.sociobot.in/>

**Verified:** 2026-08-28 UTC

## Release verdict — FAIL

The live deployment is the candidate: all 16 served build artifacts match the
local `dist/` files byte-for-byte. The earlier malformed-backup startup defect,
hidden import focus defect, and missing response-policy/caching controls are
repaired. Fresh QA nevertheless found a new deployment-only release blocker
and two accessibility contract violations.

### Open defects

1. **P1 — exported backups containing a postcard cannot be imported live.**
   The production CSP has `connect-src 'self'`, while `dataUrlToBlob()` calls
   `fetch(data:image/png...)`. Importing the app's own just-exported backup
   reports it invalid, does not restore the postcard, and logs CSP/Fetch console
   errors. The exact workflow succeeds against `npm run preview`, proving the
   response policy is the differentiator.
2. **P2 — `prefers-reduced-motion` does not freeze canvas effects.** Two Orbit
   canvas captures 700 ms apart differed in a reduced-motion context. CSS
   animation is suppressed, but the requestAnimationFrame renderer considers
   only the manual Freeze motion checkbox.
3. **P3 — small navigation hit areas.** At 390 px, the home wordmark is 38 px
   high and footer Privacy/Terms links are 24 px high, below the required
   44 × 44 CSS px target size.

Full reproduction details and evidence are in
`.factory/verification-2.md`.

## Verification summary

From a clean candidate checkout:

```bash
npm ci
npm audit --omit=dev --audit-level=high
npm test
npm run build
```

- Install/audit: 60 packages, 0 vulnerabilities.
- Tests: 5/5 Vitest and 10/10 Playwright passed at desktop and Pixel 5.
- Build/type check: passed; `dist/` produced. No lint script exists.
- Live normal flow: all three effects, 0/10-second timers, 42-character input,
  camera grant/denial, camera switch/stop, 1200 × 1500 PNG, download, saved
  restore, deletion confirmation, share fallback, invalid-input recovery, and
  keyboard focus exercised.
- Axe: 0 serious/critical findings on main, privacy, and terms at desktop and
  390 px. Factory URL smoke verification passed with no load errors.
- PWA: valid/installable manifest, controlled service worker, live offline
  reload/capture/legal page, and isolated update/reload path all passed.
- Privacy: no third-party requests, uploads, trackers, CDN assets, remote fonts,
  or audio capture observed.
- Headers/caching: enforcing CSP and framing/permissions protections present;
  hashed assets cache immutable for one year; documents/SW revalidate.
- Lighthouse mobile: Performance 98, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.2 s, LCP 1.4 s, TBT 150 ms, CLS 0.003; 72 KiB initial
  transfer. App JS is 14.86 kB raw / 6.04 kB gzip.

## Required next steps

1. Replace the `fetch(data:)` backup conversion with a CSP-compatible local
   decoder (or deliberately adjust policy), then add a production-policy E2E
   export/delete/import round trip.
2. Feed `prefers-reduced-motion` into the canvas animation state and test that
   the rendered canvas stays stable.
3. Expand persistent navigation link hit areas to at least 44 × 44 CSS px.
4. Re-run independent verification. Physical iOS Safari and Android Chrome
   camera/share-sheet smoke tests remain advisable because CI uses Chromium's
   synthetic camera.
