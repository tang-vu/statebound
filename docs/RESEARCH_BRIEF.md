# Statebound: design rationale

Research date: September 7, 2026. This note explains the execution model, related work and interface decisions behind Statebound's public Evidence Lab. Sources support the design rationale; implementation results come from the repository's recorded checks.

## The problem

A missing reply can leave an agent uncertain about an external effect. Binance documents that processing timeouts may leave execution status unknown, with order-status lookup needed to resolve the result. This supports the failure class modeled by Statebound; the specific demonstration remains a synthetic fixture. [Binance Spot REST documentation](https://developers.binance.com/en/docs/products/spot/rest-api).

Retry behavior also depends on the service's correlation and idempotency contract. AWS describes how client request identifiers help avoid duplicate effects when responses are lost. Its discussion motivates careful retry handling, while Binance's own semantics remain the relevant integration boundary. [AWS Builders' Library](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/).

Statebound represents confirmed debit separately from possible execution exposure. An unresolved attempt continues to consume its reserved budget. A repair queries the original attempt before deciding whether another purchase is allowed.

## Relationship to existing work

CoW intents illustrate separating user constraints from execution choices. Statebound's mandate uses that separation in a small execution-checking workflow; it does not implement CoW settlement. Temporal's saga pattern addresses compensation in workflows. Compensation and reconciliation can coexist: Statebound focuses on deciding what an uncertain order may already have done before another spend. [CoW Protocol](https://docs.cow.fi/cow-protocol/concepts/introduction/intents); [Temporal](https://docs.temporal.io/design-patterns/saga-pattern).

AgentCheck describes an MCP agent workbench for reproducing, intervening in and mitigating failures. TraceFix studies coordination-protocol repair using TLA+/TLC counterexamples. Statebound specializes these broader themes around financial exposure, a finite IOC model, and shared checker/executor semantics. These references provide context rather than independent validation of Statebound. [AgentCheck](https://arxiv.org/html/2607.11098); [TraceFix](https://arxiv.org/html/2605.07935v1).

## Interface decisions

The Evidence Lab lets a reader examine the same trace step from two perspectives: information delivered to the agent, and hidden exchange state available only to the reviewer. Both include explicit monetary values. Four cases distinguish budget violations, refused retries, confirmed completion and unresolved progress.

| Decision | Purpose | Implementation |
| --- | --- | --- |
| Separate knowledge and reality views | Explain why a timeout is not proof of failure | Confirmed debit, possible debit, actual debit and mandate headroom |
| Four visible outcomes | Distinguish safety from progress | Blind retry, guard only, reconciled and still unknown |
| Manual step navigation | Support inspection at the reader's pace | Native slider, previous/next controls and links to individual steps |
| Expandable provenance | Keep details available without obscuring the trace | Conditions, bounds, hashes, downloads and reproduction command |

Progressive disclosure motivates placing the central comparison before deeper provenance. This is a design rationale, not a measured improvement in task comprehension. A first-use study would be needed to establish that effect. [Nielsen Norman Group](https://www.nngroup.com/articles/progressive-disclosure/).

Text labels and numbers supplement color. The native slider has keyboard controls and separate step buttons. Traces advance only through user input. These choices follow accessibility guidance; testing has not established full WCAG conformance or coverage of every assistive technology. [W3C: use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html); [W3C: slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/); [W3C: animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html).

## Recorded cases and validation

The original lab uses a 20 USDT mandate, a synthetic 600 USDT reference price and zero fees. The first order fills while its reply is lost. Blind retry reaches 30 USDT debit. The guard refuses the second purchase at 15 USDT exposure. Reconciliation confirms completion at 15 USDT; inconclusive lookup leaves the same exposure unresolved. The fourth case changes lookup evidence as well as using the repaired plan.

These four cases explain the mechanism; the separate 48-scenario-per-variant regression corpus is a different artifact. The gallery generator replays every trace through the shared interpreter and checks exact equality. Browser checks compare every displayed step and amount, exercise keyboard navigation and shared links, and cover load failure and clipboard fallback at 390 and 1440 pixels. Hashes check consistency with the recorded model, not exchange attestation.

## Scope and next steps

The Binance input-to-verdict workflow imports a saved official CLI price and symbol grids into a separate synthetic model. Its account, fees and execution remain explicit assumptions, and unmapped venue filters are listed. Hosted MCP and exchange writes are not connected. The recorded AI candidate is revalidated rather than generated live in the public demo.

Further work includes first-use comprehension testing, broader assistive-technology coverage, independently managed evaluation scenarios and adapter conformance before any expansion to exchange execution. The current public demo and repository support inspection and reproduction of the implemented mechanism.
