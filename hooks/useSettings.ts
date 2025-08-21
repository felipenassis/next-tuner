'use client'

import { useState, useEffect, useCallback } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type Algorithm = 'YIN' | 'MPM'
export type Tuning = '440' | '432' | '415' | '392' | '466'

export interface Settings {
  theme: Theme
  algorithm: Algorithm
  tuning: Tuning
}

const STORAGE_KEY = 'appSettings'

export default function useSettings() {
  const applyTheme = useCallback((theme: Theme) => {
    const root = document.documentElement
    root.classList.remove('dark')
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (isDark) root.classList.add('dark')
    }
  }, [])

  // Inicializa o estado já lendo o localStorage
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const parsed: Settings = JSON.parse(saved)
          return parsed
        } catch {
          // se o JSON estiver corrompido, volta pro padrão
        }
      }
    }
    return {
      theme: 'system',
      algorithm: 'YIN',
      tuning: '440',
    }
  })

  // Aplica o tema quando mudar
  useEffect(() => {
    applyTheme(settings.theme)
  }, [settings.theme, applyTheme])

  // Observa mudanças no sistema se o tema for "system"
  useEffect(() => {
    if (settings.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings.theme, applyTheme])

  // Salva no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const toggleTheme = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }))
  }, [])

  const chooseTheme = useCallback((theme: Theme) => {
    setSettings(prev => ({ ...prev, theme }))
  }, [])

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings(prev => ({ ...prev, [key]: value }))
    },
    []
  )

  return { settings, toggleTheme, chooseTheme, updateSetting }
}
