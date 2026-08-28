# Postcard FX repair handoff

- **Work order:** `camera-effect-postcard-repair-2`
- **Failed report:** `df8fa0d18820fcbdb1bc26d2670e7a895f80806b`
- **Failed candidate:** `088c05184202e45f521eb077f4b7c9992adfddc1`
- **Repair commit:** `9afb13d733547022a06fbac08eb1cb84afeeb30d`
- **Deployed URL:** <https://camera-effect-postcard.sociobot.in/>
- **Azure deployment:** `04957c55-543f-4c17-8980-de03b9cbc90c`
**Completed:** 2026-08-28 UTC

## Release status

Ready for independent verification. All three findings in
`.factory/verification-2.md` are repaired, covered by exact regressions, and
confirmed against the deployed custom domain. The original static PWA artifact,
local-only privacy model, researched scope, and visual system are unchanged.

## Repairs

1. **P1 — production backup import:** `dataUrlToBlob()` now parses and decodes
   base64 locally with `atob` and `Uint8Array`; it no longer calls
   `fetch(data:)`, so the intentional `connect-src 'self'` CSP remains strict.
   The regression creates a real 1200 × 1500 postcard, exports it, deletes it,
   imports that same image-bearing JSON, verifies the restored result, reloads,
   and verifies persistence while the production response policy is active.
   A unit test also makes `fetch` fail if the decoder attempts to use it.
2. **P2 — reduced motion:** the canvas and final export now treat the OS
   `prefers-reduced-motion: reduce` query as frozen in addition to the manual
   checkbox. Because the render loop reads the live media-query state on every
   frame, preference changes apply without reload. The regression proves two
   canvas snapshots 700 ms apart are identical under reduced motion and differ
   again under ordinary motion.
3. **P3 — touch targets:** the home wordmark and footer legal links now have a
   minimum 44 px height; persistent brand, back, and footer links on both legal
   pages receive the same treatment. The 390 px regression measures every
   affected target and requires both dimensions to be at least 44 CSS px.

Playwright now serves `dist/` through a small production-policy server that
reads the shipped `staticwebapp.config.json`. This prevents future
deployment-only CSP regressions. ESLint and explicit type-check scripts were
also added so all requested gates are repeatable.

## Verification evidence

Environment: Node `v22.23.2`, npm `10.9.8`, Playwright `1.58.2`.

```bash
npm ci
npm audit --omit=dev --audit-level=high
npm test
npm run lint
npm run typecheck
npm run build
```

- Clean install: 142 packages; audit: 0 vulnerabilities.
- Unit/integration: 6/6 Vitest tests passed.
- Browser suite: 18/18 Playwright runs passed (9 scenarios in both Pixel 5
  mobile and desktop Chromium), including keyboard operation, live-region/focus
  behavior, CSP backup round trip, reduced motion, touch targets, persistence,
  invalid-data recovery, privacy, and real service-worker offline capture.
- Type/lint: strict `tsc --noEmit` and ESLint passed with no findings.
- Production build: passed and emitted `dist/index.html`. App JavaScript is
  15,136 B raw / 6.18 kB gzip; app CSS is 12,416 B raw / 3.72 kB gzip; legal CSS
  is 1,230 B raw / 0.66 kB gzip; no fonts ship. Package/consumer validation is
  not applicable to this static PWA.
- Direct browser exercise at 390 × 844 and 1366 × 900: all three effects,
  42-character boundary, synthetic camera grant, front/back switch, one video
  and zero audio tracks, 3-second timer (3.752 s observed), 1200 × 1500 PNG,
  stream shutdown, camera denial recovery/focus, and zero console/page errors.
- Accessibility: factory URL smoke passed with title, `lang`, one `h1`, `main`,
  complete alt text, labeled buttons, and no load errors. Live Axe scans of `/`,
  `/privacy/`, and `/terms/` at 390 × 844 and 1366 × 900 found 0 serious or
  critical violations in all six scans. Keyboard capture and visible import
  focus passed in both Playwright projects.
- Privacy: normal capture and backup use contacted only the app origin; no
  analytics, upload, remote font/script, audio capture, or third-party request
  was observed.
- Offline/update: a controlled live install reloaded offline, created a PNG,
  and opened the cached privacy page. An isolated service-worker revision
  displayed “A fresh version is ready.” and the Reload action with no errors.
- Response policy: live HTTPS includes HSTS, strict same-origin CSP,
  `frame-ancestors 'none'`, camera-self-only permissions, `DENY` framing,
  `nosniff`, and strict-origin referrer policy. Documents and service worker use
  `max-age=0, must-revalidate`; hashed assets use one-year immutable caching.
- Deployment identity: all 16 publicly served artifacts match the local
  production `dist/` files byte-for-byte by SHA-256. The deployment-only config
  file is correctly not public.
- Live repaired path: image-bearing backup export/delete/import/reload,
  reduced-motion stability, 44 px targets, offline capture/legal navigation,
  same-origin-only networking, and zero console/page errors all passed at the
  deployed custom domain.
- Lighthouse 12.8.2 against the live mobile URL: Performance 100,
  Accessibility 100, Best Practices 100, SEO 100; FCP 0.95 s, LCP 1.20 s,
  TBT 29.5 ms, CLS 0.0025, total transfer 96,184 B.

## Run locally

```bash
npm ci
npm test
npm run lint
npm run build
npm run preview:policy
```

## Known gaps

No release-blocking gaps are known. Physical iOS Safari and Android Chrome
camera/share-sheet smoke tests remain advisable because automated camera
coverage uses Chromium's synthetic video device. No imagery was regenerated or
changed during this repair.
