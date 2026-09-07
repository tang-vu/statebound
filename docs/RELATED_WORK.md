# Related work and attribution

Sources accessed 2026-09-05. Statebound does not claim to invent intents, durable recovery, fault injection or counterexample-driven repair.

[CoW Protocol intents](https://docs.cow.fi/cow-protocol/concepts/introduction/intents) describe expressing the outcome a user permits. Statebound's mandate similarly separates user constraints from an agent's proposed workflow. It does not implement CoW settlement or order auctions.

[Temporal's saga pattern](https://docs.temporal.io/design-patterns/saga-pattern) explains compensating actions in workflows. Statebound focuses on the narrower question of reconciling an uncertain external effect before another spend; compensation and reconciliation can coexist. A filled trade cannot be rolled back atomically by this tool.

[AgentCheck](https://arxiv.org/html/2607.11098) presents an MCP agent reproduce/intervene/mitigate workbench. Statebound also compares a vulnerable baseline and controlled mitigation, but narrows its implementation to exact financial exposure in a discrete IOC workflow.

[TraceFix](https://arxiv.org/html/2605.07935v1) concerns repair of agent coordination protocols from TLA+ counterexamples. Statebound uses a small explicit-state TypeScript checker and constrained candidate validation; it does not invoke TLA+ or inherit any proof from that paper.

[AWS Builders' Library: Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/) explains why missing responses can leave uncertain effects and why request correlation and idempotent contracts matter. It motivates careful retry handling; it does not establish Binance's order-ID semantics.

[Binance Spot REST documentation](https://developers.binance.com/en/docs/products/spot/rest-api) explicitly describes unknown execution after processing timeouts and directs callers to query order status when needed. This supports the failure class behind the synthetic fixture, not an assertion that our exact fixture was observed on Binance.

These papers are related-work context, not independent validation of this implementation. No code from them was reused. Binance CLI is an unmodified external executable under its MIT license; its source and skill references are linked in the integration document. Application dependencies and pinned versions are recorded in package-lock.json. The workbench uses system fonts; no Binance branding or endorsement is implied. References were rechecked on 2026-09-07.
