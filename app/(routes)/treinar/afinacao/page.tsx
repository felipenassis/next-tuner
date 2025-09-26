'use client'

import React, { useState, useEffect } from 'react';
import Slider from '@/components/Slider';
import { useTonePlayer } from '@/hooks/useTonePlayer';

// Tipos e constantes
type Difficulty = 'easy' | 'medium' | 'hard';
type NoteFrequencyMap = Record<string, number>;
type NoteInfo = {
  name: string;
  formattedName: string;
  frequency: number;
};

const DEFAULT_TUNING = 440;
const SEMITONE_RATIO = Math.pow(2, 1/12);
const NOTE_NAMES = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

const Treinar = () => {
  // Estados
  const [sliderValue, setSliderValue] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [score, setScore] = useState(0);
  const [noteFrequencies, setNoteFrequencies] = useState<NoteFrequencyMap>({});
  const [targetNote, setTargetNote] = useState<NoteInfo>({ name: '', formattedName: '', frequency: 0 });
  const [sliderRange, setSliderRange] = useState({ min: 0, max: 0 });
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const { playTone } = useTonePlayer();

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

  // Ajustado para faixas mais amplas (mais fácil)
  const getRangeForDifficulty = (centerFreq: number, difficulty: Difficulty) => {
    const ranges = { 
      'easy': 0.2,    // 30% de variação (antes era 20%)
      'medium': 0.15,   // 20% de variação (antes era 15%)
      'hard': 0.10     // 15% de variação (antes era 10%)
    };
    const rangePercent = ranges[difficulty];
    return {
      min: centerFreq * (1 - rangePercent),
      max: centerFreq * (1 + rangePercent)
    };
  };

  // Ajustado para tolerâncias maiores (mais fácil)
  const getToleranceForDifficulty = (): number => {
    const tolerances = { 
      'easy': 4.0,    // ±3.0 Hz (antes era ±2.0 Hz)
      'medium': 2.0,  // ±1.5 Hz (antes era ±1.0 Hz)
      'hard': 1     // ±0.8 Hz (antes era ±0.5 Hz)
    };
    return tolerances[difficulty];
  };

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

  // Inicializa afinação e gera mapa de notas
  useEffect(() => {
    const savedTuning = getTuningFromLocalStorage();
    setNoteFrequencies(generateNoteFrequencyMap(savedTuning));
  }, []);

  // Gera novo desafio
  const initNewChallenge = () => {
    if (Object.keys(noteFrequencies).length === 0) return;
    
    const note = getRandomNote(noteFrequencies);
    const freq = noteFrequencies[note];
    const range = getRangeForDifficulty(freq, difficulty);
    
    setTargetNote({
      name: note,
      formattedName: formatNoteName(note),
      frequency: freq
    });
    setSliderRange(range);
    // Define um valor inicial aleatório dentro da faixa
    setSliderValue(range.min + (range.max - range.min) * Math.random());
  };

  // Atualiza desafio quando dificuldade ou afinação muda
  useEffect(() => {
    if (Object.keys(noteFrequencies).length > 0) {
      initNewChallenge();
    }
  }, [difficulty, noteFrequencies]);

  // Calcula se o valor está correto
  const checkAnswer = (sliderValue: number): boolean => {
    return Math.abs(sliderValue - targetNote.frequency) <= getToleranceForDifficulty();
  };

  const handleCheckAnswer = () => {
    const isAnswerCorrect = checkAnswer(sliderValue);
    setIsCorrect(isAnswerCorrect);
    setAttempts(attempts + 1);
    
    if (isAnswerCorrect) {
      const basePoints = {
        'easy': 10,
        'medium': 20,
        'hard': 30
      }[difficulty];
      
      const difference = Math.abs(sliderValue - targetNote.frequency);
      const tolerance = getToleranceForDifficulty();
      const precisionBonus = Math.round((1 - (difference / tolerance)) * basePoints * 0.5);
      
      setScore(score + basePoints + precisionBonus);
      setSuccessCount(successCount + 1);
      
      setTimeout(() => {
        initNewChallenge();
        setIsCorrect(false);
      }, 1500);
    }
  };

  return (
    <div className="flex flex-row flex-grow justify-center items-center">
      <div className="p-6 bg-surface rounded-lg shadow-lg min-w-md mx-auto flex flex-col gap-8">
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium mb-1 text-muted-foreground">
            Dificuldade
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="w-full px-3 py-2 border border-border-strong rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-surface-muted text-foreground"
          >
            <option value="easy">Fácil</option>
            <option value="medium">Médio</option>
            <option value="hard">Difícil</option>
          </select>
        </div>
        
        <div className="p-4 bg-surface-muted rounded-lg">
          <p className="text-lg text-muted-foreground">
            Nota alvo: <span className="font-bold">{targetNote.formattedName}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Frequência: {targetNote.frequency.toFixed(2)}Hz | Margem: ±{getToleranceForDifficulty().toFixed(1)}Hz
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="flex space-x-2">
            <button
              onClick={() => playTone(targetNote.frequency, 2)}
              className="flex-1 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded"
            >
              Ouvir Nota Alvo
            </button>
            <button
              onClick={() => playTone(sliderValue, 2)}
              className="flex-1 py-2 bg-accent hover:bg-accent-hover text-accent-foreground rounded"
            >
              Ouvir Nota do Slider
            </button>
          </div>
          
          <Slider
            label="Ajuste a frequência"
            min={sliderRange.min}
            max={sliderRange.max}
            step={0.1}
            value={sliderValue}
            hideValue
            onChange={setSliderValue}
          />
          
          <div className="flex justify-between items-center hidden">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Sua frequência: {sliderValue.toFixed(2)} Hz
            </span>
            <span className={`text-sm ${
              Math.abs(sliderValue - targetNote.frequency) <= getToleranceForDifficulty()
                ? 'text-success'
                : 'text-danger'
            }`}>
              Diferença: {(sliderValue - targetNote.frequency).toFixed(2)} Hz
            </span>
          </div>
          
          <button
            onClick={handleCheckAnswer}
            className={`w-full py-3 rounded-md font-bold text-white ${
              isCorrect 
                ? 'bg-success'
                : 'bg-primary'
            }`}
          >
            {isCorrect ? '✓ Correto! Próximo desafio...' : 'Verificar Resposta'}
          </button>
          
          {isCorrect && (
            <div className="p-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-center">
              Parabéns! Você acertou a frequência.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Treinar;
