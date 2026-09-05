# Related work and attribution

Sources accessed 2026-09-05. Statebound does not claim to invent intents, durable recovery, fault injection or counterexample-driven repair.

[CoW Protocol intents](https://docs.cow.fi/cow-protocol/concepts/introduction/intents) describe expressing the outcome a user permits. Statebound's mandate similarly separates user constraints from an agent's proposed workflow. It does not implement CoW settlement or order auctions.

[Temporal's saga pattern](https://docs.temporal.io/design-patterns/saga-pattern) explains compensating actions in workflows. Statebound instead concentrates on reconciling an uncertain external effect before another spend. A filled trade cannot be rolled back atomically by this tool.

[AgentCheck](https://arxiv.org/html/2607.11098) presents an MCP agent reproduce/intervene/mitigate workbench. Statebound also compares a vulnerable baseline and controlled mitigation, but narrows its implementation to exact financial exposure in a discrete IOC workflow.

[TraceFix](https://arxiv.org/html/2605.07935v1) concerns repair of agent coordination protocols from TLA+ counterexamples. Statebound uses a small explicit-state TypeScript checker and constrained candidate validation; it does not invoke TLA+ or inherit any proof from that paper.

These papers are related-work context, not independent validation of this implementation. No code from them was reused. Binance CLI is an unmodified external executable under its MIT license; its source and skill references are linked in the integration document. Application dependencies and pinned versions are recorded in package-lock.json. The workbench uses system fallbacks for optional Google Fonts; no Binance branding or endorsement is implied.
