# PM2 and shareable demo

The application runs in two separate processes. `statebound-workbench` serves the full local operator workbench on `127.0.0.1:4381`. `statebound-preview` serves a recorded, read-only demo on `127.0.0.1:4382`. Both have one PM2 fork instance, readiness reporting, bounded restart backoff and graceful shutdown. Child servers receive only basic OS environment variables and fixed mode/port values, not exchange or model credentials inherited by the PM2 daemon.

```powershell
npm ci
npm run build
New-Item -ItemType Directory -Force .runtime | Out-Null
pm2 start ecosystem.config.cjs
pm2 save
# Scope operational commands to this application:
pm2 restart statebound-workbench statebound-preview
pm2 logs statebound-preview --lines 30 --nostream
node scripts/preview-test.mjs
npm run test:http
```

PM2 save persists the current process list for `pm2 resurrect`. It does not itself install Windows boot startup. Machine reboot recovery has not been tested. No global shell, Codex, credential or existing tunnel configuration is modified. The machine must remain awake and connected for a tunnel hosted here to remain reachable.

## Cloudflare publication

Live recorded preview: **https://statebound.tangvu.dev**. The user explicitly authorized publication on 2026-09-07. A dedicated `statebound-demo` tunnel and DNS route were created using the configured `cert-tangvu.pem`. `statebound-tunnel` runs under PM2 and the process list was saved. Existing tunnels and other applications were not modified.

The preview serves an explicit allowlist: landing page, local CSS/JS, recorded video/screenshots and public synthetic evidence JSON. It has no operator API, jobs, database access, cookies or write methods. Video supports byte ranges. All other paths return 404; unsupported hosts return 403. UI states clearly that the evidence views are recorded and that a new experiment requires the local workbench. The tunnel must target **4382**, never the operator port 4381.

Authorized deployment command (already executed on the build machine):

```powershell
powershell -NoProfile -File scripts/publish-preview.ps1 -Publish
Invoke-RestMethod https://statebound.tangvu.dev/healthz
```

The script checks the simulator preview health, creates a dedicated `statebound-demo` tunnel, stores its credential/config only in ignored `.runtime/`, validates ingress, routes the requested hostname without DNS overwrite, starts only `statebound-tunnel` under PM2 and saves the process list. An existing tunnel without its matching repository-scoped credential stops the script. It does not print secrets. Creation, DNS routing and public HTTPS/browser playback were verified on 2026-09-07.

Repeat verification with `node scripts/preview-test.mjs https://statebound.tangvu.dev`. Public HTTPS, video playback and seeking, exact downloaded evidence hash, mobile/desktop tabs and layout, `/api/session` returning 404, and POST returning 405 passed. The downloaded evidence also passed standalone replay and bounded-search recomputation. Reports are `submission/public-validation.json` and `submission/public-verifier.json`.

Cloudflare initially injected its analytics beacon, which the strict self-only CSP blocked. The preview now sends `Cache-Control: public, max-age=0, must-revalidate, no-transform`, preserving reviewed content without changing zone-wide settings or weakening CSP. The repeated public browser run passed without script/CSP errors. See [Cloudflare's documented no-transform behavior](https://developers.cloudflare.com/web-analytics/faq/).

To stop public access without changing another app: `pm2 stop statebound-tunnel`. To restart the local processes, use the scoped restart above. Do not use `pm2 restart all`.

Configuration references: [PM2 application declarations](https://pm2.keymetrics.io/docs/usage/application-declaration/) and [Cloudflare locally managed tunnel configuration](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/configuration-file/). Installed CLI help was checked for tunnel creation, scoped credential files and ingress validation.

The preview HTML now uses `Cache-Control: no-store, no-transform`. CSS, JavaScript, video, images and evidence links carry a content-derived `?v=` revision; the same revision is used for assets loaded by JavaScript. Assets continue to revalidate. The revision is calculated when the service starts, so restart only `statebound-preview` after changing preview files or recorded artifacts. This prevents a normal reload from reusing an earlier design's asset URLs. Native video controls remain available if chapter metadata cannot load.

The public Evidence Lab adds `/lab.js` and `/replay-gallery.json` to the allowlist. `preview/lab.html` is inserted into the landing page at startup and included in the asset revision. After changing engine fixtures, run `npm run gallery:generate`, then `npm run gallery:check` and restart `statebound-preview`. Run `npm run test:gallery` locally and `npm run test:gallery -- https://statebound.tangvu.dev` for the public viewer. The lab navigates precomputed simulator traces; it has no execution endpoint. Its failure state preserves the recorded video and downloads.

The Binance workflow at `/#binance` is rendered from `submission/binance-workflow.json` at startup, with HTML escaping and no client script dependency. `/binance-read.json` and `/binance-workflow.json` are public allowlisted artifacts. Run `npm run integration:verify` for offline verification. `npm run integration:refresh` performs a fresh official public read and only proceeds to regeneration if that read succeeds. Review the result and restart only `statebound-preview`. Tests compare both public downloads to the local artifacts and check the displayed inputs and provenance.
