export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ')
}

export type TuningStandard = '440' | '432' | '415' | '392' | '466';

const TUNING_STANDARD_FREQUENCIES: Record<TuningStandard, number> = {
  '440': 440.0,
  '432': 432.0,
  '415': 415.3,
  '392': 392.0,
  '466': 466.16,
};

// Fonte única de verdade para o A4 (em Hz) de cada padrão de afinação.
export function getTuningStandardFrequency(standard: string): number {
  return TUNING_STANDARD_FREQUENCIES[standard as TuningStandard] ?? 440.0;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_B = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function semitonesFromNoteName(noteName: string): number | null {
  const sharpIndex = NOTE_NAMES.indexOf(noteName);
  if (sharpIndex !== -1) return sharpIndex - NOTE_NAMES.indexOf('A');

  const flatIndex = NOTE_NAMES_B.indexOf(noteName);
  if (flatIndex !== -1) return flatIndex - NOTE_NAMES_B.indexOf('A');

  return null;
}

// Fórmula compartilhada nota <-> frequência (afinação igual temperada, referência A4).
export function semitonesToFrequency(semitones: number, tuningA4: number): number {
  return tuningA4 * Math.pow(2, semitones / 12);
}

export function calculateFrequency(note: string, tuningA4: number): number {
  const noteName = note.replace(/[0-9]/g, '');
  const parsed = parseInt(note.replace(/[^0-9]/g, ''), 10);
  const octave = Number.isNaN(parsed) ? 4 : parsed;

  const semitonesFromA4 = (semitonesFromNoteName(noteName) ?? 0) + (octave - 4) * 12;

  return semitonesToFrequency(semitonesFromA4, tuningA4);
};

export function getNoteFromFrequency(
  freq: number,
  tuningA4: number
): { note: string; octave: number; cents: number } | null {
  if (freq <= 0) return null;

  const semitonesFromA4 = 12 * Math.log2(freq / tuningA4);
  const midiNote = Math.round(semitonesFromA4) + 69;
  const noteIndex = ((midiNote % 12) + 12) % 12;
  const note = NOTE_NAMES[noteIndex];
  const octave = Math.floor(midiNote / 12) - 1;
  const exactFrequency = semitonesToFrequency(midiNote - 69, tuningA4);
  const cents = Math.round(1200 * Math.log2(freq / exactFrequency));

  return { note, octave, cents };
}

export function createAudioContext(): AudioContext {
  const AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) {
    throw new Error('Web Audio API não é suportada neste navegador');
  }

  return new AudioContextCtor();
}
