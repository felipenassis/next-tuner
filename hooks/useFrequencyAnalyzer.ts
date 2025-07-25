import { useState, useEffect, useCallback, useRef } from 'react';

type TuningStandard = 'A440' | 'A415' | 'A392' | 'A466';
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

const useFrequencyAnalyzer = (initialAlgorithm: PitchAlgorithm = 'YIN'): NoteInfo => {
  const [frequency, setFrequency] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [algorithm, setAlgorithm] = useState<PitchAlgorithm>(initialAlgorithm);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const dataArrayRef = useRef<Float32Array | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const getStandardFrequency = (standard: TuningStandard): number => {
    switch (standard) {
      case 'A440': return 440.0;  // Padrão internacional moderno
      case 'A415': return 415.3;  // Afinação barroca
      case 'A392': return 392.0;  // Afinação para música antiga
      case 'A466': return 466.16; // Afinação para música renascentista
      default: return 440.0;      // Padrão fallback
    }
  };

  // Obter o padrão de afinação do localStorage
  const getTuningStandard = (): TuningStandard => {
    const standard = localStorage.getItem('tuningStandard') as TuningStandard;
    return standard || 'A440';
  };

  // Implementação do algoritmo YIN
  const detectPitchYIN = (buffer: Float32Array, sampleRate: number): number => {
    const yinThreshold = 0.1;
    const bufferSize = buffer.length;
    const yinBuffer = new Array(bufferSize / 2).fill(0);

    // Passo 1: Autocorrelação
    for (let tau = 0; tau < yinBuffer.length; tau++) {
      for (let i = 0; i < yinBuffer.length; i++) {
        const delta = buffer[i] - buffer[i + tau];
        yinBuffer[tau] += delta * delta;
      }
    }

    // Passo 2: Normalização cumulativa
    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < yinBuffer.length; tau++) {
      runningSum += yinBuffer[tau];
      yinBuffer[tau] *= tau / runningSum;
    }

    // Passo 3: Limiar absoluto
    let tau = 2;
    while (tau < yinBuffer.length) {
      if (yinBuffer[tau] < yinThreshold) {
        while (tau + 1 < yinBuffer.length && yinBuffer[tau + 1] < yinBuffer[tau]) {
          tau++;
        }
        break;
      }
      tau++;
    }

    // Se não encontrou, retorna 0
    if (tau === yinBuffer.length || yinBuffer[tau] >= yinThreshold) {
      return 0;
    }

    // Interpolação quadrática para maior precisão
    const betterTau = tau;
    if (betterTau > 0 && betterTau < yinBuffer.length - 1) {
      const s0 = yinBuffer[betterTau - 1];
      const s1 = yinBuffer[betterTau];
      const s2 = yinBuffer[betterTau + 1];
      const adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));
      return sampleRate / (betterTau + adjustment);
    }

    return sampleRate / betterTau;
  };

  // Implementação do algoritmo MPM (McLeod Pitch Method)
  const detectPitchMPM = (buffer: Float32Array, sampleRate: number): number => {
    const NSDF = new Array(buffer.length).fill(0);
    const maxShift = buffer.length;

    // 1. Calcula a NSDF (Normalized Square Difference Function)
    for (let tau = 0; tau < maxShift; tau++) {
      let acf = 0;
      let divisorM = 0;
      for (let i = 0; i < maxShift - tau; i++) {
        acf += buffer[i] * buffer[i + tau];
        divisorM += buffer[i] * buffer[i] + buffer[i + tau] * buffer[i + tau];
      }
      NSDF[tau] = 2 * acf / divisorM;
    }

    // 2. Encontra picos positivos
    const peakPositions = [];
    for (let i = 1; i < NSDF.length - 1; i++) {
      if (NSDF[i] > 0 && NSDF[i] > NSDF[i - 1] && NSDF[i] > NSDF[i + 1]) {
        peakPositions.push(i);
      }
    }

    if (peakPositions.length === 0) return 0;

    // 3. Encontra o pico mais alto com o maior tau (para evitar octava superior)
    let highestPeakPos = peakPositions[0];
    let highestPeakValue = NSDF[highestPeakPos];
    
    for (const pos of peakPositions) {
      if (NSDF[pos] > highestPeakValue) {
        highestPeakValue = NSDF[pos];
        highestPeakPos = pos;
      }
    }

    // 4. Interpolação parabólica para precisão
    const betterTau = highestPeakPos;
    if (betterTau > 0 && betterTau < NSDF.length - 1) {
      const s0 = NSDF[betterTau - 1];
      const s1 = NSDF[betterTau];
      const s2 = NSDF[betterTau + 1];
      const adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));
      return sampleRate / (betterTau + adjustment);
    }

    return sampleRate / betterTau;
  };

  // Seleciona o algoritmo de detecção
  const detectPitch = (buffer: Float32Array, sampleRate: number): number => {
    switch (algorithm) {
      case 'YIN':
        return detectPitchYIN(buffer, sampleRate);
      case 'MPM':
        return detectPitchMPM(buffer, sampleRate);
      default:
        return detectPitchYIN(buffer, sampleRate);
    }
  };

  // Calcular a nota musical, oitava e cents de desafinação
  const getNoteInfo = (freq: number): { note: string | null; octave: number | null; cents: number | null } => {
    if (freq <= 0) return { note: null, octave: null, cents: null };

    const standard = getTuningStandard();
    const A4 = getStandardFrequency(standard);
    
    // Calcula o número de semitons de diferença em relação ao A4
    const semitonesFromA4 = 12 * Math.log2(frequency / A4);

    // Nota MIDI mais próxima
    const midiNote = Math.round(semitonesFromA4) + 69;

    // Nome da nota
    const noteIndex = midiNote % 12;
    const note = NOTE_NAMES[noteIndex];

    // Oitava
    const octave = Math.floor(midiNote / 12) - 1;

    // Calcula a frequência exata da nota mais próxima
    const exactFrequency = A4 * Math.pow(2, (midiNote - 69) / 12);

    // Cálculo dos cents de desvio
    const cents = Math.round(1200 * Math.log2(frequency / exactFrequency));
    
    return { 
      note, 
      octave: octave < 0 ? null : octave, // Evita oitavas negativas
      cents
    };
  };

  const processAudio = useCallback((buffer: Float32Array) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 200) return; // Throttle para 200ms
    
    const freq = detectPitch(buffer, audioContextRef.current?.sampleRate || 44100);
    if (freq > 0) {
      setFrequency(freq);
    }
    lastUpdateRef.current = now;
  }, [algorithm]);

  const startListening = useCallback(async () => {
    if (isListening) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      const microphone = ctx.createMediaStreamSource(stream);
      const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);

      analyser.fftSize = 2048;
      microphone.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      microphoneRef.current = microphone;
      scriptProcessorRef.current = scriptProcessor;
      dataArrayRef.current = new Float32Array(analyser.fftSize);

      scriptProcessor.onaudioprocess = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;
        analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);
        processAudio(dataArrayRef.current);
      };

      setIsListening(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsListening(false);
    }
  }, [isListening, processAudio]);

  const stopListening = useCallback(() => {
    if (!isListening) return;

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current.onaudioprocess = null;
      scriptProcessorRef.current = null;
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
    dataArrayRef.current = null;
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
    setAlgorithm: (algo: PitchAlgorithm) => setAlgorithm(algo),
  };
};

export default useFrequencyAnalyzer;
