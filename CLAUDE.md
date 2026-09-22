# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

next-tuner is an instrument tuner (primarily string instruments) built with Next.js as a study/practice project. Besides the chromatic tuner, it includes a per-string reference tuner, ear-training (match a frequency by ear), and chord-progression/harmony training. All UI copy and code comments are in Portuguese (pt-BR).

## Commands

Package manager is **pnpm** (see `pnpm-lock.yaml`).

```bash
pnpm install       # install deps
pnpm dev           # dev server with Turbopack
pnpm build         # production build
pnpm start         # run production build
pnpm lint          # next lint (eslint.config.mjs -> next/core-web-vitals, next/typescript)
```

```bash
pnpm test          # run the Vitest suite once (lib/, hooks/, components/)
pnpm test:watch    # Vitest in watch mode
```

Tests use **Vitest** (`vitest.config.ts`, jsdom environment, setup in `vitest.setup.ts`) + **React Testing Library** for hook/component tests. Colocated as `*.test.ts(x)` next to the source they cover. CI (`.github/workflows/ci.yml`) runs `pnpm lint`, `pnpm test`, and `pnpm build` on push/PR to `main`.

## Architecture

### Routing (App Router, route groups)

- `app/(routes)/(cromatico)/page.tsx` — chromatic tuner, served at `/` (the group name is elided from the URL).
- `app/(routes)/corda-a-corda/page.tsx` — string-by-string reference tuner, at `/corda-a-corda`.
- `app/(routes)/treinar/page.tsx` — training hub linking to sub-pages, at `/treinar`.
- `app/(routes)/treinar/afinacao/page.tsx` — "match the frequency by ear" trainer.
- `app/(routes)/treinar/progressao/page.tsx` — chord-progression / harmony-recognition trainer.
- `app/(routes)/preferencias/page.tsx` — settings page (theme, pitch-detection algorithm, tuning standard).
- `app/layout.tsx` renders `TabPanel` (bottom/top nav, active-tab logic keyed off `usePathname`) around every route, and inlines a pre-hydration `<script>` that reads `localStorage.appSettings` to set the `dark` class before paint (avoids a flash of wrong theme). Any change to the settings storage shape must be mirrored here.

### Settings: single source of truth via React Context

`hooks/useSettings.tsx` exports a `SettingsProvider` (wraps the app in `app/layout.tsx`) plus the `useSettings()` hook, which reads from that context — calling `useSettings()` outside the provider throws. Settings (`{ theme, algorithm, tuning }`) persist to `localStorage` under key `appSettings`; the provider is the only thing that reads/writes it (aside from the pre-hydration `<script>` in `app/layout.tsx`, which unavoidably reads it directly before React mounts, to avoid a flash of the wrong theme). Every page consumes `useSettings()` — none of them read `localStorage` directly anymore.

### Pitch detection pipeline

Live pitch detection runs almost entirely off the main thread:

1. `hooks/useFrequencyAnalyzer.ts` requests mic access, creates an `AudioContext` (via `lib/utils.ts:createAudioContext`), and loads `public/audio-worklets/pitch-processor.js` as an `AudioWorkletNode` (module path is a literal `/audio-worklets/pitch-processor.js`, served from `public/`, not bundled by Next — edit the worklet files directly). On any failure after the mic stream/AudioContext are created, the `catch` block releases both (`track.stop()` / `ctx.close()`) before surfacing a user-facing `error` string from the hook.
2. `pitch-processor.js` buffers incoming audio (4096 samples) and, inside `AudioWorkletProcessor.process()`, calls into `public/audio-worklets/pitch-detection.js` (imported as an ES module — `audioWorklet.addModule()` loads worklet scripts as modules, so relative `import`s between files under `public/audio-worklets/` work) to run either the **YIN** or **MPM** algorithm, posting `{ frequency }` back over `port.postMessage`. The pure algorithm functions live in `pitch-detection.js` specifically so they can be unit-tested (`lib/pitchDetection.test.ts`) without any `AudioWorkletProcessor` mocking.
3. The hook throttles incoming messages to one update per 200ms (`lastUpdateRef`), converts frequency to note/octave/cents via `lib/utils.ts:getNoteFromFrequency` against the selected tuning standard's A4, and exposes `{ frequency, note, cents, octave, error, isListening, startListening, stopListening, setAlgorithm }`.
4. The active algorithm is pushed into the worklet via `port.postMessage({ algorithm })` — both on worklet creation and whenever `algorithm` changes while listening.

Tone/chord playback (for reference notes and ear training) is separate from analysis and does **not** go through the worklet: `hooks/useTonePlayer.ts` (single note, layered sine/triangle oscillators simulating a piano-ish timbre) and `hooks/useChordPlayer.ts` (multiple simultaneous oscillators) both build on the shared `hooks/useAudioNodes.ts`, which owns the `AudioContext` lifecycle and the oscillator/gain node registry (`registerNodes`/`stop`) — each hook only implements its own oscillator/envelope shape and calls `registerNodes(...)` once per sound.

### Note/frequency math

`lib/utils.ts` is the single source of truth for tuning math:
- `getTuningStandardFrequency(standard)` — the A4 reference (Hz) for a tuning standard string; unknown values fall back to 440.
- `calculateFrequency(note, tuningA4)` — note name (e.g. `"E2"`, `"Eb2"`, sharps or flats) → frequency.
- `getNoteFromFrequency(freq, tuningA4)` — the inverse: frequency → `{ note, octave, cents } | null`.
- `semitonesToFrequency(semitones, tuningA4)` — the shared `tuningA4 * 2^(semitones/12)` formula both of the above build on.

`treinar/afinacao/page.tsx` is the one deliberate exception: it uses its own `NOTE_NAMES` array that starts at A instead of C, so its octave numbering is shifted by one relative to standard scientific pitch notation used everywhere else. This is intentional (it's just exercise labeling, not tied to real instrument tuning) — don't "fix" it by swapping in `calculateFrequency`/`getNoteFromFrequency` without checking, since that would silently shift every training frequency by an octave. It does reuse `semitonesToFrequency` for the actual math.

### Instrument/chord data

Tuning presets (`INSTRUMENT_TUNINGS` in `corda-a-corda/page.tsx`) and chord/progression definitions (`CHORDS`, `CHORD_PROGRESSIONS` in `treinar/progressao/page.tsx`) are hardcoded local objects in their respective page files, not shared data modules.

### Styling

Tailwind v4 with a custom semantic color token system defined in `app/globals.css` via `@theme` (e.g. `--color-surface`, `--color-primary`, `--color-danger`), redefined under `.dark` for dark mode (toggled by adding/removing the `dark` class on `<html>`, driven by `useSettings`). Prefer the semantic classes (`bg-surface`, `text-foreground-muted`, `border-border-strong`, etc.) already used throughout `components/` and `app/` over raw Tailwind color scales — some older code still uses raw `gray-*`/`slate-*` classes, which is inconsistent with the token system and not the pattern to copy.

### Path alias

`@/*` maps to the repo root (`tsconfig.json`), e.g. `@/components/Slider`, `@/hooks/useSettings`, `@/lib/utils`.
