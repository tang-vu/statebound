# Statebound submission draft

Statebound finds execution paths that can break an AI trading mandate, validates a structural repair, and replays the checked plan through a constrained executor. Its deliberately vulnerable synthetic fixture shows why a lost order reply must not be treated as a failed purchase.

The core keeps confirmed spend separate from possible exposure. A finite checker produces a counterexample. The development Codex session supplied a typed reconciliation repair that preserves the mandate, and the checker revalidated it. The executor shares the interpreter and persists attempts/reservations in SQLite before effects.

Agent OS integration: the documented Binance Skills Hub route uses official Binance CLI 2.1.1 for actual public testnet quote and exchange-info reads. Captured version, help, responses and capability gaps are included. The demo shows recorded integration data and synthetic order execution separately. No Binance MCP connection, real order execution or continuous-market safety guarantee is claimed.

Repository: https://github.com/tang-vu/statebound

Demo video: [VIDEO_URL_AFTER_REVIEW]

Public app: [OPTIONAL_PREVIEW_URL_AFTER_AUTHORIZATION]

## Entry requirements reviewed

The [official Binance announcement](https://www.binance.com/en/square/post/362885563835358), accessed 2026-09-05, gives the deadline as **2026-09-08 23:59 UTC**, or **2026-09-09 06:59 Vietnam time**. Track A requests an agent built using Agent OS and a video/demo plus GitHub where applicable. Entry steps include following/reposting, a reply or quote repost and the survey. Jurisdiction restrictions apply, including the US, UK, EEA, Hong Kong and Singapore. The operator must personally review current eligibility and the linked survey before submitting.

These materials are prepared for review only. No follow, repost, reply, survey login, survey submission, public deployment or publication was performed. No specific video duration limit was established from that announcement; approximately 90 seconds is a presentation target, not an event rule.

## Draft post

Built Statebound for the Binance Agent OS Mini Hackathon: a workbench for uncertain trading execution. It computes a lost-reply counterexample, checks a reconciliation repair and replays it with persistent budget reservations. Includes genuine official Binance CLI public testnet reads and independently replayable evidence. Synthetic order demo; exchange execution disabled.

Demo: [VIDEO_URL_AFTER_REVIEW]
Code: https://github.com/tang-vu/statebound

## Recording reproduction

Start the app with `npm run dev`. On the build Windows machine, run `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/narrate.ps1`, then `npm run demo:record`. This requires Playwright Chromium, ffmpeg/ffprobe and the installed Microsoft Zira Desktop synthetic voice. Narration uses that standard system voice, with no voice cloning or paid service. The recorder drives actual app actions, then muxes narration at measured scene timestamps and burns timed subtitles. Source/execution labels remain sticky. No model generation delay is edited out: the video explicitly loads a recorded Codex candidate and rechecks it.

The raw recording, narration source, scene timings, captions, evidence and verifier output make the edit inspectable. Playback is sped up uniformly to 1.35x, disclosed throughout the video. No actions or model-generation intervals are spliced out. A brief final-frame hold covers the narration tail. An exported evidence bundle is verified both by the CLI library in the recorder and a separate server worker shown in the app. Run `npx tsx scripts/mux-demo.ts` to regenerate the final MP4 from the existing raw recording and narration without repeating browser actions, and `npx tsx scripts/verify-video.ts` to decode-check the output.
