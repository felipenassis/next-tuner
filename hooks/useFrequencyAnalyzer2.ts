'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type TuningPreset = {
  name: string
  frequency: number
}

type FrequencyAnalyzerResult = {
  dominantFrequency: number | null
  noteName: string | null
  centsOff: number | null
  isListening: boolean
  startListening: () => Promise<void>
  stopListening: () => void
  error: string | null
  tuningPresets: TuningPreset[]
  currentTuning: TuningPreset
  setTuning: (frequency: number) => void
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export default function useFrequencyAnalyzer(): FrequencyAnalyzerResult {
  const [dominantFrequency, setDominantFrequency] = useState<number | null>(null)
  const [noteName, setNoteName] = useState<string | null>(null)
  const [centsOff, setCentsOff] = useState<number | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Configurações de afinação
  const tuningPresets: TuningPreset[] = [
    { name: 'Padrão (A440)', frequency: 440 },
    { name: 'Barroca (A432)', frequency: 432 },
    { name: 'Verdiana (A435)', frequency: 435 },
    { name: 'Científica (A430.5)', frequency: 430.5 },
  ]
  const [currentTuning, setCurrentTuning] = useState<TuningPreset>(tuningPresets[0])

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)

  // Calcula a frequência teórica da nota mais próxima
  const getNearestNoteFrequency = useCallback((freq: number, tuningFrequency: number): number => {
    // Fórmula para calcular o número de semitons a partir de A4
    const semitonesFromA4 = 12 * Math.log2(freq / tuningFrequency)
    const nearestSemitone = Math.round(semitonesFromA4)
    return tuningFrequency * Math.pow(2, nearestSemitone / 12)
  }, [])

  // Calcula quantos cents a frequência está da nota mais próxima
  const calculateCents = useCallback((freq: number, nearestNoteFreq: number): number => {
    return 1200 * Math.log2(freq / nearestNoteFreq)
  }, [])

  // Converte frequência para nome da nota musical com base na afinação selecionada
  const getNoteFromFrequency = useCallback((freq: number, tuningFrequency: number): string => {
    if (!freq) return ''
    
    const semitonesFromA4 = 12 * Math.log2(freq / tuningFrequency)
    const noteIndex = Math.round(semitonesFromA4) % 12
    const octave = Math.floor(semitonesFromA4 / 12 + 4)
    
    return `${NOTE_NAMES[(noteIndex + 12) % 12]}${octave}`
  }, [])

  // Analisa os dados de áudio
  const analyzeFrequency = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || !currentTuning) return

    analyserRef.current.getByteFrequencyData(dataArrayRef.current)
    
    let maxIndex = 0
    let maxValue = 0
    
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      if (dataArrayRef.current[i] > maxValue) {
        maxValue = dataArrayRef.current[i]
        maxIndex = i
      }
    }
    
    if (maxValue > 0 && audioContextRef.current) {
      const detectedFreq = maxIndex * audioContextRef.current.sampleRate / analyserRef.current.fftSize
      setDominantFrequency(detectedFreq)
      
      const nearestNoteFreq = getNearestNoteFrequency(detectedFreq, currentTuning.frequency)
      const note = getNoteFromFrequency(detectedFreq, currentTuning.frequency)
      const cents = calculateCents(detectedFreq, nearestNoteFreq)
      
      setNoteName(note)
      setCentsOff(Math.abs(cents) < 0.5 ? 0 : cents) // Margem de erro
    } else {
      setDominantFrequency(null)
      setNoteName(null)
      setCentsOff(null)
    }
    
    animationFrameRef.current = requestAnimationFrame(analyzeFrequency)
  }, [calculateCents, getNearestNoteFrequency, getNoteFromFrequency, currentTuning])

  // Inicia a captura do microfone
  const startListening = useCallback(async () => {
    try {
      setError(null)
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 2048
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount)
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream)
      microphoneRef.current.connect(analyserRef.current)
      
      setIsListening(true)
      analyzeFrequency()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao acessar o microfone')
      setIsListening(false)
    }
  }, [analyzeFrequency])

  // Para a captura do microfone
  const stopListening = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    if (microphoneRef.current) {
      microphoneRef.current.disconnect()
      const stream = microphoneRef.current.mediaStream
      stream.getTracks().forEach(track => track.stop())
      microphoneRef.current = null
    }
    
    setIsListening(false)
    setDominantFrequency(null)
    setNoteName(null)
    setCentsOff(null)
  }, [])

  // Altera a afinação de referência
  const setTuning = useCallback((frequency: number) => {
    const preset = tuningPresets.find(p => p.frequency === frequency) || { name: 'Personalizado', frequency }
    setCurrentTuning(preset)
  }, [tuningPresets])

  // Limpeza
  useEffect(() => {
    return () => {
      stopListening()
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close()
      }
    }
  }, [stopListening])

  return {
    dominantFrequency,
    noteName,
    centsOff,
    isListening,
    startListening,
    stopListening,
    error,
    tuningPresets,
    currentTuning,
    setTuning
  }
}
