# Postcard FX verification 5 handoff

## Verification 5 status

**PASS — 0 findings and 0 untested public claims.** The independently reviewed implementation is `66af9efecf647734fab57bceddc27d43ee20098c`; the later documentation baseline is `e34fddbd85a512518d5dcfc7027e7bed34e25672`.

Fresh phone and desktop live contexts showed the job, audience, and **Try it with sample data** before scrolling. The demo was populated, visibly labeled, resettable, and isolated from a real postcard. It downloaded a valid 1200 × 1500 PNG. Camera, no-camera, invalid-backup, corrupt-settings recovery, keyboard, reduced-motion, offline, legal, route-title, 404, header, cache, and same-origin request checks passed. Twelve live Axe scans had zero serious or critical issues. All 20 public artifacts matched the clean build.

From a new detached clone at `66af9ef`, `npm ci`, `npm test` (5 unit + 68 browser tests), `npm run test:claims` (44 executions), lint, strict typecheck, build, and production audit passed. Each of the 22 public claim commands was also replayed separately and passed in both browser projects. See `.factory/verification-5.md` for the full evidence and earlier-finding disposition.

The standalone Lighthouse command could not complete because Chrome crashed inside this verifier container. This did not affect any declared claim command; the clean install-shift regression and all functional/accessibility checks passed. A physical iOS Safari and Android Chrome camera/share-sheet check is advisable before broad promotion, but no release-blocking gap is known.

# Postcard FX repair 4 handoff

- **Work order:** `camera-effect-postcard-repair-4`
- **Failed review:** `6d2b9747b6f26b4fb395f258fcd53a5deb1b22b5`
- **Previous implementation:** `2696868e62cf06858d40b2f14674e4031f72717c`
- **Repaired implementation:** `66af9efecf647734fab57bceddc27d43ee20098c`
- **Live URL:** <https://camera-effect-postcard.sociobot.in/>
- **Static Web App:** `sf-camera-effect-postcard`
- **Deployment:** `17e731b4-b3dc-409c-ae59-2fc3282329a8`
- **Completed:** 2026-09-05 UTC

## Release status

Ready for strict review. All three Review 2 findings and its three untested
public claims are resolved. The implementation SHA above is separate from the
documentation-only handoff commit that follows it.

The job is to make a private 4:5 camera postcard and download it as a PNG. It
is for friends and event hosts who want a playful phone photo without sending
video to a social platform. The first action is **Try it with sample data**.
Fresh live phone and desktop contexts showed all three before scrolling.

## Repairs

1. **Complete tagged claim coverage:** `.factory/claims.json` now has 22
   claims and 22 unique `@claim:` tests. The three additions prove that the
   available share API receives a valid 1200 × 1500 PNG, changing face boxes
   move the rendered effect, and camera use leaves only the allowed settings
   plus finished PNG in demo browser storage. Share copy now states the browser
   capability condition. The camera-tab shutdown test was also made reliable
   by keeping its observer tab open before closing the camera tab.
2. **Compact phone demo banner:** at 390 × 844 the live banner is now
   374 × 88.19 CSS px, down from 374 × 169. Its label uses a 346 px row instead
   of a 61 px column. The banner remains visible at the top after scrolling,
   while Reset demo and Start for real retain at least 44 px targets.
3. **Mobile CLS:** the delayed install action now has reserved phone-header
   height. Two fresh live Lighthouse 12.8.2 runs measured CLS
   **0.000358**, down from **0.114** and below the `<0.1` budget. A browser
   regression dispatches the install prompt and requires the main-content
   position to remain unchanged.

## Clean-checkout verification

A new clone at exactly `66af9ef` started clean, then ran the documented Node
setup:

```bash
npm ci
npm test
npm run test:claims
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev --audit-level=high
```

- `npm ci`: 142 packages; 0 reported vulnerabilities.
- `npm test`: 5 Vitest tests and 68 Playwright executions passed.
- `npm run test:claims`: all 44 executions passed.
- Every one of the 22 commands in `.factory/claims.json` was then run
  separately; each passed in mobile and desktop Chromium.
- The camera-tab shutdown claim passed 10 consecutive executions after its
  observer-lifetime repair.
- Lint, strict type checking, build, and production dependency audit passed.
- `dist/` contains `index.html`. App JS is 16.37 KB raw / 6.61 KB gzip; app
  CSS is 13.98 KB raw / 3.97 KB gzip; preview artwork is 58.55 KB. No webfonts
  or third-party runtime code ship.

## Live verification

- All 20 public artifacts matched local `dist/` byte for byte after deploy.
- `verify-url.sh` passed for `/` and `/?demo=1`.
- Fresh 390 × 844 and 1366 × 900 contexts entered the sample in one click.
  Both showed Mina and Jo's garden-party caption, a populated 1200 × 1500
  result, and a downloaded PNG with the correct signature and dimensions.
- Reset restored the starter sample. Start for real returned to an ordinary
  postcard whose caption and saved-result control survived demo changes.
- Runtime requests stayed on the product origin. Normal pages produced no
  console or page errors. The unknown route returned the designed HTTP 404;
  its expected 404 resource message is not treated as a defect.
- Twelve live Axe scans covered root, demo, privacy, terms, offline, and 404 at
  phone and desktop sizes. All had zero serious or critical issues, one h1,
  one main landmark, and route-specific titles.
- A controlled fresh context reopened the populated demo offline with its
  1200 × 1500 result and no errors. An isolated service-worker revision showed
  **A fresh version is ready.** with the Reload action.
- A live synthetic-camera run requested one video track and no audio, enforced
  the 42-character limit, completed the 10-second timer in 11.82 seconds,
  created a 1200 × 1500 PNG, and stopped the track. Permission denial moved
  focus to the no-camera path. Invalid backup input preserved valid settings;
  the import focus ring measured 3 px. Reduced-motion canvas output stayed
  byte-identical across a 700 ms interval.
- Two fresh live Lighthouse runs each scored Performance 100, Accessibility
  100, Best Practices 100, and SEO 100. Both measured LCP about 1.20 s, TBT
  0 ms, CLS 0.000358, and about 97 KB transferred.
- Live headers enforce HSTS, same-origin CSP with `frame-ancestors 'none'`,
  camera-self-only permissions, frame denial, `nosniff`, and strict-origin
  referrer policy. Hashed assets use one-year immutable caching.

## Earlier finding disposition

- Verification 1 malformed-backup recovery, visible import focus, response
  policy, and caching remain fixed and passed.
- Verification 2 image-bearing backup import under CSP, reduced-motion canvas,
  and 44 px persistent targets remain fixed and passed.
- Review 1 demo isolation, claim registry, plain first screen, designed 404,
  navigation, social metadata, and URL smoke script remain fixed and passed.
- Review 2 claim coverage, phone banner layout, and CLS are fixed as described
  above.

## Known gap

No release-blocking gap is known. Automated tests use Chromium's synthetic
camera and a browser share-API fixture. A physical iOS Safari and Android
Chrome camera/share-sheet check remains advisable before broad promotion.
This free static PWA has no backend, billing offer, external AI dependency, or
server-side state.
