# Statebound: Codex implementation brief

Repository: `statebound`

Prepared: 2026-09-05. Target: Binance Agent OS Mini Hackathon, Track A. Submission deadline supplied in the event announcement: 2026-09-08 at 23:59 UTC, equivalent to 2026-09-09 at 06:59 in Vietnam. Recheck the official entry requirements before preparing the final submission.

How to use: place this file in the target repository and ask Codex to read it completely, then implement it. This is an implementation instruction, not a claim that the product already exists. The English below is the complete master prompt.

---

## 1. Mission and working agreement

You are implementing Statebound, a usable developer product for planning, checking, repairing, and executing bounded Spot trading workflows under uncertain execution status.

Build the working product in this repository. Own the engineering, interface, integration, verification, documentation, and demo preparation. Continue through implementation and meaningful validation. Do not finish after producing a plan, scaffold, attractive landing page, or simulated terminal animation.

The product decision is fixed. Concentrate the novelty in a small mechanism that can be inspected and tested:

**Keep track of what could already have happened to an order, find execution paths that violate a user's mandate, repair the plan, and bind the executor to the checked plan.**

Working style:

- Read applicable repository instructions and inspect the worktree before editing. Preserve unrelated user changes.
- If the repository is empty, scaffold it here. If it contains relevant work, extend it. Do not create a second nested repository.
- Make ordinary implementation choices yourself. Ask only for a missing decision or authority that materially blocks the requested outcome.
- Use the installed environment and configured tools. Follow their permission boundaries. An unavailable credential is not permission to look for one in browser profiles, unrelated projects, or private conversations.
- Do not modify global Codex, Claude, MCP, shell, or credential configuration. Any suggested integration setup should be scoped to this repository and use documented installation and authentication flows.
- Work locally, run tests, and make descriptive commits at coherent verified milestones. Push those commits to the already configured project remote and working branch. Preserve its visibility; do not create a public remote, change access, force-push, or rewrite unrelated history. If no remote or push access is available, retain local commits and report the specific blocker after completing useful local work.
- Keep concise progress in Vietnamese and product interface/documentation in English. Record resumable progress in `docs/PROGRESS.md`. After interruption, inspect that file and Git history before continuing.
- Do not add paid infrastructure, buy credits, contact people, submit an entry, post on social media, or deploy publicly as part of this instruction. Prepare those deliverables for review.
- Do not place mainnet orders or move real funds. Supplied testnet credentials may be used for bounded integration tests with fake funds on verified testnet hosts. Mainnet execution remains disabled in this release.
- Do not launch background work and imply it will continue after your session ends. Record actual completed work and remaining steps.

## 2. Product and scope

Name: Statebound.

Short description: an execution workbench that finds and repairs unsafe AI trading plans before they are used.

Core user: a developer connecting a financial agent to Binance who needs to understand whether its retry, reconciliation, and budget logic behaves correctly.

Core job: "Check this plan against my spending limit, show me how it can fail, repair its control flow, and let me inspect or run the checked version."

This release supports:

1. One Spot acquisition workflow for one selected USDT-quoted symbol per run.
2. A user-confirmed spending mandate and acquisition goal.
3. A small typed execution language.
4. A deterministic exchange simulator with hidden execution state and separately delivered observations.
5. Bounded exploration of execution and observation failures, including combinations.
6. An AI planner/repair loop using structured plans.
7. An executor with a persistent operation ledger, budget reservations, and plan binding.
8. An interface that shows a counterexample, the repair, and a replay.
9. Actual use of a documented Binance Agent OS integration and clear evidence of what ran.
10. An exportable run bundle and command-line verifier.

The initial symbol can be BNBUSDT when the connected environment supports it. Read symbol filters instead of assuming a minimum order size. Keep the symbol configurable. Support a second asset or a multi-leg rebalance only after the whole core works and there is time remaining.

Out of scope: alpha prediction, leveraged products, arbitrage, cross-chain settlement, withdrawals, a token, on-chain certificates, insurance, a marketplace, agent leaderboards, or a large team of debating LLM personas. Do not dilute this release by adding them.

## 3. The flagship demonstration

Use an explicitly marked vulnerable example plan with ordinary per-order limits and a retry branch. It is a developer test fixture, not evidence that a particular third-party agent has a vulnerability.

Illustrative arithmetic: a mandate allows at most 20 USDT of total debit. An order spends approximately 15 USDT. Its execution succeeds, but its reply is lost. A stale account observation is delivered. The vulnerable retry can submit another order, producing approximately 30 USDT of principal spend before fees.

Compute actual amounts using the selected fixture's price, quantity steps, and fees. Do not force real market numbers to equal the illustration. If an exact 15 + 15 example uses a synthetic zero-fee fixture, label it accordingly. Never present a synthetic quote as a current Binance quote.

The user should be able to:

1. Inspect or change the mandate and example plan.
2. Press `Find a failure`.
3. Watch the checker compute a violating path from the plan and fault model.
4. See the precise observation where the agent's knowledge diverges from exchange reality.
5. Request an AI repair.
6. Inspect a structural diff that adds reconciliation and preserves the mandate.
7. Recheck and replay the repaired plan.
8. See that recoverable tasks still complete, while unresolved states remain explicitly unresolved.
9. Download the evidence and verify it outside the UI.

A new mandate or supported plan must produce a fresh check. A canned playback cannot be presented as a newly computed result. Fixed fixtures are useful for repeatable demonstrations and must be named as fixtures.

## 4. Technical facts and source discipline

Read the relevant official documentation during implementation. Record access dates, installed versions, discovered tool schemas, and the actual adapter used in `docs/BINANCE_INTEGRATION.md`. Do not assume that the current MCP schema forwards a raw REST error unchanged.

Important facts to retain:

- The public Binance MCP documentation describes user confirmation before non-read actions and scoped access through an Agentic sub-account. Statebound must preserve the host's confirmation behavior, not replace it with a local checkbox. [Binance MCP](https://developers.binance.com/en/docs/agent-native/mcp-server/agentic)
- A Spot timeout or certain server errors can leave execution status unknown. Querying and reconciling is distinct from retrying an order. [Spot REST overview](https://developers.binance.com/en/docs/products/spot/rest-api)
- A client order identifier is not a permanent exchange-wide exactly-once guarantee. The testnet documentation describes its uniqueness among open orders and circumstances in which reuse can be accepted. Own the durable attempt ledger and never reuse an ambiguous attempt as a fresh send. [Spot testnet REST reference](https://developers.binance.com/en/docs/products/spot/testnet/rest-api)
- Quantity, price, and notional constraints are symbol-specific. Read the relevant filters and validate the selected order type. [Spot filters](https://developers.binance.com/en/docs/products/spot/filters)
- Use official order states and distinguish an acknowledgment from evidence of a fill. [Spot enums](https://developers.binance.com/en/docs/products/spot/enums), [Spot glossary](https://developers.binance.com/en/docs/products/spot/faqs/spot_glossary)
- Discover an actual supported Agent OS route rather than inventing a tool name. [Binance Skills Hub](https://developers.binance.com/en/docs/sdks-tools/integrations/skills-hub), [official Binance CLI](https://github.com/binance/binance-cli)

These are integration facts, not a claim that Statebound has already demonstrated them against a connected account. Distinguish documented behavior, observed adapter behavior, and simulator assumptions.

## 5. Initial architecture

Prefer TypeScript throughout to share the same schemas and plan interpreter across the server, checker, CLI, and UI. Use an existing compatible project stack if present. For an empty repository, use React with Vite, a small Node server, and SQLite for persistent runs and operation records. Pin compatible versions after checking the environment; keep a lockfile.

Use strict schemas for public inputs and exact decimal or scaled-integer arithmetic for all money, prices, quantities, and fees. Plain JavaScript floating-point arithmetic is unsuitable for the financial kernel. Serialize decimal values as strings.

A reasonable layout is:

- `packages/core`: mandate, plan, observations, transitions, belief state, invariants, and canonical serialization.
- `packages/simulator`: hidden exchange state, observation delivery, supported faults, and deterministic replay.
- `packages/checker`: bounded exploration, counterexamples, coverage reporting, and verification statuses.
- `packages/executor`: plan interpreter integration, durable attempts, reservations, approvals, and reconciliation.
- `packages/binance`: capability contracts and verified adapters.
- `packages/agent`: structured planner and repair provider adapters.
- `packages/evidence`: bundles and verification CLI.
- `apps/server`: authenticated local API, persistence, jobs, and event streaming.
- `apps/web`: the workbench.
- `examples`, `tests`, and `docs`.

This layout is a suggestion, not a requirement to produce many packages. A smaller folder structure is preferable if it preserves these boundaries with less setup. Do not introduce microservices, Redis, a queue cluster, or a hosted database for this release.

The server initially runs as one process on a local interface. Enforce one active executor per account scope using a transactional database lease and recovery rules. Do not claim multi-instance production readiness.

## 6. Mandates, goals, and arithmetic

The mandate is a user-owned immutable document once confirmed. AI may propose a mandate for review, but it cannot silently interpret approval, change a confirmed limit, widen the allowed product scope, or extend expiry to pass verification.

At minimum represent:

- Mandate ID, schema version, creation time, and expiration.
- Account scope identifier and execution environment.
- Allowed symbol, quote asset, side, and supported order types.
- Maximum cumulative quote-equivalent debit, including the defined treatment of fees.
- An optional quote reserve that new orders must preserve.
- Maximum permitted order count and retry/reconciliation bounds.
- The acquisition goal, preferably a net base-asset quantity relative to initial holdings.
- Reference quote and its provenance, timestamp, and allowable age.
- A price limit rule and explicit price bound for each order.
- Supported fee assumptions and conservative rounding rules.
- Any allowed shortfall tolerance, shown before approval.

A natural-language request such as "buy around 15 USDT of BNB, maximum total debit 20 USDT" should compile to a reviewable goal and budget. Derive the base quantity using a reference quote and exchange filters, then show the actual derived values. Do not silently raise the budget to satisfy minimum notional requirements. Reject or ask for a new user decision when a mandate is infeasible.

Use limit orders with a supported time-in-force such as IOC when appropriate to express a price bound. Confirm that the chosen adapter actually supports the required fields. A ticker check before an unbounded market order does not guarantee execution slippage. The verifier must reject an adapter/plan combination that cannot express an enforced bound required by the mandate.

For each order, separate confirmed debit from the additional debit that remains possible. Across a belief state, compute an upper bound on aggregate eventual debit without counting the same fill twice. A possible fill is not free budget merely because its confirmation was lost.

Define fee accounting precisely. If fees can be paid in base, quote, or a third asset, preserve the fee asset and amount. Only convert to quote-equivalent using an explicitly bounded supported method. If the adapter cannot establish a fee bound required by the mandate, return `UNSUPPORTED` or request a revised mandate; do not assume fees are zero. Synthetic fee assumptions belong to the simulator configuration and must be visible in its evidence.

Reserve-floor enforcement applies to actions controlled by this executor and the supported account model. It does not protect the whole account from unrelated manual activity or other agents. Unexpected account activity causes reconciliation and invalidation of stale assumptions.

## 7. Separate exchange reality from agent knowledge

This separation is mandatory and is the most important modeling boundary.

`ExchangeState` is the simulator's hidden ground truth. It includes orders, fills, balances, reserved amounts, fees, and accepted requests.

`Observation` is only what the adapter has delivered to the agent: replies, errors, order-status reads, balance observations, and timestamps or sequence information that are actually available.

`KnowledgeState` is the executor's supported set or conservative abstraction of possible exchange states consistent with its observation history and the stated model.

`PlanState` is the current node and bounded local state of the typed plan.

`AttemptLedger` is Statebound's durable record of intended and attempted external effects, not a replacement for exchange evidence.

Enforce these rules:

1. The planner and executor cannot read hidden simulator state, fault seeds, future events, or undisclosed fill outcomes.
2. A timeout after sending expands or preserves uncertainty; it does not establish failure.
3. A stale balance does not clear an ambiguous order reservation.
4. A response's local arrival time does not prove its server-side information is fresh.
5. A `not found` result is not automatically proof that an ambiguous order was never accepted. Treat adapter consistency and lookup completeness as explicit capabilities.
6. Absence of a WebSocket event is not proof of absence of an execution.
7. A partially filled order consumes actual debit and may retain additional exposure until its remaining quantity is conclusively terminal.
8. Cancel acknowledgment, if cancellation is supported, does not erase fills that raced with cancellation.
9. Evidence updates narrow knowledge only when justified. Contradictory or out-of-model evidence results in an unresolved state and blocks dependent writes.
10. If the model is too large to enumerate, use a conservative abstraction. Prove or test that it over-approximates the supported concrete states. Truncating states and then declaring success is forbidden.

In simulator checks, assert that the concrete exchange state remains represented by the knowledge abstraction. This is a critical soundness property. If it fails, classify the checker/model as defective rather than reporting the plan as safe.

Do not attach probabilities to branches unless a validated probabilistic model exists. Labels such as `possibly filled` are enough.

## 8. Execution language and binding

Create a finite, typed plan language with explicit control-flow nodes, guards, transitions, and bounded loops. Useful initial operations include reading a quote, submitting a bounded Spot order, querying an existing order, waiting for a bounded interval, branching on typed observations, completing, and pausing for unresolved status. Add cancellation only when its races are modeled and the adapter supports it.

Guards use a restricted expression AST over defined fields. Reject arbitrary JavaScript, shell commands, network URLs, unknown tool names, recursive expressions, unbounded loops, prototype keys, and malformed numeric strings.

Represent at least:

- Plan ID and version.
- Mandate hash.
- Initial account/snapshot reference.
- Start node and typed nodes.
- Stable logical operation IDs and bounded attempt IDs.
- Explicit branch conditions and terminal conditions.
- Required adapter capabilities and assumptions.
- Maximum steps, read attempts, and total execution duration.

Use one plan interpreter for simulation and runtime, with separate adapters for effects and observations. The checker invokes the interpreter through a deterministic transition interface. Do not implement a separate hard-coded demo algorithm while the actual executor follows different logic.

The financial kernel independently guards actual write requests. A vulnerable plan may be analyzed in an isolated simulator using a clearly labeled baseline mode, but it cannot be enabled on a real adapter. This produces three useful comparisons:

- Vulnerable plan with a per-order-only baseline, simulator only: can violate the aggregate mandate.
- Vulnerable plan under Statebound's executor: unsafe requests are blocked, but the workflow may become stuck.
- Repaired plan under the same Statebound executor: reconciles and completes when the environment permits it.

The third comparison demonstrates usefulness. Merely blocking every order is not an adequate result.

Bind execution permission to the exact plan, mandate, interpreter/model versions, adapter capabilities, and initial state or explicitly permitted state envelope. Hashes provide identity and integrity relative to a trusted reference, not proof that a plan is financially safe.

Define the mapping from adapter observations to checked states. A few sampled prices or fill fractions do not cover all real prices or quantities. To admit a range, use conservative numeric bounds, outward rounding, and the enforced order price/quantity limits, and verify that the abstraction covers that range. Otherwise restrict the verdict to the exact discrete cases checked. Never promote a fixture-only result into a broader testnet or market guarantee. Runtime guards remain necessary even when the model check completed.

An ordinary observation inside the checked state model should advance execution without forcing a new plan. A changed mandate, changed plan, different adapter, changed interpreter, expired approval, or state outside the checked envelope invalidates authorization for dependent writes and requires rechecking. Preserve prior evidence and approvals as historical records, not reusable permission.

## 9. Counterexample engine

Start with explicit-state bounded exploration in TypeScript. A small, inspectable checker is sufficient. Introduce an external solver only if a concrete property requires it and the environment supports it; do not spend the hackathon building a general theorem prover.

Enumerate supported choices over order execution, reply delivery, and observation visibility. The initial fault families are:

- Accepted order followed by a lost reply or timeout.
- Partial fills with delayed or terminal observations.
- Stale account/order observations that remain plausible under the declared consistency model.

Include selected combinations, especially an accepted order with a lost reply followed by a stale balance. Support additional local delivery/restart tests for duplicate events, reordered observations, and process interruption where needed to validate the durable executor.

The simulator may only produce behavior allowed by its documented model. It must not create money, fill more than an order's quantity, ignore a limit price, spend unavailable exchange funds, or continue filling a conclusively terminal IOC order. Otherwise the checker would be detecting invented exchange behavior instead of the plan's real weakness.

Make the search a function of plan, mandate, initial state, model version, numeric abstraction, and explicit bounds. Record all of these in the result. Use canonical state keys, a visited set, predecessor links, and a deterministic seed where sampling is used. Show real explored-state and transition counts.

Use breadth-first exploration to produce a short counterexample. Call it shortest only when this is actually established for the encoded state graph and metric. A minimized sampled trace is only minimized under the implemented reduction procedure.

Each counterexample includes:

- Full input hashes and search bounds.
- The actions and delivered observations.
- Hidden exchange events for the reviewer, kept inaccessible to the agent during execution.
- Knowledge state before and after the critical observation.
- The violating invariant, expected bound, and computed value.
- A reproducible trace or scenario file and replay command.
- The first unsafe requested transition and, when demonstrated, the subsequent concrete financial violation.

Result statuses must distinguish:

- `COUNTEREXAMPLE_FOUND`: a replayable violating path exists in the supported model.
- `NO_VIOLATION_WITHIN_BOUND`: the declared finite search completed without finding a violation.
- `INCONCLUSIVE`: the search ran out of time, memory, steps needed for its stated coverage, or encountered an internal problem.
- `UNSUPPORTED`: the plan, adapter, fee model, or required semantics exceed implemented support.

Sampling without exhaustive coverage has its own `SCENARIOS_PASSED` result and cannot be promoted to a completed model-check verdict. A path reaching the configured horizon is not proof of unbounded safety. Make the horizon and any pending obligations visible.

Check safety and progress separately. Safety includes aggregate debit, reserved exposure, allowed actions, approval binding, freshness requirements, and correct knowledge accounting. Progress includes reaching the acquisition goal in a supported recoverable environment with sufficient funds, feasible filters, required approvals, and eventual delivery of decisive observations. Permanently missing evidence is allowed to produce a visible `UNRESOLVED` outcome, not fabricated completion.

Seed an evaluation corpus before tuning repairs. Keep a separate holdout set of fault combinations and parameterizations unavailable to the repair model until final evaluation. Report the full denominator, not selected successful runs.

## 10. AI planner and repair loop

Use one capable model as the structured planner/repairer. The deterministic checker supplies counterexamples; it does not need an LLM persona. Avoid a collection of nominal agents with no distinct function.

The model receives the confirmed mandate, public plan schema, supported capabilities, delivered observations, and a bounded diagnostic trace when a repair is requested. It never receives credentials, hidden live account secrets, or authority to call an exchange directly.

Support two paths:

1. A configured model-provider adapter, using a normally configured endpoint/key and an explicitly selected supported model. Discover current SDK usage and compatible versions before coding. Do not silently choose a paid service or scrape credentials.
2. External orchestration by the user's Codex session through a local Statebound CLI or MCP interface. Codex can supply a structured candidate, read a computed counterexample, and submit a repair without a separate model API key in the web application.

Implement the core CLI first. Add the small local MCP interface if it makes the real Codex loop easier. Suggested Statebound-local tool names are `submit_plan`, `check_plan`, `get_counterexample`, `submit_repair`, `run_simulation`, and `export_evidence`; these are tools you create, not assumed Binance tool names. Discover the installed MCP SDK before implementing its transport. Use the host's normal project-scoped connection mechanism and do not edit global settings.

For the external-orchestration path, persist the submitted plan/repair and provenance as `external_agent`. A user-uploaded JSON plan is `manual`, and a bundled plan is `fixture`. Do not display `Live AI` for either of the latter. A deterministic repair template can be provided as a convenient offline example but must be labeled `template repair`.

At least one completed development run should exercise actual model-generated planning or repair using an available provider or the Codex session. Save the observable input, output, validation, and checker result. If no model route is available, complete the rest and report the live AI gate as blocked; do not pretend templates satisfy it.

Model output is a full typed plan or a tightly constrained patch. Enforce:

- No mutation of mandate, account scope, budget, goal, expiry, supported model assumptions, or checker bounds.
- No deletion of the goal or replacement of every reachable branch with unconditional pause.
- No new unsupported effects or arbitrary code.
- No interpretation of a timeout as a confirmed rejection.
- No reliance on future observations or simulator-only variables.

Limit repair iterations and token use per run. Three repair attempts is a reasonable initial product limit, configurable by the operator. Preserve each candidate and verdict. Do not retry indefinitely or let the model grade its own output as proof.

A repair should be explained as a concrete control-flow change, such as querying the original attempt and preserving its reservation until decisive evidence arrives. Provide a short action rationale, not private chain-of-thought. The original and repaired graphs should be inspectable side by side.

## 11. Durable executor and authorization

Separate simulated execution from testnet execution in types, configuration, database scope, and UI. A request body cannot switch the server to a more privileged adapter. The operator selects allowed adapters at startup.

Persist the confirmed mandate, plan binding, attempt identity, maximum debit reservation, and pending-send state transactionally before sending an external effect. Use a durable unique constraint on the logical operation/attempt identity. Never release money from the internal reservation merely because the HTTP call threw or the process restarted.

Account for the crash window between preparing a send and recording its outcome. On restart, a prepared/sent attempt may be ambiguous. Reconcile it or pause; do not blindly replay the external write. This can sacrifice availability when the adapter cannot establish what happened. State that limitation honestly.

A repeated application request with the same idempotency key should return the existing run/attempt result and must not produce a second exchange call. Implement and test this at the server/database boundary. Do not equate this local property with end-to-end exactly-once behavior across the exchange.

Persist attempt tombstones for this release. Do not reuse a completed client identifier just because the venue would accept it. Disable generic automatic retries on order-submission calls in every adapter layer you control. Document any internal SDK/MCP retry behavior you cannot establish; do not certify an adapter whose write semantics remain unknown.

Approval records identify the exact normalized action, plan hash, mandate hash, account/environment, and expiry. Approval is operator-controlled input, not an LLM tool that approves itself. In a host that requires confirmation, preserve that confirmation for each applicable write. Local Statebound approval is an additional policy boundary, not a bypass.

Before every write:

1. Confirm the active executor lease, current approval, plan identity, and adapter identity.
2. Validate parameters against current supported symbol filters and the mandate.
3. Advance or reconcile knowledge using available evidence.
4. Check aggregate worst-case debit across the supported belief state, accounting for the new action and existing uncertain exposure without double-counting.
5. Commit the durable operation record and reservation before dispatch.
6. Accept only observations that match the intended environment, account, symbol, and attempt.

Once a fill is confirmed, reconcile actual principal and fees against the reservation. Deduplicate fill/event identities and retain monotonic cumulative quantities. A duplicate event cannot charge twice or release reservations twice.

If the plan expires or the user presses stop, prevent new submissions immediately. Continue permitted read-only reconciliation of previously attempted effects. Do not claim that stopping the process cancels orders at the exchange. Any supported cancellation is a separate confirmed effect whose result must also be reconciled.

## 12. Binance integration and capability negotiation

Deliver an adapter capability contract before writing exchange code. It should state whether the adapter can provide:

- Public quotes and applicable symbol filters.
- Account scope and balance observations with known freshness semantics.
- A supported bounded-price order type.
- A caller-controlled client identifier or another reliable correlation mechanism.
- Order lookup by a stable identifier and cumulative fill information.
- Fees or a documented conservative fee bound.
- Human confirmation for applicable writes.
- Known retry behavior and a verified testnet environment.

Match plans to capabilities. A missing capability is an explicit unsupported state, not a field filled with guessed data. Testnet REST behavior must not automatically be attributed to a separate hosted MCP adapter.

Integration priority:

1. Prefer the official Binance MCP connection already available to the host, or a documented official Skills Hub workflow. Verify the actual interface and save a sanitized evidence record.
2. If supported by the selected official workflow, the official Binance CLI can supply market data or testnet execution. Read the installed command help and pinned release documentation instead of inventing flags.
3. A direct public REST reader and a direct Spot testnet adapter can be useful engineering components. Label them as direct API adapters. A REST call must not be presented as evidence that Binance MCP was used.

The release needs an actual documented Agent OS integration path. Record precisely which part uses it. If authentication is missing, finish the local core and adapter contract, show a genuine disconnected state, and leave a short exact setup checklist. Keep the integration gate blocked until it is demonstrated. Do not fabricate OAuth success, account balances, tool responses, or order IDs.

For an externally connected Codex host, use the supported host connection. Do not copy its OAuth token into the Statebound server. A tool result forwarded by a client is client-supplied evidence, not an independently authenticated exchange assertion. It may support an explicitly labeled rehearsal; it must not silently satisfy stronger live execution assurances.

For a CLI adapter, invoke a known executable with argument arrays and `shell: false`. Validate every value against the typed action. Do not allow arbitrary commands, URLs, profiles, or inherited production defaults from model output. Pass an explicit environment for each subprocess. The official CLI documents a production default, so a testnet action must never rely on an omitted environment value. [Binance CLI documentation](https://github.com/binance/binance-cli)

For testnet writes, require configured testnet credentials, explicit adapter enablement, correct host verification, and operator action approval. There must be no code path that silently falls back to a production host if testnet is unavailable. Keep credentials server-side and out of logs, screenshots, fixtures, exception payloads, and Git.

Do not intentionally create API failures against a live service. Inject faults within the simulator or a controlled local test adapter. Do not send stress traffic, spoof external service responses, or manipulate an exchange to make the demo interesting.

## 13. Server, persistence, and evidence

Use a small server API for mandates, candidates, checks, repairs, replays, run events, and exports. Validate every boundary with the same versioned schemas used by the CLI.

Long checks run as bounded jobs and stream real progress through SSE or an equivalent simple mechanism. Persist run events as they happen. Reloading the page must reconnect to the same run rather than spawn a second execution. Request retries must be idempotent where they can create work or effects.

Local operation should not require a SaaS account. Bind privileged functions to a local operator session. Validate origin and session/action authorization; do not expose unauthenticated testnet writes on a public interface. Any public preview prepared later must run in simulator-only mode with bounded jobs and no exchange/model credentials exposed to visitors.

Export one versioned JSON evidence bundle containing:

- Mandate and approval references with appropriate redaction.
- Original plan, candidate revisions, selected plan, and hashes.
- Initial state or replay snapshot, environment, and data provenance.
- Model/interpreter/adapter versions and capability declarations.
- Fault model, numerical abstraction, search bounds, and observed coverage.
- Counterexample trace and the repair diff.
- Checker results, replay outcomes, and unresolved obligations.
- External calls and sanitized responses actually observed, if any.
- LLM/provider or external-agent provenance, with observable structured outputs.
- Actual execution events, order identifiers when appropriate, and final confirmed state.
- A manifest with deterministic integrity hashes.

Do not require account identifiers or private balances in a publicly shareable example. Offer a private full export and a separate redacted replay export where necessary; mark redactions and any effect on independent checking. A corrupted or incomplete bundle must never verify as complete.

Build a standalone CLI verifier that validates schemas and hashes, replays transitions, recomputes numeric invariants, checks plan/mandate binding, and reports missing assumptions or unsupported features. It should run without an LLM, API credentials, or a running UI. If checking complete bounded coverage is requested, rerun the declared search; replaying one trace alone does not verify all paths.

Use precise result language. A locally recorded exchange response is not a Binance-signed proof. A local signature identifies the signer and protects bytes; it does not prove the response's truth. Do not add blockchain anchoring to imply a stronger guarantee.

Store evidence locally by default and prevent secrets from entering it. Generated demo evidence may be committed only after review for private information. Commit the programs that regenerate evidence as well as a small sanitized example.

## 14. Product interface

Build an application that opens directly into useful work. A short landing section can explain the purpose, but the workbench is the main product.

Suggested routes: `/` for an immediate entry/demo, `/app` for the workbench, and `/runs/:id` for a persisted run and export. Merge routes if this makes the product simpler.

Use restrained financial-tool styling: dark graphite or light neutral surfaces, clear typography, one amber accent, and semantic colors for verified observations, uncertainty, and violations. Do not imply Binance endorsement through copied branding. Avoid decorative dashboards, made-up revenue counters, stock photography, unnecessary gradients, and giant hero sections.

The workbench should present:

- A mandate panel with editable limits before confirmation.
- A plan view with typed steps and the changed branch highlighted after repair.
- A central timeline showing requests, exchange events in replay, and observations visible to the agent.
- A knowledge panel showing the remaining possible order states and reserved/confirmed debit.
- A computed failure explanation with the violated constraint.
- Controls to check, repair, replay, inspect evidence, and export.
- Clear run status, coverage bounds, actual duration, and a cancellation control.

Keep three status dimensions separate:

1. Data source: live Binance, recorded Binance response, client-supplied capture, or synthetic fixture.
2. Execution: simulator, verified testnet adapter, or unavailable. Mainnet is unavailable in this release.
3. Planner: live configured model, external Codex agent, manual plan, or bundled fixture.

For example, live market data with simulated orders is a legitimate mode, but it must not be labeled `Live trading`. Keep the distinction visible in the video frame and evidence.

Render the actual timeline and knowledge branches from server events. Animations can explain those events but cannot invent activity. If showing a stored replay, say so. Show no unsupported numeric probabilities for possible order states.

Useful empty/error states are part of the product: disconnected integration, missing model, unsupported capability, impossible mandate, check timed out, repair rejected, unresolved order, and incomplete evidence. Offer the next relevant action without exposing stack traces or credentials.

The interface must remain responsive during exploration. Support keyboard navigation, meaningful labels, reduced motion, and common desktop sizes. Validate the main workbench at 1440x900 and a smaller laptop viewport. Mobile polish is secondary to a clear desktop demo.

## 15. Meaningful verification and acceptance gates

Write tests for the financial and authorization risks below. UI snapshot tests or tests that simply restate implementation branches are not substitutes. Keep expected financial results independently derived from concrete simulator events rather than trusting the same policy function being tested.

| Gate | Required evidence |
| --- | --- |
| Aggregate overspend | The vulnerable per-order baseline produces a replayable violating path for a parameterized mandate, not only a hard-coded demo button. |
| Unknown successful order | A successful fill followed by a lost reply retains exposure and cannot cause an unchecked second purchase. |
| Unknown unsuccessful order | An actually unaccepted attempt is handled through supported reconciliation and can make progress only when sufficient evidence exists. |
| Stale balance | An old balance cannot release a reservation or overwrite a confirmed debit. |
| Partial fill | Confirmed quantity/fees and possible residual exposure are both counted correctly. |
| Combined faults | At least the accepted-write/lost-reply/stale-read combination is explored and reproduced. |
| Hidden-state isolation | Planner/executor inputs exclude hidden ground truth, future events, and fault choices. |
| Knowledge soundness | Supported concrete states remain included in the belief abstraction across generated event sequences. |
| Duplicate delivery | Repeated order/fill events do not duplicate debit or release reservations twice. |
| Out-of-order observation | Older observations cannot regress cumulative fills or erase terminal evidence. |
| Decimal and fee boundaries | Rounding, minimum notional, step sizes, and supported fee assets are handled at boundary values. |
| Durable attempts | A restart before or after sending does not blindly dispatch the same ambiguous effect. |
| Concurrent requests | Two concurrent requests cannot both spend the same internal budget or acquire the same executor scope. |
| Client identifier reuse | Local attempt tombstones prevent reuse even when a simulator models the venue accepting a previously filled identifier again. |
| Plan and approval tampering | A changed plan, mandate, account, expiry, or adapter cannot reuse a previous execution authorization. |
| Repair constraints | Attempts to increase budget, remove goals, access arbitrary tools, or change checker assumptions are rejected. |
| Progress | The repaired plan achieves a feasible acquisition goal in clean and supported recoverable cases; unconditional refusal does not pass. |
| Permanent ambiguity | A run with no decisive evidence ends visibly unresolved and preserves pending exposure. |
| Checker limits | Timeout, incomplete exploration, unsupported semantics, or state-pruning defects never produce a completed safe verdict. |
| Replay determinism | Identical recorded inputs and seeds reproduce the same computed transition trace and numeric result. |
| Evidence integrity | Altered values, hashes, plan references, missing events, and unsupported versions fail or explicitly limit verification. |
| Adapter conformance | Actual discovered schemas are mapped and at least one genuine official integration read is recorded. Missing integration remains blocked. |
| Testnet isolation | Testnet configuration cannot fall back to mainnet, including absent environment variables and malformed request parameters. |
| Actual AI loop | A real structured model or external Codex repair is validated and rechecked; fixtures are reported separately. |

Use property-based tests for arithmetic, event ordering, and belief soundness where they can expose combinations that hand-written examples miss. Keep the corpus bounded and reproducible. Never place real financial orders in unit/property tests or CI.

For the comparison report, use the same mandates and environments for all variants. Report actual counts for constraint violations, successful completions, unresolved outcomes, refusals, and checker incompleteness. Provide both safety and progress denominators. No fabricated percentage, unexplained score, backtested profit claim, or selectively omitted failure is acceptable.

Use an intentionally defective interpreter/guard mutation in a test to confirm that the verification harness detects at least one known defect. Do not silently count the vulnerable baseline's expected failures as product regressions, and do not suppress unexpected repaired-plan failures.

Run lint, type checking, meaningful unit/property/integration tests, and a production build. Run an end-to-end browser flow covering a check, counterexample inspection, actual or explicitly labeled repair, replay, reload, and export. Open the interface and inspect it visually. If a browser or integration tool is unavailable, document that gate as unverified and complete the accessible gates.

## 16. Build order and time allocation

Work in this order. The time estimates are prioritization guidance, not a reason to stop unfinished work or pretend a gate passed.

**Milestone 1: prove the mechanism, before visual polish.**

- Inspect the repo and establish the simplest runnable stack.
- Implement mandate/plan schemas, decimal accounting, a simulator, and the first bounded checker.
- Build a CLI example that finds the lost-reply/retry counterexample.
- Produce a repaired plan that reconciles, satisfies the same constraint, and completes a feasible clean/recoverable case.
- Implement hidden-state isolation and a basic knowledge-soundness test.
- Commit the runnable slice, commands, and actual results.

Aim to establish this slice within roughly the first 4 to 6 focused implementation hours. If it is not working, simplify the supported graph and fault model while retaining the real search/repair/runtime relationship. Do not replace the mechanism with a preset animation to preserve appearance.

**Milestone 2: real agent and official integration.**

- Connect one actual model or the external Codex CLI/MCP loop.
- Demonstrate a real structured repair and save its observable evidence.
- Discover and use the available documented Binance Agent OS route for an actual read.
- Implement capability checks and document any missing order/reconciliation semantics.
- Start the persistent executor and operation ledger.

Investigate integration access early. Spend a bounded initial investigation on an unavailable auth path, then finish the local product instead of spending the whole build session on authentication. Do not mark the integration complete until it works.

**Milestone 3: durable behavior and broader faults.**

- Complete reservations, replay identity, approvals, restart behavior, and single-executor enforcement.
- Add partial fills, stale observations, fault combinations, and held-out cases.
- Complete meaningful acceptance gates and the standalone evidence verifier.
- Add testnet execution only when its capability contract and isolation checks pass.

**Milestone 4: workbench and product quality.**

- Build the actual interactive timeline, knowledge panel, plan diff, and export flow.
- Stream real run events and persist runs across reloads.
- Implement clear missing-credential and unsupported-capability states.
- Inspect desktop layouts and fix the demonstrated end-to-end flow.

**Milestone 5: reproducibility and submission package.**

- Reproduce setup from the documented commands in a clean environment when feasible.
- Generate sanitized evidence and the measured baseline comparison from actual runs.
- Record the functioning app, prepare captions and narration, and verify the video.
- Finish the README, limitations, integration evidence, and submission draft.
- Commit and push the final verified project state to the existing authorized remote.

Protect time before the submission deadline for a reproducible build and demo. Drop optional extra assets, assets beyond the first symbol, fancy graph libraries, hosted auth, or additional providers before sacrificing the financial kernel or truthful integration evidence.

## 17. Commands and repository deliverables

Provide a small documented command surface. Use the repository's existing package manager, or npm for a new project unless there is a clear reason otherwise. The exact script names can vary, but the following capabilities must work:

- Install from the lockfile.
- Start the local application.
- Run lint and type checking.
- Run core tests and the held-out evaluation separately.
- Run an offline flagship demonstration with no credentials.
- Run a live model/external-agent demonstration when configured.
- Inspect integration availability without printing secret values.
- Check a user-supplied supported plan file.
- Replay a saved counterexample.
- Verify an exported evidence bundle independently.
- Build the application for release.
- Record the demo when browser/video tooling is available.

An example target is `npm run demo:verify` for the offline mechanism and `npm run evidence:verify -- path/to/bundle.json` for export verification. Implement the commands before documenting them. Do not present an intended command as tested.

Deliver at least:

1. Working app, CLI, financial kernel, simulator, checker, repair integration, and executor code.
2. Lockfile, `.env.example` with placeholders only, and a minimal `.gitignore` excluding secrets and private runtime data.
3. `README.md`: what the app does, quick start, a real screenshot, the flagship walkthrough, integration route, and honest current status.
4. `docs/SPEC.md`: mandate semantics, plan language, invariants, and completion conditions.
5. `docs/MODEL_ASSUMPTIONS.md`: finite abstractions, fault bounds, eventual-consistency assumptions, fees, unsupported cases, and what the result does not prove.
6. `docs/BINANCE_INTEGRATION.md`: official sources, discovered tool/CLI versions, capability mapping, actual observed calls, testnet isolation, and unresolved access needs.
7. `docs/EVALUATION.md`: measured baseline/repaired comparisons with full denominators and reproducible commands.
8. `docs/RELATED_WORK.md`: how the scope relates to prior intent systems, recovery workflows, and agent checking. Attribute reused code according to its license.
9. `docs/PROGRESS.md` and `docs/HANDOFF.md`: completed milestones, commits, commands/results, exact blockers, and the next concrete action.
10. Supported example plans, reproducible scenario inputs, and a small sanitized evidence bundle with its actual generated verifier output.
11. `submission/`: concise project description, integration explanation, a demo script, captions, a recording when supported, and a draft submission post with placeholders for URLs that do not yet exist.

Keep public documentation in English and copy-friendly. Do not use em dashes. Do not include fake testimonials, user counts, win probabilities, invented benchmarks, or claims of being first in the world.

## 18. Demo and presentation requirements

Prepare a short demo centered on the working application. Target approximately 90 seconds, then adapt to any verified event-specific time limit. This duration is a product choice, not an asserted hackathon rule.

Suggested sequence:

- First 10 seconds: show the confirmed budget and the vulnerable example plan. Explain that the example is deliberately vulnerable for testing.
- Next 20 seconds: start a real check, reveal the lost-reply path, and show possible order states and aggregate spend.
- Next 20 seconds: request repair and show the actual plan diff. If generation time is edited out, disclose the time cut; do not substitute a fixture while labeling it live AI.
- Next 20 seconds: recheck and replay the repaired plan. Show both a successful recoverable case and how unresolved status is represented.
- Final 20 seconds: show the actual Binance integration source, the evidence export, and the independent verifier result with its declared bounds.

The user prefers AI narration and automated screen recording. If suitable tools are available, record the real app using browser automation and produce natural, plain English synthetic narration with subtitles. Use short sentences that describe visible actions. Avoid theatrical sales language. Use a standard licensed synthetic voice; do not clone a real person's voice. Keep source/execution labels visible. A small disclosure such as `AI narration; actual application recording` is appropriate.

Do not fabricate screenshots, tool responses, authentication, trading activity, checker progress, model output, or verifier results for the recording. Do not imply that a simulated lost reply occurred at Binance. Label it as injected in the simulator. A stored replay is acceptable when labeled as a replay.

If video or TTS tools are unavailable, deliver a tested recording script if feasible, the narration text, timed captions, screenshots from the actual app, and the exact uncompleted recording step. Do not subscribe to a new paid service or block engineering progress waiting for TTS.

The public pitch should explain the product's observed capability and limits. A suitable description after the relevant gates pass is: "Statebound finds execution paths that can break an AI trading mandate, repairs the plan, and runs the checked plan through a constrained executor."

Never claim guaranteed returns, universally safe trading, atomic rollback of filled orders, or complete protection against all exchange failures.

Prepare entry materials, but leave following/reposting, replying or quote-posting, logging into the survey, survey submission, and public publication to an explicitly authorized follow-up. Drafting the submission does not authorize sending it.

## 19. Definition of done and final report

The implementation is ready for technical review when:

- A developer can install, launch, and run the offline workflow without financial or model credentials.
- The checker computes a counterexample from a supported input plan.
- A real model or Codex repair preserves the mandate and can be rechecked.
- The repaired plan both avoids the demonstrated violation and completes appropriate recoverable cases.
- The executor and checker use the same plan semantics, with persistent attempt accounting and tested authorization binding.
- There is actual documented evidence of the Binance Agent OS integration used, or that specific external gate is clearly reported as blocked.
- Evidence exports can be independently parsed, checked, and replayed without the UI or an LLM.
- Meaningful verification passes, and remaining limitations are visible.
- The app is usable and the submission assets reflect actual behavior.

Do not collapse these into a single "production-ready" claim. Report separately: offline core, live AI loop, official integration read, testnet execution, browser validation, recording, and Git push. A skipped gate is not a passed gate.

Your final response to the user should be concise and in Vietnamese. Include the actual repo/branch/commit, working commands or preview, what runs, what was tested, and any exact remaining external setup. Do not say that code was pushed, integration ran, video was recorded, or a submission was made unless you verified that action succeeded.

Start now with repository inspection and Milestone 1. Continue implementing through the accessible gates, preserving the fixed product direction and the quality requirements above.

---

## Reference notes for reviewers

These sources explain existing concepts and prevent exaggerated novelty claims. Statebound's proposed contribution is the small integrated financial workflow with explicit uncertain order state, computed counterexamples, constrained repair, and runtime plan binding. Implementation evidence is still required.

- Signed trading constraints: [CoW Protocol intents](https://docs.cow.fi/cow-protocol/concepts/introduction/intents).
- Compensating workflow actions: [Temporal saga pattern](https://docs.temporal.io/design-patterns/saga-pattern).
- MCP fault injection and controlled mitigation comparison: [AgentCheck preprint](https://arxiv.org/html/2607.11098).
- Counterexample-driven agent protocol repair: [TraceFix preprint](https://arxiv.org/html/2605.07935v1).

The research links are prior-work references, not independent validation of Statebound or a claim that these preprints establish production safety.
