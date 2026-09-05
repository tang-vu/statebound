# Measured evaluation

Reproduce with `npm run demo:verify`, `npm test`, `npm run test:holdout`, then a running server plus `npm run test:http` and `npm run test:browser`.

## Comparison

The separate corpus in `scripts/evaluate.ts` combines three mandates, four first-send outcomes, two reply delivery states and two query policies. Later sends fill normally. The same 48 scenarios are used for every variant. Full rows and the frozen candidate hash are in [evaluation.json](../examples/evaluation.json).

| Variant | Scenarios | Debit violations | Goal complete | Unresolved | Refused | Scenario horizon/incomplete |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Per-order baseline | 48 | 14 | 24 | 24 | 0 | 0 |
| Original plan + aggregate guard | 48 | 0 | 20 | 0 | 28 | 0 |
| Codex repaired + same guard | 48 | 0 | 36 | 12 | 0 | 0 |

Safety and progress are different dimensions. A baseline completion can also violate the budget. Thus violations are not added to the outcome denominator. Each variant's complete/unresolved/refused/incomplete columns sum to 48. The 12 unresolved repaired cases lack decisive evidence; they are retained, not omitted. All three repaired exhaustive discrete searches also completed without a violation. Their explored states/transitions are in the JSON. Scenario sampling is never relabeled as exhaustive checking.

This corpus was defined separately from the flagship and executed after the candidate was frozen. It was created in the same development session, so it is **not** an independently blinded or model-inaccessible benchmark. No performance, profitability or broad reliability percentage is claimed.

## Acceptance evidence

| Gate | Evidence / limits |
| --- | --- |
| Parameterized aggregate overspend | Three independent goal values produce concrete debit above a 20 USDT budget; independent assertion sums simulator filled quantities times price |
| Lost successful and unsuccessful sends | Full, half and absent first sends with lost replies tested; repaired fresh lookup completes |
| Stale balance and combined faults | Counterexample contains accepted fill + lost reply + stale initial balance; reservation stays 15 USDT |
| Partial exposure | Nonterminal cumulative debit stays inside full reserved maximum; final IOC evidence narrows the interval |
| Hidden state and knowledge | Interpreter accepts only public State; generated sequence checks plus all explored-state soundness assertions |
| Duplicate/reordered events | Duplicate cumulative observations are idempotent; old sequences cannot regress fills or terminal evidence |
| Exact arithmetic and fees | BigInt round-trip and independent fee boundary properties, quote/base fee treatment and lot rounding |
| Durability and client reuse | SQLite close/reopen preserves reservations; prepared sends reconcile before progress; permanent tombstone remains after terminal fill |
| Concurrency | Two DB connections cannot both own one scope; HTTP concurrent idempotency keys return one run |
| Approval tampering | Exact action, account, plan, binding and expiry mutations rejected |
| Repair restrictions | Protected bounds and mandate changes rejected; unconditional pause fails; recoverable progress is required |
| Progress / ambiguity | Separate reported completion and unresolved counts; durable replay follows same semantics |
| Limits / mutation | State cap and step exhaustion yield inconclusive; per-order guard mutation yields a concrete failure |
| Replay / evidence | Identical choices reproduce events, monetary values and final status; altered/missing trace fails even after rehashing; bounded search rerun |
| Official adapter | Genuine Skills Hub / CLI quote and filters read, version and help saved; no MCP or write certification claim |
| Testnet isolation | Wrong/absent/lookalike host rejected, symbols validated, every real write unavailable |
| AI loop | Development-session Codex candidate accepted via CLI and rechecked; input/output stored as external_agent |
| Server / browser | Origin, operator session/action, request-key conflict, cancellation, persistence, export, two desktop viewports |

The test suite has reproducible fast-check seeds 719, 223 and 551. Runtime tests compare durable execution exports to deterministic simulator replay. This is bounded engineering evidence. It is not a formal proof of the abstraction for every possible real exchange observation. Physical OS power loss, distributed execution, live partial fills, authenticated account freshness, cancellation races and real fee reconciliation remain outside this release's verified scope.

## Corrections found during implementation

The original workbench port was occupied by an unrelated application; Statebound moved to 4381. The initial worker bootstrap used an incompatible loader API; it was replaced with the installed tsx registration API. The CLI public-read subprocess initially waited for stdin; explicitly closing stdin made reads reproducible. These failed attempts were not counted as passed gates. A server-start timing race in the first HTTP test attempt was rerun only after the server became ready.
