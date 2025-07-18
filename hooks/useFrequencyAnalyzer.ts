import { useState, useEffect, useCallback, useRef } from 'react';

type TuningStandard = 'A440' | 'A415' | 'A392' | 'A466';
type NoteInfo = {
  frequency: number;
  isListening: boolean;
  note: string | null;
  cents: number | null;
  octave: number | null;
  startListening: () => void;
  stopListening: () => void;
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const getStandardFrequency = (standard: TuningStandard): number => {
  switch (standard) {
    case 'A440': return 440;
    case 'A415': return 415;
    case 'A392': return 392;
    case 'A466': return 466;
    default: return 440;
  }
};

const useFrequencyAnalyzer = (): NoteInfo => {
  const [frequency, setFrequency] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Obter o padrão de afinação do localStorage
  const getTuningStandard = (): TuningStandard => {
    const standard = localStorage.getItem('tuningStandard') as TuningStandard;
    return standard || 'A440';
  };

  // Calcular a nota musical, oitava e cents de desafinação
  const getNoteInfo = (freq: number): { note: string | null; octave: number | null; cents: number | null } => {
    if (freq === 0) return { note: null, octave: null, cents: null };

    const standard = getTuningStandard();
    const A4 = getStandardFrequency(standard);
    
    const semitones = 12 * Math.log2(freq / A4);
    const roundedSemitones = Math.round(semitones);
    const cents = Math.round((semitones - roundedSemitones) * 100);
    
    const adjustedCents = cents > 50 ? cents - 100 : cents < -50 ? cents + 100 : cents;
    const noteIndex = (roundedSemitones % 12 + 12) % 12;
    const note = NOTE_NAMES[noteIndex];
    const octave = Math.floor(roundedSemitones / 12) + 4;
    
    return { note, octave, cents: adjustedCents };
  };

  const analyzeFrequency = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const now = Date.now();
    if (now - lastUpdateRef.current < 50) {
      animationIdRef.current = requestAnimationFrame(analyzeFrequency);
      return;
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    if (!dataArrayRef.current) {
      dataArrayRef.current = new Uint8Array(bufferLength);
    }

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    // Encontrar a frequência dominante
    let maxIndex = 0;
    let maxValue = 0;
    for (let i = 0; i < bufferLength; i++) {
      if (dataArrayRef.current[i] > maxValue) {
        maxValue = dataArrayRef.current[i];
        maxIndex = i;
      }
    }

    // Calcular a frequência em Hz
    const freq = maxIndex * audioContextRef.current.sampleRate / analyserRef.current.fftSize;
    setFrequency(freq);
    lastUpdateRef.current = now;

    animationIdRef.current = requestAnimationFrame(analyzeFrequency);
  }, []);

  const startListening = useCallback(async () => {
    if (isListening) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyserNode = ctx.createAnalyser();
      const microphoneNode = ctx.createMediaStreamSource(stream);

      microphoneNode.connect(analyserNode);
      analyserNode.fftSize = 2048;

      audioContextRef.current = ctx;
      analyserRef.current = analyserNode;
      microphoneRef.current = microphoneNode;
      setIsListening(true);

      // Iniciar a análise
      animationIdRef.current = requestAnimationFrame(analyzeFrequency);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsListening(false);
    }
  }, [isListening, analyzeFrequency]);

  const stopListening = useCallback(() => {
    if (!isListening) return;

    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
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
  };
};

export default useFrequencyAnalyzer;
