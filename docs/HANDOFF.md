# Maintainer guide

Statebound has a local execution workbench, a read-only public demo, and command-line verification tools. The repository is https://github.com/tang-vu/statebound; the public demo is https://statebound.tangvu.dev.

## Run and verify

Use Node 24.14 or newer. Run npm ci, npm run build, then npm run dev. Open http://127.0.0.1:4381. The public preview runs separately on port 4382; process management and deployment are described in [operations](OPERATIONS.md).

For core changes, run npm test, npm run lint and npm run build. For evidence changes, run npm run gallery:check, npm run integration:verify and npm run evidence:verify -- submission/demo-evidence.json. With the relevant server running, test:http, test:browser, test:ui, test:preview and test:gallery cover the corresponding browser and HTTP workflows.

## Evidence and AI provenance

examples/external-agent-run.json preserves the development-session Codex candidate and its validation. Loading the candidate reproduces that recorded input; it is not a fresh model invocation. New structured candidates can be checked through npm run plan:repair -- original.json candidate.json.

submission/demo-evidence.json contains the durable unresolved replay and pending exposure. examples/counterexample.json preserves the baseline failure. submission/binance-workflow.json contains a separate model derived from recorded Binance inputs, together with baseline, repair and scenario evidence.

## Current scope and extensions

| Area | Current implementation | Extension work |
| --- | --- | --- |
| Verification | Finite discrete IOC model with exact decimal accounting | Review new abstractions and rerun bounded checks |
| AI repair | Recorded Codex candidate and typed candidate-validation interface | Connect a model provider while retaining deterministic acceptance gates |
| Binance reads | Official CLI 2.1.1 public testnet snapshot | Refresh using BINANCE_INTEGRATION.md; retain timestamps on failed refresh |
| Hosted MCP | Not connected | Use the documented Binance authentication and confirmation flow |
| Exchange writes | Simulator only; mainnet disabled | Implement and validate fee, lookup, correlation and retry semantics before enabling an adapter |
| Evaluation | Reproducible regression corpus | Add independently managed evaluation data |

## Persistence and hosting

The runtime uses Node's experimental SQLite API in a single local server process. Each experiment has a separate simulated account ledger. Ambiguous attempts retain their reservations and correlation records across restarts. The local session boundary is designed for loopback operation, not hosted multi-user access.

The public tunnel serves only port 4382, whose file allowlist excludes operator APIs and databases. The host must remain online. Windows reboot recovery has not been tested. See OPERATIONS.md for scoped process commands.

## Interface and recording

The workbench provides Define, Check & repair, and Inspect navigation on phones. Shared schemas validate browser and server inputs. The public Evidence Lab provides four recorded traces, manual step controls, deep links and provenance. The Binance workflow view is rendered from its recorded artifact.

The 151.7-second demo uses MiMo Dean narration and includes nine chapters. Audio provenance, ASR checks and edit decisions are documented in MIMO_NARRATION.md. The raw capture, captions, scene timings and verifier output are preserved. Regenerate artifacts before restarting the preview, then check the public downloads against the local files.
