# Progress

## 2026-09-08 - MiMo narration and complete submission video

Re-recorded the actual workbench, Binance-derived workflow and Evidence Lab as nine chapters with MiMo V2.5 TTS Dean voice. Each accepted audio clip was checked with MiMo V2.5 ASR; unwanted tails were removed and retranscribed. Narration remains at original speed; only the middle of long unvoiced waits is cut, with an edit-decision record and on-screen disclosure. The new edit replaces the older Windows-voice videos described below. Audio review scope and reproduction are in `docs/MIMO_NARRATION.md`.

## 2026-09-07 - Submission build prepared

- Completed the responsive workbench and preview redesign, shared schema validation, history/connection recovery, mobile task navigation, content-versioned assets, video chapters and full-size evidence access.
- Regenerated the actual 101.4-second recording, captions, screenshots and independently verified exported evidence. Public browser checks include media seeking, versioned resources, active chapter state and full-size evidence links.
- Final build, lint and all 16 core tests passed. Previously completed HTTP, responsive/recovery, holdout and independent verification reports remain in submission/.
- Prepared submission/READY_TO_SUBMIT.md and the short submission/POST.txt with honest integration scope. Opened the actual survey: it requires Binance login before questions are shown. No account credentials, social posting session or submission receipt is available in this session; account steps remain outstanding.


## 2026-09-07 — Authorized public deployment completed

- Explicit follow-up authorization received. Published the recorded preview at https://statebound.tangvu.dev through dedicated `statebound-demo` Cloudflare Tunnel. Created the hostname route without overwrite; no existing tunnel/application reconfiguration.
- PM2 `statebound-tunnel`, `statebound-preview` and `statebound-workbench` are online; process list saved. Public ingress targets 4382 only. Credential/config files remain ignored in `.runtime/`.
- Actual public checks passed: HTTPS, video byte ranges/playback/seeking, evidence hash matching the reviewed local bundle, mobile 390px and desktop 1440px, evidence tabs, API/private paths returning 404 and writes returning 405. Standalone verifier of the downloaded evidence returned verified=true and NO_VIOLATION_WITHIN_BOUND. Reports: `submission/public-validation.json`, `submission/public-verifier.json` and public screenshots.
- Fixed an observed edge integration issue: Cloudflare analytics injection violated self-only CSP. Added documented no-transform cache control at this origin; public browser checks now pass without CSP/script errors. No zone-wide change and no CSP relaxation.
- README, handoff, operations and submission draft now contain actual live URLs. Social posting and entry submission remain unperformed. Testnet writes, hosted Binance MCP and live hosted model remain unavailable. Host must remain online; reboot recovery is not tested.

## 2026-09-07 — PM2 operation and prepared shareable preview

- Running: `statebound-workbench` on loopback 4381 and `statebound-preview` on loopback 4382, under a separate Statebound PM2 namespace. Replaced only the previously identified Statebound manual server. Scoped restart succeeded and the process list was saved. Existing applications/tunnels were not restarted or reconfigured.
- Added readiness and graceful shutdown. Launchers pass an explicit minimal environment to the application children. PM2 persistence is configured; machine reboot recovery is not tested.
- Added a responsive recorded demo with actual 97-second video, evidence tabs, evaluation data and downloads. It explicitly labels recorded evidence/AI provenance and unavailable live trading. Its separate server has a strict file/host allowlist, security headers, GET/HEAD only, and no jobs or operator API.
- Verified: lint, TypeScript + production build, all 16 tests, operator HTTP gates, preview file/API/method/host gates, MP4 byte ranges and actual browser playback, evidence tabs, mobile 390px and desktop 1440px without overflow. HTTP/browser checks passed again after PM2 restart. Evidence: `submission/preview-validation.json` and preview screenshots.
- Prepared: dedicated `statebound-demo` tunnel script for `statebound.tangvu.dev`, repository-scoped credentials/config, port 4382 only, no DNS overwrite. PowerShell parsing and Cloudflare ingress validation passed. Existing configured Cloudflare authentication successfully listed tunnels read-only.
- Pending authorization: public tunnel creation, DNS routing and external HTTPS/video verification. The original brief says not to deploy publicly. No Statebound public deployment is claimed. Hosted Binance MCP, testnet writes and live hosted model remain unavailable as previously documented.

Repository inspected: empty application, branch main, existing origin preserved. Node 24.14.1, npm 11.11.0. Full build brief read on 2026-09-05.

Milestone 1 verified: exact accounting, strict language, shared interpreter, breadth-first finite checker, replay and standalone evidence verification. `npm run typecheck` and `npm test` passed (7 tests with reproducible property corpora). `npm run demo:verify` found 30 USDT debit under a 20 USDT zero-fee synthetic mandate. Template repair checked 2,191 states and 3,180 transitions with no violation within the discrete bound. Recoverable lost reply completes; persistent not-found remains unresolved with 15 USDT exposure. This is a template, not yet an external AI repair.

Milestones 2 and 3 verified: SQLite attempts, persistent reservations and tombstones, transactional leases and request idempotency; restart reconciliation and exact-action authorization tests; actual external Codex structured repair through the CLI; official Skills Hub / Binance CLI 2.1.1 public testnet quote and exchange-info reads saved. `npm test` now passes 12 tests. Separate evaluation: repaired 0 violations / 48 scenarios, 36 complete, 12 unresolved. All 3 parameterized repaired bounded checks completed. Mainnet and testnet writes remain unsupported, with no enabled exchange write adapter.

Milestone 4 verified and pushed as `048e025`: workbench built, worker jobs and SSE persisted to SQLite, durable simulator replay integrated. Browser flow passed at 1440x900 and 1280x800; actual screenshots inspected. Port 4317 belonged to an unrelated app; Statebound uses 4381. Worker loading fixed using the installed tsx API.

Milestone 5 verified (2026-09-06 local): **16 unit/property/runtime tests pass**, including exact replay of the durable executor, persistent approval records, expired/malformed approval rejection, contradictory scope/amount rejection, lot-rounded historical partial observations with independent fee expectations, and no late dispatch after an approval wait. Evidence validates strict metadata and stored exact-action approval references. HTTP tests passed after correcting retry handling when the two-worker pool is full. Lint and strict type checking passed. Clean lockfile install and the final source build/all 16 tests were reproduced under ignored `.runtime/clean`. Separate evaluation still reports repaired 0/48 violations, 36/48 complete and 12/48 unresolved. Final browser flow passed at both desktop sizes with no page errors.

Actual narrated recording is complete: **97.32 seconds**, 1440x900 H264/AAC MP4, raw WebM, SRT/ASS captions and measured timings. Windows Microsoft Zira Desktop is the standard synthetic voice. Playback is explicitly 1.35x; no actions or model-generation intervals are spliced out. Full decode passed and actual video frames were inspected. The downloaded evidence includes persisted exact-action approval references and independently passes the full CLI verifier. All accessible local deliverables are complete. The closing commit is identified by `git log -1`; compare with `origin/main` for remote synchronization.

Remaining external/unsupported gates: hosted Binance MCP was not connected; no certified testnet order adapter, account credentials, fee/lookup/retry conformance or real orders. Mainnet disabled. External Codex repair ran, but there is no configured hosted model provider in the web app. Regression corpus is not independently blinded. Submission/public deployment/social actions remain drafts and were not performed.

Integration investigation: no Binance MCP tool exposed to this session. Official CLI and Skills Hub documentation are being inspected. No orders authorized outside simulator. No global configuration changed.
