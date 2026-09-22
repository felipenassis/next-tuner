import type { ReactNode } from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useSettings, { SettingsProvider } from './useSettings'

const wrapper = ({ children }: { children: ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
)

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

describe('useSettings', () => {
  it('lança um erro quando usado fora do SettingsProvider', () => {
    expect(() => renderHook(() => useSettings())).toThrow(
      'useSettings precisa ser usado dentro de um SettingsProvider'
    )
  })

  it('usa valores padrão quando não há nada salvo', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.settings).toEqual({
      theme: 'system',
      algorithm: 'YIN',
      tuning: '440',
    })
  })

  it('carrega settings previamente salvas no localStorage', () => {
    localStorage.setItem(
      'appSettings',
      JSON.stringify({ theme: 'dark', algorithm: 'MPM', tuning: '432' })
    )
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.settings).toEqual({
      theme: 'dark',
      algorithm: 'MPM',
      tuning: '432',
    })
  })

  it('usa os valores padrão quando o JSON salvo está corrompido', () => {
    localStorage.setItem('appSettings', '{not valid json')
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.settings.theme).toBe('system')
  })

  it('updateSetting altera e persiste uma configuração', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })

    act(() => {
      result.current.updateSetting('tuning', '432')
    })

    expect(result.current.settings.tuning).toBe('432')
    expect(JSON.parse(localStorage.getItem('appSettings')!).tuning).toBe('432')
  })

  it('toggleTheme alterna entre light e dark', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })

    act(() => {
      result.current.chooseTheme('light')
    })
    expect(result.current.settings.theme).toBe('light')

    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.settings.theme).toBe('dark')

    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.settings.theme).toBe('light')
  })

  it('aplica a classe "dark" no <html> quando o tema é dark', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })

    act(() => {
      result.current.chooseTheme('dark')
    })
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    act(() => {
      result.current.chooseTheme('light')
    })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('não aplica dark quando o tema é system e o SO prefere claro', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })

    act(() => {
      result.current.chooseTheme('system')
    })

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
