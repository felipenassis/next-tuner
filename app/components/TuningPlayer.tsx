'use client'

import React, { useState, useRef, useEffect } from 'react';
import Slider from './Slider';
import { useToneGenerator, Difficulty } from '@/hooks/useToneGenerator';

const PianoTuningTrainer = () => {
  const [sliderValue, setSliderValue] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [score, setScore] = useState(0);
  
  const {
    tuning,
    targetNote,
    sliderRange,
    difficulty,
    setDifficulty,
    initNewChallenge,
    checkAnswer,
    getToleranceForDifficulty
  } = useToneGenerator();
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<any[]>([]);

  // Inicializa AudioContext
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      stopSound();
      audioContextRef.current?.close();
    };
  }, []);

  const stopSound = () => {
    nodesRef.current.forEach(node => {
      if (node.stop) node.stop();
      if (node.disconnect) node.disconnect();
    });
    nodesRef.current = [];
  };

  const playPianoSound = (freq: number, duration: number) => {
    if (!audioContextRef.current) return;
    
    stopSound();
    const now = audioContextRef.current.currentTime;
    
    const mainGain = audioContextRef.current.createGain();
    mainGain.gain.value = 0.7;
    mainGain.connect(audioContextRef.current.destination);

    const osc1 = audioContextRef.current.createOscillator();
    const osc2 = audioContextRef.current.createOscillator();
    const osc3 = audioContextRef.current.createOscillator();
    
    osc1.type = 'sine';
    osc1.frequency.value = freq;
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2;
    osc3.type = 'sine';
    osc3.frequency.value = freq * 4;

    const gain1 = audioContextRef.current.createGain();
    const gain2 = audioContextRef.current.createGain();
    const gain3 = audioContextRef.current.createGain();
    
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.7, now + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.4, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.8);
    
    gain3.gain.setValueAtTime(0, now);
    gain3.gain.linearRampToValueAtTime(0.3, now + 0.03);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.5);

    osc1.connect(gain1).connect(mainGain);
    osc2.connect(gain2).connect(mainGain);
    osc3.connect(gain3).connect(mainGain);
    
    osc1.start();
    osc2.start();
    osc3.start();
    
    osc1.stop(now + duration);
    osc2.stop(now + duration * 0.8);
    osc3.stop(now + duration * 0.5);

    nodesRef.current = [osc1, osc2, osc3, gain1, gain2, gain3, mainGain];
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
        setSliderValue(sliderRange.min + (sliderRange.max - sliderRange.min) * Math.random());
        setIsCorrect(false);
      }, 1500);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4 dark:text-white">Treino de Afinação</h1>
      
      <div className="mb-4 flex justify-between items-center">
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium mb-1 dark:text-gray-300">
            Dificuldade
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="p-2 border rounded dark:bg-gray-700 dark:text-white"
          >
            <option value="easy">Fácil</option>
            <option value="medium">Médio</option>
            <option value="hard">Difícil</option>
          </select>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-bold dark:text-white">Pontos: {score}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Acertos: {successCount}/{attempts} ({attempts > 0 ? Math.round((successCount / attempts) * 100) : 0}%)
          </div>
        </div>
      </div>
      
      <div className="mb-6 p-4 bg-blue-50 dark:bg-gray-700 rounded-lg">
        <p className="text-lg dark:text-white">
          Nota alvo: <span className="font-bold">{targetNote.formattedName}</span>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Afinação: A4 = {tuning}Hz | Frequência: {targetNote.frequency.toFixed(2)}Hz | Margem: ±{getToleranceForDifficulty().toFixed(1)}Hz
        </p>
      </div>
      
      <div className="space-y-6">
        <div className="flex space-x-2">
          <button
            onClick={() => playPianoSound(targetNote.frequency, 2)}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
          >
            Ouvir Nota Alvo (2s)
          </button>
          <button
            onClick={() => playPianoSound(sliderValue, 2)}
            className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
          >
            Ouvir Nota do Slider (2s)
          </button>
        </div>
        
        <Slider
          label="Ajuste a frequência"
          min={sliderRange.min}
          max={sliderRange.max}
          step={0.1}
          value={sliderValue}
          onChange={setSliderValue}
        />
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Sua frequência: {sliderValue.toFixed(2)} Hz
          </span>
          <span className={`text-sm ${
            Math.abs(sliderValue - targetNote.frequency) <= getToleranceForDifficulty()
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            Diferença: {(sliderValue - targetNote.frequency).toFixed(2)} Hz
          </span>
        </div>
        
        <button
          onClick={handleCheckAnswer}
          className={`w-full py-3 rounded-md font-bold text-white ${
            isCorrect 
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-blue-600 hover:bg-blue-700'
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
  );
};

export default PianoTuningTrainer;
