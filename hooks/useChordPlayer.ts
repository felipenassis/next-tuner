// hooks/useChordPlayer.ts
'use client';

import { useAudioNodes } from '@/hooks/useAudioNodes';

export const useChordPlayer = () => {
  const { audioContextRef, stop: stopChord, registerNodes } = useAudioNodes();

  const playChord = (frequencies: number[], duration: number, volume = 0.5) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    stopChord();
    const now = ctx.currentTime;
    const mainGain = ctx.createGain();

    mainGain.gain.value = volume;
    mainGain.connect(ctx.destination);

    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [mainGain];

    frequencies.forEach(frequency => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

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

      oscillators.push(osc);
      gains.push(gain);
    });

    registerNodes({ oscillators, gains });
  };

  return { playChord, stopChord };
};
