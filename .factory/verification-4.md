# Independent verification 4 — PASS

**Work order:** `camera-effect-postcard-verify-4`  
**Verdict:** **PASS**  
**Finding count:** **0**  
**Untested public-claim count:** **0**  
**Implementation reviewed:** `2696868e62cf06858d40b2f14674e4031f72717c`  
**Documentation baseline reviewed:** `87d6193874c157e2f1c60c6332f21d5e0359cca8`  
**Live URL:** <https://camera-effect-postcard.sociobot.in/>  
**Verified:** 2026-09-05 UTC

## Job, audience, and first action

The job is to make a private camera postcard. It is for friends and event
hosts who want a playful photo without sending video to a social platform. The
first action is **Try it with sample data**.

Fresh live Chromium contexts at 1366 × 900 and Pixel 5 dimensions both showed
that h1, audience sentence, and first action at scroll position zero. Visual
inspection found the portrait maker readable and usable at both sizes.

## Result

No Critical, High, Medium, or Low findings were found. The product completes
the real no-camera flow, creates a 1200 × 1500 PNG, offers a one-click sample
that is isolated from real local data, and retains the declared local-first and
offline behaviour.

`2696868` is the product implementation. The commits through the documented
baseline above are documentation-only handoff records; `git diff --name-status
2696868..87d6193` contains only `.factory/handoff.md`. This report and the
handoff update are also documentation-only.

## Clean-checkout gates

After `npm ci` (142 packages, audit reported 0 vulnerabilities), these passed:

```bash
npm test
npm run test:claims
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev --audit-level=high
```

- `npm test` ran 5 Vitest tests and 58 Playwright tests using the shipped
  production-policy server.
- `npm run test:claims` ran 38 browser executions: every claim in desktop and
  Pixel 5 projects.
- Build output is `dist/`. The app JavaScript is 16.37 KB raw / 6.61 KB gzip;
  app CSS is 13.82 KB raw / 3.96 KB gzip; preview artwork is 58.55 KB. No
  webfonts ship.
- Lint, typecheck, and the production dependency audit passed with no findings.

## Public-claim replay

Each command in `.factory/claims.json` was run separately from the clean setup.
Every command passed its one tagged test in both browser projects (2/2). The
aggregate command also passed (38/38). Each claim has exactly one matching
`@claim:` tag in `tests/e2e/claims.spec.ts`.

| Claim id | Result and evidence |
| --- | --- |
| `free-use` | PASS — individual `@claim:free-use`, 2/2 |
| `phone-first` | PASS — individual `@claim:phone-first`, 2/2 |
| `portrait-safe-crop` | PASS — individual `@claim:portrait-safe-crop`, 2/2 |
| `no-account` | PASS — individual `@claim:no-account`, 2/2 |
| `no-upload` | PASS — individual `@claim:no-upload`, 2/2 |
| `offline-reload` | PASS — individual `@claim:offline-reload`, 2/2 |
| `local-processing` | PASS — individual `@claim:local-processing`, 2/2 |
| `camera-stops-after-capture` | PASS — individual `@claim:camera-stops-after-capture`, 2/2 |
| `camera-stops-tab-close` | PASS — individual `@claim:camera-stops-tab-close`, 2/2 |
| `no-audio` | PASS — individual `@claim:no-audio`, 2/2 |
| `three-effects` | PASS — individual `@claim:three-effects`, 2/2 |
| `optional-face-positioning` | PASS — individual `@claim:optional-face-positioning`, 2/2 |
| `postcard-4x5` | PASS — individual `@claim:postcard-4x5`, 2/2 |
| `png-download` | PASS — individual `@claim:png-download`, 2/2 |
| `local-persistence` | PASS — individual `@claim:local-persistence`, 2/2 |
| `local-backup` | PASS — individual `@claim:local-backup`, 2/2 |
| `no-third-party-runtime` | PASS — individual `@claim:no-third-party-runtime`, 2/2 |
| `no-face-identification` | PASS — individual `@claim:no-face-identification`, 2/2 |
| `demo-isolation` | PASS — individual `@claim:demo-isolation`, 2/2 |

## Fresh live checks

- Desktop and phone landing screens had no console or page errors and made
  requests only to `https://camera-effect-postcard.sociobot.in`.
- `/?demo=1` showed **Demo — sample data, nothing is saved**, Mina and Jo's
  garden-party caption, a populated 1200 × 1500 result, and Reset demo.
  Reset restored the starter sample. A real no-camera postcard made before
  entering demo remained available after **Start for real**; its caption and
  saved-result control were unchanged.
- A fresh live service-worker context was controlled after reload. With the
  browser offline, `/?demo=1` reopened with its 1200 × 1500 sample result and
  no errors.
- `./verify-url.sh` passed against live root and demo: each has a title,
  `lang=en`, one main landmark, one h1, complete image-alt checks, and no
  load-time browser errors.
- Playwright Axe live scans found 0 serious and 0 critical issues on root,
  demo, privacy, terms, and the unknown-route page at desktop and phone sizes
  (10 scans).
- Route titles were correct for root, demo, privacy, terms, offline, and 404.
  The unknown route returned the designed page with HTTP 404, which is expected
  behaviour rather than a defect.
- Root responses enforce CSP with `frame-ancestors 'none'`, camera-only
  permissions policy, frame denial, nosniff, strict referrer policy, and HSTS.
  The hashed JavaScript has `public, max-age=31536000, immutable` caching.
- SHA-256 checks matched all 20 served build artifacts to local `dist/`:
  documents, service worker, manifest, offline files, robots, sitemap, social
  preview, icons, and hashed app assets. `staticwebapp.config.json` is a deploy
  configuration file and is correctly not exposed as a public asset.

## Earlier findings and coverage notes

| Earlier item | Current disposition |
| --- | --- |
| Verification 1 P1 malformed backup recovery | Resolved; malformed backup and corrupt stored-settings recovery pass the browser suite. |
| Verification 1 P2 import focus | Resolved; the visible import control focus test passes. |
| Verification 1 P3 policy and caching | Resolved; live enforcing headers and immutable hashed-asset cache header verified. |
| Verification 2 P1 image-bearing backup under CSP | Resolved; export/delete/import round trip passes under the production policy. |
| Verification 2 P2 reduced motion | Resolved; the regression suite verifies stable canvas output under reduced motion. |
| Verification 2 P3 44 px persistent targets | Resolved; mobile target regression checks pass. |
| Review 1 F1 demo sandbox | Resolved; direct sample route, persistent label, reset, Start for real, and isolation were checked live. |
| Review 1 F2 claims registry | Resolved; 19 entries, 19 unique tags, every declared command replayed. |
| Review 1 F3 first-screen copy | Resolved; job, audience, and first action are visible before scroll. |
| Review 1 F4 designed 404 | Resolved; live unknown route returns HTTP 404 and a usable designed page. |
| Review 1 F5 navigation | Resolved; consistent navigation and live links were checked. |
| Review 1 F6 social metadata | Resolved by the metadata regression suite; the original social image is 1200 × 630. |
| Review 1 F7 URL smoke script | Resolved; `verify-url.sh` passed against live root and demo. |

## Remaining coverage notes

These are not release findings or untested public claims:

- Chromium synthetic-camera and live no-camera flows were exercised. A physical
  iOS Safari and Android Chrome camera and share-sheet smoke test remains
  sensible before broad promotion.
- No new Lighthouse score is recorded. The prior worker's Chrome launcher
  crashed; this verification instead confirmed the static budgets, live Axe
  scans, and all browser-functional checks. No score is invented.

