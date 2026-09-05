# Binance integration evidence

Access date: 2026-09-05. Actual adapter: official Binance CLI 2.1.1, invoked by argument array with `shell: false`. Route: [Binance Skills Hub](https://developers.binance.com/en/docs/sdks-tools/integrations/skills-hub), its [Spot skill and references at commit 257d287](https://github.com/binance/binance-skills-hub/tree/257d287079cfac7d9a173078fc574e8fd7bbf212/skills/binance/binance), then the [official CLI](https://github.com/binance/binance-cli/tree/v2.1.1). No Binance MCP tool was exposed to this Codex session. No OAuth configuration was changed.

`npm run integration:inspect` successfully called `spot ticker-price --symbol BNBUSDT` and `spot exchange-info --symbol BNBUSDT` on `https://testnet.binance.vision`. The recorded response is [binance-read.json](../examples/binance-read.json). These are genuine public testnet reads, not production prices or authenticated account evidence. The app displays the record and its timestamp separately from the synthetic fixture used by the checker.

The downloaded release archive is `binance-cli-x86_64-unknown-linux-gnu.tar.xz`, version 2.1.1. SHA-256 `6b836a24f281abf590988207b0d19d4933971ca66dcf45a9e255cdc237c4deee` matches the official release checksum. Windows binaries were absent from that release. Native Rust compilation was attempted but blocked by missing MinGW OpenSSL development libraries. The verified Linux binary runs under the existing Ubuntu WSL distribution. Nothing was installed globally. The source archive and binary live under ignored `.tools/`.

Discovered command help is saved in [BINANCE_CLI_HELP.txt](BINANCE_CLI_HELP.txt). `ticker-price` supports a symbol argument and returns a decimal price string. `exchange-info` returns symbol status and filter records. `new-order --help` advertises LIMIT, IOC, price, quantity and a caller client ID. Reading help does not establish write conformance, retry behavior, fee completeness or lookup consistency.

| Capability | Observed / supported |
| --- | --- |
| Public quote and symbol filters | Actual CLI calls succeeded |
| Account scope and freshness | Not connected |
| Bounded-price writes | Help advertises fields; execution adapter unavailable |
| Client identifier and lookup | Documented fields; not validated with an account |
| Fee bound and cumulative fill mapping | Not certified |
| Human confirmation | Hosted MCP not connected; never bypassed |
| Internal write retries | Unverified, so no write certification |
| Testnet host | Explicit exact host, tested against malformed alternatives |
| Mainnet / testnet order execution | Both unavailable in this release |

The read wrapper supplies only public commands, an explicit testnet environment, an exact host and empty key/secret values. In inspected official `src/utils.rs`, the presence of both environment keys selects that configuration before profile lookup. The empty values prevent loading stored profiles. No credential values are inherited. The subprocess stdin is explicitly closed: the CLI otherwise waits for JSON input. Custom commands, URLs, profiles and symbol strings containing shell syntax are rejected. No generic order retries exist in Statebound because its real write path throws `UNSUPPORTED`.

## Reproduce the public read

On this Windows environment, unpack the official v2.1.1 Linux archive into `.tools/` and verify its checksum. With the existing `Ubuntu` WSL distribution, run `npm run integration:inspect`. On other systems, set `STATEBOUND_BINANCE_CLI` to the absolute path of a compatible installed executable, then run the same command. The wrapper uses testnet even when no other Binance environment variables are configured. Do not follow an installer that changes global configuration as part of this project.

No further credentials are needed for the demonstrated public read. For a future testnet executor, an operator must supply dedicated Spot testnet credentials through a documented flow, then implement and validate an adapter with bounded fees, reliable correlation, conservative not-found semantics, known submission retry behavior and explicit human approval. Credentials alone do not enable the current disabled adapter.

## Documented behavior versus model assumptions

The [Spot REST overview](https://developers.binance.com/en/docs/products/spot/rest-api) describes unknown execution status after timeouts. The [testnet REST reference](https://developers.binance.com/en/docs/products/spot/testnet/rest-api) documents client order IDs and order lookup; an ID is not a permanent exactly-once guarantee. Statebound uses permanent local tombstones, separately from venue uniqueness rules.

[Filters](https://github.com/binance/binance-spot-api-docs/blob/master/filters.md), [enums](https://github.com/binance/binance-spot-api-docs/blob/master/enums.md) and the [glossary](https://developers.binance.com/en/docs/products/spot/faqs/spot_glossary) informed field names, IOC states and filter validation. The full set of live symbol filters is recorded but not certified by the fixture checker. No mapping from live prices to fixture safety is claimed.

The [hosted MCP documentation](https://developers.binance.com/en/docs/agent-native/mcp-server/agentic) requires user confirmation for non-read actions and scoped Agentic access. A local simulator approval does not replace that host confirmation. No MCP schema or raw error mapping was invented. In particular, decisive absence in our simulator is an explicit local capability, not an assertion about Binance eventual consistency.
