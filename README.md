# Postcard FX

Postcard FX is a free, phone-first PWA for turning a camera moment into a
shareable 4:5 PNG. It combines an orientation-safe portrait crop with three
original generative-geometry effects, a timer, optional caption, and native
sharing—without uploading video or requiring an account.

Live: <https://camera-effect-postcard.sociobot.in>

## Who it is for

Friends and event hosts who want a quick camera toy without installing virtual
camera software or giving a social platform their video. A complete no-camera
preview path is available for unsupported devices and denied permissions.

## Privacy model

- Camera and optional face positioning run in the browser. No frame, face box,
  caption, or generated PNG is sent to a server.
- Audio is never requested. The live camera stops after capture, on preview-mode
  selection, and when the page closes.
- The most recent PNG is kept in IndexedDB and preferences in localStorage.
  Both can be exported/imported; the saved PNG can be deleted in the app.
- There are no analytics, ads, third-party scripts, runtime CDNs, or remote
  fonts. See the user-facing [privacy policy](./privacy/index.html).

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Camera access requires a secure context. Browsers treat `localhost` as secure;
use HTTPS when testing from another phone on the network.

## Test and build

```bash
npm test
npm run build
npm run preview
```

`npm test` runs unit coverage for crop/mirroring math plus Playwright flows on
mobile and desktop, including keyboard capture, axe accessibility checks, and a
real service-worker offline reload. The exact production build command is
`npm run build`; deploy the generated `dist/` directory with `dist/index.html`
at its root.

## Browser behavior

Modern browsers can capture, decorate, and export the postcard. When the
browser exposes its on-device `FaceDetector`, effects track the detected face
position. Other browsers use the clearly visible centered portrait guide, and
the status text explains the fallback. Native file sharing appears where Web
Share supports image files; PNG download always remains available.

## Project map

- `src/app.ts` — camera lifecycle, countdown, export, share, and PWA behavior
- `src/effects.ts` — deterministic Canvas 2D effects and postcard framing
- `src/geometry.ts` — orientation-safe cover crop and face-box mapping
- `src/storage.ts` — IndexedDB postcard and local preference ownership
- `public/service-worker.js` — versioned offline app shell
- `.factory/design.md` — visual thesis, tokens, motion, and asset provenance
- `.factory/handoff.md` — verification record and operational handoff

## License

MIT. See [LICENSE](./LICENSE).
