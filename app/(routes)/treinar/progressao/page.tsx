// pages/chord-ear-training.tsx
'use client';

import { useState, useEffect } from 'react';
import { useChordPlayer } from '@/hooks/useChordPlayer';
import { calculateFrequency } from '@/lib/utils';
import useSettings from '@/hooks/useSettings';

type Difficulty = 'easy' | 'medium' | 'hard';

type Chord = {
  name: string;
  notes: string[];
};

type ChordProgression = {
  chords: Chord[];
  answerIndices: number[];
  revealedIndices: number[];
};

const CHORDS: Record<string, { name: string; notes: string[] }> = {
  C: { name: "C", notes: ["C3", "E3", "G3", "C4", "E4"] },
  G: { name: "G", notes: ["G2", "B2", "D3", "G3", "D4", "G4"] },
  Am: { name: "Am", notes: ["A2", "E3", "A3", "C4", "E4"] },
  F: { name: "F", notes: ["F2", "C3", "F3", "A3", "C4", "F4"] },
  Dm: { name: "Dm", notes: ["D3", "A3", "D4", "F4"] },
  Em: { name: "Em", notes: ["E2", "B2", "E3", "G3", "B3", "E4"] },
};

const CHORD_PROGRESSIONS: Record<Difficulty, Chord[][]> = {
  easy: [
    [CHORDS.C, CHORDS.G, CHORDS.Am],
    [CHORDS.C, CHORDS.F, CHORDS.G],
    [CHORDS.Am, CHORDS.F, CHORDS.C],
  ],
  medium: [
    [CHORDS.C, CHORDS.G, CHORDS.Am, CHORDS.F],
    [CHORDS.Am, CHORDS.F, CHORDS.C, CHORDS.G],
    [CHORDS.C, CHORDS.F, CHORDS.G, CHORDS.Am],
  ],
  hard: [
    [CHORDS.C, CHORDS.G, CHORDS.Am, CHORDS.F, CHORDS.Dm],
    [CHORDS.Am, CHORDS.F, CHORDS.C, CHORDS.G, CHORDS.Em],
    [CHORDS.C, CHORDS.F, CHORDS.G, CHORDS.Am, CHORDS.Dm],
  ],
};

const getRandomProgression = (difficulty: Difficulty): ChordProgression => {
  const progressions = CHORD_PROGRESSIONS[difficulty];
  const randomIndex = Math.floor(Math.random() * progressions.length);
  const chords = progressions[randomIndex];
  
  if (difficulty === 'easy') {
    return {
      chords,
      answerIndices: [2], // Último acorde
      revealedIndices: [0, 1] // Primeiro e segundo acordes
    };
  } else if (difficulty === 'medium') {
    return {
      chords,
      answerIndices: [2, 3], // Terceiro e quarto acordes
      revealedIndices: [0, 1] // Primeiro e segundo acordes
    };
  } else {
    return {
      chords,
      answerIndices: [3, 4], // Quarto e quinto acordes
      revealedIndices: [0, 1, 2] // Primeiro, segundo e terceiro acordes
    };
  }
};

export default function ChordEarTraining() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [currentProgression, setCurrentProgression] = useState<ChordProgression | null>(null);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const { settings } = useSettings();
  
  const { playChord, stopChord } = useChordPlayer();

  const startNewGame = () => {
    setCurrentProgression(getRandomProgression(difficulty));
    setUserAnswers([]);
    setShowResult(false);
    setIsCorrect(false);
  };

  useEffect(() => {
    startNewGame();
  }, [difficulty]);

  const playProgression = async () => {
    if (!currentProgression) return;
    
    setIsPlaying(true);
    stopChord();
    
    for (let i = 0; i < currentProgression.chords.length; i++) {
      const chord = currentProgression.chords[i];
      const frequencies = chord.notes.map(note => calculateFrequency(note, parseInt(settings.tuning)))
      playChord(frequencies, 1.5, 0.6);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    setIsPlaying(false);
  };

  const handleAnswer = (chordName: string) => {
    if (!currentProgression || showResult) return;
    
    const newAnswers = [...userAnswers, chordName];
    setUserAnswers(newAnswers);
    
    if (newAnswers.length === currentProgression.answerIndices.length) {
      const isAllCorrect = currentProgression.answerIndices.every((index, i) => {
        return currentProgression.chords[index].name === newAnswers[i];
      });
      
      setIsCorrect(isAllCorrect);
      setShowResult(true);
      if (isAllCorrect) {
        setScore(prev => prev + 1);
      }
    }
  };

  const renderChordSequence = () => {
    if (!currentProgression) return null;

    return (
      <div className="flex justify-center gap-2 mb-4">
        {currentProgression.chords.map((chord, index) => {
          const isRevealed = currentProgression.revealedIndices.includes(index);
          const isAnswer = currentProgression.answerIndices.includes(index);
          const userAnswerIndex = currentProgression.answerIndices.indexOf(index);
          const userAnswer = userAnswers[userAnswerIndex];

          return (
            <div 
              key={index}
              className={`w-12 h-12 rounded-md flex items-center justify-center text-lg font-bold
                ${isRevealed ? 'bg-info text-foreground' : ''}
                ${isAnswer && !showResult ? 'bg-background-disabled hover:bg-background-disabled' : ''}
                ${isAnswer && showResult ? 
                  (currentProgression.chords[index].name === userAnswer ? 
                    'bg-success text-foreground' : 'bg-danger text-foreground') : ''}
              `}
            >
              {isRevealed ? chord.name : 
               isAnswer && userAnswer ? userAnswer : 
               isAnswer ? '?' : ''}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-surface rounded-lg shadow-lg p-6 w-full max-w-md flex flex-col gap-8">
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
        
        <div>
          {currentProgression && (
            <div>
              <p className="font-semibold mb-2">
                {difficulty === 'easy' ? '1. Ouça os 3 acordes e identifique o último:' : 
                 difficulty === 'medium' ? '1. Ouça os 4 acordes e identifique os 2 últimos:' : 
                 '1. Ouça os 5 acordes e identifique os 2 últimos:'}
              </p>
              
              {renderChordSequence()}
              
              <button
                onClick={playProgression}
                disabled={isPlaying}
                className="bg-accent text-foreground px-4 py-2 rounded-md hover:cursor-pointer disabled:bg-disabled w-full"
              >
                {isPlaying ? 'Tocando...' : 'Tocar Progressão'}
              </button>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="font-semibold mb-2">2. Selecione os acordes que você ouviu:</h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(CHORDS).map((chordName) => (
              <button
                key={chordName}
                onClick={() => handleAnswer(chordName)}
                disabled={showResult || userAnswers.length >= currentProgression?.answerIndices.length || !currentProgression}
                className="bg-surface-muted hover:cursor-pointer px-4 py-2 rounded-md disabled:bg-disabled"
              >
                {chordName}
              </button>
            ))}
          </div>
        </div>
        
        {showResult && (
          <div className={`p-4 rounded-md mb-4 text-foreground ${
            isCorrect ? 'bg-success' : 'bg-danger'
          }`}>
            <p className="font-semibold">
              {isCorrect ? 'Correto!' : 'Incorreto!'}
            </p>
            <p>
              Resposta correta: {currentProgression.answerIndices.map(i => currentProgression.chords[i].name).join(' e ')}
            </p>
            {isCorrect && <p className="mt-2">Pontuação: {score}</p>}
          </div>
        )}
        
        <button
          onClick={startNewGame}
          className="bg-primary text-foreground px-4 py-2 rounded-md hover:cursor-pointer w-full"
        >
          Novo Exercício
        </button>
      </div>
    </div>
  );
}
