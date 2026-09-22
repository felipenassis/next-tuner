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

There is no test suite/config in this repo (no jest/vitest/playwright). Don't assume one exists.

## Architecture

### Routing (App Router, route groups)

- `app/(routes)/(cromatico)/page.tsx` — chromatic tuner, served at `/` (the group name is elided from the URL).
- `app/(routes)/corda-a-corda/page.tsx` — string-by-string reference tuner, at `/corda-a-corda`.
- `app/(routes)/treinar/page.tsx` — training hub linking to sub-pages, at `/treinar`.
- `app/(routes)/treinar/afinacao/page.tsx` — "match the frequency by ear" trainer.
- `app/(routes)/treinar/progressao/page.tsx` — chord-progression / harmony-recognition trainer.
- `app/(routes)/preferencias/page.tsx` — settings page (theme, pitch-detection algorithm, tuning standard).
- `app/layout.tsx` renders `TabPanel` (bottom/top nav, active-tab logic keyed off `usePathname`) around every route, and inlines a pre-hydration `<script>` that reads `localStorage.appSettings` to set the `dark` class before paint (avoids a flash of wrong theme). Any change to the settings storage shape must be mirrored here.

### Settings: single source of truth, no context provider

`hooks/useSettings.ts` owns `{ theme, algorithm, tuning }`, persisted to `localStorage` under key `appSettings`. There is **no** React context — every component that needs settings either calls `useSettings()` directly (chromatic tuner) or independently reads/parses `localStorage.getItem('appSettings')` itself (see the duplicated `getTuningFromLocalStorage` helpers in `corda-a-corda/page.tsx` and `treinar/afinacao/page.tsx`, and inline parsing in `treinar/progressao/page.tsx`). When changing the settings shape, grep for `appSettings` and update every reader, not just the hook.

### Pitch detection pipeline

Live pitch detection runs almost entirely off the main thread:

1. `hooks/useFrequencyAnalyzer.ts` requests mic access, creates an `AudioContext`, and loads `public/audio-worklets/pitch-processor.js` as an `AudioWorkletNode` (module path is a literal `/audio-worklets/pitch-processor.js`, served from `public/`, not imported/bundled by Next — edit the worklet file directly).
2. The worklet (`pitch-processor.js`) buffers incoming audio (4096 samples) and runs either the **YIN** or **MPM** algorithm entirely inside `AudioWorkletProcessor.process()`, posting `{ frequency }` back over `port.postMessage`.
3. The hook throttles incoming messages to one update per 200ms (`lastUpdateRef`), converts frequency to note/octave/cents against the selected tuning standard's A4 (440/432/415/392/466 Hz), and exposes `{ frequency, note, cents, octave, isListening, startListening, stopListening, setAlgorithm }`.
4. The active algorithm is pushed into the worklet via `port.postMessage({ algorithm })` — both on worklet creation and whenever `algorithm` changes while listening.

Tone/chord playback (for reference notes and ear training) is separate from analysis and does **not** go through the worklet: `hooks/useTonePlayer.ts` (single note, layered sine/triangle oscillators simulating a piano-ish timbre) and `hooks/useChordPlayer.ts` (multiple simultaneous oscillators) each manage their own `AudioContext` and oscillator/gain node lifecycles directly, and must be explicitly stopped/disconnected (`stopTone`/`stopChord`) before starting new sounds to avoid leaking nodes.

### Note/frequency math

`lib/utils.ts:calculateFrequency(note, tuningA4)` converts a note name like `"E2"` or `"Eb2"` (supports both sharp and flat spellings) into a frequency, given the tuning standard's A4 in Hz. This is the shared conversion used by the reference tuner and chord trainer. `useFrequencyAnalyzer` and `treinar/afinacao/page.tsx` each have their own local, slightly different note<->frequency logic (different note-name arrays, A4-relative math) rather than reusing `calculateFrequency` — this is existing duplication, not a shared module: don't assume changing one updates the others.

### Instrument/chord data

Tuning presets (`INSTRUMENT_TUNINGS` in `corda-a-corda/page.tsx`) and chord/progression definitions (`CHORDS`, `CHORD_PROGRESSIONS` in `treinar/progressao/page.tsx`) are hardcoded local objects in their respective page files, not shared data modules.

### Styling

Tailwind v4 with a custom semantic color token system defined in `app/globals.css` via `@theme` (e.g. `--color-surface`, `--color-primary`, `--color-danger`), redefined under `.dark` for dark mode (toggled by adding/removing the `dark` class on `<html>`, driven by `useSettings`). Prefer the semantic classes (`bg-surface`, `text-foreground-muted`, `border-border-strong`, etc.) already used throughout `components/` and `app/` over raw Tailwind color scales — some older code still uses raw `gray-*`/`slate-*` classes, which is inconsistent with the token system and not the pattern to copy.

### Path alias

`@/*` maps to the repo root (`tsconfig.json`), e.g. `@/components/Slider`, `@/hooks/useSettings`, `@/lib/utils`.
