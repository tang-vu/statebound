# Finite model and limits

Version: `ioc-discrete-v1`. This document describes implemented assumptions, not exchange guarantees.

- One BUY LIMIT IOC symbol, one fixed price at the mandate bound and synthetic initial quote holdings. Synthetic lot/tick/min/max/min-notional filters are validated. Recorded live filter sets are not certified by the model.
- Each send chooses full fill, lot-rounded half fill, accepted zero fill or nonacceptance, independently combined with delivered or lost reply. The venue never exceeds available funds, fills above the limit price, creates balance or fills again after IOC termination.
- Every modeled order is actually terminal by the time its send resolves. The observer may see a preterminal partial or stale NEW observation. The knowledge abstraction conservatively permits residual exposure until decisive evidence arrives. This is an observation-delay model, not a full continuous-time matching engine.
- Query choices: fresh terminal cumulative evidence, an older observation, incomplete not-found, or nonterminal partial evidence. Fresh absence is decisive only because the local simulator has complete lookup. No such completeness is attributed to Binance.
- `balance` delivers an explicitly stale initial snapshot. It is never used to erase known order exposure. No WebSocket absence inference is implemented.
- The fixture fee rate and asset are immutable, bounded assumptions. Quote/base fees round upward. Fee rate changes, unknown fee assets, live tier discounts and continuous fill prices are unsupported.
- Query choices may remain inconclusive for the entire read bound. Such runs are unresolved and retain reservations. Recoverable scenario tests force decisive queries and sufficient later liquidity. No scheduler fairness is assumed by the exhaustive check.
- Defaults: 32 interpreter steps, 3 sends, 3 order reads, 30,000 unique explored states, 10 seconds wall time per check, 30 seconds execution duration. Supported schemas permit smaller or bounded larger values. A reachable step horizon is inconclusive rather than safe.
- State merging preserves the full agent state and hidden world, including step/read bounds. No lossy pruning or probability sampling is used for a completed bounded verdict. Generated property tests are additional finite evidence, not a mathematical proof over arbitrary event streams.

The knowledge interval deliberately overapproximates supported concrete amounts. `confirmed <= concrete <= maximum` and confirmed net quantity below concrete net quantity are asserted per attempt after every explored transition. Terminal knowledge requires equality. This does not prove the adapter correctly maps a real exchange response into that interval. Real adapter execution is disabled until that mapping can be certified.

Reserve enforcement covers this executor and the supported isolated account model. Unrelated trading, deposits, withdrawals, cancellation races, multi-symbol plans, websocket recovery and third-asset fees are unsupported. Unknown or contradictory evidence blocks writes. No live-account whole-system protection is claimed.

The simulator models a venue that can accept client identifiers again after terminal orders. Statebound's permanent local tombstones independently prevent that reuse in its executor. This trades availability for avoiding ambiguous duplicate writes. SQLite gives a single local process durable transactions and scope leases; it is not a multi-region execution system.

A repaired-plan completed bounded verdict certifies only these exact discrete cases, input mandate and graph. It is not a continuous market guarantee, unlimited-horizon proof, exchange attestation or a guarantee of acquisition when evidence/liquidity never arrives.
