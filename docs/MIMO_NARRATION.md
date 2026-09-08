# MiMo narration and review

The demo uses **mimo-v2.5-tts**, preset **Dean**, at its original speed. **mimo-v2.5-asr** transcribes each accepted audio clip for comparison with the script. Narration was produced during development with interactive agent tools; it is separate from the trading-workflow application. No person's voice is cloned.

Sources checked September 8, 2026: [Xiaomi's official TTS skill](https://github.com/XiaomiMiMo/MiMo-Skills/tree/main/skills/mimo-v2-5-tts), [speech synthesis guide](https://mimo.mi.com/docs/en-US/quick-start/usage-guide/audio/speech-synthesis-v2.5), [ASR guide](https://mimo.mi.com/docs/en-US/quick-start/usage-guide/audio/Speech-Recognition).

## What was checked

- Nine scene scripts in `submission/scenes.json`; the model receives narration as assistant content, with voice direction in user content.
- Each accepted WAV is retranscribed. `submission/voice-validation.json` preserves transcripts, differences, pace, hashes and tail edits. ASR sometimes adds formatting markers or changes punctuation. It is a content check, not proof of subjective voice quality or a human listening test.
- Initial takes with extra trailing transcript content were rejected. Two accepted takes were cut after their complete scripts at measured pauses, then sent to ASR again. The final transcript contains the intended content without the unwanted tail.
- Captions are timed proportionally within measured scenes, not from word-level ASR timestamps. The video records actual browser actions including the Binance-derived workflow and public Evidence Lab. The middle of long unvoiced waits is removed while preserving the click and result; `submission/edit-decisions.json` records those cuts and the on-screen overlay discloses them.
- Narration is mixed at original speed and normalized toward -16 LUFS with a -1.5 dBTP ceiling. Full decoding, visual inspection and final loudness measurement are separate release checks.

## Reproduce on the recording machine

Use an authorized MiMo credential in the current process's `MIMO_API_KEY` environment variable. `node scripts/mimo-voice.mjs tts intro` generates one requested scene; `node scripts/mimo-voice.mjs asr intro` transcribes it. Repeat only for scenes being reviewed. The Windows helper `scripts/mimo-voice.ps1` reads a locally DPAPI-protected credential from ignored `.runtime/mimo/credential.dpapi`; neither the secret nor that file belongs in Git or public assets.

Accepted audio belongs at `.runtime/mimo/<scene-id>.wav`. Preserve the approved tail edits and transcript files when reproducing this exact edit; new TTS calls are nondeterministic and need fresh review. With the local workbench on 4381 and preview on 4382, run:

```sh
node scripts/voice-verify.mjs
npm run demo:record
npx tsx scripts/verify-video.ts
```

`scripts/record-demo.ts` runs the browser workflow and calls `scripts/mux-mimo.ts`. To remux an existing raw recording and its measured timings without rerunning actions, run `npx tsx scripts/mux-mimo.ts`. Retained `scripts/narrate.ps1` and `scripts/mux-demo.ts` belong to the older Windows-voice edit, not this release.
