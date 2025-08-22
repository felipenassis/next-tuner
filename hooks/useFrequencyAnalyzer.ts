import { useState, useEffect, useCallback, useRef } from 'react';

type TuningStandard = '440' | '432' | '415' | '392' | '466';
type PitchAlgorithm = 'YIN' | 'MPM';
type NoteInfo = {
  frequency: number;
  isListening: boolean;
  note: string | null;
  cents: number | null;
  octave: number | null;
  startListening: () => void;
  stopListening: () => void;
  setAlgorithm: (algo: PitchAlgorithm) => void;
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const useFrequencyAnalyzer = (initialTuning: TuningStandard = '440', initialAlgorithm: PitchAlgorithm = 'YIN'): NoteInfo => {
  const [frequency, setFrequency] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [algorithm, setAlgorithm] = useState<PitchAlgorithm>(initialAlgorithm);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const getStandardFrequency = (standard: TuningStandard): number => {
    switch (standard) {
      case '440': return 440.0;
      case '415': return 415.3;
      case '392': return 392.0;
      case '466': return 466.16;
      default: return 440.0;
    }
  };

  const getTuningStandard = (): TuningStandard => {
    const standard = initialTuning as TuningStandard;
    return standard || 'A440';
  };

  const getNoteInfo = (freq: number): { note: string | null; octave: number | null; cents: number | null } => {
    if (freq <= 0) return { note: null, octave: null, cents: null };

    const standard = getTuningStandard();
    const A4 = getStandardFrequency(standard);
    
    const semitonesFromA4 = 12 * Math.log2(freq / A4);
    const midiNote = Math.round(semitonesFromA4) + 69;
    const noteIndex = midiNote % 12;
    const note = NOTE_NAMES[noteIndex];
    const octave = Math.floor(midiNote / 12) - 1;
    const exactFrequency = A4 * Math.pow(2, (midiNote - 69) / 12);
    const cents = Math.round(1200 * Math.log2(freq / exactFrequency));
    
    return { 
      note, 
      octave: octave < 0 ? null : octave,
      cents
    };
  };

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

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Carrega e adiciona o Audio Worklet
      try {
        await ctx.audioWorklet.addModule('/audio-worklets/pitch-processor.js');
      } catch (error) {
        console.error('Error loading Audio Worklet:', error);
        throw new Error('Audio Worklet não pôde ser carregado');
      }

      const analyser = ctx.createAnalyser();
      const microphone = ctx.createMediaStreamSource(stream);
      
      // Cria o Audio Worklet Node
      const workletNode = new AudioWorkletNode(ctx, 'pitch-processor');
      
      // Configura o analisador
      analyser.fftSize = 4096;
      
      // Conecta os nós: microfone -> analisador -> worklet
      microphone.connect(analyser);
      analyser.connect(workletNode);
      
      // Configura o handler de mensagens
      workletNode.port.onmessage = handleWorkletMessage;
      
      // Envia o algoritmo inicial para o worklet
      workletNode.port.postMessage({ algorithm });

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      microphoneRef.current = microphone;
      workletNodeRef.current = workletNode;

      setIsListening(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsListening(false);
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
    analyserRef.current = null;
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

  const noteInfo = getNoteInfo(frequency);

  return {
    frequency,
    isListening,
    note: noteInfo.note,
    cents: noteInfo.cents,
    octave: noteInfo.octave,
    startListening,
    stopListening,
    setAlgorithm: (algo: PitchAlgorithm) => setAlgorithm(algo),
  };
};

export default useFrequencyAnalyzer;
