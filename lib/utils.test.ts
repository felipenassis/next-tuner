import { describe, it, expect } from 'vitest'
import {
  cn,
  calculateFrequency,
  getNoteFromFrequency,
  getTuningStandardFrequency,
  semitonesToFrequency,
} from './utils'

describe('cn', () => {
  it('junta classes truthy e ignora falsy', () => {
    expect(cn('a', false, 'b', undefined, null, 'c')).toBe('a b c')
  })
})

describe('getTuningStandardFrequency', () => {
  it('retorna o A4 correto para cada padrão conhecido', () => {
    expect(getTuningStandardFrequency('440')).toBe(440)
    expect(getTuningStandardFrequency('432')).toBe(432)
    expect(getTuningStandardFrequency('415')).toBe(415.3)
    expect(getTuningStandardFrequency('392')).toBe(392)
    expect(getTuningStandardFrequency('466')).toBe(466.16)
  })

  it('usa 440Hz como fallback para um padrão desconhecido', () => {
    expect(getTuningStandardFrequency('999')).toBe(440)
  })
})

describe('semitonesToFrequency', () => {
  it('0 semitons retorna a própria referência', () => {
    expect(semitonesToFrequency(0, 440)).toBe(440)
  })

  it('12 semitons dobra a frequência (uma oitava acima)', () => {
    expect(semitonesToFrequency(12, 440)).toBeCloseTo(880, 6)
  })

  it('-12 semitons divide a frequência por dois (uma oitava abaixo)', () => {
    expect(semitonesToFrequency(-12, 440)).toBeCloseTo(220, 6)
  })
})

describe('calculateFrequency', () => {
  it('A4 na afinação padrão é exatamente o A4 de referência', () => {
    expect(calculateFrequency('A4', 440)).toBeCloseTo(440, 6)
  })

  it('calcula notas conhecidas a partir de A4=440', () => {
    expect(calculateFrequency('E2', 440)).toBeCloseTo(82.41, 1) // corda E grave do violão
    expect(calculateFrequency('C4', 440)).toBeCloseTo(261.63, 1) // dó central
    expect(calculateFrequency('A2', 440)).toBeCloseTo(110, 1)
  })

  it('sustenidos e bemóis equivalentes geram a mesma frequência', () => {
    expect(calculateFrequency('C#4', 440)).toBeCloseTo(calculateFrequency('Db4', 440), 9)
    expect(calculateFrequency('Eb2', 440)).toBeCloseTo(calculateFrequency('D#2', 440), 9)
  })

  it('nota sem oitava assume oitava 4 como padrão', () => {
    expect(calculateFrequency('A', 440)).toBeCloseTo(440, 6)
  })

  it('respeita padrões de afinação diferentes de 440Hz', () => {
    expect(calculateFrequency('A4', 432)).toBeCloseTo(432, 6)
  })
})

describe('getNoteFromFrequency', () => {
  it('retorna null para frequência zero ou negativa', () => {
    expect(getNoteFromFrequency(0, 440)).toBeNull()
    expect(getNoteFromFrequency(-10, 440)).toBeNull()
  })

  it('reconhece A4 exatamente', () => {
    const result = getNoteFromFrequency(440, 440)
    expect(result).toMatchObject({ note: 'A', octave: 4, cents: 0 })
  })

  it('é o inverso de calculateFrequency para notas conhecidas', () => {
    const cases = ['C4', 'E2', 'G3', 'A#3', 'B5']
    for (const note of cases) {
      const freq = calculateFrequency(note, 440)
      const result = getNoteFromFrequency(freq, 440)
      const noteName = note.replace(/[0-9]/g, '')
      const octave = parseInt(note.replace(/[^0-9]/g, ''), 10)
      expect(result?.note).toBe(noteName)
      expect(result?.octave).toBe(octave)
      expect(result?.cents).toBe(0)
    }
  })

  it('calcula os cents de desvio corretamente para uma nota levemente desafinada', () => {
    // ~10 cents acima de A4 (440Hz)
    const freq = 440 * Math.pow(2, 10 / 1200)
    const result = getNoteFromFrequency(freq, 440)
    expect(result?.note).toBe('A')
    expect(result?.octave).toBe(4)
    expect(result?.cents).toBeCloseTo(10, 0)
  })

  it('retorna octave 0 (não null) para notas na oitava científica 0 — regressão de bug de UI', () => {
    // Bug histórico: a página do afinador cromático checava `octave &&` em vez de
    // `octave !== null`, então uma oitava 0 legítima (ex.: C0 ≈ 16.35Hz) era
    // tratada como "nenhuma nota detectada" por ser falsy em JS.
    const freq = calculateFrequency('C0', 440)
    const result = getNoteFromFrequency(freq, 440)
    expect(result?.octave).toBe(0)
  })
})
