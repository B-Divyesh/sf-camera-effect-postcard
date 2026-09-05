# Postcard FX repair handoff — PASS

**Implementation SHA:** `2696868e62cf06858d40b2f14674e4031f72717c`

**Live URL:** <https://camera-effect-postcard.sociobot.in/>

**Date:** 2026-09-05 UTC

## Result

The seven Review 1 findings are resolved. Postcard FX now has an isolated,
one-click demo, an outcome-tested public-claim registry, plain first-screen
copy, consistent navigation, complete social metadata, a real HTTP 404 page,
and a reproducible URL smoke check.

The implementation above was built and deployed to the existing
`sf-camera-effect-postcard` static product. A later documentation-only commit
records this handoff; it does not require a new product image.

## What changed

- **Demo sandbox:** `/?demo=1` (and `/demo/`) opens Mina and Jo's garden-party
  sample with a completed 1200 × 1500 postcard. The persistent banner reads
  **Demo — sample data, nothing is saved** and has Reset demo and Start for
  real controls. Demo state uses `demo:postcard-fx` IndexedDB and
  `demo:postcard-fx-settings` localStorage, never the ordinary namespaces.
- **Claims:** `.factory/claims.json` contains 19 public claims. Each has one
  `@claim:<id>` browser test against the demo entry point. The test suite
  checks actual output, download bytes, browser requests, service-worker
  offline reload, isolated storage, video-track shutdown, and recovery paths.
- **First screen and docs:** the first screen now states the job, audience,
  and first action: **Make a private camera postcard** for friends and event
  hosts; **Try it with sample data**. The landing copy audit is in
  `.factory/copy-audit.md`; sandbox details are in `.factory/demo.md`.
- **Site shell:** added visible Demo/Maker/Privacy navigation, per-route plain
  titles, Open Graph and Twitter metadata, a 1200 × 630 original social image,
  sitemap Demo entry, and consistent legal/offline/404 headers and footers.
- **404 and policy:** `staticwebapp.config.json` now uses a response override
  to serve designed `/404.html` with HTTP 404. The local production-policy
  server reproduces that behavior. Existing CSP, permissions, framing, and
  immutable hashed-asset headers remain enforced.
- **URL smoke check:** `./verify-url.sh <url>` uses a real browser to check
  title, `lang`, one main, one h1, image alts, and console/page errors.

## Review finding disposition

| Finding | Current disposition |
| --- | --- |
| F1 demo sandbox | Resolved with the direct demo URL, populated sample, banner, reset/start controls, and separate `demo:` stores. |
| F2 claims registry | Resolved with 19 entries and 19 individually tagged outcome checks. |
| F3 unclear copy | Resolved with job/audience/action copy and the landing copy audit. |
| F4 missing 404 | Resolved: unknown live URLs return the designed page with HTTP 404. |
| F5 missing navigation | Resolved with consistent header and footer navigation on landing, legal, offline, and 404 pages. |
| F6 social metadata | Resolved with OG/Twitter tags and `social-preview.png` at 1200 × 630. |
| F7 missing smoke script | Resolved with executable `verify-url.sh`. |

The defects from all earlier verification reports remain covered: malformed
backup recovery and image-bearing import, reduced-motion canvas freezing,
visible import focus, 44 px persistent targets, immutable asset caching, CSP,
and permissions policy all pass the regression suite.

## Verification

From the documented clean setup, `npm ci` completed with no vulnerabilities.

```bash
npm test
npm run test:claims
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev --audit-level=high
```

Passed:

- `npm test`: 5 Vitest checks and 58 Playwright checks across fresh desktop
  Chromium and Pixel 5 projects.
- `npm run test:claims`: all 19 claim tests in both browser projects (38
  executions) passed. Each documented individual command is a Playwright
  `--grep @claim:<id>` invocation and is also covered by this aggregate run.
- lint, typecheck, build, and production audit passed; audit found 0
  vulnerabilities.
- Playwright Axe found 0 serious or critical violations on root, privacy, and
  terms at desktop and phone sizes, plus the designed 404 page.
- `verify-url.sh` passed against local root, local demo, local offline, live
  root, and live demo. The live custom domain has no browser console/page
  errors in the fresh checks.
- Fresh live desktop (1366 × 900) and phone (390 × 844) contexts both showed
  the job, audience, and **Try it with sample data** first action. Both entered
  the sample, showed its persistent banner and Mina and Jo caption, rendered a
  populated 1200 × 1500 PNG, and reset to the starter sample.
- A separate fresh live browser created a real no-camera postcard, changed and
  reset the demo, then chose Start for real. The original real caption and
  saved postcard remained available; there were no console/page errors.
- Deployment completed successfully. Live artifact hashes match the local
  `dist/` output for 20 of 20 public files. Live root headers retain enforcing
  CSP, camera-only permissions policy, frame denial, nosniff, strict referrer
  policy, and immutable hashing for the app asset.

Static budget check: app JavaScript is 16.37 KB raw / 6.61 KB gzip; app CSS is
13.82 KB raw / 3.96 KB gzip; the preview WebP is 58.55 KB; no webfonts ship.
All are within the product budgets. A fresh Lighthouse CLI attempt used the
preinstalled Chromium path but that browser tab crashed in this worker, so no
new Lighthouse score is reported rather than inventing one.

## Known gaps and next steps

- Chromium synthetic camera and no-camera paths are automated. A physical iOS
  Safari and Android Chrome camera/share-sheet smoke test is still sensible
  before broad promotion.
- The current worker could not produce a fresh Lighthouse score because the
  CLI browser crashed. The current static budget and browser accessibility
  checks pass; rerun Lighthouse in a worker with a stable Chrome launcher.
