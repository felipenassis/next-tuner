'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type Algorithm = 'YIN' | 'MPM'
export type Tuning = '440' | '432' | '415' | '392' | '466'

export interface Settings {
  theme: Theme
  algorithm: Algorithm
  tuning: Tuning
}

const STORAGE_KEY = 'appSettings'

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  algorithm: 'YIN',
  tuning: '440',
}

interface SettingsContextValue {
  settings: Settings
  toggleTheme: () => void
  chooseTheme: (theme: Theme) => void
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

// Fonte única de verdade para as settings em runtime — todas as páginas leem
// e escrevem por aqui, em vez de reimplementar acesso ao localStorage.
export function SettingsProvider({ children }: { children: ReactNode }) {
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
          return JSON.parse(saved) as Settings
        } catch {
          // se o JSON estiver corrompido, volta pro padrão
        }
      }
    }
    return DEFAULT_SETTINGS
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

  return (
    <SettingsContext.Provider value={{ settings, toggleTheme, chooseTheme, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  )
}

export default function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings precisa ser usado dentro de um SettingsProvider')
  }
  return context
}
