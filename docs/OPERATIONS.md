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

## Prepared Cloudflare publication

Target: **https://statebound.tangvu.dev**. Publication is pending explicit authorization because the original build brief prohibited public deployment. Cloudflare authentication was checked read-only using the configured `cert-tangvu.pem`; no Statebound tunnel existed at preparation time. The existing shared tunnel is for other domains and is not modified.

The preview serves an explicit allowlist: landing page, local CSS/JS, recorded video/screenshots and public synthetic evidence JSON. It has no operator API, jobs, database access, cookies or write methods. Video supports byte ranges. All other paths return 404; unsupported hosts return 403. UI states clearly that the evidence views are recorded and that a new experiment requires the local workbench. The tunnel must target **4382**, never the operator port 4381.

After authorization:

```powershell
powershell -NoProfile -File scripts/publish-preview.ps1 -Publish
Invoke-RestMethod https://statebound.tangvu.dev/healthz
```

The script checks the simulator preview health, creates a dedicated `statebound-demo` tunnel, stores its credential/config only in ignored `.runtime/`, validates ingress, routes the requested hostname without DNS overwrite, starts only `statebound-tunnel` under PM2 and saves the process list. An existing tunnel without its matching repository-scoped credential stops the script. It does not print secrets. The script has been parsed and its ingress template validated; actual creation, DNS routing and external playback remain untested until authorized.

Then verify public HTTPS, video seeking, evidence downloads, `/api/session` returning 404, and POST returning 405. Only after these checks should submission drafts identify the URL as live.

To stop public access without changing another app: `pm2 stop statebound-tunnel`. To restart the local processes, use the scoped restart above. Do not use `pm2 restart all`.

Configuration references: [PM2 application declarations](https://pm2.keymetrics.io/docs/usage/application-declaration/) and [Cloudflare locally managed tunnel configuration](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/configuration-file/). Installed CLI help was checked for tunnel creation, scoped credential files and ingress validation.
