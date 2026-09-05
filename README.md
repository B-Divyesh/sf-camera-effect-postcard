# Postcard FX

Make a private camera postcard.

Postcard FX is for friends and event hosts who want a playful phone photo
without sending video to a social platform. Use the camera or the no-camera
preview, choose one of three geometric effects, add a short message, and
download a 4:5 PNG.

Live product: <https://camera-effect-postcard.sociobot.in>

## Try the sample

Open <https://camera-effect-postcard.sociobot.in/?demo=1>, or choose **Try it
with sample data** on the first screen. The demo starts with Mina and Jo's
garden-party postcard already made.

Demo data is separate from normal postcard data. **Reset demo** restores the
starter sample. **Start for real** deletes the demo data and opens the ordinary
maker. See [the demo notes](.factory/demo.md) for its storage namespaces.

## Privacy and product claims

Camera frames, captions, and postcards stay in the browser. Audio is not
requested. The latest postcard and preferences are local browser data, with
local backup tools. There are no analytics, trackers, third-party scripts, or
runtime CDNs.

Every public claim has a browser test using the sample sandbox. The exact
claim wording, test commands, and observable checks are in
[.factory/claims.json](.factory/claims.json). Read the user-facing
[privacy policy](https://camera-effect-postcard.sociobot.in/privacy/) and
[terms](https://camera-effect-postcard.sociobot.in/terms/) for details.

## Run locally

Requires Node.js 20 or newer.

```bash
npm ci
npm run dev
```

Camera access needs a secure context. `localhost` is secure in modern
browsers. Use HTTPS when testing another phone on a network.

## Test and build

From a clean checkout:

```bash
npm ci
npm test
npm run test:claims
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev --audit-level=high
./verify-url.sh http://127.0.0.1:4173/
```

`npm test` runs unit and browser regression checks. `npm run test:claims` runs
the public-claim checks from `.factory/claims.json`. The browser suite builds
the product and serves `dist/` with the same response policy used in
production. `verify-url.sh` needs the preview server running; use
`npm run preview:policy` after a build.

## Deploy

Run `npm run build` and deploy the generated `dist/` directory as a static
site. Keep `dist/staticwebapp.config.json`; it supplies the content-security
policy, cache policy, and designed HTTP 404 response. The factory owns product
deployment. This repository has no deployment credentials.

## Project map

- `src/app.ts` — camera lifecycle, demo mode, countdown, export, and PWA UI
- `src/storage.ts` — real and `demo:` browser storage namespaces
- `src/effects.ts` — local Canvas 2D effects and postcard frame
- `public/service-worker.js` — versioned offline app shell
- `.factory/design.md` — visual thesis and asset provenance
- `.factory/claims.json` — public claim registry and reproducible evidence
- `.factory/handoff.md` — verification record and known gaps

## License

MIT. See [LICENSE](LICENSE).
