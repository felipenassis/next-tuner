// hooks/useChordPlayer.ts
'use client';

import { useEffect, useRef } from 'react';

export const useChordPlayer = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ oscillators: OscillatorNode[], gains: GainNode[] }>({ oscillators: [], gains: [] });

  // Inicializa o AudioContext
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      stopChord();
      audioContextRef.current?.close();
    };
  }, []);

  const stopChord = () => {
    nodesRef.current.oscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        console.warn("Error stopping oscillator:", e);
      }
    });
    nodesRef.current.gains.forEach(gain => gain.disconnect());
    nodesRef.current = { oscillators: [], gains: [] };
  };

  const playChord = (frequencies: number[], duration: number, volume = 0.5) => {
    if (!audioContextRef.current) return;
    
    stopChord();
    const now = audioContextRef.current.currentTime;
    const mainGain = audioContextRef.current.createGain();
    
    mainGain.gain.value = volume;
    mainGain.connect(audioContextRef.current.destination);

    frequencies.forEach(frequency => {
      const osc = audioContextRef.current!.createOscillator();
      const gain = audioContextRef.current!.createGain();
      
      // Configuração do oscilador
      osc.type = 'sine';
      osc.frequency.value = frequency;
      
      // Envelope do som
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume / frequencies.length, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      // Conexões
      osc.connect(gain).connect(mainGain);
      osc.start(now);
      osc.stop(now + duration);
      
      // Armazenar referências
      nodesRef.current.oscillators.push(osc);
      nodesRef.current.gains.push(gain);
    });

    // Adicionar o gain principal à lista
    nodesRef.current.gains.push(mainGain);
  };

  return { playChord, stopChord };
};
