# Statebound: a four-minute review

**Pitch:** an agent should reconcile an uncertain order before spending its budget again. Statebound makes that rule executable and independently inspectable.

1. **0:00–0:45 — [Evidence Lab](https://statebound.tangvu.dev/#lab).** Start with Blind retry. The agent sees a timeout while the hidden exchange state already contains a fill. Jump to outcome: 30 USDT spent against 20. Compare Guard only, Reconciled, and Still unknown. A refused retry is not confirmed progress.
2. **0:45–1:20 — [Binance workflow](https://statebound.tangvu.dev/#binance).** Inspect the actual timestamped public testnet read, derived price/lot grids and changed debit amounts. This is a separate model driven by recorded Binance inputs, not the flagship's synthetic 600 USDT price. Open the data-boundary disclosure.
3. **1:20–4:00 — [Recorded workbench](https://statebound.tangvu.dev/#watch).** Watch the actual check, recorded AI candidate validation, bounded recheck and durable simulator replay. The 151.7-second walkthrough includes MiMo narration, captions and the Binance workflow.

## Independently reproduce

```sh
npm ci
npm run integration:verify
npm run gallery:check
npm run evidence:verify -- submission/demo-evidence.json
```

Requires Node 24.14+; no account funding or model credentials. For the operator UI, run `npm run build` then `npm run dev` and open http://127.0.0.1:4381.

## Claims to evaluate

- Counterexamples are computed from the plan and a declared finite fault model.
- Possible execution exposure survives missing replies and inconclusive lookup.
- The recorded external AI repair is checked by deterministic gates, not trusted because an LLM produced it.
- Evidence includes exact transitions and supports replay plus bounded-search recomputation.
- Official CLI public data drives a separate model; execution remains simulated, and complete exchange admission is not claimed.

The hosted Binance MCP is not connected. There is no mainnet execution, live hosted AI repair, independently blinded benchmark or universal safety certification. The entry uses the Skills Hub/official CLI integration route; organizer eligibility and acceptance remain their decision.
