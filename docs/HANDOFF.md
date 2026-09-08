# Handoff

Repository: `https://github.com/tang-vu/statebound`, branch `main`. Existing remote and visibility preserved. Recorded preview published with explicit follow-up authorization on 2026-09-07 at https://statebound.tangvu.dev. No force push, social post or entry submission.

## Verified milestones

- `090e2aa`: runnable exact-arithmetic core, computed counterexample, guarded comparison, template repair and evidence verifier. Pushed.
- `89755fc`: SQLite attempts/reservations/leases, actual external Codex repair, actual Binance Skills Hub / CLI public reads. Pushed.
- `048e025`: usable workbench, persisted workers/SSE, durable replay, browser flow and documentation. Pushed.
- Final polish commits are listed by `git log --oneline`. They include recording, narration/captions, the narrow mandate compiler, expiry/scope checks and capacity/idempotency regression coverage.

## Start or resume

Update 2026-09-07: the local servers run under PM2 as `statebound-workbench` (4381) and `statebound-preview` (4382); `statebound-tunnel` exposes only the latter at https://statebound.tangvu.dev. The user explicitly authorized publication. Public HTTP/browser checks and standalone verification of downloaded evidence passed; `pm2 save` completed. Windows reboot recovery has not been tested. See `docs/OPERATIONS.md` for commands. The public preview is a separate recorded, read-only site, not the interactive operator workbench.

Read `docs/PROGRESS.md` and Git history first. Run `npm ci`, `npm run build`, `npm run dev`; open `http://127.0.0.1:4381`. Do not kill an unrelated process occupying a port. Set `PORT` explicitly if needed and adjust test URLs for a custom port. On the build machine, an actual local preview was started, but no autonomous work is promised after the session ends.

Run `npm run demo:verify`, `npm test`, `npm run test:holdout`, `npm run lint`, `npm run typecheck` and `npm run build`. With the app running, use `npm run test:http`, `npm run test:browser` and `npm run test:ui`. Never run live orders from tests. `npm run evidence:verify -- submission/demo-evidence.json` checks the recorded demo without the UI, model or credentials.

The generated demo evidence includes an unresolved durable replay and its pending exposure. The separate flagship bundle contains the baseline counterexample. `examples/external-agent-run.json` preserves actual development-session Codex input/output and recheck evidence. Re-running its generation script reproduces a stored candidate; it is not a fresh model invocation. A new external agent submits new typed output through `npm run plan:repair -- original.json candidate.json`.

## Exact external limits and next steps

| Area | Current state | What would be needed next |
| --- | --- | --- |
| Offline mechanism | Running and tested | Continue bounded model review; do not widen claims |
| External AI loop | Actual Codex session repair completed | Use CLI with the active agent for a new request; web has no hosted live model provider |
| Official integration read | Actual CLI 2.1.1 public testnet reads recorded | Reproduce with local CLI path or existing WSL setup in BINANCE_INTEGRATION.md |
| Hosted Binance MCP | Not connected in this session | Operator connects using Binance's documented host flow; preserve all confirmations |
| Testnet order execution | Unsupported; no certified write adapter | Dedicated testnet credentials plus implementation/conformance for fees, lookup, retry and host approval. A key alone is insufficient |
| Mainnet | Disabled, outside this release | No enabled path |
| Continuous market range / unrelated activity | Outside the finite fixture model | A new conservative abstraction and adapter mapping, then recheck |
| Independent blinded evaluation | Not demonstrated | Freeze candidate, obtain an independently managed corpus unavailable to repair generation |
| Submission/publication | Public demo and GitHub published; entry not submitted | Account owner completes the official social and Binance survey steps in `submission/READY_TO_SUBMIT.md` |

The native Windows Binance CLI build is blocked by unavailable MinGW OpenSSL development libraries, but the official Linux release successfully supplies the required public reads through existing WSL. This is not an outstanding blocker for the demonstrated integration.

## Recording

`submission/demo.mp4` contains actual app actions with Microsoft Zira Desktop synthetic narration and timed captions. `submission/demo-raw.webm` preserves the source recording. Speedup and recorded AI provenance are disclosed. Reproduction is in `submission/SUBMISSION_DRAFT.md`. No paid voice service or cloned voice is involved. Review `submission/video-validation.json` for actual probe/decode evidence.

## Operational cautions from actual implementation

SQLite is Node 24's built-in experimental API and is intentionally single-process/local. Different UI experiments have separate fake account ledgers. A stopped or crashed run does not cancel exchange effects; ambiguity remains reserved. There is no generic ability to clear tombstones. The local session is a loopback policy boundary, not hosted multi-user authentication. Do not expose this server publicly with credentials.

## Interface completion

The workbench and recorded preview share an ivory, charcoal and signal-orange design. The workbench introduction is compact enough to expose the mandate action on desktop. Phones use Define / Check & repair / Inspect navigation, with selected trace state preserved across views. Shared browser/server schemas reject incomplete plan JSON before rendering; connection retry and history navigation are covered by `scripts/ui.ts`.

The refreshed recording, screenshots, ambiguity evidence view and seekable chapter metadata come from actual simulator runs. Re-record with `npm run demo:record`, decode-check with `npx tsx scripts/verify-video.ts`, and validate the preview with `npm run test:preview`. The preview server allowlist includes `chapters.json` and `ambiguity.png`; restart its scoped PM2 process after changing routes. No live exchange execution is enabled.

The public Evidence Lab exposes four precomputed traces with separate knowledge/reality ledgers, manual step controls, deep links and provenance. Its generator checks every trace against the shared interpreter. Use `npm run gallery:check` and `npm run test:gallery`; see `docs/RESEARCH_BRIEF.md` for the source-backed rationale and limitations. Browser checks cover every step at 390/1440px, keyboard controls, link restoration, clipboard fallback and failed loading.

Final submission pass, September 8: the official recorded Binance response now parameterizes a separate synthetic model and the saved AI repair is rechecked against it. `npm run integration:verify` reproduces its baseline, repair and three scenario traces; `submission/JUDGE_GUIDE.md` provides a short review path. The full suite now has 18 passing tests. Read refresh attempts timed out locally, so the original September 5 snapshot remains explicitly timestamped. A stale preview process left by a stalled PM2 restart was removed; the public listener was restored under the managed preview process and the public browser checks passed again.
