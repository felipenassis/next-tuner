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

const getStandardFrequency = (standard: TuningStandard): number => {
  switch (standard) {
    case '440': return 440.0;
    case '415': return 415.3;
    case '392': return 392.0;
    case '466': return 466.16;
    case '432': return 432.0;
    default: return 440.0;
  }
};

const getNoteInfo = (
  freq: number,
  standard: TuningStandard = '440'
): { note: string | null; octave: number | null; cents: number | null } => {
  if (freq <= 0) return { note: null, octave: null, cents: null };

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

const useFrequencyAnalyzer = (
  initialTuning: TuningStandard = '440',
  initialAlgorithm: PitchAlgorithm = 'YIN'
): NoteInfo => {
  const [frequency, setFrequency] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [algorithm, setAlgorithm] = useState<PitchAlgorithm>(initialAlgorithm);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
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

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

      try {
        await ctx.audioWorklet.addModule('/audio-worklets/pitch-processor.js');
      } catch (error) {
        console.error('Error loading Audio Worklet:', error);
        throw new Error('Audio Worklet não pôde ser carregado');
      }

      const analyser = ctx.createAnalyser();
      const microphone = ctx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(ctx, 'pitch-processor');

      analyser.fftSize = 4096;
      microphone.connect(analyser);
      analyser.connect(workletNode);

      workletNode.port.onmessage = handleWorkletMessage;
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

  const noteInfo = getNoteInfo(frequency, initialTuning);

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

// utilitários de teste
export const __testUtils = { getNoteInfo, NOTE_NAMES };
