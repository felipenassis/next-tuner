'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type TuningPreset = {
  name: string
  frequency: number
}

type FrequencyAnalyzerResult = {
  frequency: number | null,
  isListening: boolean,
  note: string | null,
  cents: number | null,
  octave: number | null,
  startListening: () => void,
  stopListening: () => void
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export default function useFrequencyAnalyzer(): FrequencyAnalyzerResult {
  const [frequency, setFrequency] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [cents, setCents] = useState<number | null>(null);
  const [octave, setOctave] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);

  const getNoteFromFrequency = (frequency: number, tuning = 440) => {
    if (typeof frequency !== 'number' || frequency <= 0) {
      throw new Error("Frequência inválida.");
    }

    // Calcula a distância em semitons a partir do A4 (nota MIDI 69)
    const semitonesFromA4 = 12 * Math.log2(frequency / tuning);
    const roundedSemitones = Math.round(semitonesFromA4);

    // Calcula o número MIDI (A4 = 69)
    const midiNoteNumber = 69 + roundedSemitones;
    
    // Determina a nota e oitava
    const noteIndex = (midiNoteNumber % 12 + 12) % 12; // Garante valor positivo
    const octave = Math.floor(midiNoteNumber / 12) - 1; // Ajuste para oitava correta
    const noteName = NOTE_NAMES[noteIndex];

    // Calcula a frequência exata da nota temperada mais próxima
    const exactFrequency = tuning * Math.pow(2, roundedSemitones / 12);

    // Calcula a diferença em cents (100 cents = 1 semitom)
    const cents = 1200 * Math.log2(frequency / exactFrequency);

    return {
      note: noteName,
      cents: Math.round(cents), // Arredonda para 1 casa decimal
      octave,
      frequency, // Frequência original para referência
      exactFrequency, // Frequência temperada mais próxima
      midiNote: midiNoteNumber // Número MIDI para referência
    };
  }

  useEffect(() => {
    if (!isListening) {
      setFrequency(null);
      return;
    }

    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let microphone: MediaStreamAudioSourceNode;
    let scriptProcessor: ScriptProcessorNode;
    let animationFrameId: number | null = null;

    const detectPitchYIN = (buffer: Float32Array, sampleRate: number) => {
      const YIN_THRESHOLD = 0.1;
      const bufferSize = buffer.length;
      const result = new Float32Array(bufferSize / 2);

      // Step 1: Difference function
      for (let tau = 0; tau < bufferSize / 2; tau++) {
        result[tau] = 0;
        for (let j = 0; j < bufferSize / 2; j++) {
          const delta = buffer[j] - buffer[j + tau];
          result[tau] += delta * delta;
        }
      }

      // Step 2: Cumulative mean normalized difference function
      result[0] = 1;
      let sum = 0;
      for (let tau = 1; tau < bufferSize / 2; tau++) {
        sum += result[tau];
        result[tau] *= tau / sum;
      }

      // Step 3: Absolute threshold
      let tau = 2;
      while (tau < bufferSize / 2) {
        if (result[tau] < YIN_THRESHOLD) {
          while (tau + 1 < bufferSize / 2 && result[tau + 1] < result[tau]) {
            tau++;
          }
          break;
        }
        tau++;
      }

      // Step 4: Parabolic interpolation
      if (tau === bufferSize / 2 || result[tau] >= YIN_THRESHOLD) {
        return null; // No pitch found
      }

      const x0 = tau < 1 ? tau : tau - 1;
      const x2 = tau + 1 < bufferSize / 2 ? tau + 1 : tau;
      const s0 = result[x0];
      const s1 = result[tau];
      const s2 = result[x2];
      const adjustment = (x2 - x0) * (s0 - s2) / (2 * (s0 - 2 * s1 + s2));

      const period = tau + adjustment;
      const frequency = sampleRate / period;

      return frequency > 50 && frequency < 1000 ? frequency : null;
    };

    const initAudio = async () => {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 4096;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphone = audioContext.createMediaStreamSource(stream);
        
        scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
        
        scriptProcessor.onaudioprocess = () => {
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Float32Array(bufferLength);
          analyser.getFloatTimeDomainData(dataArray);
          
          const detectedFrequency = detectPitchYIN(dataArray, audioContext.sampleRate);
          if (detectedFrequency) {
            setFrequency(detectedFrequency);
            const tune = getNoteFromFrequency(detectedFrequency)

            setNote(tune.note)
            setCents(tune.cents)
            setOctave(tune.octave)
          }
        };

        microphone.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        setIsListening(false);
      }
    };

    initAudio();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (scriptProcessor) {
        scriptProcessor.disconnect();
      }
      if (analyser) {
        analyser.disconnect();
      }
      if (microphone) {
        microphone.disconnect();
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [isListening]);

  const startListening = () => {
    setIsListening(true)
  }
  
  const stopListening = () => {
    setIsListening(false)
  }

  return {
    frequency,
    isListening,
    note,
    cents,
    octave,
    startListening,
    stopListening
  }
}
