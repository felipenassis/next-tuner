import { useState, useEffect, useCallback, useRef } from 'react';
import { createAudioContext, getNoteFromFrequency, getTuningStandardFrequency } from '@/lib/utils';

type TuningStandard = '440' | '432' | '415' | '392' | '466';
type PitchAlgorithm = 'YIN' | 'MPM';
type NoteInfo = {
  frequency: number;
  isListening: boolean;
  note: string | null;
  cents: number | null;
  octave: number | null;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  setAlgorithm: (algo: PitchAlgorithm) => void;
};

const useFrequencyAnalyzer = (initialTuning: TuningStandard = '440', initialAlgorithm: PitchAlgorithm = 'YIN'): NoteInfo => {
  const [frequency, setFrequency] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [algorithm, setAlgorithm] = useState<PitchAlgorithm>(initialAlgorithm);
  const audioContextRef = useRef<AudioContext | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const handleWorkletMessage = useCallback((event: MessageEvent) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 200) return;

    if (event.data.frequency && event.data.frequency > 0) {
      setFrequency(event.data.frequency);
    }
    lastUpdateRef.current = now;
  }, []);

  const startListening = useCallback(async () => {
    if (isListening) return;

    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;

    setError(null);

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      ctx = createAudioContext();

      // Carrega e adiciona o Audio Worklet
      try {
        await ctx.audioWorklet.addModule('/audio-worklets/pitch-processor.js');
      } catch (error) {
        console.error('Error loading Audio Worklet:', error);
        throw new Error('Audio Worklet não pôde ser carregado');
      }

      const microphone = ctx.createMediaStreamSource(stream);

      // Cria o Audio Worklet Node
      const workletNode = new AudioWorkletNode(ctx, 'pitch-processor');

      // Conecta os nós: microfone -> worklet
      microphone.connect(workletNode);

      // Configura o handler de mensagens
      workletNode.port.onmessage = handleWorkletMessage;

      // Envia o algoritmo inicial para o worklet
      workletNode.port.postMessage({ algorithm });

      audioContextRef.current = ctx;
      microphoneRef.current = microphone;
      workletNodeRef.current = workletNode;

      setIsListening(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      // Libera o microfone e fecha o AudioContext caso algo falhe após serem criados
      stream?.getTracks().forEach(track => track.stop());
      if (ctx && ctx.state !== 'closed') {
        await ctx.close();
      }
      setIsListening(false);

      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Permissão de microfone negada. Habilite o acesso ao microfone para usar o afinador.');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('Nenhum microfone foi encontrado.');
      } else {
        setError('Não foi possível acessar o microfone.');
      }
    }
  }, [isListening, algorithm, handleWorkletMessage]);

  const stopListening = useCallback(() => {
    if (!isListening) return;

    if (workletNodeRef.current) {
      workletNodeRef.current.port.onmessage = null;
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    if (microphoneRef.current?.mediaStream) {
      microphoneRef.current.mediaStream.getTracks().forEach(track => track.stop());
    }

    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
    }

    audioContextRef.current = null;
    microphoneRef.current = null;
    setIsListening(false);
    setFrequency(0);
    lastUpdateRef.current = 0;
  }, [isListening]);

  // Atualiza o algoritmo no worklet quando ele mudar
  useEffect(() => {
    if (workletNodeRef.current && isListening) {
      workletNodeRef.current.port.postMessage({ algorithm });
    }
  }, [algorithm, isListening]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const noteInfo = getNoteFromFrequency(frequency, getTuningStandardFrequency(initialTuning));

  return {
    frequency,
    isListening,
    note: noteInfo?.note ?? null,
    cents: noteInfo?.cents ?? null,
    octave: noteInfo && noteInfo.octave >= 0 ? noteInfo.octave : null,
    error,
    startListening,
    stopListening,
    setAlgorithm: (algo: PitchAlgorithm) => setAlgorithm(algo),
  };
};

export default useFrequencyAnalyzer;
