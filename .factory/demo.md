# Postcard FX demo sandbox

## Open the sample

Use <https://camera-effect-postcard.sociobot.in/?demo=1> or the first-screen
**Try it with sample data** link. `/demo/` redirects to the same URL.

The demo opens a completed 1200 × 1500 postcard for **Mina and Jo's garden
party**. It uses the abstract no-camera portrait and the Party post effect, so
the maker, controls, result, and PNG download are visible without permission or
setup.

## Isolation and reset

Demo preferences use localStorage key `demo:postcard-fx-settings`. Its saved
postcard uses IndexedDB database `demo:postcard-fx`. The ordinary maker uses
`postcard-fx-settings` and `postcard-fx`, so demo actions cannot read or write
ordinary postcard data.

**Reset demo** deletes only the two `demo:` stores and reloads the starter
sample. **Start for real** deletes only demo stores before returning to `/`.
Nothing from the sample is carried into the ordinary maker.

## Verification

Every public claim uses this demo entry point. Run all claim checks with:

```bash
npm run test:claims
```

The individual reproducible commands are recorded in `.factory/claims.json`.
