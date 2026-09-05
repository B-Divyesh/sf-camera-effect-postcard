# Review 3: Make a private camera postcard

**Verdict: PASS.** There are **0 findings** and **0 untested public claims**.

- Live URL: <https://camera-effect-postcard.sociobot.in/>
- Reviewed: 2026-09-05 UTC
- Implementation reviewed: `66af9efecf647734fab57bceddc27d43ee20098c`
- Documentation baseline: `e34fddbd85a512518d5dcfc7027e7bed34e25672`
- Review starting revision: `aa3a7d8c5015e84b4e45d902bd8dfd4d77f239b4`

The two revisions after the implementation change only `.factory` reports and
handoff notes. All 20 deployed public files match the clean implementation
build byte for byte.

## Job, audience, and first action

The job is to make a private camera postcard and download a 4:5 PNG. The
audience is friends and event hosts who want a playful phone photo without
sending video to a social platform. The first action is **Try it with sample
data**.

Fresh 1366 × 900 desktop and 390 × 844 phone contexts showed the job, audience,
and first action at scroll position zero. The action was fully visible before
scrolling in both contexts.

## Findings

None. No Critical, High, Medium, or Low findings remain.

## Clean-checkout gates

A detached checkout at the implementation SHA was created at
`/work/qa-camera-effect-postcard-review-3`. It began clean. `npm ci` installed
142 packages and reported no vulnerabilities. These commands passed:

```bash
npm test
npm run test:claims
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev --audit-level=high
```

- `npm test`: 5 unit tests and 68 browser executions passed.
- `npm run test:claims`: 44/44 browser executions passed on a clean rerun.
  The first aggregate run reached 43 passes before Chromium itself aborted on
  a dangling-pointer check during context shutdown. No assertion failed. A
  fresh aggregate process passed, and the affected claim also passed in its
  required standalone command.
- Lint, strict TypeScript, production build, and production dependency audit
  passed. `dist/index.html` was produced.
- App JavaScript is 16.37 KB raw / 6.61 KB gzip. App CSS is 13.98 KB raw /
  3.97 KB gzip. The preview artwork is 58.55 KB. No webfont ships.

The registry has 22 entries, 22 unique `@claim:` tags, no missing tags, no
extra tags, and no duplicate tag. Every declared command was run separately:

| Claim | Result |
| --- | --- |
| `free-use` | PASS — 2/2 |
| `phone-first` | PASS — 2/2 |
| `portrait-safe-crop` | PASS — 2/2 |
| `no-account` | PASS — 2/2 |
| `no-upload` | PASS — 2/2 |
| `offline-reload` | PASS — 2/2 |
| `local-processing` | PASS — 2/2 |
| `camera-stops-after-capture` | PASS — 2/2 |
| `camera-stops-tab-close` | PASS — 2/2 |
| `no-audio` | PASS — 2/2 |
| `three-effects` | PASS — 2/2 |
| `face-following` | PASS — 2/2 |
| `optional-face-positioning` | PASS — 2/2 |
| `postcard-4x5` | PASS — 2/2 |
| `png-download` | PASS — 2/2 |
| `native-share` | PASS — 2/2 |
| `local-persistence` | PASS — 2/2 |
| `local-backup` | PASS — 2/2 |
| `no-third-party-runtime` | PASS — 2/2 |
| `no-face-identification` | PASS — 2/2 |
| `no-face-position-storage` | PASS — 2/2 |
| `demo-isolation` | PASS — 2/2 |

The live page, privacy and terms pages, offline copy, README, and claim registry
were cross-checked. No public reliance claim is missing a registered test.

## Fresh live checks

- The one-click demo opened Mina and Jo's garden-party sample with a populated
  1200 × 1500 result. Its persistent label reads **Demo — sample data, nothing
  is saved**. The phone banner measured 377 × 88.19 CSS px and stayed at y=0
  after scrolling. Reset restored the starter caption.
- A real postcard created before demo use retained its caption and saved-result
  control after demo changes, reset, and **Start for real**. Demo use did not
  alter real data.
- Normal no-camera use produced three visibly different effects and a valid
  1200 × 1500 PNG. Downloaded PNG signature and IHDR dimensions passed. The
  image-bearing backup exported, deleted, and imported successfully.
- The 42-character caption boundary held. A malformed backup was rejected
  without changing valid preferences. Manually corrupt preferences were
  cleared on reload with recovery copy, and the maker remained usable.
- A synthetic live camera requested video with `audio: false`. The 10-second
  boundary completed in 10.49 seconds, created a 1200 × 1500 result, and
  stopped its track. Permission denial explained recovery and moved focus to
  **Try without a camera**.
- Keyboard use put the skip link first, moved focus to `main`, and showed the
  designed 3 px import focus outline. Reduced-motion output stayed identical
  over 700 ms.
- A controlled fresh phone context reopened the populated demo offline, made a
  new postcard offline, and opened the cached privacy page. The update event
  showed **A fresh version is ready.** and its Reload action sent
  `SKIP_WAITING`. Showing the install action shifted main content by 0 px.
- `verify-url.sh` passed for root, demo, privacy, and terms. Twelve live
  Playwright Axe scans covered root, demo, privacy, terms, offline, and 404 at
  phone and desktop sizes. All had zero serious or critical violations, one
  h1, one main landmark, `lang=en`, and their correct route title.
- Internal links and the explicit external operator link returned 200. An
  unknown path returned the designed HTTP 404 page. The deliberate 404 is
  expected and is not a defect.
- Live runtime HTTP(S) requests stayed on this product origin during product
  use. No analytics, tracker, runtime CDN, remote font, or upload request was
  observed.
- Live headers enforce HSTS, a same-origin CSP with `frame-ancestors 'none'`,
  camera-only permissions, frame denial, `nosniff`, and strict-origin referrer
  policy. Hashed assets use one-year immutable caching.

Fresh Lighthouse 12.8.2 results were Performance 100, Accessibility 100, Best
Practices 100, and SEO 100. LCP was 1.223 s, CLS 0.000358, total blocking time
91 ms, and total transfer 97.3 KB. Evidence is saved at
`/work/.evidence/review-3-lighthouse.json`; phone and desktop screenshots use
the `/work/.evidence/review-3-*.png` prefix.

## Earlier finding disposition

| Earlier item | Current disposition |
| --- | --- |
| Verification 1 P1 malformed backup recovery | Resolved. Invalid import and corrupt persisted-state recovery passed live and in the clean suite. |
| Verification 1 P2 import focus | Resolved. The live visible label has a 3 px focus outline. |
| Verification 1 P3 response policy and caching | Resolved. Current live policy and immutable asset caching passed. |
| Verification 2 P1 image backup under CSP | Resolved. The live export/delete/import round trip passed under the enforcing CSP. |
| Verification 2 P2 reduced motion | Resolved. Live reduced-motion canvas output remained stable. |
| Verification 2 P3 44 px persistent targets | Resolved. The clean mobile target regression passed; fresh phone interaction remained usable. |
| Review 1 F1 demo sandbox | Resolved. One-click sample, separate storage, persistent label, reset, and Start for real passed. |
| Review 1 F2 claim registry | Resolved. All 22 entries and unique tags are present, and all 22 commands passed separately. |
| Review 1 F3 plain first screen | Resolved. The job, audience, and first action are visible before scrolling. |
| Review 1 F4 designed 404 | Resolved. Unknown live paths return the designed page with HTTP 404. |
| Review 1 F5 navigation | Resolved. Consistent header/footer navigation and every link passed. |
| Review 1 F6 social metadata | Resolved. Metadata passed the clean suite; the 1200 × 630 asset matches live. |
| Review 1 F7 URL smoke script | Resolved. The script passed on all four main public routes. |
| Review 2 F1 three uncovered claims | Resolved. Native share, face following, and no face-position storage each have passing standalone commands. |
| Review 2 F2 obstructive demo banner | Resolved. Fresh phone height is 88.19 px, with the complete label on one row and persistent controls. |
| Review 2 F3 mobile CLS | Resolved. Fresh live CLS is 0.000358; install-action shift is 0 px. |
| Verification 3, 4, and 5 | No findings were recorded; their passing areas remain covered above. |

## Scope decision

This is a static local-first PWA. Backend tenant isolation, restart
persistence, health, and 429/Retry-After checks do not apply. An AI step would
not improve the brief's private on-device camera job and would weaken its
privacy boundary, so there is no missed AI leverage finding.

A physical iOS Safari and Android Chrome camera/share-sheet smoke test remains
prudent before broad promotion. It is not a public-claim coverage gap because
the capability conditions and observable browser paths are tested.

## Decision

**PASS — 0 findings and 0 untested public claims.**
