# Postcard FX review 2 handoff — FAIL

**Implementation SHA:** `2696868e62cf06858d40b2f14674e4031f72717c`

**Documentation baseline SHA:** `638d1ac206d28b68f7a8df02d484427839b839a2`

**Live URL:** <https://camera-effect-postcard.sociobot.in/>

**Date:** 2026-09-05 UTC

## Result

Review 2 records **FAIL**, with 3 findings and 3 untested public claims. The
full report is `.factory/review-2.md`. No product code was changed.

The core product paths remain healthy: all local gates, all 19 declared claim
commands, the aggregate 38-execution claim suite, desktop and phone sample
flows, real/demo isolation, valid PNG download, camera shutdown, invalid input
recovery, offline use, accessibility scans, legal pages, designed 404, links,
headers, and all 20 live artifact comparisons passed.

## Findings to address

1. Add tagged demo claim coverage for native sharing, supported face-following,
   and absence of stored face-position data, or narrow the corresponding
   public copy.
2. Reflow the persistent demo banner at 390 px. It is 169 px tall and squeezes
   its label into a 61 px column, making the sticky banner obstructive.
3. Remove the mobile load shift. Two Lighthouse 12.8.2 runs measured CLS 0.114
   against the required < 0.1 budget.

## Verification performed

From a clean checkout:

```bash
npm ci
npm test
npm run test:claims
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev --audit-level=high
./verify-url.sh https://camera-effect-postcard.sociobot.in/
./verify-url.sh 'https://camera-effect-postcard.sociobot.in/?demo=1'
```

- `npm test`: 5 unit and 58 browser tests passed.
- Every `.factory/claims.json` command passed separately in both projects.
- Aggregate claims: 38/38 passed.
- Build output: JS 16.37 KB raw / 6.61 KB gzip; CSS 13.82 KB raw /
  3.96 KB gzip; preview WebP 58.55 KB.
- Fourteen fresh live Axe scans found no serious or critical issues.
- Lighthouse repeated at 97 Performance, 100 Accessibility, 100 Best
  Practices, and 100 SEO, but CLS repeated at 0.114.
- Live output matched 20/20 local public artifacts.

## Earlier findings

All Verification 1 and 2 defects remain fixed: malformed-backup recovery,
visible import focus, response policy and caching, image-bearing backup import
under CSP, reduced-motion canvas behavior, and 44 px targets all passed.

Review 1's first-screen copy, 404, navigation, social metadata, and smoke-script
findings remain fixed. Its demo functionality passes, but the phone banner has
the new layout finding. Its original missing registry is substantially fixed,
but three public statements still lack complete tagged coverage.

## Evidence and next step

Screenshots and Lighthouse JSON/trace files are under `/work/.evidence/`.
Repair the three findings without weakening the local-only privacy model, then
rerun every declared claim command and the live phone review.
