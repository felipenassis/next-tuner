import { useEffect, useRef } from 'react';

export const useTonePlayer = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ oscillators: OscillatorNode[], gains: GainNode[] }>({ oscillators: [], gains: [] });

  // Inicializa o AudioContext
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      stopTone();
      audioContextRef.current?.close();
    };
  }, []);

  const stopTone = () => {
    nodesRef.current.oscillators.forEach(osc => osc.stop());
    nodesRef.current.gains.forEach(gain => gain.disconnect());
    nodesRef.current = { oscillators: [], gains: [] };
  };

  const playTone = (frequency: number, duration: number, volume = 0.7) => {
    if (!audioContextRef.current) return;
    
    stopTone();
    const now = audioContextRef.current.currentTime;
    
    // Configuração do timbre de piano
    const mainGain = audioContextRef.current.createGain();
    mainGain.gain.value = volume;
    mainGain.connect(audioContextRef.current.destination);

    // Osciladores para simular piano
    const osc1 = audioContextRef.current.createOscillator();
    const osc2 = audioContextRef.current.createOscillator();
    const osc3 = audioContextRef.current.createOscillator();
    
    osc1.type = 'sine';
    osc1.frequency.value = frequency;
    osc2.type = 'triangle';
    osc2.frequency.value = frequency * 2;
    osc3.type = 'sine';
    osc3.frequency.value = frequency * 4;

    // Envelope
    const gain1 = audioContextRef.current.createGain();
    const gain2 = audioContextRef.current.createGain();
    const gain3 = audioContextRef.current.createGain();
    
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.7, now + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.4, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);
    
    gain3.gain.setValueAtTime(0, now);
    gain3.gain.linearRampToValueAtTime(0.3, now + 0.03);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.5);

    // Conexões
    osc1.connect(gain1).connect(mainGain);
    osc2.connect(gain2).connect(mainGain);
    osc3.connect(gain3).connect(mainGain);
    
    osc1.start();
    osc2.start();
    osc3.start();
    
    osc1.stop(now + duration);
    osc2.stop(now + duration * 0.8);
    osc3.stop(now + duration * 0.5);

    nodesRef.current = {
      oscillators: [osc1, osc2, osc3],
      gains: [gain1, gain2, gain3, mainGain]
    };
  };

  return { playTone, stopTone };
};
