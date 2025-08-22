export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}

export function calculateFrequency(note: string, tuningA4: number): number {
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const NOTE_NAMES_B = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  
  const noteName = note.replace(/[0-9]/g, '');
  const parsed = parseInt(note.replace(/[^0-9]/g, ''), 10);
  const octave = Number.isNaN(parsed) ? 4 : parsed;

  let noteIndex = NOTE_NAMES.indexOf(noteName);
  let semitonesFromA4;

  if (noteIndex == -1) {
    noteIndex = NOTE_NAMES_B.indexOf(noteName);
    semitonesFromA4 = noteIndex - NOTE_NAMES_B.indexOf('A') + (octave - 4) * 12;
  } else {
    semitonesFromA4 = noteIndex - NOTE_NAMES.indexOf('A') + (octave - 4) * 12;
  }

  return tuningA4 * Math.pow(2, semitonesFromA4 / 12);
};
