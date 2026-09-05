# Review 2: Make a private camera postcard

**Verdict: FAIL.** There are **3 findings** and **3 untested public claims**.
This is not a release approval.

**Live URL:** <https://camera-effect-postcard.sociobot.in/>

**Reviewed:** 2026-09-05 UTC

**Implementation reviewed:** `2696868e62cf06858d40b2f14674e4031f72717c`

**Documentation baseline reviewed:** `638d1ac206d28b68f7a8df02d484427839b839a2`

The implementation SHA is the last product-code commit. The later commits
through the documentation baseline change only factory reports and handoff
records. A fresh local build matched all 20 live public artifacts byte for
byte, excluding the deploy-only `staticwebapp.config.json` as expected.

## Job, audience, and first action

Job: make a private 4:5 camera postcard and download it as a PNG.

Audience: friends and event hosts who want a playful phone photo without
sending video to a social platform.

First action: **Try it with sample data**.

Fresh desktop 1366 × 900 and phone 390 × 844 browsers showed all three before
scrolling. The headline is **Make a private camera postcard**.

## Findings

### F1 — Medium — Three public claims lack complete tagged claim tests

All 19 declared claim commands pass, and each declared id has exactly one
`@claim:<id>` tag. The public product still makes three additional reliance
claims that the registry does not completely test:

1. The result says users can share through a phone share sheet and provides
   **Share postcard**. There is no share claim and no tagged test references
   `#share-button`. An independent stubbed live share check received a
   `postcard-fx.png` file, but an ad-hoc review check does not replace the
   required claim entry and reproducible command.
2. The landing page and privacy policy say supported browsers make effects
   follow a coarse face position. `@claim:optional-face-positioning` tests only
   the opposite branch: FaceDetector is unavailable and the centered guide is
   used. No tagged test supplies changing face boxes and checks the output.
3. The privacy policy says face positions are not stored. Neither
   `local-processing` nor `no-face-identification` checks browser storage for
   face-position records; they check network origins and the absence of an
   identity step.

These are three untested public claims under the attached claims contract.
They must be listed with observable demo tests or removed/narrowed.

### F2 — Medium — The persistent phone demo banner is obstructive

At 390 × 844 on the live direct demo, `#demo-banner` measures 374 × 169 CSS px.
Its label is squeezed into a 61 × 147 px column while the two actions consume
270 px, so **Demo — sample data, nothing is saved** breaks almost word by word.
The sticky banner then covers about 20% of the viewport while the user edits
and reviews the postcard.

The controls remain operable, but this does not meet the demo contract's
requirement for a persistent, unobtrusive sample label or the phone-first
clarity requirement. Evidence: `/work/.evidence/review-2-phone-demo.png`.

### F3 — Low — Mobile CLS exceeds the declared performance budget

Two fresh Lighthouse 12.8.2 mobile runs against the live root both measured
CLS **0.114**, above the attached **< 0.1** budget. The saved trace records one
shift with the main content moving from y=145 to y=168. Both runs otherwise
scored Performance 97, Accessibility 100, Best Practices 100, and SEO 100;
LCP was 1.2 s and total blocking time was 40 ms then 0 ms.

Evidence is in `/work/.evidence/lighthouse-review-2.json`,
`/work/.evidence/lighthouse-review-2-repeat.json`, and
`/work/.evidence/lighthouse-review-2-assets/`.

## Clean-checkout gates

The checkout was clean at `638d1ac` before review. From the documented Node
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

Results:

- `npm ci`: 142 packages, 0 reported vulnerabilities.
- `npm test`: 5 Vitest tests and 58 Playwright tests passed.
- `npm run test:claims`: 38/38 browser executions passed.
- Lint, type checking, build, and production dependency audit passed.
- `dist/` was produced. App JavaScript is 16.37 KB raw / 6.61 KB gzip;
  app CSS is 13.82 KB raw / 3.96 KB gzip; preview artwork is 58.55 KB.

## Declared claim replay

Every command in `.factory/claims.json` was run separately from the clean
setup. Each passed in desktop Chromium and Pixel 5, 2/2:

| Claim | Result |
| --- | --- |
| `free-use` | PASS |
| `phone-first` | PASS |
| `portrait-safe-crop` | PASS |
| `no-account` | PASS |
| `no-upload` | PASS |
| `offline-reload` | PASS |
| `local-processing` | PASS |
| `camera-stops-after-capture` | PASS |
| `camera-stops-tab-close` | PASS |
| `no-audio` | PASS |
| `three-effects` | PASS |
| `optional-face-positioning` | PASS for the fallback branch only; see F1 |
| `postcard-4x5` | PASS |
| `png-download` | PASS |
| `local-persistence` | PASS |
| `local-backup` | PASS |
| `no-third-party-runtime` | PASS |
| `no-face-identification` | PASS |
| `demo-isolation` | PASS |

The aggregate command also passed 38/38. F1 concerns public claims outside the
observable scope of these declared commands.

## Fresh live evidence

- Desktop and phone entered the sample in one click. It showed Mina and Jo's
  garden-party caption, a completed 1200 × 1500 result, a valid downloaded PNG,
  the persistent sample label, Reset demo, and Start for real.
- Reset restored the original sample. A separately made real postcard and its
  caption survived demo changes, reset, and Start for real.
- Normal no-camera and synthetic-camera paths passed. The camera requested no
  audio and stopped after capture. A 42-character caption rejected a 43rd
  character; the 10-second timer did not finish early.
- A malformed backup was rejected without replacing valid settings. Manually
  corrupted saved settings were cleared on reload and the maker recovered.
- Keyboard use reached the skip link, maker, capture, and visible import focus.
  Reduced-motion canvas output stayed byte-identical while ordinary motion
  changed.
- A fresh service-worker context controlled the app. The populated demo and
  privacy page reopened offline without console or page errors. An isolated
  copy with a changed worker version showed **A fresh version is ready** and
  its Reload action.
- Live root and demo both passed `verify-url.sh`. Fourteen desktop/phone Axe
  scans across root, demo, privacy, terms, offline, and the designed 404 found
  0 serious and 0 critical violations.
- Internal links returned their intended responses. Privacy and terms have
  route-specific titles. The unknown route returned the designed HTTP 404;
  its expected 404 browser resource message is not a defect.
- Live runtime HTTP(S) requests stayed on the product origin. No analytics,
  trackers, runtime CDNs, remote fonts, or upload requests were observed.
- Live headers enforce CSP with `frame-ancestors 'none'`, camera-only
  permissions, frame denial, nosniff, strict referrer policy, and HSTS.
  Hashed assets use immutable caching.

The product is static, so backend tenant, restart, health, and 429 checks do
not apply. The brief does not imply a useful AI step; adding one would weaken
the local camera job and privacy boundary.

## Earlier finding disposition

| Earlier item | Current disposition |
| --- | --- |
| Verification 1 P1 malformed backup recovery | Resolved; invalid import and corrupt stored-state recovery passed locally and live. |
| Verification 1 P2 import focus | Resolved; the visible label receives the designed focus outline. |
| Verification 1 P3 policy and caching | Resolved; live enforcing headers and immutable hashed assets passed. |
| Verification 2 P1 image-bearing backup under CSP | Resolved; export/delete/import passes under production policy. |
| Verification 2 P2 reduced motion | Resolved; canvas output is stable under reduced motion. |
| Verification 2 P3 44 px persistent targets | Resolved; checked phone targets are at least 44 px. |
| Review 1 F1 demo sandbox | Functionally resolved; isolation and reset pass, but the phone banner has the new F2 presentation defect. |
| Review 1 F2 claims registry | Partly resolved; all 19 entries pass, but F1 identifies three uncovered public claims. |
| Review 1 F3 first-screen copy | Resolved; job, audience, and first action are visible before scroll. |
| Review 1 F4 designed 404 | Resolved; the unknown live route returns the designed HTTP 404. |
| Review 1 F5 navigation | Resolved; consistent navigation and live internal links pass. |
| Review 1 F6 social metadata | Resolved; OG/Twitter data and the 1200 × 630 image pass. |
| Review 1 F7 URL smoke script | Resolved; live root and demo pass the script. |

## Decision

**FAIL — 3 findings, 3 untested public claims.** Fix F1–F3 and run another
strict review before declaring the product accepted.
