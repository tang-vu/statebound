# Statebound project overview

Statebound is an execution-verification workflow for AI trading agents, presented in Track A of the Binance Agent OS Mini Hackathon.

## Project links

| Resource | Link |
| --- | --- |
| Demo and video | https://statebound.tangvu.dev |
| Evidence Lab | https://statebound.tangvu.dev/#lab |
| Binance workflow | https://statebound.tangvu.dev/#binance |
| Source | https://github.com/tang-vu/statebound |
| Public post | https://x.com/tangvu_dev/status/2097251859597795543 |
| Quick walkthrough | [Four-minute guide](JUDGE_GUIDE.md) |

## The workflow

An order fills, its reply is lost, and a blind retry spends 30 USDT against a 20 USDT mandate. Statebound computes this counterexample from a typed plan and a finite fault model. It then checks a reconciliation repair authored during a Codex development session and replays that plan through an executor with persistent budget reservations.

When terminal evidence confirms the fill, the acquisition goal can complete. When lookup remains inconclusive, the workflow reports unresolved progress and preserves the pending exposure. The checker and executor share transition semantics; exported evidence can be independently replayed and rechecked without an LLM.

## Binance integration

The demonstrated integration uses the documented Skills Hub route and official Binance CLI 2.1.1. Recorded public Spot testnet prices and symbol filters parameterize a separate synthetic model, against which the saved AI repair is checked again. The original 600 USDT flagship remains a separate fixture.

The response timestamp, imported fields, unmapped filters and assumptions are preserved. Hosted Binance MCP is not connected. Account state, fees and order execution are simulated. Loading the recorded Codex candidate is not a fresh model call.

## Reproduce

Install Node 24.14 or newer and Git, then clone the repository and run:

npm ci
npm run integration:verify
npm run gallery:check
npm run evidence:verify -- submission/demo-evidence.json

For the interactive workbench, run npm run build followed by npm run dev, then open http://127.0.0.1:4381. See [Binance workflow reproduction](../docs/BINANCE_WORKFLOW.md) for the data import and verification process.

## Validation and scope

The core and integration suite has 18 passing tests. The separate regression corpus has 48 scenarios per variant; the repaired variant records zero budget violations, 36 completions and 12 unresolved outcomes. These are results within the declared finite synthetic IOC model, not a general guarantee across market conditions.

The demo video is approximately 2 minutes 32 seconds, with MiMo Dean narration, ASR content checks, captions and nine chapters. Footage and voice remain at original speed; long unvoiced waits are shortened with an edit-decision record. Public artifacts and the local workbench have browser and HTTP validation reports.
