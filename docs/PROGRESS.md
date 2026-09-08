# Development history

This is a chronological summary of implemented work. Reproduction commands and current scope are in [README](../README.md) and the [maintainer guide](HANDOFF.md).

## September 5, 2026 - Core and integration

- Implemented the typed plan language, exact decimal arithmetic, finite-state checker and independent evidence verifier.
- Added a shared simulator interpreter and a SQLite execution ledger with reservations, leases and correlation records.
- Captured a development-session Codex repair and checked its structured output.
- Recorded public Spot testnet quote and symbol-filter responses through official Binance CLI 2.1.1.

## September 7, 2026 - Workbench and public evidence

- Completed the responsive workbench, input validation, connection recovery and experiment history.
- Published the read-only preview with recorded evidence and video; the local operator API remains separate.
- Added content-versioned assets, video chapters, full-size evidence views and the four-case Evidence Lab.
- Verified the 48-scenario-per-variant regression corpus: the repaired variant had zero budget violations, 36 completions and 12 unresolved outcomes.

## September 8, 2026 - Derived model and narration

- Connected the saved Binance price and symbol grids to a separate synthetic model. Rechecked the recorded AI repair and exported independently reproducible evidence.
- Added validation of incompatible or missing market metadata, bringing the core and integration suite to 18 tests.
- Preserved the original snapshot timestamp when local CLI refresh attempts timed out.
- Re-recorded nine demo chapters with MiMo TTS Dean narration and MiMo ASR content checks. Rejected or trimmed unwanted audio tails and recorded the edits.
- Checked full video decoding, final audio loudness, public download equality, browser playback and responsive layout.

The release retains simulated order execution, explicit finite-model assumptions and recorded AI provenance. Detailed outcomes are in the verification artifacts under submission/.
