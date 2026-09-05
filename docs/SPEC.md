# Statebound v1 semantics

The kernel is in `src/core.ts`. `src/simulator.ts` owns exchange reality and observation delivery. `src/checker.ts` explores the same transition function used by `src/executor.ts`. `src/ledger.ts` persists attempts, leases, requests and events in SQLite.

## Mandate

A strict versioned document binds account scope, simulator environment, one USDT symbol, BUY, LIMIT IOC, cumulative debit budget, reserve floor, initial quote holdings, net base goal, shortfall tolerance, maximum order/read counts, reference provenance/time/age, limit price, fixture filters, expiry and fee assumptions. Confirming an edit starts a new binding. The AI repair endpoint cannot change mandate fields or search limits.

All financial strings are unsigned decimal values with up to 8 fractional digits and 12 integer digits. Exponents, negatives, NaN, Infinity, leading-zero ambiguity and extra precision are rejected. Arithmetic uses BigInt at scale 100,000,000. Debit and fee products round upward. Goal quantities round upward to the lot step; a base-denominated fee is conservatively included before deriving gross quantity. Infeasible minimum-notional/budget combinations are rejected; the budget is never raised automatically.

Quote fee: debit is principal plus fee in USDT. Base fee: net received is gross filled base minus the upward-rounded fee; the fee's explicit quote equivalent at the fixed bounded fixture price is added to principal for the mandate's conservative economic debit. This base-fee policy intentionally counts acquisition friction beyond cash movement and is shown in the mandate. Third-asset fee conversion is unsupported. Synthetic price is fixed within a check, so it is also the enforced price limit. Live quotes are separate evidence and never overwrite the synthetic reference.

## Typed plan

Plans bind version, mandate hash, initial snapshot, simulator capability ID, duration and step bounds, a start node and at most 32 named nodes. Supported effects are `submit`, `query`, `balance`, `wait`; terminals are `complete` and `pause`. `branch` uses a nonrecursive equality AST over `goalMet`, `lastTerminal` or `hasUnknown`, each compared with a boolean. There are no arbitrary expressions, tools, URLs, scripts, prototype keys or dynamic imports in the language.

`submit` names a logical operation and either a literal quantity or `remaining`. Each attempted submission gets an ordinal attempt ID. Loops are bounded by maxSteps, maxOrders and maxReads; hitting a step horizon is checker incompleteness. Runtime `wait` is a discrete no-effect step, not an unbounded scheduler. The simulator-only baseline applies per-order admission. Every actual executor call uses aggregate admission. There is no real baseline adapter.

Completion requires confirmed net acquisition plus permitted tolerance to meet the goal, with no ambiguous orders. Unconditional pause does not pass repair acceptance. A repair must preserve model and mandate bindings and complete cleanly recoverable full-fill and unaccepted-attempt cases. Partial-fill dust can legitimately be infeasible under minimum notional.

## Knowledge and invariants

For each attempt, knowledge stores confirmed debit/net quantity, reserved maximum, monotonic observation sequence and terminal status. An unresolved attempt contributes its full maximum to aggregate exposure; a terminal attempt contributes its confirmed debit. Never add confirmed debit to that same full maximum. Pending exposure is maximum minus confirmed debit.

Timeouts, stale balances and incomplete not-found reads never clear reservations. Older sequence observations are ignored. Duplicate cumulative events are idempotent. Regressing cumulative quantities, conflicting terminal evidence, wrong scope/correlation and out-of-bound debit invalidate knowledge and block dependent writes. The checker separately asserts concrete reality is contained in the abstraction at every explored state. There are no branch probabilities.

## Search and binding

Breadth-first exploration uses canonical keys, a visited set and predecessor edges. It returns a shortest violating trace in number of encoded transitions for the explored finite graph. State and transition counts are actual counts; merged equivalent states are not distinct full execution histories. Complete finite exploration returns `NO_VIOLATION_WITHIN_BOUND`. A reachable horizon, resource cap or internal defect cannot be a complete success. Schema/capability mismatch returns `UNSUPPORTED`.

Approval identity includes plan, mandate, interpreter/model versions, capabilities and initial snapshot. The ledger additionally checks exact action hash, account, expiry, current lease, filter constraints and aggregate existing reservations transactionally. Prepared or sent attempts remain ambiguous across process failure; recovery reads the attempt before proceeding. A fresh run cannot reuse the same ledger's tombstones. Separate UI simulator runs have separate fake account worlds/databases, explicitly scoped to each independent experiment.

## Local server and evidence

The server binds loopback, rejects foreign Host/Origin values and requires a SameSite HttpOnly operator cookie plus an action header for POST. Checks run in worker threads; real phase/coverage and trace messages are stored and streamed through SSE. Cancelled or interrupted jobs have incomplete coverage. No user request can select an exchange write adapter.

Evidence contains original/selected plan, mandate, capability and model identity, bounds and coverage, counterexample choices/events, provenance and any durable simulation replay. The verifier recomputes canonical integrity, validates schemas/bindings and replays every recorded execution. Full verification reruns the finite check; replay-only explicitly limits its conclusion. Public examples contain only synthetic accounts and public market reads. Full local runtime databases are not shared.
