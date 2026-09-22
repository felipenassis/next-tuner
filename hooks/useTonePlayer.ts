import { useAudioNodes } from '@/hooks/useAudioNodes';

export const useTonePlayer = () => {
  const { audioContextRef, stop: stopTone, registerNodes } = useAudioNodes();

  const playTone = (frequency: number, duration: number, volume = 0.7) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    stopTone();
    const now = ctx.currentTime;

    // Configuração do timbre de piano
    const mainGain = ctx.createGain();
    mainGain.gain.value = volume;
    mainGain.connect(ctx.destination);

    // Osciladores para simular piano
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();

    osc1.type = 'sine';
    osc1.frequency.value = frequency;
    osc2.type = 'triangle';
    osc2.frequency.value = frequency * 2;
    osc3.type = 'sine';
    osc3.frequency.value = frequency * 4;

    // Envelope
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const gain3 = ctx.createGain();

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

    registerNodes({
      oscillators: [osc1, osc2, osc3],
      gains: [gain1, gain2, gain3, mainGain]
    });
  };

  return { playTone, stopTone };
};
