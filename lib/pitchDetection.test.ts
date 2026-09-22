import { describe, it, expect } from 'vitest'
import { detectPitchYIN, detectPitchMPM } from '../public/audio-worklets/pitch-detection.js'

const SAMPLE_RATE = 44100
const BUFFER_SIZE = 4096

function makeSineBuffer(frequency: number): Float32Array {
  const buffer = new Float32Array(BUFFER_SIZE)
  for (let i = 0; i < BUFFER_SIZE; i++) {
    buffer[i] = Math.sin((2 * Math.PI * frequency * i) / SAMPLE_RATE)
  }
  return buffer
}

// Notas realmente usadas pelo app (ver INSTRUMENT_TUNINGS em corda-a-corda/page.tsx),
// da mais grave (baixo de 5 cordas) à mais aguda (violino).
const REAL_NOTES: Array<{ label: string; freq: number }> = [
  { label: 'B0 (baixo 5 cordas)', freq: 30.87 },
  { label: 'E1 (baixo padrão)', freq: 41.2 },
  { label: 'E2 (violão 6ª corda)', freq: 82.41 },
  { label: 'A2', freq: 110 },
  { label: 'D3', freq: 146.83 },
  { label: 'G3', freq: 196 },
  { label: 'B3', freq: 246.94 },
  { label: 'E4 (violão 1ª corda)', freq: 329.63 },
  { label: 'A4 (referência)', freq: 440 },
  { label: 'E5 (violino)', freq: 659.25 },
]

function describeAlgorithm(name: string, detect: (buffer: Float32Array, sampleRate: number) => number) {
  describe(name, () => {
    for (const { label, freq } of REAL_NOTES) {
      it(`detecta ${label} (${freq}Hz) a partir de uma onda senoidal`, () => {
        const buffer = makeSineBuffer(freq)
        const detected = detect(buffer, SAMPLE_RATE)
        expect(detected).toBeGreaterThan(0)
        expect(detected).toBeCloseTo(freq, 0)
      })
    }

    it('retorna 0 para silêncio completo', () => {
      const buffer = new Float32Array(BUFFER_SIZE)
      expect(detect(buffer, SAMPLE_RATE)).toBe(0)
    })
  })
}

describeAlgorithm('YIN', detectPitchYIN)
describeAlgorithm('MPM', detectPitchMPM)
