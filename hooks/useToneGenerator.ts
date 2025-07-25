import { useState, useEffect } from 'react';

// Configurações e tipos
export type Difficulty = 'easy' | 'medium' | 'hard';
type NoteFrequencyMap = Record<string, number>;

// Constantes
const DEFAULT_TUNING = 440;
const SEMITONE_RATIO = Math.pow(2, 1/12);
const NOTE_NAMES = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

// Utilitários
const getTuningFromLocalStorage = (): number => {
  try {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return Number(settings.tuning) || DEFAULT_TUNING;
    }
    return DEFAULT_TUNING;
  } catch {
    return DEFAULT_TUNING;
  }
};

const generateNoteFrequencyMap = (tuning: number): NoteFrequencyMap => {
  const notes: string[] = [];
  
  for (let octave = 2; octave <= 5; octave++) {
    const startNote = octave === 2 ? 7 : 0;
    const endNote = octave === 5 ? 7 : 11;
    
    for (let i = startNote; i <= endNote; i++) {
      const noteName = NOTE_NAMES[i];
      if (noteName) notes.push(`${noteName}${octave}`);
    }
  }

  const frequencyMap: NoteFrequencyMap = {};
  notes.forEach(note => {
    const noteName = note.replace(/[0-9]/g, '');
    const octave = parseInt(note.replace(/[^0-9]/g, '')) || 4;
    const noteIndex = NOTE_NAMES.indexOf(noteName);
    const semitonesFromA4 = noteIndex + (octave - 4) * 12;
    frequencyMap[note] = tuning * Math.pow(SEMITONE_RATIO, semitonesFromA4);
  });

  return frequencyMap;
};

const getRandomNote = (noteFrequencies: NoteFrequencyMap): string => {
  const notes = Object.keys(noteFrequencies);
  return notes[Math.floor(Math.random() * notes.length)];
};

const getRangeForDifficulty = (centerFreq: number, difficulty: Difficulty) => {
  const ranges = { 'easy': 0.2, 'medium': 0.15, 'hard': 0.1 };
  const rangePercent = ranges[difficulty];
  return {
    min: centerFreq * (1 - rangePercent),
    max: centerFreq * (1 + rangePercent)
  };
};

const getToleranceForDifficulty = (difficulty: Difficulty): number => {
  const tolerances = { 'easy': 2.0, 'medium': 1.0, 'hard': 0.5 };
  return tolerances[difficulty];
};

// Hook principal
export const useToneGenerator = () => {
  const [tuning, setTuning] = useState(DEFAULT_TUNING);
  const [noteFrequencies, setNoteFrequencies] = useState<NoteFrequencyMap>({});
  const [targetNote, setTargetNote] = useState('');
  const [targetFreq, setTargetFreq] = useState(0);
  const [sliderRange, setSliderRange] = useState({ min: 0, max: 0 });
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  // Inicializa afinação e gera mapa de notas
  useEffect(() => {
    const savedTuning = getTuningFromLocalStorage();
    setTuning(savedTuning);
    setNoteFrequencies(generateNoteFrequencyMap(savedTuning));
  }, []);

  // Gera novo desafio
  const initNewChallenge = () => {
    if (Object.keys(noteFrequencies).length === 0) return;
    
    const note = getRandomNote(noteFrequencies);
    const freq = noteFrequencies[note];
    const range = getRangeForDifficulty(freq, difficulty);
    
    setTargetNote(note);
    setTargetFreq(freq);
    setSliderRange(range);
  };

  // Atualiza desafio quando dificuldade ou afinação muda
  useEffect(() => {
    if (Object.keys(noteFrequencies).length > 0) {
      initNewChallenge();
    }
  }, [difficulty, noteFrequencies]);

  // Calcula se o valor está correto
  const checkAnswer = (sliderValue: number): boolean => {
    const tolerance = getToleranceForDifficulty(difficulty);
    return Math.abs(sliderValue - targetFreq) <= tolerance;
  };

  // Formata nome da nota para exibição
  const formatNoteName = (note: string): string => {
    const noteMap: Record<string, string> = {
      'A': 'Lá', 'A#': 'Lá#', 'B': 'Si', 'C': 'Dó', 'C#': 'Dó#',
      'D': 'Ré', 'D#': 'Ré#', 'E': 'Mi', 'F': 'Fá', 'F#': 'Fá#',
      'G': 'Sol', 'G#': 'Sol#'
    };
    
    const noteName = note.replace(/[0-9]/g, '');
    const octave = note.replace(/[^0-9]/g, '');
    return `${noteMap[noteName] || noteName}${octave}`;
  };

  return {
    tuning,
    targetNote: {
      name: targetNote,
      formattedName: formatNoteName(targetNote),
      frequency: targetFreq
    },
    sliderRange,
    difficulty,
    setDifficulty,
    initNewChallenge,
    checkAnswer,
    getToleranceForDifficulty: () => getToleranceForDifficulty(difficulty)
  };
};
