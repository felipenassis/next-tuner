import { useEffect, useRef, useCallback } from 'react';
import { createAudioContext } from '@/lib/utils';

type NodeRegistry = { oscillators: OscillatorNode[]; gains: GainNode[] };

// Ciclo de vida compartilhado por useTonePlayer/useChordPlayer: cria o
// AudioContext no mount, fecha no unmount, e para/desconecta os nós de
// osciladores e ganhos em reprodução antes de cada novo som.
export function useAudioNodes() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<NodeRegistry>({ oscillators: [], gains: [] });

  const stop = useCallback(() => {
    nodesRef.current.oscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        console.warn('Error stopping oscillator:', e);
      }
    });
    nodesRef.current.gains.forEach(gain => gain.disconnect());
    nodesRef.current = { oscillators: [], gains: [] };
  }, []);

  useEffect(() => {
    audioContextRef.current = createAudioContext();
    return () => {
      stop();
      audioContextRef.current?.close();
    };
  }, [stop]);

  const registerNodes = useCallback((nodes: NodeRegistry) => {
    nodesRef.current = nodes;
  }, []);

  return { audioContextRef, stop, registerNodes };
}
