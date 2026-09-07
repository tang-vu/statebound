# Handoff

Repository: `https://github.com/tang-vu/statebound`, branch `main`. Existing remote and visibility preserved. No force push, public deployment, social post or entry submission.

## Verified milestones

- `090e2aa`: runnable exact-arithmetic core, computed counterexample, guarded comparison, template repair and evidence verifier. Pushed.
- `89755fc`: SQLite attempts/reservations/leases, actual external Codex repair, actual Binance Skills Hub / CLI public reads. Pushed.
- `048e025`: usable workbench, persisted workers/SSE, durable replay, browser flow and documentation. Pushed.
- Final polish commits are listed by `git log --oneline`. They include recording, narration/captions, the narrow mandate compiler, expiry/scope checks and capacity/idempotency regression coverage.

## Start or resume

Update 2026-09-07: the local servers now run under PM2 as `statebound-workbench` (4381) and `statebound-preview` (4382). A scoped restart and post-restart HTTP/browser checks passed; `pm2 save` completed. Windows reboot recovery has not been tested. See `docs/OPERATIONS.md` for commands. The preview is a separate recorded, read-only site, not the interactive operator workbench. Cloudflare ingress and the publication script are prepared; no Statebound tunnel or DNS record has been created and public deployment is still pending explicit authorization.

Read `docs/PROGRESS.md` and Git history first. Run `npm ci`, `npm run build`, `npm run dev`; open `http://127.0.0.1:4381`. Do not kill an unrelated process occupying a port. Set `PORT` explicitly if needed and adjust test URLs for a custom port. On the build machine, an actual local preview was started, but no autonomous work is promised after the session ends.

Run `npm run demo:verify`, `npm test`, `npm run test:holdout`, `npm run lint`, `npm run typecheck` and `npm run build`. With the app running, use `npm run test:http` and `npm run test:browser`. Never run live orders from tests. `npm run evidence:verify -- submission/demo-evidence.json` checks the recorded demo without the UI, model or credentials.

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
| Submission/publication | Drafts only | Operator reviews eligibility and materials, then explicitly authorizes any publication/submission |

The native Windows Binance CLI build is blocked by unavailable MinGW OpenSSL development libraries, but the official Linux release successfully supplies the required public reads through existing WSL. This is not an outstanding blocker for the demonstrated integration.

## Recording

`submission/demo.mp4` is 97.32 seconds and contains actual app actions with Microsoft Zira Desktop synthetic narration and timed captions. `submission/demo-raw.webm` preserves the source recording. Speedup and recorded AI provenance are disclosed. Reproduction is in `submission/SUBMISSION_DRAFT.md`. No paid voice service or cloned voice is involved. Review `submission/video-validation.json` for actual probe/decode evidence.

## Operational cautions from actual implementation

SQLite is Node 24's built-in experimental API and is intentionally single-process/local. Different UI experiments have separate fake account ledgers. A stopped or crashed run does not cancel exchange effects; ambiguity remains reserved. There is no generic ability to clear tombstones. The local session is a loopback policy boundary, not hosted multi-user authentication. Do not expose this server publicly with credentials.
