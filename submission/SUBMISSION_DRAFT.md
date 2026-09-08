# Demo materials and reproduction

The [project overview](READY_TO_SUBMIT.md) describes Statebound's mechanism, Binance integration and verification scope. The [walkthrough](JUDGE_GUIDE.md) provides a short path through the public demo.

- Public demo: https://statebound.tangvu.dev
- Video: https://statebound.tangvu.dev/demo.mp4
- Source: https://github.com/tang-vu/statebound
- Public post: https://x.com/tangvu_dev/status/2097251859597795543

## Recording

The current video uses MiMo V2.5 TTS, preset Dean, at original speed. Each accepted clip is checked with MiMo V2.5 ASR. Nine chapters include the Binance-derived workflow and Evidence Lab. [Narration documentation](../docs/MIMO_NARRATION.md) records the call structure, audio edits, validation scope and reproduction commands.

The recorder drives actual browser actions, exports evidence and verifies it through both the local library and the workbench. Captions and chapter labels are editorial overlays. Long silent waits are shortened; submission/edit-decisions.json maps the cuts to the preserved raw recording. The recorded Codex candidate is loaded and rechecked on screen, without claiming a fresh generation call.

Use npm run demo:record to record and render. With approved audio and existing footage, npx tsx scripts/mux-mimo.ts regenerates the edit. Use npx tsx scripts/verify-video.ts for full decoding checks.
