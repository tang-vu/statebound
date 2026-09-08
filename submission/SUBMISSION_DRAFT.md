# Statebound submission draft

Ready-to-use links, form copy and account steps: [READY_TO_SUBMIT.md](READY_TO_SUBMIT.md). Short post: [POST.txt](POST.txt).

Statebound finds execution paths that can break an AI trading mandate, validates a structural repair, and replays the checked plan through a constrained executor. Its deliberately vulnerable synthetic fixture shows why a lost order reply must not be treated as a failed purchase.

The core keeps confirmed spend separate from possible exposure. A finite checker produces a counterexample. The development Codex session supplied a typed reconciliation repair that preserves the mandate, and the checker revalidated it. The executor shares the interpreter and persists attempts/reservations in SQLite before effects.

Agent OS integration: the documented Binance Skills Hub route uses official Binance CLI 2.1.1 for actual public testnet quote and exchange-info reads. Captured version, help, responses and capability gaps are included. The demo shows recorded integration data and synthetic order execution separately. No Binance MCP connection, real order execution or continuous-market safety guarantee is claimed.

Repository: https://github.com/tang-vu/statebound

Demo video: https://statebound.tangvu.dev/demo.mp4

Public recorded preview: https://statebound.tangvu.dev (recorded artifacts only; run the repository for the interactive workbench)

## Entry requirements reviewed

The [official Binance announcement](https://www.binance.com/en/square/post/362885563835358), accessed 2026-09-05, gives the deadline as **2026-09-08 23:59 UTC**, or **2026-09-09 06:59 Vietnam time**. Track A requests an agent built using Agent OS and a video/demo plus GitHub where applicable. Entry steps include following/reposting, a reply or quote repost and the survey. Jurisdiction restrictions apply, including the US, UK, EEA, Hong Kong and Singapore. The operator must personally review current eligibility and the linked survey before submitting.

The recorded preview was publicly deployed with explicit user authorization on 2026-09-07 and passed public browser/API-boundary checks. These submission materials remain drafts: no follow, repost, reply, survey login or survey submission was performed. No specific video duration limit was established from that announcement; the final duration is an editorial choice, not an event rule.

## Draft post

Built Statebound for the Binance Agent OS Mini Hackathon: a workbench for uncertain trading execution. It computes a lost-reply counterexample, checks a reconciliation repair and replays it with persistent budget reservations. Includes genuine official Binance CLI public testnet reads and independently replayable evidence. Synthetic order demo; exchange execution disabled.

Demo: https://statebound.tangvu.dev
Code: https://github.com/tang-vu/statebound

## Recording reproduction

The current edit uses MiMo V2.5 TTS, preset Dean, at original speed, with each accepted clip checked by MiMo V2.5 ASR. Nine chapters include the Binance-derived workflow and Evidence Lab. See [MiMo narration and review](../docs/MIMO_NARRATION.md) for the exact call structure, credential handling, tail edits, limitations and commands.

The recorder drives actual browser actions, exports evidence and verifies it both locally and through the workbench. Captions and chapter overlays are editorial additions. The raw WebM and scene timings remain available. No fresh AI repair generation is claimed; the recorded Codex candidate is validated and rechecked on screen. Use npm run demo:record to record and render, or npx tsx scripts/mux-mimo.ts to remux accepted audio and existing footage. Full decoding is checked with npx tsx scripts/verify-video.ts.
