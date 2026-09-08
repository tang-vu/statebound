# Binance input-to-verdict workflow

This adds a causal integration to the submission: the recorded official Binance CLI response determines the price and quantity grid of a new synthetic experiment. It is separate from the original 600 USDT flagship fixture and does not enable exchange execution.

## Reproduce

```sh
npm ci
npm run integration:verify
```

This offline command derives the model again from `examples/binance-read.json`, validates the recorded external AI candidate against it, reruns bounded searches for baseline and repair, replays three scenarios and compares the entire output to `submission/binance-workflow.json`. It needs no credentials or LLM. Timing fields are normalized; verdicts, state counts, traces, inputs and hashes are not.

To capture a new public read using the installed official CLI and generate a new artifact:

```sh
npm run integration:inspect
# Continue only if the read succeeded. A failed read preserves the old snapshot.
npm run integration:workflow
npm run integration:verify
```

Inspect the timestamps and changes before publication. Restart `statebound-preview` after updating artifacts. The public site serves the saved workflow at `/#binance`, original response at `/binance-read.json`, and derived evidence at `/binance-workflow.json`.

## Data boundary

| Source | Use |
| --- | --- |
| Real public testnet ticker | Snapshot reference; limit rounds down to price tick |
| PRICE_FILTER | Tick and price bounds |
| LOT_SIZE | Quantity step and bounds |
| NOTIONAL | Minimum and maximum principal bounds |
| User-facing demo policy | 15 USDT principal target, 20 USDT total budget |
| Synthetic assumptions | 100 USDT fake account, 10 bps quote fee, fixed-price IOC fault model |
| Recorded Codex candidate | Rebind only mandate hash, validate protected fields and rerun repair gates |

All arithmetic that derives price, lot size and debit uses integer decimal units. Missing, duplicated, disabled or incompatible supported filters fail validation. Other venue filters are listed as unmapped; this workflow does not claim complete exchange admission. Price snapshots are historical inputs, not a freshness authorization to trade. The bounded result is conditional on the declared model.

The three saved replays demonstrate a blind duplicate purchase, recovered completion, and unresolved exposure after inconclusive lookups. The verifier distinguishes safety from progress. The saved external candidate is not a new hosted AI call.

## Agent OS positioning

The demonstrated route is [Binance Skills Hub](https://developers.binance.com/en/docs/sdks-tools/integrations/skills-hub) through the [official Binance CLI](https://github.com/binance/binance-cli/tree/v2.1.1). The separate [hosted MCP](https://developers.binance.com/en/docs/agent-native/mcp-server/agentic) connection is not established. This strengthens evidence of useful Binance data integration; it does not establish organizer acceptance of this route for Track A. Sources checked 2026-09-08.
