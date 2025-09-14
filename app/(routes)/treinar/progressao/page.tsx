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
                    'bg-success text-foreground' : 'bg-error text-foreground') : ''}
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
      <div className="bg-background-muted rounded-lg shadow-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Exercício de Audição Musical</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Dificuldade:</h2>
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`px-4 py-2 rounded-md ${
                  difficulty === level
                    ? 'bg-info text-foreground'
                    : 'bg-background-disabled hover:bg-background-disabled'
                }`}
              >
                {level === 'easy' ? 'Fácil' : level === 'medium' ? 'Médio' : 'Difícil'}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Progressão de Acordes:</h2>
          {currentProgression && (
            <div className="mb-4">
              <p className="mb-2 text-center">
                {difficulty === 'easy' ? 'Ouça os 3 acordes e identifique o último' : 
                 difficulty === 'medium' ? 'Ouça os 4 acordes e identifique os 2 últimos' : 
                 'Ouça os 5 acordes e identifique os 2 últimos'}
              </p>
              
              {renderChordSequence()}
              
              <button
                onClick={playProgression}
                disabled={isPlaying}
                className="bg-success text-foreground px-4 py-2 rounded-md hover:bg-success disabled:bg-background-disabled w-full"
              >
                {isPlaying ? 'Tocando...' : 'Tocar Progressão'}
              </button>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Selecione os acordes que você ouviu:</h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(CHORDS).map((chordName) => (
              <button
                key={chordName}
                onClick={() => handleAnswer(chordName)}
                disabled={showResult || userAnswers.length >= currentProgression?.answerIndices.length || !currentProgression}
                className="bg-background hover:bg-background px-4 py-2 rounded-md disabled:opacity-50"
              >
                {chordName}
              </button>
            ))}
          </div>
        </div>
        
        {showResult && (
          <div className={`p-4 rounded-md mb-4 ${
            isCorrect ? 'bg-success text-foreground' : 'bg-success text-foreground'
          }`}>
            <p className="font-semibold">
              {isCorrect ? '✅ Correto!' : '❌ Incorreto!'}
            </p>
            <p>
              Resposta correta: {currentProgression.answerIndices.map(i => currentProgression.chords[i].name).join(' e ')}
            </p>
            {isCorrect && <p className="mt-2">Pontuação: {score}</p>}
          </div>
        )}
        
        <button
          onClick={startNewGame}
          className="bg-info text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full"
        >
          Novo Exercício
        </button>
      </div>
    </div>
  );
}
